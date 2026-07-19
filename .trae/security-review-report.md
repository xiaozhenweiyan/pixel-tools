# 安全审查报告 — `/workspace/js/app.js`

**审查范围**：计算器表达式求值（`calculateExpr` 附近）与图片上传（`compressImage`、`readImageFile`、`initSettings` 中的头像/背景上传）。
**审查视角**：JavaScript 前端安全最佳实践（XSS、表达式注入、文件上传、存储安全）。
**审查日期**：2026-07-19
**审查文件**：`/workspace/js/app.js`（审查时 2321 行，修复后 2500 行）

---

## 执行摘要 / Executive Summary

整体代码安全基线**良好**：

- **XSS 防护到位**：全文件无 `innerHTML`、`document.write`、`insertAdjacentHTML`、`eval` 等危险 API；用户可控内容（昵称、预测结果、方法名、计算器步骤等）一律通过 `textContent` / `createElement` 渲染（见 L12、L534、L1084、L1195 等注释与实现）。
- **计算器白名单比预期更严格**：实际白名单是 `/^[-+*/().0-9]+$/`（在剥离 `sqrt/sin/cos/tan` 之后），**不是**任务描述中提到的 `/^[-+*/().0-9Mathsqrt]+$/`。`Math` 字符无法被用户直接输入，只能由 `sqrt(` → `Math.sqrt(` 的内部替换引入，无法被链接为 `Math.constructor` 等原型链访问。
- **三角函数替换未引入新风险**：`sin(`/`cos(`/`tan(` 被替换为内部占位 `__sin(`/`__cos(`/`__tan(`，由闭包包装的 `trigEval` 求值；用户无法输入下划线 `_`，无法构造任意标识符。

但仍发现以下需关注的问题，其中 **3 个高危问题已在代码中直接修复**，中低危问题记录如下供后续处理。

| 编号 | 严重程度 | 标题 | 状态 |
|------|----------|------|------|
| H-1 | 高 | SVG 上传未消毒，存在 XSS 防御纵深缺失 | ✅ 已修复 |
| H-2 | 高 | `compressImage` 缺少图像像素尺寸校验，易受解压炸弹 DoS | ✅ 已修复 |
| H-3 | 高 | 头像/背景图片上传缺少整体文件大小上限 | ✅ 已修复 |
| M-1 | 中 | SVG 上传缺少文件大小上限（sessionStorage 配额/解析 DoS） | ✅ 已修复 |
| M-2 | 中 | `calculateExpr` 使用 `Function` 构造器（代码异味，纵深防御） | 📝 记录，未修 |
| M-3 | 中 | `readImageFile` 为死代码（已定义未调用） | 📝 记录，未修 |
| L-1 | 低 | 文件类型校验依赖 `file.type` 与扩展名（均可伪造） | 📝 记录，未修 |
| L-2 | 低 | `applyBackground` 将 `profile.bgValue` 拼入 CSS（已由数据来源约束） | 📝 记录，未修 |
| L-3 | 低 | sessionStorage 配额超限错误提示可更具体 | 📝 记录，未修 |

---

## 一、已修复的高危问题

### H-1: SVG 上传未消毒，存在 XSS 防御纵深缺失

**严重程度**：高（defense-in-depth；当前渲染方式下不可直接利用，但属于"安全靠巧合维持"的脆弱防线）

**影响声明**：SVG 文件可携带 `<script>`、`on*` 事件处理器、`<foreignObject>`、外部资源引用等。当前代码将 SVG 直接 base64 存入 `sessionStorage` 并通过 `style.backgroundImage = 'url(...)'` 渲染——CSS 背景图在所有现代浏览器中**不会**执行 SVG 内脚本。但若未来将渲染方式改为 `innerHTML`、`<embed>`、`<object>` 或 `<img src>`（部分场景），脚本将执行，导致存储型 XSS。

**修复前代码位置**：
- `/workspace/js/app.js` L430–443（头像 SVG 分支）
- `/workspace/js/app.js` L513–526（背景 SVG 分支）

```javascript
// 修复前（头像分支，L430-443）
// SVG 不压缩（直接读取）
if (file.type === 'image/svg+xml' || ext === 'svg') {
  const reader = new FileReader();
  reader.onload = function (e) {
    profile.avatar = e.target.result;   // ⚠ 未经消毒直接存储
    saveProfile();
    ...
  };
  reader.readAsDataURL(file);
  this.value = '';
  return;
}
```

**修复方案**：新增 `sanitizeSvgDataUrl(dataUrl)` 函数，使用 `DOMParser` 解析 SVG，移除危险元素与属性，再重新序列化为 base64 data URL。若解析失败或检测到无法清除的危险内容，返回 `null`，调用方拒绝上传。

**新增函数位置**：`/workspace/js/app.js` L253–326

```javascript
function sanitizeSvgDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string') return null;
  const m = dataUrl.match(/^data:image\/svg\+xml;base64,([A-Za-z0-9+/=]*)$/);
  if (!m) return null;
  let svgText;
  try { svgText = atob(m[1]); } catch (e) { return null; }
  if (!svgText || svgText.length > 1024 * 1024) return null;
  let doc;
  try { doc = new DOMParser().parseFromString(svgText, 'image/svg+xml'); }
  catch (e) { return null; }
  if (!doc || !doc.documentElement) return null;
  const root = doc.documentElement;
  if (root.tagName && root.tagName.toLowerCase() === 'parsererror') return null;
  // 移除危险元素
  const dangerousSelectors = 'script, foreignObject, embed, object, iframe, link[rel="stylesheet"], meta, base';
  const dangerous = root.querySelectorAll(dangerousSelectors);
  for (let i = dangerous.length - 1; i >= 0; i--) {
    const el = dangerous[i];
    if (el.parentNode) el.parentNode.removeChild(el);
  }
  // 移除事件属性与外链引用
  const all = root.querySelectorAll('*');
  for (let i = 0; i < all.length; i++) {
    const el = all[i];
    const attrs = el.attributes;
    for (let j = attrs.length - 1; j >= 0; j--) {
      const attr = attrs[j];
      const name = attr.name.toLowerCase();
      const val = attr.value || '';
      if (name.startsWith('on')) {
        el.removeAttribute(attr.name);
      } else if ((name === 'href' || name === 'xlink:href') &&
                 (/^https?:/i.test(val) || /^\/\//.test(val) ||
                  val.toLowerCase().indexOf('javascript:') === 0)) {
        el.removeAttribute(attr.name);
      }
    }
  }
  let cleanSvg;
  try { cleanSvg = new XMLSerializer().serializeToString(root); }
  catch (e) { return null; }
  if (!cleanSvg) return null;
  let b64;
  try { b64 = btoa(unescape(encodeURIComponent(cleanSvg))); }
  catch (e) { return null; }
  return 'data:image/svg+xml;base64,' + b64;
}
```

**调用点修改**：
- `/workspace/js/app.js` L430–458（头像 SVG 分支）：调用 `sanitizeSvgDataUrl`，返回 `null` 时显示"SVG 文件含不安全内容或格式错误，已拒绝"。
- `/workspace/js/app.js` L513–541（背景 SVG 分支）：同上。

---

### H-2: `compressImage` 缺少图像像素尺寸校验，易受解压炸弹 DoS

**严重程度**：高（self-DoS；用户上传恶意"解压炸弹"图片可冻结/崩溃浏览器标签页）

**影响声明**：用户可上传文件体积小但像素极大的图片（如 50000×50000 PNG，文件 < 1MB 但解码后占用 ~10GB 内存）。`compressImage` 直接将 Image 解码到 canvas，会导致标签页内存耗尽、浏览器卡死。文件大小校验无法防御此类攻击。

**修复前代码位置**：`/workspace/js/app.js` L272–318（原 `compressImage` 大文件分支）

```javascript
// 修复前：直接 drawImage，未校验 img.width / img.height
img.onload = function () {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    // ⚠ 未检查 img.width / img.height，直接 drawImage
    ctx.drawImage(img, ...);
    ...
  } catch (err) { reject(new Error('图片处理失败：' + err.message)); }
};
```

**修复方案**：在 `drawImage` 之前增加像素尺寸校验。

**修复后代码位置**：`/workspace/js/app.js` L362–378

```javascript
// 安全：检查图像像素尺寸，防"解压炸弹" / prevent decompression bomb DoS
const MAX_PIXELS_PER_SIDE = 8192;
const MAX_TOTAL_PIXELS = 4096 * 4096;
if (!Number.isFinite(img.width) || !Number.isFinite(img.height) ||
    img.width <= 0 || img.height <= 0) {
  reject(new Error('图片尺寸无效'));
  return;
}
if (img.width > MAX_PIXELS_PER_SIDE || img.height > MAX_PIXELS_PER_SIDE) {
  reject(new Error('图片像素尺寸过大（单边 > ' + MAX_PIXELS_PER_SIDE + 'px）'));
  return;
}
if (img.width * img.height > MAX_TOTAL_PIXELS) {
  reject(new Error('图片总像素过大（> ' + MAX_TOTAL_PIXELS + ' 像素）'));
  return;
}
```

---

### H-3: 头像/背景图片上传缺少整体文件大小上限

**严重程度**：高（self-DoS；超大文件可耗尽内存与 sessionStorage 配额）

**影响声明**：原代码头像分支注释为"不限大小，由 compressImage 处理"，但 `compressImage` 仅以 500KB 为界决定是否压缩，**并不拒绝**大文件。用户上传 100MB JPEG 会被完整读入内存并解码，导致卡顿/崩溃。

**修复前代码位置**：
- `/workspace/js/app.js` L420（头像分支注释："不限大小，由 compressImage 处理"）
- `/workspace/js/app.js` L484–511（背景分支无大小校验）

**修复方案**：在两处上传分支与 `compressImage` 入口都增加 10MB 硬上限。

**修复后代码位置**：
- 头像分支：`/workspace/js/app.js` L460–465
- 背景分支：`/workspace/js/app.js` L543–548
- `compressImage` 入口：`/workspace/js/app.js` L342–346

```javascript
// 安全：限制上传文件大小（防 DoS）
if (file.size > 10 * 1024 * 1024) {
  showToast('文件过大（>10MB），请压缩后上传');
  this.value = '';
  return;
}
```

```javascript
// compressImage 入口
if (file.size > 10 * 1024 * 1024) {
  reject(new Error('文件过大（>10MB），请压缩后上传'));
  return;
}
```

---

## 二、已修复的中危问题

### M-1: SVG 上传缺少文件大小上限

**严重程度**：中

**影响声明**：SVG 分支原本无任何文件大小校验，用户可上传数 MB 的 SVG，base64 化后撑爆 sessionStorage 5–10MB 配额；超大 SVG 也会让 `DOMParser` 解析变慢。虽 `saveProfile` 已捕获 `QuotaExceededError`，但提前拒绝更友好。

**修复方案**：在 SVG 分支增加 200KB 上限。

**修复后代码位置**：
- 头像 SVG 分支：`/workspace/js/app.js` L432–437
- 背景 SVG 分支：`/workspace/js/app.js` L515–520

```javascript
// 安全：限制 SVG 文件大小，防 sessionStorage 配额耗尽与解析 DoS
if (file.size > 200 * 1024) {
  showToast('SVG 文件过大（>200KB），请精简后上传');
  this.value = '';
  return;
}
```

---

## 三、未修复的中低危问题（供后续处理）

### M-2: `calculateExpr` 使用 `Function` 构造器（代码异味，纵深防御）

**严重程度**：中（当前不可利用，但属于"靠白名单维持安全"的脆弱设计）

**代码位置**：`/workspace/js/app.js` L1853

```javascript
const fn = new Function('__sin', '__cos', '__tan', 'return (' + cleaned + ');');
```

**分析**：

任务描述担心白名单 `/^[-+*/().0-9Mathsqrt]+$/` 允许 `Math.constructor` 等原型链访问。**经核查，实际代码白名单更严格**：

```javascript
// /workspace/js/app.js L1827-1834
const checkStr = cleaned
  .replace(/sqrt/g, '')
  .replace(/sin/g, '')
  .replace(/cos/g, '')
  .replace(/tan/g, '');
if (!/^[-+*/().0-9]+$/.test(checkStr)) {   // ✅ 不含 M/a/t/h 字符
  return { ok: false, error: '包含非法字符' };
}
```

**结论**：

1. 用户**无法**直接输入 `M`、`a`、`t`、`h`、`s`、`i`、`n`、`c`、`o`、`_` 等字符（不在 `[-+*/().0-9]` 内）。
2. `Math` 仅由内部替换 `sqrt(` → `Math.sqrt(` 引入，用户无法在 `Math` 与 `.sqrt` 之间插入任何字符，也无法链式访问 `Math.sqrt.constructor` 等（因为无法输入 `.constructor`）。
3. 三角函数替换 `sin(`/`cos(`/`tan(` → `__sin(`/`__cos(`/`__tan(` 是安全的：用户无法输入下划线，无法构造 `__sin.constructor` 等标识符。
4. 已尝试多种绕过路径（`sinsqrt`、`sqrt.cos`、`sinsin(2)`、`1+1)(2` 等），均被白名单拦截或触发 `ReferenceError`/`SyntaxError` 被 `try/catch` 捕获。

**遗留建议**（未修复，避免破坏现有功能）：

- 长期看建议用真正的表达式解析器（如 `expr-eval` 库或手写递归下降解析器）替代 `new Function`，实现"靠设计安全"而非"靠白名单安全"。
- 若坚持用 `Function`，可在替换后增加一道防御性校验：确认 `cleaned` 中除 `Math.sqrt(`、`__sin(`、`__cos(`、`__tan(` 外不含其他字母/下划线字符。

---

### M-3: `readImageFile` 为死代码

**严重程度**：中（维护性，无直接安全风险）

**代码位置**：`/workspace/js/app.js` L230–249

**分析**：`readImageFile` 函数已定义但全文件无任何调用点（实际头像/背景上传使用 `initSettings` 中的内联逻辑）。其内部校验逻辑（类型/大小）与 `initSettings` 中的内联校验重复，且 `readImageFile` 的 `maxSize` 参数比内联逻辑更严格。

**建议**：删除 `readImageFile`，或重构 `initSettings` 复用该函数以统一校验逻辑。本次审查未删除，避免影响可能的外部调用。

---

### L-1: 文件类型校验依赖 `file.type` 与扩展名（均可伪造）

**严重程度**：低（客户端单用户场景下影响有限）

**代码位置**：`/workspace/js/app.js` L421–428、L504–511

**分析**：`file.type` 由浏览器根据文件扩展名和魔数推断，可被伪造；扩展名更可任意命名。但由于文件被转换为 base64 data URL 后仅作为 CSS 背景图渲染，伪造类型不会导致脚本执行（raster 图无法携带脚本，SVG 已由 H-1 消毒）。

**建议**：若需更严格校验，可读取文件头魔数（如 PNG: `89 50 4E 47`、JPEG: `FF D8 FF`）验证实际格式。当前实现可接受。

---

### L-2: `applyBackground` 将 `profile.bgValue` 拼入 CSS 字符串

**严重程度**：低（数据来源受控，无法被用户注入任意 CSS）

**代码位置**：`/workspace/js/app.js` L555–562

```javascript
document.body.style.background = 'url(' + profile.bgValue + ') center center / cover no-repeat #1a1a2e fixed';
```

**分析**：`profile.bgValue` 来源有二：
1. `FileReader.readAsDataURL` → 始终为 `data:<mime>;base64,<base64>` 形式，base64 字符集为 `[A-Za-z0-9+/=]`，不含 `)`、`;`、`url(` 等 CSS 元字符，无法逃逸。
2. `<input type="color">` → 始终返回 `#rrggbb` 格式 hex 颜色，无法注入任意 CSS。

唯一"注入"路径是用户手动改 sessionStorage（self-XSS），不构成实际威胁。

**建议**：无需修复。若未来 `bgValue` 来源扩展为自由文本输入，需重新评估。

---

### L-3: sessionStorage 配额超限错误提示可更具体

**严重程度**：低（用户体验，非安全问题）

**代码位置**：`/workspace/js/app.js` L96–99

```javascript
if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
  showToast('图片过大，请用更小的图片');
}
```

**分析**：当前提示已能区分配额超限与其他错误，但未提示具体配额（通常 5–10MB）。可补充"sessionStorage 容量约 5MB"以引导用户。

**建议**：可选优化，非必须修复。

---

## 四、优先级排序

### 必须修（已完成）✅

1. **H-1 SVG 消毒**：虽当前不可直接利用，但属于"靠巧合安全"的脆弱防线，一旦渲染方式变更即变高危。已修复。
2. **H-2 解压炸弹 DoS**：用户可主动触发标签页崩溃。已修复。
3. **H-3 文件大小上限**：与 H-2 互补，防止大文件内存耗尽。已修复。
4. **M-1 SVG 大小上限**：与 H-1 配套，防止配额耗尽与解析 DoS。已修复。

### 可后续修 📝

5. **M-2 `Function` 构造器**：当前白名单足够严格，短期无风险。长期建议替换为表达式解析器。
6. **M-3 死代码清理**：维护性问题，无安全风险。
7. **L-1 / L-2 / L-3**：低优先级，可按需处理。

---

## 五、审查中验证的良好实践

为完整起见，记录代码中已正确实施的安全实践：

1. **无 `innerHTML` 用于用户内容**：全文件 `innerHTML` 仅出现在注释中（L12、L534、L1084、L1195），实际渲染均用 `textContent` / `createElement` + `appendChild`。
2. **无 `eval`**：仅 1 处 `new Function`（L1853），由严格白名单防护。
3. **无 `document.write` / `insertAdjacentHTML` / `outerHTML`**。
4. **CSV/JSON 导出安全**：`csvEscape` 正确转义逗号/引号/换行（L1444+）；`downloadBlob` 使用 `URL.createObjectURL` + `download` 属性 + `revokeObjectURL` 释放（L1428–1438）。
5. **`showToast` 仅用 `textContent`**（L542，注释明确"绝不使用 innerHTML"）。
6. **输入解析防御性**：`parseSequence` 拒绝 NaN/Infinity（L518–525）。
7. **长期训练状态使用 localStorage，配额错误被捕获**（L592–596）。
8. **计算器白名单比预期更严格**：实际为 `/^[-+*/().0-9]+$/`，不含 `Math` 字符。

---

## 六、修复验证

- ✅ `node --check /workspace/js/app.js` 通过（语法正确）。
- ✅ 新增 `sanitizeSvgDataUrl` 函数在头像/背景 SVG 分支被正确调用。
- ✅ `compressImage` 在 `drawImage` 前增加像素尺寸校验。
- ✅ 头像/背景上传分支与 `compressImage` 入口均增加 10MB 文件大小上限。
- ✅ SVG 分支增加 200KB 文件大小上限。
- ✅ 未修改 `calculateExpr`、`parseSequence`、`showToast`、CSV/JSON 导出等已安全的代码。
- ✅ 未推送 GitHub（按要求，最后统一推送）。

---

**报告作者**：security-best-practices skill 审查
**报告路径**：`/workspace/.trae/security-review-report.md`
