# Google Custom Search API 配置指南

## 📋 目标
配置 Google Custom Search API 以自动从百度文库搜索真实的复盘相关文章。

## 🔑 需要获取的两个密钥

1. **GOOGLE_API_KEY** - Google Cloud API 密钥
2. **GOOGLE_SEARCH_ENGINE_ID** - 自定义搜索引擎 ID

---

## 步骤 1: 创建 Google Cloud 项目并获取 API Key

### 1.1 访问 Google Cloud Console
打开浏览器，访问：https://console.cloud.google.com/

### 1.2 创建新项目（如果还没有）
1. 点击顶部的项目下拉菜单
2. 点击"新建项目"
3. 输入项目名称（例如：review-system-search）
4. 点击"创建"

### 1.3 启用 Custom Search API
1. 在左侧菜单中，点击"API 和服务" > "库"
2. 搜索 "Custom Search API"
3. 点击 "Custom Search API"
4. 点击"启用"按钮

### 1.4 创建 API 密钥
1. 在左侧菜单中，点击"API 和服务" > "凭据"
2. 点击顶部"+ 创建凭据"
3. 选择"API 密钥"
4. 复制生成的 API 密钥（格式类似：`AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`）
5. （可选）点击"限制密钥"，添加 API 限制（只允许 Custom Search API）

**保存这个 API Key** ✅ → 这是你的 `GOOGLE_API_KEY`

---

## 步骤 2: 创建自定义搜索引擎

### 2.1 访问自定义搜索引擎控制台
打开新标签页，访问：https://programmablesearchengine.google.com/

### 2.2 创建新的搜索引擎
1. 点击"添加"或"Get Started"
2. 填写表单：
   - **要搜索的网站**：输入 `wenku.baidu.com`
   - **搜索引擎名称**：输入 `Review System Baidu Wenku Search`
   - **语言**：选择"中文（简体）"
3. 点击"创建"

### 2.3 获取搜索引擎 ID
1. 创建成功后，点击"控制面板"
2. 在"基本信息"部分，找到"搜索引擎 ID"
3. 复制这个 ID（格式类似：`a1b2c3d4e5f6g7h8i`）

**保存这个搜索引擎 ID** ✅ → 这是你的 `GOOGLE_SEARCH_ENGINE_ID`

### 2.4 配置搜索设置（重要）
1. 在控制面板，点击"编辑搜索引擎"
2. 在"要搜索的网站"部分：
   - 确认 `wenku.baidu.com` 已添加
3. 在"搜索功能"部分：
   - 启用"图片搜索"（可选）
   - 启用"搜索整个网络"（重要！）✅
4. 点击"更新"保存设置

---

## 步骤 3: 配置 Cloudflare Pages 环境变量

### 3.1 访问 Cloudflare Dashboard
打开：https://dash.cloudflare.com/pages/view/review-system

### 3.2 进入设置页面
1. 点击"设置"（Settings）标签
2. 滚动到"环境变量"（Environment variables）部分

### 3.3 添加生产环境变量
1. 在"生产"（Production）下，点击"添加变量"
2. 添加第一个变量：
   - **变量名称**：`GOOGLE_API_KEY`
   - **值**：粘贴你在步骤 1.4 获取的 API 密钥
   - 点击"保存"

3. 再次点击"添加变量"
4. 添加第二个变量：
   - **变量名称**：`GOOGLE_SEARCH_ENGINE_ID`
   - **值**：粘贴你在步骤 2.3 获取的搜索引擎 ID
   - 点击"保存"

### 3.4 添加预览环境变量（可选）
重复上述步骤，在"预览"（Preview）环境下也添加相同的变量。

---

## 步骤 4: 验证配置

### 4.1 重新部署
配置环境变量后，需要重新部署：

```bash
cd /home/user/webapp
npm run deploy:prod
```

### 4.2 测试 API
部署完成后，测试 API：

```bash
# 测试中文文章 API
curl "https://review-system.pages.dev/api/resources/articles?lang=zh" | jq '.source, .articles[0]'
```

**预期结果**：
```json
"google_search"  // source 应该是 "google_search" 而不是 "mock"
{
  "title": "复盘方法...",  // 真实的百度文库文章标题
  "url": "https://wenku.baidu.com/view/xxxxxx.html",  // 真实的百度文库链接
  ...
}
```

### 4.3 浏览器测试
1. 访问：https://review-system.pages.dev
2. 切换到中文
3. 查看"学习资源"板块
4. 应该看到从百度文库搜索到的真实文章
5. 点击文章链接，验证可以访问

---

## 📊 配置检查清单

完成以下所有步骤后打勾：

- [ ] Google Cloud 项目已创建
- [ ] Custom Search API 已启用
- [ ] API 密钥已创建并保存
- [ ] 自定义搜索引擎已创建
- [ ] 搜索引擎 ID 已获取并保存
- [ ] 已启用"搜索整个网络"功能
- [ ] Cloudflare 生产环境变量 GOOGLE_API_KEY 已添加
- [ ] Cloudflare 生产环境变量 GOOGLE_SEARCH_ENGINE_ID 已添加
- [ ] 已重新部署到生产环境
- [ ] API 测试显示 source: "google_search"
- [ ] 浏览器中可以看到真实的百度文库链接

---

## ❓ 常见问题

### Q1: API 配额限制是多少？
**答**：免费的 Custom Search API 每天有 100 次查询限制。对于你的应用：
- 每次加载文章页面 = 5 次查询（5 个搜索关键词）
- 每天可以加载约 20 次
- 由于有缓存机制，实际可以支持更多用户

如果需要更多配额，可以启用付费计划（$5/1000 次查询）。

### Q2: 为什么还是显示 Mock 数据？
**可能原因**：
1. 环境变量没有正确配置
2. 没有重新部署
3. API Key 或搜索引擎 ID 不正确

**解决方案**：
1. 检查 Cloudflare Dashboard 中的环境变量
2. 确保变量名称完全正确（区分大小写）
3. 重新部署应用

### Q3: API 返回错误怎么办？
**检查步骤**：
1. 确认 Custom Search API 已启用
2. 确认 API Key 有效且没有限制
3. 查看浏览器控制台的错误信息
4. 检查 API 配额是否用完

### Q4: 搜索结果太少或没有结果？
**优化方案**：
1. 在自定义搜索引擎设置中启用"搜索整个网络"
2. 添加更多相关网站到搜索范围
3. 调整搜索关键词

---

## 🎯 配置完成后的效果

配置成功后：
- ✅ 自动从百度文库搜索相关文章
- ✅ 显示真实的百度文库链接
- ✅ 文章标题和描述来自 Google 搜索结果
- ✅ 每次刷新可能看到不同的文章（Google 搜索结果）
- ✅ 不再依赖 Mock 数据

---

## 📞 需要帮助？

如果在配置过程中遇到问题，请提供以下信息：

1. 你完成到了哪一步？
2. 遇到了什么具体错误？
3. API 测试的响应内容是什么？
4. 浏览器控制台有什么错误信息？

我会帮你解决！

---

**文档版本**: V5.6.3  
**更新日期**: 2025-10-16  
**配置目标**: 启用百度文库真实文章搜索
