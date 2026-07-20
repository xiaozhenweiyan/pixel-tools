/**
 * pixel-rpg.js
 * 像素 RPG 小游戏 / Pixel RPG Mini-Game
 *
 * 功能：
 *   - 瓦片地图（20x15），多个关卡，房间+随机墙
 *   - 玩家角色 16x16 像素，4 方向行走动画
 *   - 接触怪物触发回合制战斗（伤害 = 攻击力 - 防御力，最小 1）
 *   - 击败怪物获得经验，满经验升级（HP/ATK/DEF 提升）
 *   - 宝箱随机奖励（HP 药水 / ATK / DEF / EXP）
 *   - Web Audio API 生成 8-bit BGM 循环 + 音效（移动/攻击/受伤/升级/胜利/开箱/下楼）
 *   - 顶部 UI：HP 条 / 等级 / 经验条 / ATK / DEF / 关卡
 *
 * 用法：
 *   PixelRPG.init(canvas);
 *   PixelRPG.start();
 *   PixelRPG.stop();
 *   PixelRPG.reset();
 *
 * 调色板：与站点 pixel.css 一致（像素深空 Pixel Deep Space）
 */
window.PixelRPG = (function () {
  'use strict';

  // ============================================================
  // 常量 / Constants
  // ============================================================

  // 颜色（地牢风调色板）
  const COLOR = {
    BG:                   '#0a0a14', // 地牢背景（更暗）
    FLOOR:                '#3a3a3a', // 深灰石板地板
    GRASS:                '#228b22', // 草地绿（保留兼容，未使用）
    GRASS_DK:             '#1a6b1a', // 草地暗（保留兼容，未使用）
    WALL:                 '#1a1a1a', // 黑色砖墙主色
    WALL_DK:              '#1f1f33', // 墙壁暗（保留供 UI 使用）
    WALL_LT:              '#3d3d54', // 墙壁亮（保留供 UI 使用）
    WALL_HIGHLIGHT:       '#2a2a2a', // 砖墙高光
    WALL_SHADOW:          '#000000', // 砖墙阴影
    TORCH_HANDLE:         '#8b4513', // 火把木柄棕色
    TORCH_FIRE:           '#ff6600', // 火把橙色火焰
    TORCH_FIRE_HIGHLIGHT: '#ffaa00', // 火把火焰高光
    ROBE:                 '#0a0a0a', // 玩家黑袍
    MASK:                 '#f0f0f0', // 玩家白色面具
    SLIME:                'rgba(124, 252, 0, 0.85)', // 史莱姆半透明绿
    SLIME_HIGHLIGHT:      '#aaff44', // 史莱姆高光
    SLIME_OUTLINE:        '#4a8a00', // 史莱姆暗描边
    CHEST:                '#ffd700', // 宝箱金
    CHEST_DK:             '#8b4513', // 宝箱暗棕
    EXIT:                 '#ffd700', // 出口金（向下走廊箭头）
    PLAYER:               '#ffd700', // 玩家金色（保留兼容，未使用）
    PLAYER_SKIN:          '#ffe4c4', // 玩家肤色（保留兼容，未使用）
    PLAYER_HAIR:          '#8b4513', // 玩家头发（保留兼容，未使用）
    HP_RED:               '#ff4500', // HP 红
    HP_GREEN:             '#228b22', // HP 绿
    EXP_BLUE:             '#1e90ff', // 经验蓝
    PANEL:                '#2d2d44', // UI 面板
    TEXT:                 '#ffd700', // 文字金
    TEXT_DIM:             '#8888aa', // 暗文字
    BLACK:                '#000000',
    WHITE:                '#ffffff'
  };

  // 瓦片类型
  const TILE = {
    FLOOR: 0, // 深灰石板地板（地牢）
    WALL: 1,  // 黑色砖墙
    EXIT: 2   // 向下走廊出口
  };

  // 地图尺寸
  const MAP_W = 20;
  const MAP_H = 15;
  const TILE_PX = 16;           // 逻辑像素
  const SCALE = 2;               // 显示放大倍数
  const PIXEL = TILE_PX * SCALE; // 屏幕每格像素 = 32

  // 画布尺寸
  const UI_HEIGHT = 60;
  const CANVAS_W = MAP_W * PIXEL;            // 640
  const CANVAS_H = MAP_H * PIXEL + UI_HEIGHT; // 480 + 60 = 540

  // 移动动画速度（每秒移动几格）
  const MOVE_SPEED = 8;

  // 怪物种类（基础数值，会随关卡缩放；weight 控制生成权重）
  const MONSTER_TYPES = [
    { name: '史莱姆', hp: 8,  atk: 3, def: 0, exp: 5,  color: '#7cfc00', color2: '#4a8a00', weight: 60 },
    { name: '蝙蝠',   hp: 6,  atk: 5, def: 0, exp: 7,  color: '#9370db', color2: '#5a3080', weight: 13 },
    { name: '骷髅',   hp: 12, atk: 6, def: 2, exp: 12, color: '#e0e0e0', color2: '#888888', weight: 13 },
    { name: '哥布林', hp: 10, atk: 7, def: 1, exp: 10, color: '#8b4513', color2: '#4a2408', weight: 14 }
  ];

  // BGM 旋律（C 大调五声音阶，8 音符循环）
  const BGM_MELODY = [
    { freq: 261.63, dur: 0.24 }, // C4
    { freq: 329.63, dur: 0.24 }, // E4
    { freq: 392.00, dur: 0.24 }, // G4
    { freq: 523.25, dur: 0.24 }, // C5
    { freq: 440.00, dur: 0.24 }, // A4
    { freq: 392.00, dur: 0.24 }, // G4
    { freq: 329.63, dur: 0.24 }, // E4
    { freq: 261.63, dur: 0.24 }  // C4
  ];

  // ============================================================
  // 模块状态 / Module State
  // ============================================================

  let canvas = null;
  let ctx = null;

  const state = {
    // 音频
    audioContext: null,
    masterGain: null,
    noiseBuffer: null,
    bgmPlaying: false,
    bgmNoteIndex: 0,
    bgmNextTime: 0,
    bgmTimer: null,

    // 地图（二维数组，存 TILE 类型）
    map: [],
    exit: { gx: 0, gy: 0 },

    // 玩家
    player: {
      gx: 1, gy: 1,              // 网格坐标
      px: PIXEL, py: PIXEL,      // 屏幕像素坐标（游戏区内，不含 UI 偏移）
      targetGx: 1, targetGy: 1,  // 移动目标
      moving: false,
      moveProgress: 0,           // 0~1
      facing: 'down',            // up/down/left/right
      frame: 0,                  // 行走动画帧 0/1
      hp: 20, maxHp: 20,
      atk: 5, def: 1,
      level: 1, exp: 0, expToNext: 10
    },

    // 怪物与宝箱
    monsters: [],
    chests: [],
    torches: [],

    // 游戏状态
    level: 1,                    // 当前关卡
    gameOver: false,
    message: '',
    messageTimer: 0,
    animTime: 0,

    // 循环
    running: false,
    lastTime: 0,
    animationId: null
  };

  // ============================================================
  // 音频系统 / Audio (Web Audio API)
  // ============================================================

  /**
   * 初始化 Web Audio API 上下文（需在用户手势后真正发声）。
   */
  function initAudio() {
    if (state.audioContext) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    state.audioContext = new AudioContext();
    state.masterGain = state.audioContext.createGain();
    state.masterGain.gain.value = 0.5;
    state.masterGain.connect(state.audioContext.destination);
    createNoiseBuffer();
  }

  /**
   * 创建白噪声缓冲（用于攻击音效）。
   */
  function createNoiseBuffer() {
    const ac = state.audioContext;
    if (!ac) return;
    const len = Math.floor(ac.sampleRate * 0.3);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len); // 衰减噪声
    }
    state.noiseBuffer = buf;
  }

  /**
   * 播放 BGM（8 音符旋律循环）。
   */
  function playBGM() {
    if (!state.audioContext) return;
    if (state.bgmPlaying) return;
    state.bgmPlaying = true;
    state.bgmNoteIndex = 0;
    state.bgmNextTime = state.audioContext.currentTime + 0.05;
    scheduleBGM();
  }

  /**
   * 调度 BGM 音符（前瞻调度，避免抖动）。
   */
  function scheduleBGM() {
    if (!state.bgmPlaying || !state.audioContext) return;
    const ac = state.audioContext;
    while (state.bgmNextTime < ac.currentTime + 0.3) {
      const note = BGM_MELODY[state.bgmNoteIndex];
      // 主旋律（方波）
      scheduleBGMNote(note.freq, state.bgmNextTime, note.dur, 'square', 0.06);
      // 低音伴奏（三角波，每两拍一次）
      if (state.bgmNoteIndex % 2 === 0) {
        scheduleBGMNote(note.freq / 2, state.bgmNextTime, note.dur * 2, 'triangle', 0.05);
      }
      state.bgmNextTime += note.dur;
      state.bgmNoteIndex = (state.bgmNoteIndex + 1) % BGM_MELODY.length;
    }
    state.bgmTimer = setTimeout(scheduleBGM, 80);
  }

  /**
   * 安排单个 BGM 音符。
   */
  function scheduleBGMNote(freq, time, dur, type, vol) {
    const ac = state.audioContext;
    if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(vol, time + 0.02);
    gain.gain.setValueAtTime(vol, time + dur * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur * 0.95);
    osc.connect(gain);
    gain.connect(state.masterGain);
    osc.start(time);
    osc.stop(time + dur);
  }

  /**
   * 停止 BGM。
   */
  function stopBGM() {
    state.bgmPlaying = false;
    if (state.bgmTimer) {
      clearTimeout(state.bgmTimer);
      state.bgmTimer = null;
    }
  }

  /**
   * 播放短促音效。
   * @param {string} type move|attack|hurt|levelup|win|chest|stairs
   */
  function playSound(type) {
    if (!state.audioContext) return;
    const ac = state.audioContext;
    const now = ac.currentTime;

    switch (type) {
      case 'move': {
        // 移动：短促低频 blip
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'square';
        osc.frequency.value = 180;
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
        osc.connect(gain); gain.connect(state.masterGain);
        osc.start(now); osc.stop(now + 0.06);
        break;
      }
      case 'attack': {
        // 攻击：噪声爆发 + 下降方波
        if (state.noiseBuffer) {
          const noise = ac.createBufferSource();
          noise.buffer = state.noiseBuffer;
          const ng = ac.createGain();
          ng.gain.setValueAtTime(0.18, now);
          ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
          noise.connect(ng); ng.connect(state.masterGain);
          noise.start(now); noise.stop(now + 0.12);
        }
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.1);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
        osc.connect(gain); gain.connect(state.masterGain);
        osc.start(now); osc.stop(now + 0.12);
        break;
      }
      case 'hurt': {
        // 受伤：下降锯齿波
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
        osc.connect(gain); gain.connect(state.masterGain);
        osc.start(now); osc.stop(now + 0.3);
        break;
      }
      case 'levelup': {
        // 升级：上升琶音 C5 E5 G5 C6
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, i) => {
          const osc = ac.createOscillator();
          const gain = ac.createGain();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          const t = now + i * 0.08;
          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.exponentialRampToValueAtTime(0.16, t + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
          osc.connect(gain); gain.connect(state.masterGain);
          osc.start(t); osc.stop(t + 0.2);
        });
        break;
      }
      case 'win': {
        // 胜利：和弦 C5 E5 G5
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq) => {
          const osc = ac.createOscillator();
          const gain = ac.createGain();
          osc.type = 'square';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.exponentialRampToValueAtTime(0.09, now + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
          osc.connect(gain); gain.connect(state.masterGain);
          osc.start(now); osc.stop(now + 0.3);
        });
        break;
      }
      case 'chest': {
        // 开宝箱：叮叮叮
        [659.25, 880, 1318.5].forEach((freq, i) => {
          const osc = ac.createOscillator();
          const gain = ac.createGain();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          const t = now + i * 0.06;
          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.exponentialRampToValueAtTime(0.14, t + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
          osc.connect(gain); gain.connect(state.masterGain);
          osc.start(t); osc.stop(t + 0.16);
        });
        break;
      }
      case 'stairs': {
        // 下楼：上升滑音
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        osc.connect(gain); gain.connect(state.masterGain);
        osc.start(now); osc.stop(now + 0.35);
        break;
      }
    }
  }

  // ============================================================
  // 地图生成 / Map Generation
  // ============================================================

  /**
   * 生成指定关卡的地图（地牢迷宫 + 火把 + 出口 + 怪物 + 宝箱）。
   * 使用递归回溯算法挖出完美迷宫通道。
   * @param {number} level 关卡数
   */
  function generateMap(level) {
    // 初始化全墙（地牢砖墙）
    state.map = [];
    state.torches = [];
    for (let y = 0; y < MAP_H; y++) {
      state.map[y] = [];
      for (let x = 0; x < MAP_W; x++) {
        state.map[y][x] = TILE.WALL;
      }
    }

    // 递归回溯算法挖通道（步长 2 保证墙厚 1）
    const stack = [{ x: 1, y: 1 }];
    state.map[1][1] = TILE.FLOOR;
    const dirs = [[0, -2], [0, 2], [-2, 0], [2, 0]];

    while (stack.length > 0) {
      const cur = stack[stack.length - 1];
      // 找未访问的邻居（仍为 WALL 且坐标在范围内）
      const neighbors = [];
      for (let d = 0; d < dirs.length; d++) {
        const nx = cur.x + dirs[d][0];
        const ny = cur.y + dirs[d][1];
        if (nx > 0 && nx < MAP_W - 1 && ny > 0 && ny < MAP_H - 1 && state.map[ny][nx] === TILE.WALL) {
          neighbors.push({ x: nx, y: ny, dx: dirs[d][0], dy: dirs[d][1] });
        }
      }
      if (neighbors.length === 0) {
        stack.pop();
        continue;
      }
      // 随机选一个邻居，打通中间的墙
      const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
      state.map[cur.y + pick.dy / 2][cur.x + pick.dx / 2] = TILE.FLOOR;
      state.map[pick.y][pick.x] = TILE.FLOOR;
      stack.push({ x: pick.x, y: pick.y });
    }

    // 玩家起点（左上角空地）
    state.player.gx = 1;
    state.player.gy = 1;
    state.player.px = state.player.gx * PIXEL;
    state.player.py = state.player.gy * PIXEL;
    state.player.targetGx = state.player.gx;
    state.player.targetGy = state.player.gy;
    state.player.moving = false;
    state.player.moveProgress = 0;
    state.player.facing = 'down';

    // 出口（右下角，确保是空地后标记为 EXIT 瓦片）
    const ex = MAP_W - 2;
    const ey = MAP_H - 2;
    if (state.map[ey][ex] === TILE.WALL) {
      state.map[ey][ex] = TILE.FLOOR;
      // 若上下左右都是墙（孤立），打通上方连接附近通道
      if (state.map[ey - 1][ex] === TILE.WALL && state.map[ey][ex - 1] === TILE.WALL) {
        state.map[ey - 1][ex] = TILE.FLOOR;
      }
    }
    state.map[ey][ex] = TILE.EXIT;
    state.exit = { gx: ex, gy: ey };

    // 火把：墙的中段以 20% 概率添加（且至少有一个相邻 FLOOR/EXIT）
    for (let y = 1; y < MAP_H - 1; y++) {
      for (let x = 1; x < MAP_W - 1; x++) {
        if (state.map[y][x] === TILE.WALL) {
          const adjacentFloor =
            state.map[y - 1][x] === TILE.FLOOR || state.map[y - 1][x] === TILE.EXIT ||
            state.map[y + 1][x] === TILE.FLOOR || state.map[y + 1][x] === TILE.EXIT ||
            state.map[y][x - 1] === TILE.FLOOR || state.map[y][x - 1] === TILE.EXIT ||
            state.map[y][x + 1] === TILE.FLOOR || state.map[y][x + 1] === TILE.EXIT;
          if (adjacentFloor && Math.random() < 0.20) {
            state.torches.push({ gx: x, gy: y });
          }
        }
      }
    }

    // 怪物
    state.monsters = [];
    const numMonsters = 4 + Math.min(level, 6);
    let attempts = 0;
    while (state.monsters.length < numMonsters && attempts < 300) {
      attempts++;
      const mx = 1 + Math.floor(Math.random() * (MAP_W - 2));
      const my = 1 + Math.floor(Math.random() * (MAP_H - 2));
      if (state.map[my][mx] !== TILE.FLOOR) continue;
      if (mx === state.player.gx && my === state.player.gy) continue;
      if (mx === ex && my === ey) continue;
      // 离玩家至少 4 格曼哈顿距离
      if (Math.abs(mx - state.player.gx) + Math.abs(my - state.player.gy) < 4) continue;
      // 不与已有怪物重叠
      if (state.monsters.some(m => m.gx === mx && m.gy === my)) continue;
      // 加权选择怪物类型（在等级可用范围内）
      const availableCount = Math.min(MONSTER_TYPES.length, 1 + Math.floor(level / 2));
      const available = MONSTER_TYPES.slice(0, availableCount);
      let totalW = 0;
      for (let i = 0; i < available.length; i++) totalW += available[i].weight;
      let r = Math.random() * totalW;
      let typeIdx = 0;
      for (let i = 0; i < available.length; i++) {
        r -= available[i].weight;
        if (r <= 0) { typeIdx = i; break; }
      }
      const type = available[typeIdx];
      const scale = 1 + (level - 1) * 0.3;
      const hp = Math.round(type.hp * scale);
      state.monsters.push({
        gx: mx, gy: my,
        type: type.name,
        hp: hp, maxHp: hp,
        atk: Math.round(type.atk * scale),
        def: type.def,
        exp: type.exp,
        color: type.color,
        color2: type.color2,
        alive: true
      });
    }

    // 宝箱
    state.chests = [];
    const numChests = 2;
    attempts = 0;
    while (state.chests.length < numChests && attempts < 100) {
      attempts++;
      const cx = 1 + Math.floor(Math.random() * (MAP_W - 2));
      const cy = 1 + Math.floor(Math.random() * (MAP_H - 2));
      if (state.map[cy][cx] !== TILE.FLOOR) continue;
      if (cx === state.player.gx && cy === state.player.gy) continue;
      if (cx === ex && cy === ey) continue;
      if (state.monsters.some(m => m.gx === cx && m.gy === cy)) continue;
      if (state.chests.some(c => c.gx === cx && c.gy === cy)) continue;
      state.chests.push({ gx: cx, gy: cy, opened: false });
    }
  }

  // ============================================================
  // 像素绘制 / Pixel Drawing
  // ============================================================

  /**
   * 绘制单个瓦片（16x16 像素，放大 SCALE 倍显示）。
   * 地牢风：石板地板 / 黑色砖墙 / 向下走廊出口。
   */
  function drawTile(gx, gy, type) {
    const x = gx * PIXEL;
    const y = UI_HEIGHT + gy * PIXEL;
    const s = SCALE;
    if (type === TILE.FLOOR) {
      // 深灰石板地板
      ctx.fillStyle = COLOR.FLOOR;
      ctx.fillRect(x, y, PIXEL, PIXEL);
      // 细微斑点（基于 gx,gy 的伪随机）
      const seed = (gx * 73 + gy * 31) % 7;
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(x + (seed * 3 % 16) * s, y + (seed * 5 % 16) * s, 1 * s, 1 * s);
      ctx.fillRect(x + (seed * 7 % 16) * s, y + (seed * 11 % 16) * s, 1 * s, 1 * s);
      // 石板缝隙（深色边线，下边和右边）
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(x, y + PIXEL - 1 * s, PIXEL, 1 * s);
      ctx.fillRect(x + PIXEL - 1 * s, y, 1 * s, PIXEL);
    } else if (type === TILE.WALL) {
      // 黑色砖墙主体
      ctx.fillStyle = COLOR.WALL;
      ctx.fillRect(x, y, PIXEL, PIXEL);
      // 砖块高光（顶部和左侧）
      ctx.fillStyle = COLOR.WALL_HIGHLIGHT;
      ctx.fillRect(x, y, PIXEL, 2 * s);
      ctx.fillRect(x, y, 2 * s, PIXEL);
      // 砖块阴影（底部和右侧）
      ctx.fillStyle = COLOR.WALL_SHADOW;
      ctx.fillRect(x, y + PIXEL - 2 * s, PIXEL, 2 * s);
      ctx.fillRect(x + PIXEL - 2 * s, y, 2 * s, PIXEL);
      // 砖块缝隙（中间横线）
      ctx.fillStyle = COLOR.BLACK;
      ctx.fillRect(x, y + 8 * s, PIXEL, 1 * s);
      // 错位竖线（奇偶行不同位置，模拟砌砖错位）
      if (gy % 2 === 0) {
        ctx.fillRect(x + 8 * s, y, 1 * s, 8 * s);
        ctx.fillRect(x + 4 * s, y + 9 * s, 1 * s, 7 * s);
      } else {
        ctx.fillRect(x + 4 * s, y, 1 * s, 8 * s);
        ctx.fillRect(x + 8 * s, y + 9 * s, 1 * s, 7 * s);
      }
    } else if (type === TILE.EXIT) {
      // 向下走廊出口
      // 先画地板底色
      ctx.fillStyle = COLOR.FLOOR;
      ctx.fillRect(x, y, PIXEL, PIXEL);
      // 黑色走廊入口（向下延伸的暗道）
      ctx.fillStyle = COLOR.BLACK;
      ctx.fillRect(x + 4 * s, y + 2 * s, 8 * s, 12 * s);
      // 拱门轮廓（深灰边框）
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(x + 4 * s, y + 2 * s, 8 * s, 1 * s);  // 顶部
      ctx.fillRect(x + 4 * s, y + 2 * s, 1 * s, 4 * s);  // 左立柱
      ctx.fillRect(x + 11 * s, y + 2 * s, 1 * s, 4 * s); // 右立柱
      // 向下阶梯（3 级，逐渐变窄，模拟透视）
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(x + 5 * s, y + 6 * s, 6 * s, 2 * s);
      ctx.fillStyle = COLOR.BLACK;
      ctx.fillRect(x + 5 * s, y + 8 * s, 6 * s, 1 * s);
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(x + 6 * s, y + 9 * s, 4 * s, 2 * s);
      ctx.fillStyle = COLOR.BLACK;
      ctx.fillRect(x + 6 * s, y + 11 * s, 4 * s, 1 * s);
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(x + 7 * s, y + 12 * s, 2 * s, 2 * s);
      // 底部金色向下箭头（指示下楼）
      ctx.fillStyle = COLOR.EXIT;
      const ax = x + 8 * s;
      const ay = y + 13 * s;
      ctx.fillRect(ax, ay, 1 * s, 2 * s);
      ctx.fillRect(ax - 1 * s, ay + 2 * s, 3 * s, 1 * s);
    }
  }

  /**
   * 绘制玩家（16x16 像素戴面具的黑衣人，4 方向 + 2 帧行走动画）。
   * 整体只有黑+白两色：黑袍 + 黑兜帽 + 白色面具 + 黑色眼洞。
   * @param {number} px 屏幕坐标 x（含 UI 偏移）
   * @param {number} py 屏幕坐标 y（含 UI 偏移）
   * @param {string} facing up/down/left/right
   * @param {number} frame 0 或 1（行走帧）
   */
  function drawPlayer(px, py, facing, frame) {
    const s = SCALE;
    // 阴影
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(px + 3 * s, py + 14 * s, 10 * s, 1 * s);

    // 腿偏移（行走动画：两腿前后错开）
    let lLegX = 5, rLegX = 9;
    if (frame === 1) { lLegX = 4; rLegX = 10; }

    // 腿部（黑袍下摆）
    ctx.fillStyle = COLOR.ROBE;
    ctx.fillRect(px + lLegX * s, py + 12 * s, 2 * s, 3 * s);
    ctx.fillRect(px + rLegX * s, py + 12 * s, 2 * s, 3 * s);

    // 黑色长袍主体（覆盖身体）
    ctx.fillStyle = COLOR.ROBE;
    ctx.fillRect(px + 4 * s, py + 7 * s, 8 * s, 6 * s);

    // 黑色兜帽（头部上方）
    ctx.fillRect(px + 5 * s, py + 2 * s, 6 * s, 4 * s);
    // 兜帽尖端（根据朝向有细微差别）
    if (facing === 'down') {
      ctx.fillRect(px + 6 * s, py + 1 * s, 4 * s, 1 * s);
    } else if (facing === 'up') {
      ctx.fillRect(px + 6 * s, py + 1 * s, 4 * s, 1 * s);
    } else if (facing === 'left') {
      ctx.fillRect(px + 4 * s, py + 2 * s, 2 * s, 3 * s);
    } else if (facing === 'right') {
      ctx.fillRect(px + 10 * s, py + 2 * s, 2 * s, 3 * s);
    }

    // 白色面具（覆盖脸部）
    ctx.fillStyle = COLOR.MASK;
    if (facing === 'down') {
      ctx.fillRect(px + 6 * s, py + 5 * s, 4 * s, 3 * s);
      // 黑色眼洞
      ctx.fillStyle = COLOR.BLACK;
      ctx.fillRect(px + 7 * s, py + 6 * s, 1 * s, 1 * s);
      ctx.fillRect(px + 9 * s, py + 6 * s, 1 * s, 1 * s);
    } else if (facing === 'up') {
      // 朝上：背面，面具不显示（兜帽覆盖）
    } else if (facing === 'left') {
      ctx.fillRect(px + 5 * s, py + 5 * s, 3 * s, 3 * s);
      // 黑色眼洞（单只）
      ctx.fillStyle = COLOR.BLACK;
      ctx.fillRect(px + 6 * s, py + 6 * s, 1 * s, 1 * s);
    } else if (facing === 'right') {
      ctx.fillRect(px + 8 * s, py + 5 * s, 3 * s, 3 * s);
      // 黑色眼洞（单只）
      ctx.fillStyle = COLOR.BLACK;
      ctx.fillRect(px + 9 * s, py + 6 * s, 1 * s, 1 * s);
    }
  }

  /**
   * 绘制墙上火把（棕色木柄 + 闪烁的橙色火焰）。
   * 火把位置由 generateMap 写入 state.torches。
   */
  function drawTorches() {
    const s = SCALE;
    if (!state.torches) return;
    for (let i = 0; i < state.torches.length; i++) {
      const t = state.torches[i];
      const x = t.gx * PIXEL;
      const y = UI_HEIGHT + t.gy * PIXEL;

      // 火焰闪烁（基于 animTime + 火把位置相位偏移）
      const flicker = Math.sin(state.animTime * 8 + t.gx * 1.7 + t.gy * 2.3);
      const fireH = 4 + Math.floor(flicker * 1.5 + 1.5); // 4-7（逻辑像素）
      const fireW = 3 + Math.floor(flicker * 0.5 + 0.5); // 3-4

      // 橙色火焰主体（在木柄顶部上方）
      const fireX = x + 8 * s - Math.floor(fireW / 2) * s;
      const fireY = y + 6 * s - fireH * s;
      ctx.fillStyle = COLOR.TORCH_FIRE;
      ctx.fillRect(fireX, fireY, fireW * s, fireH * s);

      // 火焰高光（黄色竖条）
      ctx.fillStyle = COLOR.TORCH_FIRE_HIGHLIGHT;
      ctx.fillRect(x + 8 * s, fireY + 1 * s, 1 * s, (fireH - 2) * s);

      // 棕色木柄（竖条）
      ctx.fillStyle = COLOR.TORCH_HANDLE;
      ctx.fillRect(x + 7 * s, y + 6 * s, 2 * s, 8 * s);
    }
  }

  /**
   * 绘制怪物（16x16 像素，根据类型不同形状，含闲置浮动动画）。
   * 史莱姆分支使用半透明绿色 + 自带描边/眼睛；其他怪物保留原绘制逻辑。
   */
  function drawMonster(m) {
    const x = m.gx * PIXEL;
    const y = UI_HEIGHT + m.gy * PIXEL;
    const s = SCALE;
    // 闲置动画（上下浮动 1 像素）
    const bob = Math.sin(state.animTime * 4 + m.gx + m.gy) > 0 ? 0 : 1 * s;

    // 阴影
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x + 4 * s, y + 14 * s, 8 * s, 1 * s);

    if (m.type === '史莱姆') {
      // 变形动画（scaleY 在 0.85-1.15 间变化）
      const scaleY = 1.0 + Math.sin(state.animTime * 3 + m.gx * 1.3) * 0.15;
      const baseH = 8; // 逻辑像素
      const h = Math.floor(baseH * scaleY);
      const offsetY = Math.floor((baseH - h) / 2);
      const w = 8;
      const sx = x + 4 * s;
      const sy = y + (4 + offsetY) * s + bob;

      // 半透明绿色主体
      ctx.fillStyle = COLOR.SLIME;
      ctx.fillRect(sx, sy, w * s, h * s);

      // 高光
      ctx.fillStyle = COLOR.SLIME_HIGHLIGHT;
      ctx.fillRect(x + 6 * s, y + (5 + offsetY) * s + bob, 3 * s, 2 * s);

      // 暗描边（顶/底/左/右）
      ctx.fillStyle = COLOR.SLIME_OUTLINE;
      ctx.fillRect(sx, sy, w * s, 1 * s);                   // 顶
      ctx.fillRect(sx, sy + (h - 1) * s, w * s, 1 * s);     // 底
      ctx.fillRect(sx, sy, 1 * s, h * s);                   // 左
      ctx.fillRect(sx + (w - 1) * s, sy, 1 * s, h * s);     // 右

      // 眼睛（两只黑色小点）
      ctx.fillStyle = COLOR.BLACK;
      ctx.fillRect(x + 6 * s, y + (7 + offsetY) * s + bob, 1 * s, 1 * s);
      ctx.fillRect(x + 9 * s, y + (7 + offsetY) * s + bob, 1 * s, 1 * s);
    } else {
      ctx.fillStyle = m.color;
      if (m.type === '蝙蝠') {
        // 蝙蝠：身体 + 翅膀
        ctx.fillRect(x + 6 * s, y + (6 + bob) * s, 4 * s, 5 * s);
        ctx.fillRect(x + 2 * s, y + (7 + bob) * s, 4 * s, 3 * s);
        ctx.fillRect(x + 10 * s, y + (7 + bob) * s, 4 * s, 3 * s);
      } else if (m.type === '骷髅') {
        // 骷髅：头骨 + 下颌
        ctx.fillRect(x + 4 * s, y + (4 + bob) * s, 8 * s, 7 * s);
        ctx.fillRect(x + 5 * s, y + (11 + bob) * s, 6 * s, 3 * s);
      } else {
        // 哥布林：小人
        ctx.fillRect(x + 5 * s, y + (3 + bob) * s, 6 * s, 5 * s);
        ctx.fillRect(x + 4 * s, y + (8 + bob) * s, 8 * s, 5 * s);
      }

      // 暗色描边
      ctx.fillStyle = m.color2;
      ctx.fillRect(x + 3 * s, y + (12 + bob) * s, 10 * s, 1 * s);

      // 眼睛
      ctx.fillStyle = COLOR.BLACK;
      ctx.fillRect(x + 6 * s, y + (8 + bob) * s, 1 * s, 1 * s);
      ctx.fillRect(x + 9 * s, y + (8 + bob) * s, 1 * s, 1 * s);
    }

    // HP 条（受伤时显示）
    if (m.hp < m.maxHp) {
      ctx.fillStyle = COLOR.BG;
      ctx.fillRect(x + 2 * s, y + 1 * s, 12 * s, 2 * s);
      ctx.fillStyle = COLOR.HP_RED;
      ctx.fillRect(x + 2 * s, y + 1 * s, Math.ceil(12 * s * (m.hp / m.maxHp)), 2 * s);
    }
  }

  /**
   * 绘制宝箱（未打开状态）。
   */
  function drawChest(c) {
    if (c.opened) return;
    const x = c.gx * PIXEL;
    const y = UI_HEIGHT + c.gy * PIXEL;
    const s = SCALE;
    // 阴影
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x + 3 * s, y + 13 * s, 10 * s, 1 * s);
    // 箱体
    ctx.fillStyle = COLOR.CHEST_DK;
    ctx.fillRect(x + 3 * s, y + 5 * s, 10 * s, 8 * s);
    // 顶盖
    ctx.fillStyle = COLOR.CHEST;
    ctx.fillRect(x + 3 * s, y + 4 * s, 10 * s, 3 * s);
    // 锁
    ctx.fillStyle = COLOR.BLACK;
    ctx.fillRect(x + 7 * s, y + 8 * s, 2 * s, 2 * s);
    // 横条装饰
    ctx.fillStyle = COLOR.CHEST;
    ctx.fillRect(x + 3 * s, y + 11 * s, 10 * s, 1 * s);
  }

  // ============================================================
  // 游戏逻辑 / Game Logic
  // ============================================================

  /**
   * 显示消息提示。
   * @param {string} msg 消息内容
   * @param {number} dur 显示时长（秒）
   */
  function showMessage(msg, dur) {
    state.message = msg;
    state.messageTimer = dur || 1.5;
  }

  /**
   * 尝试移动玩家到相邻格子（含碰撞、宝箱、怪物、出口判定）。
   */
  function tryMove(dx, dy) {
    if (state.player.moving || state.gameOver) return;
    const nx = state.player.gx + dx;
    const ny = state.player.gy + dy;
    if (nx < 0 || nx >= MAP_W || ny < 0 || ny >= MAP_H) return;
    const tile = state.map[ny][nx];
    if (tile === TILE.WALL) return;
    // 检查宝箱
    const chest = state.chests.find(c => !c.opened && c.gx === nx && c.gy === ny);
    if (chest) {
      openChest(chest);
      return;
    }
    // 检查怪物：触发战斗回合
    const monster = state.monsters.find(m => m.alive && m.gx === nx && m.gy === ny);
    if (monster) {
      combatRound(monster);
      return;
    }
    // 出口：进入下一关
    if (tile === TILE.EXIT) {
      nextLevel();
      return;
    }
    // 普通移动
    state.player.targetGx = nx;
    state.player.targetGy = ny;
    state.player.moving = true;
    state.player.moveProgress = 0;
    playSound('move');
  }

  /**
   * 朝面对方向攻击（空格 / J）。
   */
  function tryAttack() {
    if (state.player.moving || state.gameOver) return;
    let dx = 0, dy = 0;
    if (state.player.facing === 'up') dy = -1;
    else if (state.player.facing === 'down') dy = 1;
    else if (state.player.facing === 'left') dx = -1;
    else if (state.player.facing === 'right') dx = 1;
    const nx = state.player.gx + dx;
    const ny = state.player.gy + dy;
    const monster = state.monsters.find(m => m.alive && m.gx === nx && m.gy === ny);
    if (monster) {
      combatRound(monster);
    }
  }

  /**
   * 一回合战斗：玩家攻击 → 怪物反击（若存活）。
   * 伤害 = max(1, atk - def)
   */
  function combatRound(monster) {
    // 玩家攻击
    const dmgToMonster = Math.max(1, state.player.atk - monster.def);
    monster.hp -= dmgToMonster;
    showMessage('对 ' + monster.type + ' 造成 ' + dmgToMonster + ' 伤害', 0.9);
    playSound('attack');
    if (monster.hp <= 0) {
      monster.alive = false;
      state.player.exp += monster.exp;
      showMessage('击败 ' + monster.type + '! +' + monster.exp + ' EXP', 1.5);
      playSound('win');
      checkLevelUp();
      return;
    }
    // 怪物反击
    const dmgToPlayer = Math.max(1, monster.atk - state.player.def);
    state.player.hp -= dmgToPlayer;
    playSound('hurt');
    if (state.player.hp <= 0) {
      state.player.hp = 0;
      state.gameOver = true;
      showMessage('你被击败了... 游戏结束', 3);
      stopBGM();
    } else {
      showMessage(monster.type + ' 反击 ' + dmgToPlayer + ' 伤害', 0.8);
    }
  }

  /**
   * 打开宝箱，获得随机奖励。
   */
  function openChest(chest) {
    chest.opened = true;
    const rewards = [
      { type: 'hp',  amount: 10, msg: 'HP 药水! +10 HP' },
      { type: 'atk', amount: 1,  msg: '攻击卷轴! ATK +1' },
      { type: 'def', amount: 1,  msg: '防御卷轴! DEF +1' },
      { type: 'exp', amount: 15, msg: '经验宝石! +15 EXP' }
    ];
    const r = rewards[Math.floor(Math.random() * rewards.length)];
    if (r.type === 'hp') {
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + r.amount);
    } else if (r.type === 'atk') {
      state.player.atk += r.amount;
    } else if (r.type === 'def') {
      state.player.def += r.amount;
    } else if (r.type === 'exp') {
      state.player.exp += r.amount;
      checkLevelUp();
    }
    showMessage('宝箱: ' + r.msg, 2);
    playSound('chest');
  }

  /**
   * 检查升级：经验满后提升等级与属性。
   */
  function checkLevelUp() {
    while (state.player.exp >= state.player.expToNext) {
      state.player.exp -= state.player.expToNext;
      state.player.level++;
      state.player.maxHp += 5;
      state.player.hp = state.player.maxHp; // 升级回满 HP
      state.player.atk += 2;
      state.player.def += 1;
      state.player.expToNext = Math.floor(state.player.expToNext * 1.5);
      showMessage('升级! 等级 ' + state.player.level + ' (HP/ATK/DEF 提升)', 2);
      playSound('levelup');
    }
  }

  /**
   * 进入下一关：生成新地图，少量恢复 HP。
   */
  function nextLevel() {
    state.level++;
    showMessage('进入第 ' + state.level + ' 关!', 2);
    playSound('stairs');
    generateMap(state.level);
    // 关卡过渡：恢复 5 HP（不超过上限）
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 5);
  }

  // ============================================================
  // UI 绘制 / UI Rendering
  // ============================================================

  /**
   * 绘制顶部 UI（HP/EXP 条、等级、属性、关卡）。
   */
  function drawUI() {
    // 面板背景
    ctx.fillStyle = COLOR.PANEL;
    ctx.fillRect(0, 0, CANVAS_W, UI_HEIGHT);
    ctx.fillStyle = COLOR.WALL_LT;
    ctx.fillRect(0, UI_HEIGHT - 2, CANVAS_W, 2);

    ctx.textBaseline = 'middle';

    // 等级
    ctx.fillStyle = COLOR.TEXT;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('LV ' + state.player.level, 10, 14);

    // HP 条
    ctx.fillStyle = COLOR.TEXT;
    ctx.font = '10px monospace';
    ctx.fillText('HP', 10, 38);
    ctx.fillStyle = COLOR.BG;
    ctx.fillRect(28, 32, 120, 12);
    const hpRatio = state.player.maxHp > 0 ? state.player.hp / state.player.maxHp : 0;
    ctx.fillStyle = hpRatio > 0.3 ? COLOR.HP_GREEN : COLOR.HP_RED;
    ctx.fillRect(28, 32, Math.ceil(120 * hpRatio), 12);
    ctx.fillStyle = COLOR.TEXT;
    ctx.fillText(state.player.hp + '/' + state.player.maxHp, 60, 38);

    // 经验条
    ctx.fillStyle = COLOR.TEXT;
    ctx.fillText('EXP', 160, 38);
    ctx.fillStyle = COLOR.BG;
    ctx.fillRect(190, 32, 90, 12);
    ctx.fillStyle = COLOR.EXP_BLUE;
    const expRatio = state.player.expToNext > 0 ? state.player.exp / state.player.expToNext : 0;
    ctx.fillRect(190, 32, Math.ceil(90 * expRatio), 12);
    ctx.fillStyle = COLOR.TEXT;
    ctx.fillText(state.player.exp + '/' + state.player.expToNext, 210, 38);

    // ATK / DEF
    ctx.fillStyle = COLOR.TEXT;
    ctx.font = '11px monospace';
    ctx.fillText('ATK ' + state.player.atk, 295, 38);
    ctx.fillText('DEF ' + state.player.def, 350, 38);

    // 关卡
    ctx.fillStyle = COLOR.TEXT;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('第 ' + state.level + ' 关', CANVAS_W - 10, 14);

    // 操作提示
    ctx.fillStyle = COLOR.TEXT_DIM;
    ctx.font = '10px monospace';
    ctx.fillText('方向键/WASD 移动 · 空格/J 攻击 · R 重置', CANVAS_W - 10, 38);

    ctx.textAlign = 'left';
  }

  /**
   * 绘制消息提示（顶部居中）。
   */
  function drawMessage() {
    if (!state.message) return;
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const x = CANVAS_W / 2;
    const y = UI_HEIGHT + 24;
    const w = ctx.measureText(state.message).width + 20;
    // 背景框
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(x - w / 2, y - 12, w, 24);
    ctx.strokeStyle = COLOR.TEXT;
    ctx.lineWidth = 1;
    ctx.strokeRect(x - w / 2, y - 12, w, 24);
    // 文字
    ctx.fillStyle = COLOR.TEXT;
    ctx.fillText(state.message, x, y);
    ctx.textAlign = 'left';
  }

  /**
   * 绘制游戏结束遮罩。
   */
  function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLOR.HP_RED;
    ctx.font = 'bold 32px monospace';
    ctx.fillText('游戏结束', CANVAS_W / 2, CANVAS_H / 2 - 30);
    ctx.fillStyle = COLOR.TEXT;
    ctx.font = '14px monospace';
    ctx.fillText('达到等级 ' + state.player.level + ' · 第 ' + state.level + ' 关', CANVAS_W / 2, CANVAS_H / 2 + 10);
    ctx.fillStyle = COLOR.TEXT_DIM;
    ctx.fillText('按 R 重新开始', CANVAS_W / 2, CANVAS_H / 2 + 40);
    ctx.textAlign = 'left';
  }

  // ============================================================
  // 主循环 / Game Loop
  // ============================================================

  /**
   * 更新游戏状态（每帧调用）。
   * @param {number} dt 距上一帧的秒数
   */
  function update(dt) {
    state.animTime += dt;
    // 消息计时
    if (state.messageTimer > 0) {
      state.messageTimer -= dt;
      if (state.messageTimer <= 0) state.message = '';
    }
    // 玩家移动动画（网格间插值）
    if (state.player.moving) {
      state.player.moveProgress += dt * MOVE_SPEED;
      if (state.player.moveProgress >= 1) {
        state.player.moveProgress = 1;
        state.player.gx = state.player.targetGx;
        state.player.gy = state.player.targetGy;
        state.player.moving = false;
      }
      const t = state.player.moveProgress;
      const fromX = state.player.gx;
      const fromY = state.player.gy;
      state.player.px = (fromX + (state.player.targetGx - fromX) * t) * PIXEL;
      state.player.py = (fromY + (state.player.targetGy - fromY) * t) * PIXEL;
      // 行走动画帧（移动中切换 0/1）
      state.player.frame = Math.floor(state.player.moveProgress * 4) % 2;
    } else {
      state.player.frame = 0;
    }
  }

  /**
   * 渲染整个画面。
   */
  function render() {
    // 清屏
    ctx.fillStyle = COLOR.BG;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // 地图
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        drawTile(x, y, state.map[y][x]);
      }
    }

    // 墙上火把（在瓦片之后、宝箱/怪物之前）
    drawTorches();

    // 宝箱
    state.chests.forEach(drawChest);

    // 怪物
    state.monsters.forEach(function (m) { if (m.alive) drawMonster(m); });

    // 玩家（注意 py 加 UI_HEIGHT 偏移）
    drawPlayer(state.player.px, state.player.py + UI_HEIGHT, state.player.facing, state.player.frame);

    // UI 与消息
    drawUI();
    drawMessage();

    // 游戏结束遮罩
    if (state.gameOver) drawGameOver();
  }

  /**
   * 游戏主循环（requestAnimationFrame 回调）。
   */
  function gameLoop(timestamp) {
    if (!state.running) return;
    const dt = Math.min(0.05, (timestamp - state.lastTime) / 1000);
    state.lastTime = timestamp;
    update(dt);
    render();
    state.animationId = requestAnimationFrame(gameLoop);
  }

  // ============================================================
  // 输入 / Input
  // ============================================================

  /**
   * 键盘事件处理：方向键/WASD 移动，空格/J 攻击，R 重置。
   */
  function handleKeyDown(e) {
    if (!canvas) return;
    const key = e.key.toLowerCase();

    // R 键：随时重置并开始
    if (key === 'r') {
      reset();
      if (!state.running) start();
      e.preventDefault();
      return;
    }

    if (!state.running || state.gameOver) return;

    let dx = 0, dy = 0, facing = null;
    if (key === 'arrowup' || key === 'w') { dy = -1; facing = 'up'; }
    else if (key === 'arrowdown' || key === 's') { dy = 1; facing = 'down'; }
    else if (key === 'arrowleft' || key === 'a') { dx = -1; facing = 'left'; }
    else if (key === 'arrowright' || key === 'd') { dx = 1; facing = 'right'; }
    else if (key === ' ' || key === 'j') {
      // 空格 / J：朝面对方向攻击
      tryAttack();
      e.preventDefault();
      return;
    }

    if (facing) {
      state.player.facing = facing;
      tryMove(dx, dy);
      e.preventDefault();
    }
  }

  // ============================================================
  // 公共 API / Public API
  // ============================================================

  /**
   * 初始化游戏：绑定 canvas、设置像素渲染、初始化音频、绑定键盘、生成初始地图。
   * @param {HTMLCanvasElement} canvasEl
   */
  function init(canvasEl) {
    canvas = canvasEl;
    if (!canvas) return;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    // CSS 像素化渲染（放大不平滑）
    canvas.style.imageRendering = 'pixelated';
    // 初始化音频（实际发声需用户手势，由 start() 触发 resume）
    initAudio();
    // 绑定键盘
    window.addEventListener('keydown', handleKeyDown);
    // 初始化游戏状态并渲染一帧
    reset();
  }

  /**
   * 开始游戏：启动主循环 + BGM（必须在用户手势后调用以激活音频）。
   */
  function start() {
    if (!canvas) return;
    if (state.running) return;
    if (!state.audioContext) initAudio();
    // 恢复 suspended 状态的音频上下文
    if (state.audioContext && state.audioContext.state === 'suspended') {
      state.audioContext.resume();
    }
    state.running = true;
    state.lastTime = performance.now();
    state.animationId = requestAnimationFrame(gameLoop);
    playBGM();
  }

  /**
   * 停止游戏：暂停主循环 + BGM。
   */
  function stop() {
    state.running = false;
    if (state.animationId) {
      cancelAnimationFrame(state.animationId);
      state.animationId = null;
    }
    stopBGM();
  }

  /**
   * 重置游戏到初始状态（第 1 关，等级 1，HP/ATK/DEF 重置）。
   */
  function reset() {
    state.player = {
      gx: 1, gy: 1,
      px: PIXEL, py: PIXEL,
      targetGx: 1, targetGy: 1,
      moving: false, moveProgress: 0,
      facing: 'down', frame: 0,
      hp: 20, maxHp: 20,
      atk: 5, def: 1,
      level: 1, exp: 0, expToNext: 10
    };
    state.level = 1;
    state.gameOver = false;
    state.message = '开始地牢冒险! 找到向下走廊进入下一关';
    state.messageTimer = 3;
    state.animTime = 0;
    generateMap(1);
    if (ctx) render();
  }

  return {
    init: init,
    start: start,
    stop: stop,
    reset: reset
  };
})();