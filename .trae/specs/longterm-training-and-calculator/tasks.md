# Tasks

- [ ] Task 1: 长期训练模式开关 + 数据累积 (index.html + pixel.css + app.js)
  - [ ] SubTask 1.1: 在 index.html 导出 CSV 按钮右侧添加 iOS 风格开关（class="ios-switch"），含"长期训练"标签
  - [ ] SubTask 1.2: pixel.css 添加 iOS 开关样式（灰色关闭/金色开启，左右滑动动画）
  - [ ] SubTask 1.3: app.js 添加开关状态切换逻辑，开启时"预测"按钮文字变为"预测+训练"
  - [ ] SubTask 1.4: app.js 实现长期累积序列（localStorage 持久化，key="longterm_series"）
  - [ ] SubTask 1.5: app.js 修改预测按钮点击逻辑：长期模式开启时，把当前输入追加到累积序列，清空输入框，用累积序列做预测+训练
  - [ ] SubTask 1.6: app.js 页面加载时从 localStorage 恢复开关状态和累积序列

- [ ] Task 2: 神经网络增量训练接口 (nn.js)
  - [ ] SubTask 2.1: 在 nn.js 新增 `incrementalTrain(canvas, fullSeries, steps, onProgress)` 方法，复用 progressiveTrain 但不重置权重（不调用 initWeights，保留当前 params）
  - [ ] SubTask 2.2: 导出 incrementalTrain 到 neuralNet 对象
  - [ ] SubTask 2.3: app.js 长期训练模式调用 incrementalTrain 而非 progressiveTrain

- [ ] Task 3: 计算机系统卡片 + 计算器界面 (index.html + pixel.css)
  - [ ] SubTask 3.1: index.html 落地页新增"计算机系统"卡片（含 SVG 图标、标题、描述），id="btn-enter-calculator"
  - [ ] SubTask 3.2: index.html 新增计算器页面 div（id="calculator-page"），默认 display:none
  - [ ] SubTask 3.3: 计算器页面含：顶部输出区（id="calc-output"）、中间按键网格、底部输入框（id="calc-input"）、返回首页按钮（id="btn-back-home"）
  - [ ] SubTask 3.4: 按键网格含：数字 0-9、+ - × ÷ ( ) . = C ⌫（退格）
  - [ ] SubTask 3.5: pixel.css 添加计算器样式（像素风按键、网格布局、输出区样式）
  - [ ] SubTask 3.6: 预测系统页面也加一个"返回首页"按钮（id="btn-back-home-predict"）

- [ ] Task 4: 计算器逻辑 + 页面切换 (app.js)
  - [ ] SubTask 4.1: app.js 实现 calculateExpr(expr) 表达式求值（支持 + - × ÷ 括号 小数 负数，用 Function 构造器或手写 tokenizer）
  - [ ] SubTask 4.2: app.js 实现按键事件：每个按键点击追加对应字符到 calc-input 末尾
  - [ ] SubTask 4.3: app.js 实现等号：读取 calc-input，求值，结果写入 calc-output（含历史记录）
  - [ ] SubTask 4.4: app.js 实现 C 清空、⌫ 退格
  - [ ] SubTask 4.5: app.js 实现 calc-input 键盘输入（input 事件同步）+ 回车触发等号
  - [ ] SubTask 4.6: app.js 实现页面切换：点击"预测系统"卡片显示预测页、点击"计算机系统"卡片显示计算器页、点击返回首页回到落地页
  - [ ] SubTask 4.7: 安全：表达式求值不能用 eval，用受限的 tokenizer + shunting-yard 或 Function 构造器 + 字符白名单校验

- [ ] Task 5: 推送 GitHub
  - [ ] SubTask 5.1: 提交并推送到 origin main + gh-pages
  - [ ] SubTask 5.2: 验证 https://xiaozhenweiyan.github.io/math-pixel-site/ 可访问

# Task Dependencies
- [Task 2] 独立于 [Task 1] 的 UI 部分，可并行
- [Task 3] 独立于 [Task 1]，可并行
- [Task 4] depends on [Task 3]（需要 DOM 结构）
- [Task 5] depends on [Task 1], [Task 2], [Task 3], [Task 4]
