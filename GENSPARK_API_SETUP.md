# Genspark API 配置指南

## 📋 概述

**版本**: v8.2.0  
**更新日期**: 2025-11-23

Famous Book Review 功能现在使用 **Genspark AI** 来分析视频内容，因为 Gemini 无法直接读取和分析视频。

---

## 🎯 为什么使用 Genspark？

### Gemini 的限制
- ❌ **无法直接访问视频内容**
- ❌ 只能处理文本输入
- ❌ 需要用户手动提供视频转录文本

### Genspark 的优势
- ✅ **可以直接读取和分析视频**
- ✅ 支持 YouTube、Bilibili 等平台
- ✅ 自动提取视频内容和要点
- ✅ 更适合视频分析场景

---

## 🔄 API 使用策略

### 视频链接 → Genspark API
当用户选择 **"视频链接"** 输入类型时：
- 使用 **Genspark API** 分析
- API 端点: `https://api.genspark.ai/v1/chat/completions`
- 模型: `genspark-1.5`

### 书籍名称 → Gemini API
当用户选择 **"著作名称"** 输入类型时：
- 使用 **Gemini API** 分析
- API 端点: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- 模型: `gemini-2.0-flash`

---

## 🔑 获取 Genspark API Key

### 方法 1: 联系 Genspark 团队
1. 访问 Genspark 官网
2. 联系销售或支持团队
3. 申请 API 访问权限
4. 获取 API Key

### 方法 2: Genspark 控制台（如果可用）
1. 登录 Genspark 控制台
2. 导航到 API Keys 或 Credentials 页面
3. 创建新的 API Key
4. 复制 Key 用于配置

---

## ⚙️ 配置步骤

### 本地开发环境

1. **编辑 `.dev.vars` 文件**

```bash
cd /home/user/webapp
nano .dev.vars
```

2. **添加或更新 GENSPARK_API_KEY**

```bash
# Genspark API Key（用于视频分析功能）
# 获取方式：联系 Genspark 团队或查看 Genspark 控制台
GENSPARK_API_KEY=your-actual-genspark-api-key-here
```

3. **保存并重启服务**

```bash
pm2 restart review-system
```

---

### 生产环境（Cloudflare Pages）

1. **使用 Wrangler 添加 Secret**

```bash
cd /home/user/webapp
echo "your-actual-genspark-api-key" | npx wrangler pages secret put GENSPARK_API_KEY --project-name review-system
```

2. **验证 Secret 已添加**

```bash
npx wrangler pages secret list --project-name review-system
```

**应该看到**:
```
GEMINI_API_KEY
GENSPARK_API_KEY  ← 新添加
JWT_SECRET
...
```

---

## 🧪 测试配置

### 测试 Genspark API

```bash
curl -X POST https://api.genspark.ai/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_GENSPARK_API_KEY" \
  -d '{
    "model": "genspark-1.5",
    "messages": [
      {
        "role": "user",
        "content": "请分析这个视频：https://www.youtube.com/watch?v=example"
      }
    ],
    "stream": false
  }'
```

**预期结果**: 返回视频分析内容（JSON 格式）

---

## 📝 代码实现

### API 路由逻辑 (`src/routes/reviews.ts`)

```typescript
// 检查输入类型
if (inputType === 'video') {
  // 使用 Genspark API
  const GENSPARK_API_KEY = c.env.GENSPARK_API_KEY;
  const fullPrompt = `请分析这个视频：${content}\n\n${prompt}`;
  
  const gensparkResponse = await fetch(
    'https://api.genspark.ai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GENSPARK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'genspark-1.5',
        messages: [{ role: 'user', content: fullPrompt }],
        stream: false
      })
    }
  );
  
  const gensparkData = await gensparkResponse.json();
  result = gensparkData.choices?.[0]?.message?.content;
  
} else {
  // 使用 Gemini API (书籍分析)
  // ... Gemini API 调用逻辑
}
```

---

## 🔍 故障排查

### 问题 1: "GENSPARK_API_KEY not configured"

**症状**: 视频分析失败，返回配置错误

**解决方案**:
1. 检查 `.dev.vars` 文件中是否有 `GENSPARK_API_KEY`
2. 检查 Cloudflare Pages Secrets 中是否配置了该 Key
3. 重启本地服务或重新部署生产环境

---

### 问题 2: "Genspark API error: 401 Unauthorized"

**症状**: API 调用返回 401 错误

**原因**: API Key 无效或已过期

**解决方案**:
1. 验证 API Key 是否正确
2. 检查 API Key 是否有权限
3. 联系 Genspark 团队确认 Key 状态

---

### 问题 3: "Genspark API error: 404 Not Found"

**症状**: API 端点不存在

**原因**: API 端点地址错误

**解决方案**:
1. 确认 Genspark API 端点是否正确
2. 检查 API 文档确认最新端点
3. 更新代码中的端点地址

---

## 📊 API 对比

| 特性 | Gemini API | Genspark API |
|------|-----------|--------------|
| **视频分析** | ❌ 不支持 | ✅ 支持 |
| **文本分析** | ✅ 支持 | ✅ 支持 |
| **速度** | 快 | 中等 |
| **成本** | 低 | 取决于定价 |
| **使用场景** | 书籍、文档 | 视频、多媒体 |

---

## 🚀 部署清单

在部署到生产环境之前，确保：

- [ ] 已获取 Genspark API Key
- [ ] 本地 `.dev.vars` 已配置 `GENSPARK_API_KEY`
- [ ] 生产环境 Cloudflare Pages Secret 已配置
- [ ] 已测试视频分析功能
- [ ] 已测试书籍分析功能（Gemini）
- [ ] 代码已提交到 Git
- [ ] 已重新构建项目 (`npm run build`)
- [ ] 已部署到 Cloudflare Pages

---

## 📞 支持

### 获取 Genspark API Key
- 联系 Genspark 支持团队
- 查看 Genspark 官方文档

### 技术问题
- 查看项目文档
- 检查 Git 提交历史
- 查看 PM2 日志: `pm2 logs review-system`

---

## 🔄 版本历史

**v8.2.0** (2025-11-23):
- ✨ 新增 Genspark API 集成
- ✨ 视频分析使用 Genspark
- ✨ 书籍分析保留 Gemini
- 📝 添加配置文档

---

**最后更新**: 2025-11-23  
**维护人员**: Claude (AI Assistant)
