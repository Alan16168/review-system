# Gemini API Key 配置指南

## 快速配置步骤

### 第1步：获取Gemini API Key

#### 方式1：使用 Google AI Studio（推荐 - 最简单）

1. **访问 Google AI Studio**
   ```
   https://makersuite.google.com/app/apikey
   ```
   或
   ```
   https://aistudio.google.com/app/apikey
   ```

2. **登录你的Google账号**

3. **点击 "Create API Key" 按钮**

4. **选择项目**（或创建新项目）

5. **复制生成的API Key**
   - 格式类似：`AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
   - ⚠️ 保存好这个Key，页面关闭后可能无法再次查看

#### 方式2：使用 Google Cloud Console（更多控制）

1. **访问 Google Cloud Console**
   ```
   https://console.cloud.google.com/
   ```

2. **创建或选择项目**

3. **启用 Generative Language API**
   - 进入：APIs & Services > Library
   - 搜索：`Generative Language API` 或 `Gemini API`
   - 点击 "Enable" 启用

4. **创建 API Key**
   - 进入：APIs & Services > Credentials
   - 点击：Create Credentials > API Key
   - 复制生成的Key

5. **（可选）设置API Key限制**
   - 点击刚创建的API Key
   - 设置应用程序限制（推荐：HTTP referrers 或 IP addresses）
   - 设置API限制（只选择：Generative Language API）

### 第2步：配置到项目中

#### 本地开发环境配置

1. **编辑 `.dev.vars` 文件**
   
   在项目根目录打开 `.dev.vars` 文件：
   ```bash
   cd /home/user/webapp
   nano .dev.vars
   ```
   或
   ```bash
   vim .dev.vars
   ```

2. **添加 GEMINI_API_KEY**
   
   在文件末尾添加：
   ```bash
   # Gemini API Key（用于AI对话功能）
   GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```
   
   替换 `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXX` 为你的实际API Key

3. **保存文件**
   - nano: 按 `Ctrl + X`，然后按 `Y`，再按 `Enter`
   - vim: 按 `Esc`，输入 `:wq`，按 `Enter`

4. **重启服务**
   ```bash
   cd /home/user/webapp
   npm run build
   pm2 restart review-system
   ```

5. **验证配置**
   ```bash
   # 测试API
   curl -X POST http://localhost:3000/api/resources/ai-chat \
     -H "Content-Type: application/json" \
     -H "X-Language: zh" \
     -d '{"question":"如何做好项目复盘？"}'
   
   # 查看日志
   pm2 logs review-system --nostream --lines 50
   ```

   如果配置成功，你应该看到：
   ```
   Using API Key for Gemini (from GEMINI_API_KEY)
   ==================== AI Chat Prompt ====================
   ...
   ==================== Gemini Response ====================
   Status: 200
   AI Text: {...真实的AI回答...}
   ```

#### 生产环境配置（Cloudflare Pages）

1. **使用 Wrangler 设置密钥**
   ```bash
   cd /home/user/webapp
   npx wrangler secret put GEMINI_API_KEY --project-name webapp
   ```

2. **输入API Key**
   - 命令会提示你输入密钥值
   - 粘贴你的Gemini API Key
   - 按 `Enter` 确认

3. **验证密钥设置**
   ```bash
   npx wrangler secret list --project-name webapp
   ```

### 第3步：验证功能

1. **访问应用**
   ```
   https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev
   ```

2. **打开AI对话**
   - 滚动到"学习资源库"部分
   - 点击紫色的"与AI对话"按钮

3. **测试问题**
   试试这些问题：
   - "如何提高团队协作效率？"
   - "项目复盘的核心步骤是什么？"
   - "如何建立有效的复盘机制？"

4. **观察响应**
   - 如果看到详细的、多角度的回答 ✅
   - 如果看到通用的模板回答 ❌（说明API Key还没生效或有问题）

## 完整的 .dev.vars 配置示例

```bash
# Google OAuth 配置
GOOGLE_CLIENT_ID=78785931273-pse627aasv4h50mcc1cschj5cvtqr88f.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Google API Key（用于搜索和YouTube）
GOOGLE_API_KEY=AIzaSyAsXAObY7qWBlnO0aXZYXbInYXfUnbiHKs

# YouTube Data API
YOUTUBE_API_KEY=AIzaSyAsXAObY7qWBlnO0aXZYXbInYXfUnbiHKs

# Gemini API Key（用于AI对话功能）⭐ 新增
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Resend Email API Key
RESEND_API_KEY=re_123456789_placeholder

# PayPal 配置
PAYPAL_MODE=live
PAYPAL_CLIENT_ID=AV4i_SNiqZQKsUh0-UVPFBvL0dKC6wwc5CE5oMNzJ9q42RqOa12c5GK1_V8F_wYBW2zBz21uwfcQaMeY
PAYPAL_CLIENT_SECRET=EHuw5IqcNvfb0AN-xO4h6IUIW7uRHIq4mpw0bb9DjHsX42dUlsLtpriwJLVm4aBSo173HFw8hmZ30-8H

# JWT Secret
JWT_SECRET=your-secret-jwt-key-change-this-in-production-2024
```

## 常见问题解决

### 问题1：403 Forbidden 错误

**错误信息**：`Gemini API error: 403`

**可能原因**：
1. API Key没有启用Generative Language API权限
2. API Key有应用限制（如IP白名单）
3. API Key已过期或被撤销

**解决方法**：
1. 检查API是否已启用：
   - 访问：https://console.cloud.google.com/apis/library
   - 搜索：Generative Language API
   - 确保显示"API已启用"

2. 检查API Key限制：
   - 访问：https://console.cloud.google.com/apis/credentials
   - 点击你的API Key
   - 查看"应用程序限制"和"API限制"
   - 开发环境建议设置为"无"

3. 重新创建API Key：
   - 删除旧的Key
   - 创建新的Key
   - 重新配置到项目

### 问题2：API Key不生效

**症状**：配置后仍然返回Mock数据

**解决方法**：
1. 确认文件已保存
   ```bash
   cat /home/user/webapp/.dev.vars | grep GEMINI
   ```

2. 重启服务
   ```bash
   pm2 restart review-system
   ```

3. 清除构建缓存
   ```bash
   rm -rf dist
   npm run build
   pm2 restart review-system
   ```

4. 检查日志
   ```bash
   pm2 logs review-system --nostream --lines 50
   ```
   应该看到：`Using API Key for Gemini (from GEMINI_API_KEY)`

### 问题3：API配额限制

**错误信息**：`429 Too Many Requests`

**解决方法**：
1. 检查配额：https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
2. 等待配额重置（通常是每分钟或每天）
3. 申请提高配额限制
4. 实现请求频率限制

### 问题4：找不到 .dev.vars 文件

**解决方法**：
```bash
# 复制示例文件
cd /home/user/webapp
cp .dev.vars.example .dev.vars

# 编辑文件
nano .dev.vars
```

## API使用限制

### 免费配额（Google AI Studio）
- **每分钟请求数**: 15次
- **每天请求数**: 1,500次
- **完全免费**，无需信用卡

### 付费配额（Google Cloud）
- 根据使用量计费
- 详见：https://ai.google.dev/pricing

### 建议
- 开发测试阶段：使用免费配额足够
- 生产环境：考虑配额监控和限流机制

## 安全最佳实践

### 1. 不要提交API Key到Git
```bash
# .gitignore 已包含
.dev.vars
```

### 2. 定期轮换API Key
建议每3-6个月更换一次API Key

### 3. 设置API Key限制
- 限制可调用的API
- 限制请求来源（IP或域名）

### 4. 监控API使用
定期检查API调用次数和费用

## 快速命令参考

```bash
# 1. 编辑配置文件
nano /home/user/webapp/.dev.vars

# 2. 重新构建
cd /home/user/webapp && npm run build

# 3. 重启服务
pm2 restart review-system

# 4. 查看日志
pm2 logs review-system --nostream --lines 50

# 5. 测试API
curl -X POST http://localhost:3000/api/resources/ai-chat \
  -H "Content-Type: application/json" \
  -H "X-Language: zh" \
  -d '{"question":"测试问题"}'

# 6. 生产环境配置
npx wrangler secret put GEMINI_API_KEY --project-name webapp
```

## 需要帮助？

如果配置过程中遇到问题：
1. 查看日志：`pm2 logs review-system`
2. 检查API控制台：https://console.cloud.google.com/
3. 参考官方文档：https://ai.google.dev/docs
4. 查看调试文档：`AI_CHAT_PROMPT_DEBUG.md`

## 下一步

配置完成后，你可以：
1. 测试不同的问题，观察AI的回答质量
2. 根据实际效果优化Prompt（见 `AI_CHAT_PROMPT_DEBUG.md`）
3. 收集用户反馈，持续改进对话体验
