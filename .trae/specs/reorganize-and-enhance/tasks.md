# Tasks

## 阶段一：分类重构
- [ ] Task 1: 创建"像素编程"子系统
  - [ ] SubTask 1.1: 在 index.html 创建 pixel-programming-landing-page（参考 learning-landing-page 结构）
  - [ ] SubTask 1.2: 首页学习类把"像素迷宫"和"神经网络可视化"卡片替换为"像素编程"入口卡片
  - [ ] SubTask 1.3: pixel-programming-landing-page 中放迷宫和神经网络两张卡片
  - [ ] SubTask 1.4: app.js 添加页面切换逻辑和返回按钮
  - [ ] SubTask 1.5: i18n.js 添加"像素编程"相关翻译

- [ ] Task 2: 把函数3D移到函数系统中
  - [ ] SubTask 2.1: 在 function-page 添加"2D/3D"切换按钮
  - [ ] SubTask 2.2: 3D 模式下显示 3D canvas，复用 function-3d.js
  - [ ] SubTask 2.3: 2D/3D 共享表达式输入和参数滑块
  - [ ] SubTask 2.4: 移除首页"函数3D"独立卡片和 function-3d-page
  - [ ] SubTask 2.5: app.js 更新页面切换逻辑

- [ ] Task 3: 数学卡片扩展拆分为独立卡片
  - [ ] SubTask 3.1: 在 learning-landing-page 添加分数/小数/方程/几何/速算 5 张卡片
  - [ ] SubTask 3.2: 创建 fraction-page, decimal-page, equation-page, geometry-page, speed-page 5 个独立页面
  - [ ] SubTask 3.3: 修改 math-cards-ext.js，让每个 init 函数接受独立 canvas
  - [ ] SubTask 3.4: 移除 math-ext-page（原 tab 切换页面）
  - [ ] SubTask 3.5: app.js 更新页面切换逻辑
  - [ ] SubTask 3.6: i18n.js 更新翻译

## 阶段二：功能增强
- [ ] Task 4: 神经网络可视化训练集增强
  - [ ] SubTask 4.1: 添加标准训练集：XOR、正弦、圆形分类、螺旋分类
  - [ ] SubTask 4.2: 创建训练集编辑器 UI（添加/删除/修改样本）
  - [ ] SubTask 4.3: 训练集散点图可视化
  - [ ] SubTask 4.4: 修改 nn-visualizer.js 支持自定义训练集

- [ ] Task 5: 背景粒子交互菜单
  - [ ] SubTask 5.1: 创建 js/background-particles.js
  - [ ] SubTask 5.2: 让背景彩色方块可拖动
  - [ ] SubTask 5.3: 鼠标移动产生粒子拖拽效果
  - [ ] SubTask 5.4: 添加菜单控制（开关/数量/颜色）
  - [ ] SubTask 5.5: index.html 引入脚本，app.js 初始化

## 阶段三：附加改进
- [ ] Task 6: 附加改进（我的建议）
  - [ ] SubTask 6.1: 首页分类折叠展开
  - [ ] SubTask 6.2: 首页添加"最近使用"区域
  - [ ] SubTask 6.3: ESC 键统一返回上一级
  - [ ] SubTask 6.4: 移动端响应式优化

- [ ] Task 7: 更新 README.md
  - [ ] SubTask 7.1: 更新工具分类说明
  - [ ] SubTask 7.2: 更新功能列表
  - [ ] SubTask 7.3: 更新截图说明（如有）

## 阶段四：收尾
- [ ] Task 8: 升级 Service Worker 缓存 + 提交推送

# Task Dependencies
- Task 2, 3 依赖 Task 1（分类重构有先后）
- Task 4, 5 独立，可并行
- Task 6 依赖 Task 1-5 完成
- Task 7 依赖 Task 1-6 完成
- Task 8 依赖所有 Task