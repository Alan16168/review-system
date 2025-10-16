# 下一步操作指南

## 🎯 当前状态

**版本**: V5.6.3  
**部署 URL**: https://review-system.pages.dev  
**最新部署**: https://96c6554f.review-system.pages.dev  
**部署时间**: 2025-10-16

### ✅ 已完成
1. ✅ 代码已改回百度文库搜索
2. ✅ 跳过 HEAD 验证（避免反爬虫拦截）
3. ✅ 已部署到生产环境
4. ✅ 创建了详细的 Google API 配置指南

### ⏳ 待完成
1. ⏳ 配置 Google Custom Search API credentials
2. ⏳ 重新部署以启用真实搜索

---

## 📝 你需要做的事情

### 步骤 1: 获取 Google API Credentials

按照 **GOOGLE_API_SETUP_GUIDE.md** 文档完成以下操作：

#### 1.1 创建 Google Cloud 项目
- 访问：https://console.cloud.google.com/
- 创建新项目或选择现有项目

#### 1.2 启用 Custom Search API
- 在 API 库中搜索 "Custom Search API"
- 点击启用

#### 1.3 创建 API 密钥
- 在"凭据"页面创建 API 密钥
- 复制保存 **GOOGLE_API_KEY**

#### 1.4 创建自定义搜索引擎
- 访问：https://programmablesearchengine.google.com/
- 创建新搜索引擎
- 搜索网站：`wenku.baidu.com`
- **重要**：启用"搜索整个网络"功能
- 复制保存 **GOOGLE_SEARCH_ENGINE_ID**

---

### 步骤 2: 配置 Cloudflare 环境变量

有两种方式配置：

#### 方式 A: 使用 Cloudflare Dashboard（推荐）

1. 访问：https://dash.cloudflare.com/pages/view/review-system
2. 点击"设置" > "环境变量"
3. 在"生产"环境下添加：
   - 变量名：`GOOGLE_API_KEY`
   - 值：你的 API 密钥
4. 再添加：
   - 变量名：`GOOGLE_SEARCH_ENGINE_ID`
   - 值：你的搜索引擎 ID
5. 点击"保存"

#### 方式 B: 使用命令行脚本

```bash
cd /home/user/webapp
./configure-google-api.sh
# 按提示输入你的 credentials
```

---

### 步骤 3: 重新部署

配置完环境变量后，告诉我，我会帮你重新部署。

或者你也可以手动部署：
```bash
cd /home/user/webapp
npm run deploy:prod
```

---

### 步骤 4: 验证配置

部署完成后，验证是否生效：

```bash
# 测试 API
curl "https://review-system.pages.dev/api/resources/articles?lang=zh" | jq '.source'

# 应该返回：
# "google_search"  ✅ 正确
# 而不是：
# "mock"  ❌ 说明还没配置
```

---

## 📊 配置前后对比

### 配置前（当前）
```
数据源: Mock 数据
文章链接: 示例 URL（wenku.baidu.com/view/xxx.html - 不可访问）
标题: 预设的示例标题
特点: 固定内容，无法更新
```

### 配置后
```
数据源: Google Custom Search
文章链接: 真实的百度文库链接（Google 搜索结果）
标题: 真实文章标题
特点: 动态内容，每次搜索可能不同
```

---

## ❓ 常见问题

### Q: 我没有 Google 账号怎么办？
**答**: 需要先注册一个 Google 账号才能使用 Google Cloud 服务。

### Q: Google API 是免费的吗？
**答**: Custom Search API 有免费配额（100 次/天），对于你的应用足够使用。

### Q: 如果不配置会怎样？
**答**: 系统会继续显示 Mock 数据，但链接都是示例 URL，点击后可能无法访问。

### Q: 配置需要多长时间？
**答**: 如果你熟悉 Google Cloud，大约 10-15 分钟。首次操作可能需要 20-30 分钟。

### Q: 配置后需要等多久生效？
**答**: 配置环境变量后重新部署，大约 1-2 分钟即可生效。

---

## 🎯 完成配置后的效果

配置成功后，你的学习资源页面会：

1. ✅ **显示真实文章**
   - 从百度文库实时搜索
   - 真实可访问的链接
   - 最新的复盘相关内容

2. ✅ **动态更新**
   - 点击"更新文章"按钮可刷新
   - 每次可能显示不同的搜索结果
   - 保持内容新鲜度

3. ✅ **高质量内容**
   - Google 搜索排名靠前的结果
   - 相关度高的文章
   - 来自百度文库的专业内容

---

## 📞 需要帮助？

如果在配置过程中遇到任何问题：

1. **查看详细指南**: GOOGLE_API_SETUP_GUIDE.md
2. **告诉我具体问题**: 我会帮你解决
3. **提供以下信息**:
   - 你完成到了哪一步？
   - 遇到了什么错误？
   - 错误信息是什么？

---

## 📚 相关文档

- `GOOGLE_API_SETUP_GUIDE.md` - 详细的配置步骤
- `configure-google-api.sh` - 配置脚本
- `YOUTUBE_API_SETUP.md` - YouTube API 配置（可选）
- `VERIFICATION_GUIDE.md` - 验证和测试指南

---

**准备好配置了吗？** 🚀

按照上述步骤完成配置后，告诉我，我会帮你重新部署并验证！
