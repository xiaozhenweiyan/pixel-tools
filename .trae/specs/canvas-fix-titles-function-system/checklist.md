# Checklist

## 像素艺术画布填满显示区域
- [ ] pixel.css 中 `#pixel-art-canvas-container` 已移除 `max-width: 600px`，改为 `width: 100%`
- [ ] pixel-art.js 默认 resolution 从 32 改为 48
- [ ] pixel-art.js 中 art-resolution input 的 value 改为 48，max 改为 96
- [ ] 打开像素艺术生成器页面，画布显示区域填满容器宽度，无明显留白
- [ ] 画布保持 1:1 正方形（aspect-ratio 1）

## 设置齿轮按钮位置
- [ ] pixel.css 中 `.floating-settings-btn` 移除 `right: 60px`，改为 `left: 60px`
- [ ] 齿轮按钮紧邻头像右侧（头像 left:16px width:36px，齿轮 left:60px）
- [ ] 齿轮按钮不挡住右上角 floating-back-btn（right:16px）
- [ ] 齿轮按钮点击仍能打开设置页

## 标题统一
- [ ] landing-page 大标题显示"像素数学"（原"数学学习网站"）
- [ ] landing-page 副标题显示"PIXEL MATH"（原"MATH LEARNING SITE"）
- [ ] predictor-page 大标题显示"预测系统 PIXEL PREDICTOR"（原"像素预测器 PIXEL PREDICTOR"）
- [ ] calculator-page 大标题显示"计算机系统 PIXEL CALCULATOR"（原"像素计算器 PIXEL CALCULATOR"）
- [ ] pixel-art-page 标题保持"像素艺术生成器"不变

## 计算器运算过程合并动画
- [ ] pixel.css 新增 `.calc-step-line` transition（opacity, transform 0.3s）
- [ ] pixel.css 新增 `.calc-step-highlight` 高亮样式（金色背景 + translateY 位移）
- [ ] app.js showCalcStepsAnimated 每步添加时先高亮 + 透明 + 上方位移，200ms 后切换为正常样式
- [ ] 输入 `1+2*3` 显示 3 步：`1+2*3 → 1+6 → = 7`，每步有合并动画
- [ ] 输入 `2*3+4*5` 显示 4 步：`2*3+4*5 → 6+4*5 → 6+20 → = 26`（每个乘法单独一步）
- [ ] 输入 `2*3*4` 显示 3 步：`2*3*4 → 6*4 → = 24`（连续乘法逐步，不跳步）
- [ ] 多个乘法不会一次性算出（如 `2*3+4*5` 不会直接显示 `6+20`）
- [ ] 错误表达式立即显示错误，不延迟

## 函数系统卡片
- [ ] index.html landing-page 在"预测系统"卡片之后新增"函数系统"卡片（id="btn-enter-function"）
- [ ] 卡片含 SVG 图标（坐标系 + 曲线图案）
- [ ] 卡片标题为"函数系统"
- [ ] 卡片描述说明可输入函数绘制图像
- [ ] 点击卡片进入 function-page
- [ ] app.js 新增 showFunction() 函数
- [ ] app.js 绑定 btn-enter-function 事件

## 函数系统页面结构
- [ ] index.html 新增 `<div id="function-page" class="function-page">`
- [ ] 含浮动返回按钮（id="btn-back-home-function"）
- [ ] 含标题"函数系统 PIXEL FUNCTION"
- [ ] 含 Canvas（id="function-canvas"）显示平面直角坐标系
- [ ] Canvas 右下角有 +/− 缩放按钮
- [ ] Canvas 下方有函数输入框（id="function-input"）
- [ ] 有添加按钮（id="btn-function-add"）和清除按钮（id="btn-function-clear"）
- [ ] 有函数列表显示区（id="function-list"）
- [ ] app.js 绑定 btn-back-home-function 返回像素数学首页

## 函数系统页面样式
- [ ] pixel.css 新增 `.function-page` 页面容器样式
- [ ] 新增 `.function-canvas-wrap` 相对定位容器
- [ ] `#function-canvas` 宽度 100%，高度 500px 左右，深空背景白边框
- [ ] `.function-zoom-controls` absolute 定位在 canvas 右下角
- [ ] `.function-input-row` flex 布局
- [ ] `.function-list` 显示已添加函数列表

## function-plotter.js 实现
- [ ] 创建 /workspace/js/function-plotter.js
- [ ] 实现 FunctionPlotter 类（构造函数接收 canvas）
- [ ] 坐标系状态：originX, originY, scale（默认 40px/单位）
- [ ] drawGrid()：绘制网格线（每单位一条淡色线）
- [ ] drawAxes()：绘制 x/y 轴（白色 2px 加粗）+ 原点 "O" + 刻度数字
- [ ] plotFunction(expr, color)：解析表达式并绘制曲线
- [ ] parseFunction 支持 `y=表达式` 和 `f(x)=表达式` 格式
- [ ] 表达式预处理：`^` → `**`，`sin/cos/tan/log/sqrt` → `Math.xxx`
- [ ] 安全求值：Function 构造器 + 字符白名单
- [ ] 鼠标拖拽平移：mousedown/mousemove/mouseup 更新 originX/originY
- [ ] 滚轮缩放：wheel 事件，以鼠标位置为缩放中心
- [ ] +/− 按钮缩放：scale 增减 10px（限制 10-200）
- [ ] redraw()：清空 + 网格 + 轴 + 所有函数曲线
- [ ] addFunction(input) / clearFunctions() 公共方法

## 函数系统功能验证
- [ ] 输入 `y=x^2` 显示抛物线（金色 #ffd700）
- [ ] 输入 `f(x)=sin(x)` 显示正弦曲线
- [ ] 输入 `y=2*x+1` 显示直线
- [ ] 多函数叠加显示不同颜色曲线
- [ ] 鼠标拖拽平移坐标系，网格和曲线一起移动
- [ ] 点击 + 按钮放大，网格变疏，刻度数字对齐
- [ ] 点击 − 按钮缩小，网格变密，刻度数字对齐
- [ ] 滚轮缩放以鼠标位置为中心
- [ ] 多次缩放平移后基准长度（scale）始终为正值
- [ ] 坐标系不混乱（网格等距、刻度对齐）
- [ ] 清除按钮可清空所有曲线

## index.html 加载脚本
- [ ] index.html 在 pixel-art.js 之后加载 function-plotter.js
- [ ] app.js 在 DOMContentLoaded 后初始化 FunctionPlotter

## 像素风一致性
- [ ] 函数系统页面是像素风（3px 白边框、4px 圆角、深空背景、Courier New）
- [ ] 缩放按钮是像素风
- [ ] 输入框和按钮样式与现有页面一致
- [ ] 函数卡片样式与现有卡片一致

## 部署
- [ ] 代码已提交并推送到 origin main
- [ ] 代码已推送到 gh-pages
- [ ] https://xiaozhenweiyan.github.io/pixel-tools/ 可访问且所有 5 项改动生效
