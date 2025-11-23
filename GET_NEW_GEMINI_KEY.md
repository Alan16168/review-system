# 🔑 获取新的 Gemini API Key 指南

## 📋 当前问题

你的 Gemini API Key 已超出配额限制：
```
GEMINI_API_KEY=AIzaSyAl8M8ERdeVU81RYFMWnrD4AA-rNF7A_l8
```

错误信息：
- ❌ 免费层请求配额: 0 (已用完)
- ❌ 免费层输入 token 配额: 0 (已用完)
- ⏰ 建议重试时间: 19.5 秒后

---

## ✅ 解决方案：获取新的免费 API Key

### 步骤 1: 访问 Google AI Studio

打开浏览器，访问：
```
https://aistudio.google.com/app/apikey
```

或者：
```
https://makersuite.google.com/app/apikey
```

### 步骤 2: 登录 Google 账号

使用你的 Google 账号登录（建议使用新账号或不同的 Google 账号）

### 步骤 3: 创建新的 API Key

1. 点击页面上的 **"Create API Key"** 按钮
2. 选择 Google Cloud 项目（或创建新项目）
3. 等待 API Key 生成
4. **复制** 新生成的 API Key

API Key 格式类似：
```
AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 步骤 4: 更新项目配置

**方法 A: 直接告诉我你的新 API Key**

把新的 API Key 发给我，我来帮你配置。

**方法 B: 自己手动配置**

```bash
# 编辑配置文件
cd /home/user/webapp
vi .dev.vars

# 找到这一行
GEMINI_API_KEY=AIzaSyAl8M8ERdeVU81RYFMWnrD4AA-rNF7A_l8

# 替换为新的 API Key
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# 保存并退出 (按 ESC, 输入 :wq, 回车)

# 重启服务
fuser -k 3000/tcp || true
pm2 restart review-system

# 测试新 API Key
curl -s "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=你的新APIKey" \
  -H 'Content-Type: application/json' \
  -d '{"contents": [{"parts": [{"text": "Hello"}]}]}'
```

---

## 💡 替代方案：使用 Genspark API

如果你有 Genspark API Key，可以：

1. 配置 Genspark API Key（系统优先使用）
2. Gemini 只作为降级备用
3. 避免配额问题

```bash
# 编辑配置文件
vi .dev.vars

# 找到这一行
GENSPARK_API_KEY=your-genspark-api-key-here

# 替换为实际的 Genspark API Key
GENSPARK_API_KEY=gs-xxxxxxxxxxxxxxxxxxxx
```

---

## 📊 Gemini API 免费配额说明

**免费层限制**:
- ✅ 每分钟请求数: 15 个
- ✅ 每天请求数: 1500 个
- ✅ 每分钟输入 token: 1,000,000
- ✅ 每分钟输出 token: 10,000

**如何避免超限**:
1. 不要短时间内连续请求
2. 使用多个 API Key 轮换
3. 升级到付费计划
4. 使用 Genspark API 作为主要服务

---

## 🔧 生产环境配置

更新完本地环境后，也需要更新 Cloudflare Pages：

1. 登录 Cloudflare Dashboard
2. 进入 Pages → review-system
3. Settings → Environment variables
4. 编辑 `GEMINI_API_KEY` 变量
5. 粘贴新的 API Key
6. 保存并重新部署

---

## ✅ 验证配置

更新后验证：

```bash
# 测试 API Key
cd /home/user/webapp
curl -s "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=你的新APIKey" \
  -H 'Content-Type: application/json' \
  -d '{"contents": [{"parts": [{"text": "Hello"}]}]}' | jq

# 检查服务日志
pm2 logs review-system --nostream

# 测试创建复盘
# 访问 http://localhost:3000
# 登录并创建一个新的名著复盘
```

---

## 📞 需要帮助？

如果你：
1. ✅ **已获取新的 API Key** - 直接发给我，我帮你配置
2. ✅ **有 Genspark API Key** - 发给我，我优先配置 Genspark
3. ❌ **无法获取新 Key** - 我们可以讨论其他方案

---

**当前状态**: ❌ Gemini API 配额已用完  
**建议操作**: 获取新的 Gemini API Key 或配置 Genspark API Key  
**紧急程度**: 🔴 高 - 影响所有 AI 分析功能
