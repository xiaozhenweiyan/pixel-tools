/**
 * background-particles.js
 * 背景粒子交互系统 / Background Particle Interaction System
 *
 * 功能：
 *   - 在背景渲染可交互的彩色像素方块（增强现有 .landing-pixels 装饰）
 *   - 方块可拖动（鼠标 / 触摸）
 *   - 鼠标移动产生粒子拖拽效果（小粒子跟随鼠标，带速度、寿命、重力）
 *   - 浮动菜单：开关粒子、粒子数量、重置位置
 *
 * 设计：
 *   - 单个全屏 Canvas（position: fixed, pointer-events: none）负责渲染
 *   - 交互通过 window 事件检测（canvas 本身不接收事件）
 *   - 仅在工具首页（.app-landing-page 可见）时渲染与交互，避免遮挡其它工具页
 */
window.BackgroundParticles = (function () {
  'use strict';

  // ============================================================
  // 配置 / Configuration
  // ============================================================
  var config = {
    enabled: true,          // 是否启用粒子效果
    blockCount: 12,         // 彩色方块数量
    particleCount: 3,       // 每次鼠标移动产生的粒子数
    particleLifetime: 60,   // 粒子寿命（帧）
    blockSize: 10,          // 方块尺寸（像素）
    gravity: 0.05,          // 粒子重力
    friction: 0.98,         // 粒子速度衰减
    spawnMinDistance: 4,    // 鼠标移动产生粒子的最小距离（像素）
    maxParticles: 500,      // 粒子总数上限
    colors: ['#ffd700', '#1e90ff', '#ff4500', '#228b22', '#ff69b4', '#9370db']
  };

  // ============================================================
  // 状态 / State
  // ============================================================
  var canvas = null;
  var ctx = null;
  var blocks = [];          // 彩色方块列表
  var particles = [];       // 粒子列表
  var dragging = null;      // 当前正在拖动的方块
  var dragOffset = { x: 0, y: 0 };
  var mouse = { x: 0, y: 0, lastSpawnX: 0, lastSpawnY: 0 };
  var animationId = null;
  var menuOpen = false;

  // ============================================================
  // 工具函数 / Helpers
  // ============================================================
  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function pickColor() {
    return config.colors[Math.floor(Math.random() * config.colors.length)];
  }

  // 当前是否在工具首页（仅此时渲染与交互，避免粒子遮挡其它页面）
  function isAppLandingActive() {
    var el = document.querySelector('.app-landing-page');
    return !!(el && el.classList.contains('active') && el.offsetWidth > 0);
  }

  // 事件目标是否落在工具首页内（用于交互门控）
  function targetInAppLanding(target) {
    return !!(target && target.closest && target.closest('.app-landing-page'));
  }

  // 目标是否为可交互控件（按钮 / 输入 / 链接等），此时不应开始拖动
  function isInteractiveTarget(el) {
    if (!el) return false;
    var tag = el.tagName;
    if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'TEXTAREA' ||
        tag === 'SELECT' || tag === 'A' || tag === 'LABEL') {
      return true;
    }
    if (el.classList && (el.classList.contains('pixel-btn') ||
        el.classList.contains('pixel-input') ||
        el.classList.contains('bg-particles-menu'))) {
      return true;
    }
    return false;
  }

  // 取 i18n 文案，回退到默认中文
  function tt(key, fallback) {
    if (window.i18n && typeof window.i18n.t === 'function') {
      return window.i18n.t(key);
    }
    return fallback;
  }

  // ============================================================
  // 初始化 / Initialize
  // ============================================================
  function init(container) {
    canvas = container || document.getElementById('bg-particles-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    // 关闭抗锯齿，保持像素风
    ctx.imageSmoothingEnabled = false;

    resize();
    window.addEventListener('resize', onResize);

    createBlocks();

    // 鼠标事件（监听 window，因为 canvas 是 pointer-events:none）
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mouseleave', onMouseUp);

    // 触摸支持
    window.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    createMenu();

    // 语言切换时刷新菜单 tooltip
    document.addEventListener('languagechange', updateMenuI18n);

    startAnimation();
  }

  function onResize() {
    resize();
    // 把超出新画布的方块拉回范围内
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      if (b.x > canvas.width - b.size) b.x = canvas.width - b.size;
      if (b.y > canvas.height - b.size) b.y = canvas.height - b.size;
      if (b.baseY > canvas.height - b.size) b.baseY = canvas.height - b.size;
      if (b.x < 0) b.x = 0;
      if (b.baseY < 0) b.baseY = 0;
    }
  }

  function resize() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (ctx) ctx.imageSmoothingEnabled = false;
  }

  // ============================================================
  // 方块 / Blocks
  // ============================================================
  function createBlocks() {
    blocks = [];
    if (!canvas) return;
    var w = canvas.width;
    var h = canvas.height;
    for (var i = 0; i < config.blockCount; i++) {
      var b = {
        x: rand(0, Math.max(1, w - config.blockSize)),
        y: 0,
        baseY: 0,                       // 浮动动画基准 Y
        floatPhase: rand(0, Math.PI * 2),
        floatSpeed: rand(0.01, 0.02),
        floatAmp: rand(5, 15),
        color: pickColor(),
        size: config.blockSize,
        dragging: false
      };
      b.baseY = rand(0, Math.max(1, h - config.blockSize));
      b.y = b.baseY;
      blocks.push(b);
    }
  }

  function resetBlocks() {
    createBlocks();
  }

  // 方块实际渲染位置（浮动动画后的 Y）
  function blockRenderY(b) {
    return b.dragging ? b.y : b.baseY + Math.sin(b.floatPhase) * b.floatAmp;
  }

  // 命中检测：返回鼠标位置上的方块（上层优先）
  function getBlockAt(x, y) {
    for (var i = blocks.length - 1; i >= 0; i--) {
      var b = blocks[i];
      var by = blockRenderY(b);
      if (x >= b.x && x <= b.x + b.size &&
          y >= by && y <= by + b.size) {
        return b;
      }
    }
    return null;
  }

  function updateBlocks() {
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      if (!b.dragging) {
        b.floatPhase += b.floatSpeed;
      }
    }
  }

  // ============================================================
  // 粒子 / Particles
  // ============================================================
  function spawnParticles(x, y, color, count) {
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = rand(0.5, 2.5);
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: config.particleLifetime,
        maxLife: config.particleLifetime,
        color: color,
        size: 2 + Math.floor(Math.random() * 3) // 2~4 像素
      });
    }
    // 限制粒子总数，丢弃最旧的
    if (particles.length > config.maxParticles) {
      particles.splice(0, particles.length - config.maxParticles);
    }
  }

  function updateParticles() {
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += config.gravity;
      p.vx *= config.friction;
      p.vy *= config.friction;
      p.life--;
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }
  }

  // ============================================================
  // 渲染 / Render
  // ============================================================
  function draw() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 不在工具首页时清空画面，不绘制（避免遮挡其它页面）
    if (!isAppLandingActive()) {
      return;
    }

    // 画方块
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      var by = blockRenderY(b);
      ctx.globalAlpha = b.dragging ? 1 : 0.7;
      ctx.fillStyle = b.color;
      ctx.fillRect(Math.round(b.x), Math.round(by), b.size, b.size);
    }
    ctx.globalAlpha = 1;

    // 画粒子（按寿命淡出）
    for (var j = 0; j < particles.length; j++) {
      var p = particles[j];
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  function startAnimation() {
    if (animationId) return;
    function loop() {
      updateBlocks();
      updateParticles();
      draw();
      animationId = requestAnimationFrame(loop);
    }
    loop();
  }

  // ============================================================
  // 鼠标事件 / Mouse Events
  // ============================================================
  function onMouseDown(e) {
    if (!config.enabled) return;
    if (!isAppLandingActive()) return;
    if (!targetInAppLanding(e.target)) return;
    if (isInteractiveTarget(e.target)) return;

    var b = getBlockAt(e.clientX, e.clientY);
    if (b) {
      dragging = b;
      b.dragging = true;
      var by = blockRenderY(b);
      dragOffset.x = e.clientX - b.x;
      dragOffset.y = e.clientY - by;
      e.preventDefault();
    }
  }

  function onMouseMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    if (!config.enabled) return;

    if (dragging) {
      // 拖动方块：跟随鼠标
      dragging.x = e.clientX - dragOffset.x;
      dragging.y = e.clientY - dragOffset.y;
      dragging.baseY = dragging.y; // 停止浮动，以拖动位置为新基准
      // 拖动时大量产生粒子
      spawnParticles(
        dragging.x + dragging.size / 2,
        dragging.y + dragging.size / 2,
        dragging.color,
        config.particleCount + 2
      );
      return;
    }

    // 普通移动：在工具首页可见时产生粒子拖拽效果
    if (!isAppLandingActive()) return;

    var dx = e.clientX - mouse.lastSpawnX;
    var dy = e.clientY - mouse.lastSpawnY;
    if (dx * dx + dy * dy >= config.spawnMinDistance * config.spawnMinDistance) {
      // 颜色优先取鼠标下方方块，否则随机
      var near = getBlockAt(e.clientX, e.clientY);
      var color = near ? near.color : pickColor();
      spawnParticles(e.clientX, e.clientY, color, config.particleCount);
      mouse.lastSpawnX = e.clientX;
      mouse.lastSpawnY = e.clientY;
    }
  }

  function onMouseUp() {
    if (dragging) {
      dragging.dragging = false;
      dragging.baseY = dragging.y;
      dragging.floatPhase = rand(0, Math.PI * 2);
      dragging = null;
    }
  }

  // ============================================================
  // 触摸事件 / Touch Events
  // ============================================================
  function onTouchStart(e) {
    if (!config.enabled) return;
    if (!isAppLandingActive()) return;
    if (!e.touches.length) return;
    var t = e.touches[0];
    if (!targetInAppLanding(t.target)) return;
    if (isInteractiveTarget(t.target)) return;

    var b = getBlockAt(t.clientX, t.clientY);
    if (b) {
      dragging = b;
      b.dragging = true;
      var by = blockRenderY(b);
      dragOffset.x = t.clientX - b.x;
      dragOffset.y = t.clientY - by;
      e.preventDefault();
    }
  }

  function onTouchMove(e) {
    if (!config.enabled) return;
    if (!e.touches.length) return;
    var t = e.touches[0];
    mouse.x = t.clientX;
    mouse.y = t.clientY;

    if (dragging) {
      dragging.x = t.clientX - dragOffset.x;
      dragging.y = t.clientY - dragOffset.y;
      dragging.baseY = dragging.y;
      spawnParticles(
        dragging.x + dragging.size / 2,
        dragging.y + dragging.size / 2,
        dragging.color,
        config.particleCount + 2
      );
      e.preventDefault();
      return;
    }

    if (!isAppLandingActive()) return;
    var dx = t.clientX - mouse.lastSpawnX;
    var dy = t.clientY - mouse.lastSpawnY;
    if (dx * dx + dy * dy >= config.spawnMinDistance * config.spawnMinDistance) {
      var color = pickColor();
      spawnParticles(t.clientX, t.clientY, color, config.particleCount);
      mouse.lastSpawnX = t.clientX;
      mouse.lastSpawnY = t.clientY;
    }
  }

  function onTouchEnd() {
    onMouseUp();
  }

  // ============================================================
  // 菜单 / Menu
  // ============================================================
  function createMenu() {
    if (document.getElementById('bg-particles-menu')) return;

    var menu = document.createElement('div');
    menu.id = 'bg-particles-menu';
    menu.className = 'bg-particles-menu';

    // 齿轮开关按钮
    var toggleBtn = document.createElement('button');
    toggleBtn.className = 'bg-particles-toggle';
    toggleBtn.type = 'button';
    toggleBtn.innerHTML = '<span class="bg-particles-toggle-icon">⚙</span>';
    toggleBtn.title = tt('bg_particles_menu', '背景粒子设置');
    toggleBtn.setAttribute('aria-label', tt('bg_particles_menu', '背景粒子设置'));
    toggleBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleMenu();
    });
    menu.appendChild(toggleBtn);

    // 设置面板
    var panel = document.createElement('div');
    panel.className = 'bg-particles-panel pixel-panel';

    // 启用开关
    var enabledRow = document.createElement('label');
    enabledRow.className = 'bg-particles-row';
    var enabledCheckbox = document.createElement('input');
    enabledCheckbox.type = 'checkbox';
    enabledCheckbox.id = 'bg-particles-enabled';
    enabledCheckbox.checked = config.enabled;
    enabledCheckbox.addEventListener('change', function () {
      config.enabled = this.checked;
    });
    var enabledLabel = document.createElement('span');
    enabledLabel.setAttribute('data-i18n', 'bg_particles_enabled');
    enabledLabel.textContent = tt('bg_particles_enabled', '启用粒子');
    enabledRow.appendChild(enabledCheckbox);
    enabledRow.appendChild(enabledLabel);
    panel.appendChild(enabledRow);

    // 粒子数量滑块
    var countRow = document.createElement('div');
    countRow.className = 'bg-particles-row';
    var countLabel = document.createElement('span');
    countLabel.className = 'bg-particles-label';
    countLabel.setAttribute('data-i18n', 'bg_particles_count');
    countLabel.textContent = tt('bg_particles_count', '粒子数量');
    var countSlider = document.createElement('input');
    countSlider.type = 'range';
    countSlider.min = '1';
    countSlider.max = '10';
    countSlider.value = String(config.particleCount);
    countSlider.className = 'bg-particles-slider';
    countSlider.addEventListener('input', function () {
      config.particleCount = parseInt(this.value, 10) || 1;
    });
    countRow.appendChild(countLabel);
    countRow.appendChild(countSlider);
    panel.appendChild(countRow);

    // 重置按钮
    var resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'pixel-btn bg-particles-reset';
    resetBtn.setAttribute('data-i18n', 'bg_particles_reset');
    resetBtn.textContent = tt('bg_particles_reset', '重置位置');
    resetBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      resetBlocks();
    });
    panel.appendChild(resetBtn);

    menu.appendChild(panel);
    document.body.appendChild(menu);
  }

  function toggleMenu() {
    menuOpen = !menuOpen;
    var panel = document.querySelector('#bg-particles-menu .bg-particles-panel');
    if (panel) {
      panel.style.display = menuOpen ? 'block' : 'none';
    }
    var toggle = document.querySelector('#bg-particles-menu .bg-particles-toggle');
    if (toggle) {
      toggle.classList.toggle('active', menuOpen);
    }
  }

  // 语言切换时刷新 tooltip / aria-label（齿轮按钮无 data-i18n，避免覆盖图标）
  function updateMenuI18n() {
    var toggle = document.querySelector('#bg-particles-menu .bg-particles-toggle');
    if (toggle) {
      var text = tt('bg_particles_menu', '背景粒子设置');
      toggle.title = text;
      toggle.setAttribute('aria-label', text);
    }
  }

  // ============================================================
  // 公开 API / Public API
  // ============================================================
  return {
    init: init,
    setEnabled: function (v) { config.enabled = !!v; },
    setParticleCount: function (n) {
      n = parseInt(n, 10);
      if (isNaN(n)) n = config.particleCount;
      config.particleCount = Math.max(1, Math.min(10, n));
    },
    resetBlocks: resetBlocks,
    getConfig: function () { return config; }
  };
})();
