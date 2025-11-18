# 🚀 Review System - 生产环境部署信息

## 📍 部署URL

### 主要URL
- **生产环境**: https://review-system.pages.dev
- **当前部署**: https://9fc7ce84.review-system.pages.dev

## 🔐 管理员账户

**默认管理员账户**:
- 📧 邮箱: `admin@review.com`
- 🔑 密码: `admin123`
- 👤 角色: Admin (管理员)

⚠️ **重要**: 首次登录后请立即修改密码！

## ✅ 已配置的功能

### 1. 环境变量 (Secrets)
- ✅ GOOGLE_CLIENT_ID - Google OAuth
- ✅ GOOGLE_CLIENT_SECRET - Google OAuth
- ✅ GOOGLE_API_KEY - Google API
- ✅ YOUTUBE_API_KEY - YouTube API
- ✅ GEMINI_API_KEY - AI对话功能
- ✅ PAYPAL_CLIENT_ID - PayPal支付
- ✅ PAYPAL_CLIENT_SECRET - PayPal支付
- ✅ PAYPAL_MODE - live（生产环境）
- ✅ JWT_SECRET - JWT签名

### 2. 数据库
- ✅ D1 Database: `review-system-production`
- ✅ Database ID: `02a7e4ac-ec90-4731-85f7-c03eb63e8391`
- ✅ 已应用40个迁移文件
- ✅ 已添加管理员账户

### 3. 核心功能
- ✅ 用户认证（Google OAuth + 邮箱密码）
- ✅ 复盘管理（个人/团队/公开）
- ✅ 团队协作
- ✅ 模板系统
- ✅ 多语言（中文/英文/日语/西班牙语）
- ✅ AI对话助手（Gemini，带自动重试）
- ✅ 资源库（文章/视频搜索）
- ✅ PayPal订阅支付
- ✅ 推荐系统

## 🎯 首次使用步骤

1. **访问系统**: https://review-system.pages.dev

2. **管理员登录**:
   - 使用 admin@review.com / admin123 登录
   - 修改默认密码

3. **配置系统**:
   - 检查所有功能是否正常
   - 测试AI对话功能
   - 测试Google登录
   - 测试资源搜索

4. **添加内容**:
   - 创建模板
   - 创建团队
   - 邀请成员

## 🔧 维护命令

### 部署更新
```bash
# 构建项目
npm run build

# 部署到生产环境
npx wrangler pages deploy dist --project-name review-system
```

### 数据库管理
```bash
# 查看数据库列表
npx wrangler d1 list

# 执行SQL命令
npx wrangler d1 execute review-system-production --remote --command="SELECT * FROM users LIMIT 5;"

# 应用新的迁移
npx wrangler d1 migrations apply review-system-production --remote
```

### 环境变量管理
```bash
# 添加新的secret
echo "value" | npx wrangler pages secret put SECRET_NAME --project-name review-system

# 列出所有secrets
npx wrangler pages secret list --project-name review-system

# 删除secret
npx wrangler pages secret delete SECRET_NAME --project-name review-system
```

## ⚠️ 重要提示

1. **PayPal配置**: 当前使用 **LIVE模式**，所有支付都是真实交易
2. **JWT_SECRET**: 建议更换为更安全的随机密钥
3. **API配额**: 注意监控API使用量（Google API, Gemini API）
4. **备份**: 定期备份数据库
5. **日志**: 通过Cloudflare Dashboard查看错误日志

## 🐛 故障排除

### 500错误
- 检查环境变量是否正确配置
- 检查数据库是否正常
- 查看Cloudflare Pages日志

### Google登录问题
- 确认GOOGLE_CLIENT_ID和GOOGLE_CLIENT_SECRET正确
- 检查Google Cloud Console中的授权回调URL

### AI对话不响应
- 检查GEMINI_API_KEY是否有效
- 确认API配额未超限

## 📝 修复历史

### 2025-11-18 修复记录
**问题**: `/api/templates/admin/all` 接口返回 500 错误
**原因**: 远程数据库 `templates` 表缺少 `price` 字段
**解决**: 执行 `ALTER TABLE templates ADD COLUMN price REAL DEFAULT 0.0;`
**验证**: ✅ 接口现在正常返回数据

## 📞 技术支持

如有问题，请检查：
1. Cloudflare Pages Dashboard: https://dash.cloudflare.com
2. D1 Database Dashboard
3. 应用日志

---

**部署时间**: 2025-11-18
**部署者**: Claude Code Agent
**版本**: 6.11.0
