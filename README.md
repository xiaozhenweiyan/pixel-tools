# 像素风格工具网站 · Pixel Tools

> 一个复古像素风格的纯前端工具集合网站，覆盖学习、艺术、沙盒、工具、娱乐五大类别，所有功能 100% 在浏览器中运行，无需后端、无需登录、无需联网（仅首次加载需要网络，PWA 安装后可离线使用）。

<p align="center">
  <strong>复古深空像素风 · 中英文双语 · PWA 离线可用 · 响应式设计 · 鼠标拖拽粒子特效</strong>
</p>

---

## 目录

- [在线访问](#在线访问)
- [项目简介](#项目简介)
- [核心特性](#核心特性)
- [工具目录](#工具目录)
  - [学习类 LEARNING](#学习类-learning)
  - [艺术类 ART](#艺术类-art)
  - [沙盒类 SANDBOX](#沙盒类-sandbox)
  - [工具类 TOOLS](#工具类-tools)
  - [娱乐类 ENTERTAINMENT](#娱乐类-entertainment)
- [预测系统 40 种方法](#预测系统-40-种方法)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [本地开发](#本地开发)
- [部署到 GitHub Pages](#部署到-github-pages)
- [PWA 与 Service Worker 策略](#pwa-与-service-worker-策略)
- [国际化（i18n）](#国际化i18n)
- [教程系统](#教程系统)
- [首页交互](#首页交互)
- [键盘快捷键](#键盘快捷键)
- [鼠标拖拽粒子特效](#鼠标拖拽粒子特效)
- [MCP Server](#mcp-server)
- [WebAssembly 加速](#webassembly-加速)
- [浏览器兼容性](#浏览器兼容性)
- [性能与无障碍](#性能与无障碍)
- [贡献](#贡献)
- [License](#license)

---

## 在线访问

- 在线 Demo：<https://xiaozhenweiyan.github.io/pixel-tools/>
- GitHub 仓库：<https://github.com/xiaozhenweiyan/pixel-tools>

> 推荐使用最新版 Chrome / Edge / Firefox / Safari 访问。首次加载后可点击浏览器地址栏的"安装"按钮把网站作为 PWA 应用添加到桌面，之后即可离线使用。

---

## 项目简介

Pixel Tools 是一个纯前端的工具集合网站，采用复古深空像素风（Retro Deep-Space Pixel Theme）视觉设计。所有工具均使用原生 JavaScript + Canvas API 实现，不依赖任何前端框架（React / Vue / Angular 等），仅在像素艺术生成器中借用了 [p5.js](https://p5js.org/) 作为绘图辅助库。

网站包含 20+ 个独立工具，分布在 5 个一级类别下：

- **学习类**：数学预测器、函数绘图、计算器、像素编程（迷宫 + 神经网络可视化）、7 种数学学习卡片
- **艺术类**：像素艺术生成器（8 种艺术模式）、像素绘图编辑器（多图层 + 调色板）、像素音乐合成器（8-bit 芯片音乐）
- **沙盒类**：物理模拟器（Falling Sand 风格）、AI 图像像素化工具
- **工具类**：像素时钟（时钟 + 日历 + 番茄钟）
- **娱乐类**：像素 RPG 小游戏（回合制战斗）

整个项目零后端依赖，所有数据存储在浏览器 `localStorage` / `IndexedDB` 中，关闭浏览器即销毁（除非用户主动保留）。所有图像处理（像素化、绘图导出）全部在客户端完成，图片不会上传到任何服务器。

---

## 核心特性

- **复古深空像素风 UI**：统一的色板（深空蓝 `#1a1a2e`、面板紫 `#2d2d44`、金黄强调 `#ffd700`）、像素边框（`3px solid`）、硬阴影（`4px 4px 0`）、等宽字体（Courier New）。
- **中英文双语支持**：完整的 i18n 系统，支持 `auto` / `zh` / `en` 三种模式，`auto` 跟随系统语言，切换实时生效无需刷新（部分页面会提示刷新）。
- **PWA 离线可用**：通过 Service Worker 缓存所有静态资源，安装到桌面后可完全离线使用。
- **响应式设计**：桌面端双栏布局，移动端单栏自适应，触摸友好的按钮尺寸和间距。
- **首页分类折叠**：5 个一级类别可独立折叠/展开，状态保存到 `localStorage`，下次访问自动恢复。
- **首页"最近使用"快捷区**：自动记录最近访问的 3 个工具，无记录时自动隐藏，支持一键清空。
- **ESC 键返回上一级**：在任何子页面按 ESC 返回上一级，连按可逐级回到首页；输入框聚焦时按 ESC 优先失焦。
- **鼠标拖拽粒子特效**：鼠标在页面上拖动时会留下像素风粒子拖尾，位于最顶层（`z-index: 99999`）但不遮挡交互（`pointer-events: none`）。
- **每页专属教程**：每个工具页面底部都有"教程"按钮（固定在视口底部居中），点击弹出该页面的专属使用说明，内容包括基本操作、参数说明、技巧等。
- **函数系统参数动画**：函数系统支持参数 `a, b, c, d...`，添加函数后自动出现参数滑动条，可设置最小值、最大值、步长，点击"播放动画"参数按正弦波形自动变化。
- **坐标系单位长度标识**：预测器和函数系统的坐标系会根据缩放级别自动选择最接近的标准单位长度（1, 0.5, 0.2, 0.1, 2, 5, 10...），在坐标轴左下角显示，缩放时自动调整。
- **纯前端实现**：零后端依赖，所有计算、存储、渲染都在浏览器中完成，数据不会离开设备。
- **WebAssembly 加速**（实验性）：反应扩散模式可选启用 Wasm 加速，性能比纯 JS 版本提升 3-5 倍。
- **MCP Server**：附带一个 MCP（Model Context Protocol）服务器，把计算器和预测器封装为 MCP tools，可供 TRAE、Claude 等 MCP 客户端直接调用。

---

## 工具目录

### 学习类 LEARNING

#### 像素数学 PIXEL MATH

数学工具的集合入口，包含三大核心工具：

- **预测系统 PIXEL PREDICTOR**：输入数字序列，使用 40 种数学方法 + 神经网络预测下一个值，支持权重融合、长期训练、回测验证、JSON/CSV 导出。
- **函数系统 PIXEL FUNCTION**：绘制 2D/3D 函数图像，支持参数滑动条、动画播放、鼠标拖拽平移、滚轮缩放、单位长度自动调整。
- **计算器系统 PIXEL CALCULATOR**：像素风计算器，支持四则运算、表达式求值、三角函数、对数、幂运算、括号、常数（pi, e），DEG/RAD 切换，运算步骤展示，历史记录。

#### 像素编程 PIXEL PROGRAMMING

算法可视化工具集合：

- **像素迷宫 PIXEL MAZE**：使用 4 种算法生成迷宫（递归回溯 Recursive Backtracker、Prim、Kruskal、Eller），支持 BFS 最短路径求解动画，可调整行列数和墙壁厚度，可导出为像素图。
- **神经网络可视化 NN VISUALIZER**：可视化神经网络训练过程，实时显示前向/反向传播、权重变化、损失曲线、决策边界，支持 XOR、正弦拟合、分类问题等数据集。

#### 学习系统 LEARNING SYSTEM

数学学习卡片集合，通过动画和互动帮助理解数学概念：

- **四则运算 ARITHMETIC**：加减乘除基础运算，方块阵列动画演示运算过程。
- **混合运算 MIXED ARITHMETIC**：带括号的四则混合运算，演示运算优先级。
- **分数 FRACTION**：分数加减乘除、约分、通分动画。
- **小数 DECIMAL**：小数运算、与分数互转动画。
- **方程 EQUATION**：一元一次/二次方程，天平动画求解。
- **几何 GEOMETRY**：面积/周长/体积公式，互动图形。
- **速算挑战 SPEED CHALLENGE**：60 秒限时答题，本地排行榜。

### 艺术类 ART

#### 像素图画 PIXEL DRAWING

- **像素艺术生成器 PIXEL ART**：基于种子化随机算法生成像素艺术，8 种艺术模式（流场 Flow Field、粒子系统 Particles、几何马赛克 Mosaic、螺旋 Spiral、分形树 Fractal Tree、Voronoi 镶嵌、波干涉 Wave、反应扩散 Reaction-Diffusion），可调整分辨率、密度、色相、递归深度等参数，支持动画播放和 PNG 导出。相同种子 + 相同参数 = 相同图像，方便复现。
- **像素绘图编辑器 PIXEL DRAWING EDITOR**：逐像素手绘创作，支持画笔、橡皮、填充、吸管、直线、矩形、圆形等工具，多图层操作，NES / GameBoy / CGA 复古调色板 + 自定义颜色，可调整画布尺寸，导出 PNG。

#### 像素音乐 PIXEL MUSIC

- **像素音乐合成器 PIXEL MUSIC SYNTH**：8-bit 芯片音乐创作工具，多音轨序列编辑器（旋律、贝斯、鼓点），方波 / 三角波 / 锯齿波 / 噪声等音色，可调 BPM，钢琴键盘输入，示波器可视化，导出 WAV。

### 沙盒类 SANDBOX

- **物理模拟器 PHYSICS SANDBOX**：像素风 2D 物理沙盒，类似 Falling Sand Game。支持沙子、水、石头、火、植物、金属等元素，元素间有真实互动（火燃烧植物、金属被火加热变红、植物遇水生长等），可调整笔刷大小，播放/暂停控制。
- **AI 图像像素化 IMAGE PIXELIZER**：上传任意图片，自动转换为像素风格。可调整像素块大小、调色板（NES / GameBoy / CGA / 自定义）、颜色数量，实时预览，下载像素化图片。所有处理纯前端完成，图片不上传服务器。

### 工具类 TOOLS

- **像素时钟 PIXEL CLOCK**：复古像素风时钟、日历和番茄钟工具。
  - 数字时钟：实时显示当前时间，多种像素字体风格。
  - 日历：月历视图，可点击日期添加事件标记。
  - 番茄钟：25 分钟工作 + 5 分钟休息循环，提高专注力。

### 娱乐类 ENTERTAINMENT

- **像素 RPG PIXEL RPG**：简单的像素风 RPG 小游戏，回合制战斗、角色升级。
  - 方向键 / WASD 控制角色移动。
  - 遇到敌人进入回合制战斗，可选择攻击、技能、道具等指令。
  - 击败敌人获得经验值，升级提升属性。
  - 8-bit 音效。

---

## 预测系统 40 种方法

预测系统（PIXEL PREDICTOR）内置 40 种数学预测方法，按权重融合给出最终预测结果。所有方法均在客户端计算，无任何后端调用。

| # | ID | 方法名 | 说明 |
|---|----|--------|------|
| 1 | `naive` | 朴素法 Naive | 用最后一个值作为预测 |
| 2 | `seasonal_naive` | 季节朴素法 Seasonal Naive | 用上一个周期的值 |
| 3 | `drift` | 漂移法 Drift | 在朴素法基础上加平均变化趋势 |
| 4 | `mean` | 简单平均 Mean | 所有序列值的平均 |
| 5 | `median` | 中位数 Median | 所有序列值的中位数 |
| 6 | `sma` | 简单移动平均 SMA | 简单移动平均 |
| 7 | `wma` | 加权移动平均 WMA | 加权移动平均（近期权重更高） |
| 8 | `ses` | 简单指数平滑 SES | 简单指数平滑 |
| 9 | `holt` | 二次指数平滑 Holt Linear | Holt 线性趋势法 |
| 10 | `holt_winters` | 三次指数平滑 Holt-Winters | Holt-Winters 季节趋势法 |
| 11 | `linear` | 线性回归 Linear | 最小二乘线性回归 |
| 12 | `poly2` | 二次多项式回归 Poly2 | 二次多项式拟合 |
| 13 | `poly3` | 三次多项式回归 Poly3 | 三次多项式拟合 |
| 14 | `ar1` | 自回归 AR(1) | 一阶自回归 |
| 15 | `ar2` | 自回归 AR(2) | 二阶自回归 |
| 16 | `geometric` | 几何增长 Geometric | 几何级数增长 |
| 17 | `diff1` | 一阶差分外推 Diff1 | 一阶差分外推 |
| 18 | `diff2` | 二阶差分外推 Diff2 | 二阶差分外推 |
| 19 | `fibonacci` | Fibonacci 黄金比率 | Fibonacci 黄金比率 |
| 20 | `fourier` | 傅里叶外推 Fourier | 傅里叶级数外推 |
| 21 | `seasonal_naive3` | 季节朴素3 Seasonal Naive(3) | 周期为 3 的季节朴素 |
| 22 | `exp_smooth_03` | 指数平滑(α=0.3) SES-0.3 | α=0.3 的指数平滑 |
| 23 | `exp_smooth_07` | 指数平滑(α=0.7) SES-0.7 | α=0.7 的指数平滑 |
| 24 | `sma5` | 5点移动平均 SMA-5 | 5 点简单移动平均 |
| 25 | `poly4` | 四次多项式回归 Poly4 | 四次多项式拟合 |
| 26 | `ar3` | 自回归 AR(3) | 三阶自回归 |
| 27 | `harmonic_mean` | 调和平均 Harmonic Mean | 调和平均数 |
| 28 | `cagr` | 复合增长率 CAGR | 复合年均增长率 |
| 29 | `log_linear` | 对数线性回归 Log-Linear | 对数变换后线性回归 |
| 30 | `weighted_last` | 末尾加权平均 Weighted-Last | 末尾加权平均 |
| 31 | `diff_extrap` | 差分外推 Diff Extrap | 差分外推 |
| 32 | `weighted_median` | 加权中位数 Weighted Median | 加权中位数 |
| 33 | `recursive_avg` | 递推平均 Recursive Avg | 递推平均 |
| 34 | `sign_preserving` | 符号守恒 Sign-Preserving | 符号守恒预测 |
| 35 | `second_order` | 二阶趋势 Second Order | 二阶趋势外推 |
| 36 | `moving_median` | 移动中位数 Moving Median | 移动中位数 |
| 37 | `triple_smooth` | 三次平滑 Triple Smooth | 三次平滑 |
| 38 | `symmetric_proj` | 对称投影 Symmetric Proj | 对称投影 |
| 39 | `ratio_diff` | 比值差分 Ratio Diff | 比值差分 |
| 40 | `abs_log_linear` | 绝对值对数线性 Abs Log-Lin | 绝对值对数线性 |

此外还有 **神经网络预测**（独立，不参与融合）、**过拟合算法**（独立，不参与融合）、**偏移算法**（独立，不参与融合）、**函数拟合**（带 R² 评估）。

权重模式支持：
- **回测权重**：留一回测 MAPE 反归一化权重，误差越低权重越高。
- **均匀权重**：所有方法权重相等。

---

## 技术栈

- **原生 JavaScript**：无任何前端框架（React / Vue / Angular），仅使用 ES5 兼容写法以保证最大兼容性。
- **Canvas 2D API**：所有绘图（图表、函数、像素艺术、物理模拟）均使用 Canvas 2D API。
- **Web Audio API**：像素音乐合成器使用 Web Audio API 实时合成 8-bit 音色。
- **Service Worker + Cache API**：PWA 离线缓存，使用 Network-First 策略确保用户拿到最新版本。
- **CSS Variables**：统一的色板和设计 token 管理。
- **p5.js**（仅像素艺术生成器使用）：作为绘图辅助库。
- **WebAssembly**（实验性）：反应扩散模式的 Wasm 加速版本，由 Emscripten 编译 C 源码生成。
- **localStorage**：保存用户设置（昵称、语言、背景、分类折叠状态、最近使用、速算排行榜等）。
- **IndexedDB / Blob URL**：保存头像和背景图片（base64 直接存 localStorage 会超限）。
- **GitHub Actions**：自动部署到 GitHub Pages。

---

## 项目结构

```
pixel-tools/
├── index.html                  # 主页面（包含所有页面 div，通过 hidden 类切换）
├── styles/
│   └── pixel.css               # 全局样式（CSS Variables + 像素风组件）
├── js/
│   ├── app.js                  # 主应用逻辑（页面切换、历史栈、首页增强、教程系统）
│   ├── i18n.js                 # 国际化（中英文双语，含每页专属教程内容）
│   ├── mouse-trails.js         # 鼠标拖拽粒子特效（最顶层 canvas，pointer-events: none）
│   ├── expression-parser.js    # 表达式解析（AST，用于计算器和函数系统）
│   ├── predictors.js           # 40 种序列预测方法
│   ├── weights.js              # 权重计算 + 回测（backtest / computeWeights / ensemblePredict）
│   ├── nn.js                   # 神经网络（含增量训练、长期训练模式）
│   ├── funcfit.js              # 函数拟合（带 R² 评估）
│   ├── overfit.js              # 过拟合算法（独立，不参与融合）
│   ├── offsetfit.js            # 偏移算法（独立，不参与融合）
│   ├── chart.js                # 折线图 + 权重条形图（自制像素风滚动条 + 缩放按钮）
│   ├── function-plotter.js     # 2D 函数绘制（坐标系、单位长度、参数滑动条、动画）
│   ├── function-3d.js          # 3D 函数渲染（z=f(x,y)，鼠标旋转视角）
│   ├── math-cards.js           # 数学学习卡片（四则运算 + 混合运算）
│   ├── math-cards-ext.js       # 数学卡片扩展（分数 / 小数 / 方程 / 几何 / 速算）
│   ├── maze-generator.js       # 迷宫生成器（4 种算法 + BFS 求解动画）
│   ├── nn-visualizer.js        # 神经网络可视化（前向/反向传播、损失曲线、决策边界）
│   ├── pixel-art.js            # 像素艺术生成器（8 种艺术模式，依赖 p5.js）
│   ├── pixel-drawing-editor.js # 像素绘图编辑器（多图层 + 调色板 + 工具栏）
│   ├── pixel-music.js          # 像素音乐合成器（Web Audio API + 音序器 + 示波器）
│   ├── physics-sandbox.js      # 物理模拟器（Falling Sand 风格，元素互动）
│   ├── image-pixelizer.js      # 图像像素化（调色板量化 + 颜色限制）
│   ├── pixel-clock.js          # 像素时钟（时钟 + 日历 + 番茄钟）
│   └── pixel-rpg.js            # 像素 RPG（回合制战斗 + 升级）
├── wasm/
│   ├── reaction-diffusion.c    # 反应扩散 C 源码（Gray-Scott 模型）
│   └── build.sh                # Emscripten 编译脚本
├── mcp-server/                 # MCP Server（FastMCP + Python）
│   ├── server.py               # 主服务（calculate / predict_sequence / list_predictors）
│   ├── requirements.txt        # 依赖（mcp）
│   └── README.md               # MCP Server 文档
├── icons/
│   ├── icon-192.png            # PWA 图标 192px
│   └── icon-512.png            # PWA 图标 512px
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions 自动部署到 Pages
├── service-worker.js           # PWA Service Worker（Network-First 策略）
├── manifest.json               # PWA Manifest
├── .gitignore
└── README.md                   # 本文档
```

---

## 本地开发

本项目是纯静态网站，无需构建步骤，用任意静态服务器打开即可。

```bash
# 1. 克隆仓库
git clone https://github.com/xiaozhenweiyan/pixel-tools.git
cd pixel-tools

# 2. 启动静态服务器（任选其一）

# 方式 A：Python 3
python3 -m http.server 8000

# 方式 B：Node.js（需先 npm i -g serve）
serve -p 8000

# 方式 C：VS Code Live Server 扩展（右键 index.html → Open with Live Server）

# 3. 在浏览器访问
# http://localhost:8000
```

> **重要**：必须通过 `http://localhost` 访问，不能直接用 `file://` 协议打开。原因：
> 1. Service Worker 只能在 `http://` 或 `https://` 协议下注册。
> 2. 部分浏览器限制 `file://` 协议下的 `localStorage` 和 ES Module。
> 3. p5.js 等 CDN 资源在 `file://` 下可能加载失败。

### 修改与调试

- 所有 JS 都是 IIFE 模式，挂载到 `window` 全局，可直接在浏览器 DevTools Console 中调用。
- 修改 CSS 后无需刷新（部分浏览器支持热重载），修改 JS 需要刷新页面。
- Service Worker 修改后需要关闭所有标签页再重新打开，或在新 SW 激活后刷新一次（已在 `service-worker.js` 中通过 `skipWaiting` + `clients.claim` 自动处理）。
- 调试 Service Worker：Chrome DevTools → Application → Service Workers → 勾选 "Update on reload"。

---

## 部署到 GitHub Pages

本项目通过 GitHub Actions 自动部署，每次推送到 `main` 分支会触发部署。

### 自动部署配置

`.github/workflows/deploy.yml` 配置如下：

- **触发条件**：push 到 `main` 分支，或手动 workflow_dispatch。
- **权限**：`pages: write` + `id-token: write`（GitHub Pages 部署所需）。
- **并发控制**：`group: pages`，新部署会取消正在进行的旧部署。
- **步骤**：checkout → configure-pages → upload-artifact（path: `.`）→ deploy-pages。

### 手动部署

如果想手动部署到自己的 GitHub Pages：

1. Fork 本仓库。
2. 进入仓库 Settings → Pages → Source：选 "GitHub Actions"。
3. 推送代码到 `main` 分支，等待 Actions 完成即可访问 `https://<你的用户名>.github.io/pixel-tools/`。

### 自定义域名

如需使用自定义域名，在仓库根目录添加 `CNAME` 文件（内容为域名），并在 DNS 服务商配置 CNAME 记录指向 `<用户名>.github.io`。

---

## PWA 与 Service Worker 策略

`service-worker.js` 使用 **Network-First** 策略，确保用户每次刷新都能拿到最新版本：

| 资源类型 | 策略 | 说明 |
|---------|------|------|
| HTML 文档 | Network-First | 优先网络，离线时回退缓存 |
| JS / CSS / 图片 | Network-First | 优先网络，避免 SWR 导致刷新两次才生效 |
| 第三方 CDN（p5.js） | Cache-First | 跨域资源缓存优先，离线兜底 |

### 缓存版本管理

每次部署后必须升级 `CACHE_VERSION`（当前 `v13`），新 SW 激活时会自动删除所有旧版本缓存：

```javascript
const CACHE_VERSION = 'v13';
const CACHE_NAME = 'pixel-tools-' + CACHE_VERSION;
```

### SW 更新流程

1. 浏览器检测到 `service-worker.js` 字节变化，后台下载新版本。
2. 新 SW 安装（`install` 事件）→ 预缓存关键资源 → `self.skipWaiting()` 立即接管。
3. 新 SW 激活（`activate` 事件）→ 删除所有旧缓存 → `self.clients.claim()` 立即控制所有客户端 → 通知所有客户端 `SW_UPDATED`。
4. 客户端收到 `SW_UPDATED` 消息后可提示用户刷新（部分页面会自动刷新）。

### 调试 Service Worker

- Chrome DevTools → Application → Service Workers
- 勾选 "Update on reload"：每次刷新都重新下载 SW。
- 勾选 "Bypass for network"：临时绕过 SW（用于排查问题）。
- "Unregister"：注销 SW（用于彻底重置）。

---

## 国际化（i18n）

`js/i18n.js` 实现完整的中英文双语系统：

- **三种模式**：`auto`（跟随系统）/ `zh`（中文）/ `en`（英文），保存到 `localStorage`。
- **翻译函数**：`i18n.t(key, params)`，支持参数插值（如 `t('toast_welcome', { name: '访客' })` → `欢迎你，访客！`）。
- **自动应用**：所有带 `data-i18n` 属性的元素会自动更新 `innerHTML`，带 `data-i18n-placeholder` 的元素更新 `placeholder`。
- **实时切换**：调用 `i18n.setMode('en')` 立即更新所有 DOM，无需刷新（部分页面如 Service Worker 缓存的页面可能需要手动刷新）。
- **自定义事件**：切换语言时触发 `languagechange` 事件，组件可监听此事件做额外处理。
- **回退机制**：找不到 key 时返回 key 本身，并在 Console 警告。

### 添加新翻译

1. 在 `js/i18n.js` 的 `translations.zh` 和 `translations.en` 中同时添加 key。
2. 在 HTML 中给元素加 `data-i18n="key"`（替换 innerHTML）或 `data-i18n-placeholder="key"`（替换 placeholder）。
3. 在 JS 中通过 `i18n.t('key')` 获取翻译。

> **注意**：含连字符的 key（如 `tutorial_app-landing`）必须用引号括起来：`'tutorial_app-landing': '...'`，否则 JS 会把 `-` 解析为减号导致语法错误。

---

## 教程系统

每个工具页面底部都有一个"教程"按钮（`.tutorial-btn`），固定在视口底部居中（`position: fixed; bottom: 20px`），点击弹出该页面的专属教程模态框。

### 实现细节

- **按钮位置**：CSS `position: fixed` 确保始终在视口底部，不受页面滚动影响。
- **按钮位置（DOM）**：按钮放在对应页面 `<div>` 内部（`</div>` 之前），确保 `hideAllPages()` 隐藏页面时按钮也被隐藏。
- **专属内容**：每个页面的教程内容都是该页面专属的，根据 `data-page` 属性查找 i18n key（如 `app-landing-page` → `tutorial_app-landing`）。
- **回退兜底**：找不到专属教程时显示通用 `tutorial_fallback` 内容。
- **模态框**：点击遮罩、按 ESC、点击 × 按钮均可关闭，关闭时恢复 `body` 滚动。
- **层级**：教程按钮 `z-index: 9000`，教程模态框 `z-index: 10001`，鼠标拖拽粒子 `z-index: 99999`。

### 教程 key 命名规则

页面 ID 去掉 `-page` 后缀，加 `tutorial_` 前缀：

| 页面 ID | i18n key |
|---------|----------|
| `app-landing-page` | `tutorial_app-landing` |
| `landing-page` | `tutorial_landing` |
| `learning-landing-page` | `tutorial_learning-landing` |
| `pixel-programming-landing-page` | `tutorial_pixel-programming-landing` |
| `predictor-page` | `tutorial_predictor` |
| `function-page` | `tutorial_function` |
| `calculator-page` | `tutorial_calculator` |
| `pixel-art-page` | `tutorial_pixel_art` |
| `pixel-drawing-page` | `tutorial_pixel_draw` |
| `pixel-music-page` | `tutorial_pixel_music` |
| `arithmetic-page` | `tutorial_arithmetic` |
| `mixed-arithmetic-page` | `tutorial_mixed-arithmetic` |
| `fraction-page` | `tutorial_fraction` |
| `decimal-page` | `tutorial_decimal` |
| `equation-page` | `tutorial_equation` |
| `geometry-page` | `tutorial_geometry` |
| `speed-page` | `tutorial_speed` |
| `maze-page` | `tutorial_maze` |
| `nn-visualizer-page` | `tutorial_nn-visualizer` |
| `physics-page` | `tutorial_physics` |
| `pixelizer-page` | `tutorial_pixelizer` |
| `clock-page` | `tutorial_clock` |
| `rpg-page` | `tutorial_rpg` |
| `settings-page` | `tutorial_settings` |

---

## 首页交互

### 分类折叠

首页的 5 个一级类别（学习类 / 艺术类 / 工具类 / 娱乐类）可独立折叠/展开：

- 点击类别标题切换折叠状态。
- 折叠状态保存到 `localStorage`，下次访问自动恢复。
- 折叠图标 `▼` / `▶` 实时更新。

### 最近使用

首页顶部"最近使用"区域：

- 自动记录最近访问的 3 个工具（FIFO，重复访问会移到最前）。
- 点击卡片即可快速进入对应工具。
- 点击"清空"按钮清除所有记录。
- 无记录时该区域自动隐藏（`display: none`）。

### ESC 键导航

- 在任何子页面按 ESC 返回上一级页面。
- 连按可逐级回到首页。
- 在首页按 ESC 不响应。
- 输入框聚焦时按 ESC 优先失焦（不触发页面返回）。

---

## 键盘快捷键

| 快捷键 | 作用 | 适用页面 |
|--------|------|---------|
| `ESC` | 返回上一级页面 / 输入框失焦 | 所有页面 |
| `Enter` | 提交输入（预测、计算、添加函数等） | 预测器、计算器、函数系统 |
| `←` `→` `↑` `↓` / `WASD` | 角色移动 | 像素 RPG |
| `+` / `-` | 缩放坐标系 | 预测器、函数系统 |
| 鼠标拖拽 | 平移坐标系 / 旋转 3D 视角 / 绘制 | 预测器、函数系统、物理沙盒、绘图编辑器 |
| 滚轮 | 缩放 | 预测器、函数系统、像素艺术 |

---

## 鼠标拖拽粒子特效

`js/mouse-trails.js` 实现的鼠标拖拽粒子特效：

- **触发**：鼠标在页面上移动时（速度超过阈值）。
- **效果**：在鼠标轨迹上生成像素风粒子，粒子有重力、衰减、淡出效果。
- **层级**：`z-index: 99999`（最顶层），但 `pointer-events: none`，不遮挡任何交互。
- **canvas 重置**：通过 `#mouse-trails-canvas` 专用 CSS 规则 + inline 样式，重置全局 `canvas {}` 规则的影响（背景透明、无边框、无阴影、宽度不限）。
- **性能**：使用 `requestAnimationFrame`，粒子数量上限自动控制，避免性能问题。
- **移动端**：触摸事件同样触发粒子特效。

---

## MCP Server

`mcp-server/` 目录包含一个 MCP（Model Context Protocol）服务器，把网站的计算器和预测器封装为 MCP tools，可供 TRAE、Claude Desktop、Cursor 等 MCP 客户端直接调用。

### 暴露的 Tools

- **`calculate(expression, angle_mode?)`**：计算数学表达式（白名单 + 受限 `eval`，仅暴露 `math` 模块与三角函数包装）。
- **`predict_sequence(series, count?, weight_mode?)`**：预测数字序列的后续值（4 种基础方法：平均值、线性回归、差分、移动平均，按权重融合）。
- **`list_predictors()`**：列出所有可用的预测方法。

### 安装与配置

详见 [`mcp-server/README.md`](mcp-server/README.md)。

### 安全说明

- 表达式求值使用受限 `eval`，全局命名空间 `__builtins__` 为空，仅暴露 `math` 模块与三角函数包装。
- 输入字符白名单：数字、`+ - * / ( ) .` 空白、函数名 `sqrt` / `sin` / `cos` / `tan`，其余字符直接拒绝。
- 三角函数 DEG 模式经 `x * π / 180` 转换为弧度，并内置特殊角度精确值查表（0/30/45/60/90/120/135/150/180/270/360 度）。

---

## WebAssembly 加速

`wasm/` 目录包含反应扩散模式的 Wasm 加速版本：

- **源码**：`wasm/reaction-diffusion.c`（Gray-Scott 反应扩散模型）。
- **编译**：`wasm/build.sh`（使用 Emscripten 编译为 `wasm/reaction_diffusion.wasm`）。
- **使用**：在像素艺术生成器中选择"反应扩散 RD"模式，在设置页启用 "WebAssembly 加速"。
- **性能**：Wasm 版本比纯 JS 版本快 3-5 倍，可处理更高分辨率和更多迭代次数。
- **回退**：Wasm 加载失败时自动回退到 JS 版本，并提示用户。

### 编译 Wasm

```bash
cd wasm
# 需要先安装 Emscripten SDK（emsdk）
./build.sh
# 生成的 reaction_diffusion.wasm 会自动放到 ../js/ 目录
```

---

## 浏览器兼容性

| 浏览器 | 最低版本 | 备注 |
|--------|---------|------|
| Chrome | 90+ | 推荐 |
| Edge | 90+ | 推荐 |
| Firefox | 88+ | 推荐 |
| Safari | 14+ | iOS Safari 14+ |
| Samsung Internet | 14+ | |
| IE | 不支持 | 使用了 ES6+ 特性 |

### 必需的 Web API

- **Service Worker**：PWA 离线功能。
- **Cache API**：SW 缓存。
- **localStorage**：用户设置存储。
- **IndexedDB**：头像和背景图片存储。
- **Canvas 2D**：所有绘图。
- **Web Audio API**：像素音乐合成器。
- **Blob URL**：图片处理。
- **WebAssembly**（可选）：反应扩散加速。

---

## 性能与无障碍

### 性能优化

- **零依赖**：除 p5.js（仅像素艺术生成器使用）外无任何第三方库。
- **按需加载**：每个工具的 JS 只在该工具被打开时初始化。
- **Canvas 重绘优化**：仅在数据变化时重绘，避免无意义 `requestAnimationFrame`。
- **粒子数量上限**：鼠标拖拽粒子特效自动限制粒子数量。
- **Service Worker 缓存**：所有静态资源缓存，二次访问零网络请求。
- **CSS Variables**：统一的设计 token，避免重复样式计算。

### 无障碍（Accessibility）

- **键盘导航**：所有按钮和输入框支持 Tab 键聚焦，Enter 键提交。
- **focus-visible**：聚焦时显示明显的金色边框（`border-color: var(--accent)`）。
- **ARIA 标签**：装饰性 SVG 添加 `aria-hidden="true"`。
- **prefers-reduced-motion**：尊重系统"减少动画"设置，禁用按钮过渡动画。
- **语义化 HTML**：使用 `<header>` `<footer>` `<button>` 等语义化标签。
- **颜色对比度**：所有文本与背景的对比度符合 WCAG AA 标准。

---

## 贡献

欢迎通过 Issue 和 Pull Request 贡献代码！

### 贡献流程

1. Fork 本仓库。
2. 创建特性分支：`git checkout -b feature/your-feature`。
3. 提交修改：`git commit -m 'feat: add your feature'`（推荐使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范）。
4. 推送分支：`git push origin feature/your-feature`。
5. 提交 Pull Request。

### 贡献方向

- 新工具：添加新的像素风工具（如像素塔防、像素画板导入导出等）。
- 新艺术模式：为像素艺术生成器添加新的生成算法。
- 新预测方法：为预测系统添加新的数学方法。
- 新学习卡片：为学习系统添加新的数学概念卡片。
- 国际化：添加新语言支持（如日语、韩语）。
- 性能优化：Wasm 加速更多模式。
- Bug 修复：修复 Issue 中的问题。

### 代码规范

- JavaScript：ES5 兼容写法（`var` / `function`），IIFE 模式，挂载到 `window` 全局。
- CSS：使用 CSS Variables，遵循 BEM 命名（部分老代码可能不完全符合）。
- HTML：语义化标签，`data-i18n` 标注所有用户可见文本。

---

## License

[MIT](LICENSE)

© 2026 Pixel Tools. 复古深空像素风.

---

## 致谢

- [p5.js](https://p5js.org/)：像素艺术生成器的绘图辅助库。
- [Emscripten](https://emscripten.org/)：WebAssembly 编译工具链。
- [FastMCP](https://github.com/modelcontextprotocol/python-sdk)：MCP Server 框架。
- [GitHub Pages](https://pages.github.com/)：免费托管。
- [GitHub Actions](https://github.com/features/actions)：自动部署。

---

> 如果这个项目对你有帮助，欢迎在 GitHub 上点个 ⭐ Star！
