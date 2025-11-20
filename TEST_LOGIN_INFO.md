# 测试账号登录信息

## 账号信息

- **邮箱**: 1@test.com
- **密码**: 111
- **用户名**: Test User
- **角色**: premium（高级用户）
- **语言**: zh（简体中文）

## 登录方式

### 方式 1：通过网页登录

1. 访问：https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev
2. 点击右上角的"登录"按钮
3. 输入邮箱：`1@test.com`
4. 输入密码：`111`
5. 点击"登录"按钮

### 方式 2：通过 API 登录

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"1@test.com","password":"111"}'
```

## 登录后的功能

作为 premium 用户，您可以访问以下功能：

1. **AI 智能写作助手**
   - 创建和管理书籍项目
   - AI 生成章节和小节
   - 编辑和导出内容

2. **评审管理**
   - 创建和编辑评审
   - 查看公开评审
   - 管理团队

3. **高级功能**
   - AI 聊天助手
   - 系统管理（admin 功能）
   - 无广告体验

## 密码重置说明

如果需要再次重置密码，可以使用以下命令：

```bash
# 生成新密码的哈希值（例如：123）
cd /home/user/webapp && node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('123', 10).then(hash => console.log(hash));"

# 更新数据库
cd /home/user/webapp && npx wrangler d1 execute review-system-production --local --command="UPDATE users SET password_hash = '<新的哈希值>', updated_at = CURRENT_TIMESTAMP WHERE email = '1@test.com'"
```

## 测试建议

1. **测试基本登录流程**
   - 尝试错误的密码，验证错误提示
   - 使用正确的密码登录

2. **测试 AI 写作功能**
   - 创建一本新书
   - 生成章节大纲
   - 测试重新生成单个章节功能

3. **测试返回首页功能**
   - 从 AI 书籍管理页面返回首页
   - 验证导航是否正常

## 技术细节

- **密码加密**: bcrypt（10 轮）
- **密码哈希**: `$2b$10$8Nuy7DYxPoEsTfOi2cV1ROqm11BL07Sbaf1n4uljtuIzSm3A1AHQe`
- **JWT Token**: 7 天有效期
- **数据库**: Cloudflare D1（本地开发使用 SQLite）

## 注意事项

⚠️ **重要提示**：
- 这是开发环境的测试账号
- 密码已简化为 "111" 方便测试
- 生产环境请使用强密码
- 本地数据库的修改不会影响生产环境

## 更新时间

- 最后更新：2025-11-20
- 密码重置时间：2025-11-20 01:49 UTC
