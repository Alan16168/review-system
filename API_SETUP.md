# API 配置指南

本文档说明如何配置 Google Custom Search API 和 YouTube Data API 以获取真实的文章和视频数据。

## 📋 概述

系统支持两种模式：
1. **Mock 模式**（默认）：使用预设的示例数据
2. **API 模式**：使用真实的 Google 和 YouTube API 获取数据

当未配置 API 密钥时，系统自动使用 Mock 模式，不会影响功能。

---

## 🔑 Google Custom Search API 配置

### 1. 获取 API 密钥

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 **Custom Search API**
4. 在"凭据"页面创建 API 密钥
5. 复制 API 密钥

### 2. 创建自定义搜索引擎

1. 访问 [Programmable Search Engine](https://programmablesearchengine.google.com/)
2. 点击"添加"创建新的搜索引擎
3. 配置搜索引擎：
   - **搜索的网站**: 输入 `*`（搜索整个网络）
   - **语言**: 选择中文或英文
   - **搜索引擎名称**: 例如"Review System Search"
4. 创建后，复制"搜索引擎 ID"（cx 参数）

### 3. 设置环境变量

在项目根目录创建 `.dev.vars` 文件：

```bash
# Google Custom Search API
GOOGLE_API_KEY=your-google-api-key-here
GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id-here
```

---

## 🎥 YouTube Data API 配置

### 1. 获取 API 密钥

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 使用与上面相同的项目
3. 启用 **YouTube Data API v3**
4. 使用相同的 API 密钥或创建新密钥

### 2. 设置环境变量

在 `.dev.vars` 文件中添加：

```bash
# YouTube Data API
YOUTUBE_API_KEY=your-youtube-api-key-here
```

---

## 📝 完整配置示例

`.dev.vars` 文件内容：

```bash
# Google Custom Search API
GOOGLE_API_KEY=AIzaSyC_xxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_SEARCH_ENGINE_ID=a1234567890123456

# YouTube Data API  
YOUTUBE_API_KEY=AIzaSyD_yyyyyyyyyyyyyyyyyyyyyyyyyy
```

---

## 🚀 本地开发测试

### 1. 重启开发服务器

```bash
# 停止当前服务
pm2 stop review-system

# 重新构建
npm run build

# 启动服务（会自动加载 .dev.vars）
pm2 start ecosystem.config.cjs
```

### 2. 验证 API 集成

```bash
# 测试文章 API
curl http://localhost:3000/api/resources/articles | jq '.source'

# 测试视频 API
curl http://localhost:3000/api/resources/videos | jq '.source'
```

**期望输出**：
- 配置正确时：`"google_search"` 和 `"youtube_api"`
- 未配置时：`"mock"` 或 `"mock_fallback"`

### 3. 查看浏览器控制台

访问主页后，打开浏览器开发者工具，查看控制台输出：

```
Articles loaded from: google_search
Videos loaded from: youtube_api
```

---

## 🌐 生产环境部署

### 1. Cloudflare Pages 环境变量

在 Cloudflare Pages 项目设置中添加环境变量：

```bash
npx wrangler pages secret put GOOGLE_API_KEY --project-name webapp
npx wrangler pages secret put GOOGLE_SEARCH_ENGINE_ID --project-name webapp
npx wrangler pages secret put YOUTUBE_API_KEY --project-name webapp
```

### 2. 手动设置（可选）

也可以在 Cloudflare Pages Dashboard 中手动设置：

1. 进入项目设置
2. 选择"环境变量"
3. 添加以下变量：
   - `GOOGLE_API_KEY`
   - `GOOGLE_SEARCH_ENGINE_ID`
   - `YOUTUBE_API_KEY`

---

## 💡 API 配额说明

### Google Custom Search API
- **免费配额**: 100 次/天
- **超出配额**: 需要付费或使用 Mock 数据
- **优化建议**: 
  - 实现缓存机制
  - 仅在必要时刷新数据
  - 考虑增加付费配额

### YouTube Data API
- **免费配额**: 10,000 单位/天
- **查询成本**: 搜索 = 100 单位，详情 = 1 单位
- **优化建议**:
  - 缓存视频数据
  - 减少搜索频率
  - 使用批量请求

---

## 🔧 故障排除

### 问题 1: API 返回 "mock"

**原因**: API 密钥未配置或无效

**解决方案**:
1. 检查 `.dev.vars` 文件是否存在
2. 验证 API 密钥格式正确
3. 确认已重启服务
4. 检查 API 配额是否用尽

### 问题 2: 403 Forbidden 错误

**原因**: API 密钥权限不足或被限制

**解决方案**:
1. 检查 Google Cloud Console 中 API 是否已启用
2. 验证 API 密钥的访问限制设置
3. 确认项目计费已启用（如需要）

### 问题 3: 429 Too Many Requests

**原因**: 超出 API 配额

**解决方案**:
1. 等待配额重置（通常每天午夜）
2. 系统会自动切换到 Mock 模式
3. 考虑增加配额或实现缓存

---

## 📊 数据源优先级

系统按以下顺序尝试获取数据：

1. **API 数据**: 如果配置了密钥且请求成功
2. **Mock 数据**: 如果 API 失败或未配置
3. **缓存数据**: (未来功能) 减少 API 调用

---

## 🎯 推荐配置

### 开发环境
- 使用 Mock 数据（无需配置）
- 快速开发和测试
- 不消耗 API 配额

### 演示环境
- 配置 API 密钥
- 展示真实数据
- 设置较长的缓存时间

### 生产环境
- 配置 API 密钥
- 实现缓存机制
- 监控 API 配额使用
- 设置告警阈值

---

## 📚 相关文档

- [Google Custom Search API 文档](https://developers.google.com/custom-search/v1/overview)
- [YouTube Data API 文档](https://developers.google.com/youtube/v3)
- [Cloudflare Pages 环境变量](https://developers.cloudflare.com/pages/platform/build-configuration/#environment-variables)

---

**最后更新**: 2025-10-08  
**支持**: 如有问题，请查看项目 README.md 或提交 Issue
