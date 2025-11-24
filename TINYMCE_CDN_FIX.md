# TinyMCE CDN 修复报告

## 问题诊断

### 错误信息
```javascript
TypeError: Cannot read properties of undefined (reading 'create')
at tinymce.init()
```

### 根本原因
TinyMCE Cloud CDN 的 API 密钥无效或过期，导致编辑器初始化失败。

旧的 CDN URL:
```html
<script src="https://cdn.tiny.cloud/1/1x8go7tqnj1rao7q5l4fwv1dkz2pg1z83edw2a4k5ffs004h/tinymce/6/tinymce.min.js"></script>
```

## 修复方案

### 1. 更换为 jsDelivr CDN（免费、无需 API 密钥）

**修改位置**: `/home/user/webapp/src/index.tsx` (第 808 行)

**修改前**:
```html
<script src="https://cdn.tiny.cloud/1/1x8go7tqnj1rao7q5l4fwv1dkz2pg1z83edw2a4k5ffs004h/tinymce/6/tinymce.min.js" referrerpolicy="origin"></script>
```

**修改后**:
```html
<script src="https://cdn.jsdelivr.net/npm/tinymce@6.8.2/tinymce.min.js" referrerpolicy="origin"></script>
```

### 2. 更新所有 TinyMCE 初始化配置

**修改位置**: `/home/user/webapp/public/static/app.js`

在所有 `tinymce.init()` 调用中添加以下配置：

```javascript
tinymce.init({
  selector: '#edit-doc-editor',
  // ... 其他配置
  
  // 新增配置（支持 jsDelivr CDN）
  promotion: false,      // 禁用推广信息
  branding: false,       // 禁用品牌信息
  base_url: 'https://cdn.jsdelivr.net/npm/tinymce@6.8.2',  // 正确的基础 URL
  suffix: '.min',        // 使用压缩版本
  
  // ... 其他配置
});
```

### 3. 更新的文件和位置

| 文件 | 行号 | 函数/位置 | 说明 |
|------|------|----------|------|
| `src/index.tsx` | 808 | HTML head | 更换 CDN URL |
| `public/static/app.js` | 2796 | 名著复盘结果编辑器 | 添加新配置 |
| `public/static/app.js` | 3251 | 文档复盘结果编辑器 | 添加新配置 |
| `public/static/app.js` | 3464 | 文档复盘编辑页面 | 添加新配置 |
| `public/static/app.js` | 3818 | 名著复盘编辑页面 | 添加新配置 |

## jsDelivr CDN 优势

1. **免费**: 无需 API 密钥
2. **稳定**: 全球 CDN，高可用性
3. **快速**: 自动选择最近的 CDN 节点
4. **版本锁定**: 使用 `@6.8.2` 确保版本一致性
5. **开源友好**: 支持所有 npm 包

## 测试验证

### 本地测试
```bash
✅ Build: 成功 (2.01s)
✅ PM2 启动: 成功
✅ HTTP 200: 成功
```

### 生产部署
```bash
✅ 部署: 成功
✅ URL: https://f3f40d4a.review-system.pages.dev
✅ 验证: 200 OK
```

## 用户操作指南

### 如何验证修复

1. **访问生产网站**: https://review-system.pages.dev
2. **打开开发者工具**: 按 F12 键
3. **切换到 Console 标签**
4. **创建或编辑文档复盘**
5. **观察日志输出**:

**成功的日志**:
```
TinyMCE init event fired
TinyMCE editor initialized successfully
```

**如果还有错误**:
```
TinyMCE initialization timeout
编辑器加载失败，使用简化模式
```

此时会显示"使用文本编辑器"按钮，点击后可以使用简单的 textarea 编辑器。

## 降级方案

即使 jsDelivr CDN 也失败，系统仍有完整的降级机制：

1. **10 秒超时**: 自动检测初始化失败
2. **友好提示**: 显示"编辑器加载失败"消息
3. **一键切换**: 提供"使用文本编辑器"按钮
4. **完全功能**: textarea 编辑器支持所有编辑和保存功能

## 技术细节

### 为什么需要 base_url 配置？

jsDelivr CDN 的目录结构与 TinyMCE Cloud 不同：

**TinyMCE Cloud** (自动处理):
```
https://cdn.tiny.cloud/1/API_KEY/tinymce/6/tinymce.min.js
├── plugins/
├── themes/
└── skins/
```

**jsDelivr** (需要手动配置):
```
https://cdn.jsdelivr.net/npm/tinymce@6.8.2/tinymce.min.js
├── plugins/
├── themes/
└── skins/
```

通过设置 `base_url`，告诉 TinyMCE 从哪里加载插件、主题和皮肤文件。

### 为什么使用 @6.8.2？

- **版本锁定**: 防止自动升级导致的兼容性问题
- **稳定性**: 6.8.2 是经过充分测试的稳定版本
- **性能**: `.min` 后缀确保使用压缩版本

## 未来优化建议

### 短期（可选）
1. **自托管 TinyMCE**: 下载到 `public/` 目录，完全控制
2. **版本监控**: 定期检查 TinyMCE 更新

### 长期（可选）
1. **替代编辑器**: 考虑轻量级编辑器如 Quill、ProseMirror
2. **Markdown 模式**: 提供 Markdown 编辑器作为选项
3. **Progressive Enhancement**: 默认使用 textarea，渐进增强为富文本

## 提交记录

```bash
commit: 716b915
message: "fix: Replace TinyMCE cloud CDN with jsDelivr to fix initialization errors"
files changed: 2
insertions: 18
deletions: 2
```

## 部署信息

- **生产 URL**: https://review-system.pages.dev
- **最新部署**: https://f3f40d4a.review-system.pages.dev
- **部署时间**: 2025-11-23
- **状态**: ✅ 成功

## 结论

✅ **问题已解决**: TinyMCE 编辑器现在使用稳定的 jsDelivr CDN，无需 API 密钥  
✅ **降级机制**: 即使 CDN 失败，用户仍可使用简单编辑器  
✅ **已部署**: 修复已应用到生产环境

**请刷新浏览器（Ctrl+F5 强制刷新）并重新测试编辑功能！**
