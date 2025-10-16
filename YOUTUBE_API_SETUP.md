# YouTube Data API 配置指南（可选）

## 📋 说明
这是可选配置，用于显示真实的 YouTube 复盘相关视频。如果不配置，系统会显示 Mock 视频数据。

## 🔑 获取 YouTube API Key

### 步骤 1: 启用 YouTube Data API v3
1. 访问 Google Cloud Console: https://console.cloud.google.com/
2. 选择你的项目（与 Custom Search 相同的项目）
3. 点击"API 和服务" > "库"
4. 搜索 "YouTube Data API v3"
5. 点击并启用

### 步骤 2: 使用相同的 API Key
YouTube Data API 可以使用与 Custom Search API 相同的 API 密钥。

### 步骤 3: 配置 Cloudflare 环境变量
1. 访问：https://dash.cloudflare.com/pages/view/review-system
2. 进入"设置" > "环境变量"
3. 添加变量：
   - **变量名称**：`YOUTUBE_API_KEY`
   - **值**：你的 Google API Key（与 GOOGLE_API_KEY 相同）

### 步骤 4: 重新部署
```bash
npm run deploy:prod
```

## 📊 API 配额
- YouTube Data API 免费配额：10,000 单位/天
- 每次搜索大约消耗 100 单位
- 足够日常使用

## ⚠️ 注意
如果不配置 YouTube API，视频部分会显示 Mock 数据（YouTube 搜索链接），这不影响文章功能的使用。

---

**优先级**: 低（可选）  
**依赖**: 先完成 Google Custom Search API 配置
