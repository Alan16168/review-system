# 快速开始指南

## 🚀 立即体验

### 在线访问
直接访问开发环境：https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev

### 测试账号
| 角色 | 邮箱 | 密码 | 说明 |
|------|------|------|------|
| 管理员 | admin@review.com | admin123 | 所有权限 + 后台管理 |
| 高级用户 | premium@review.com | premium123 | 个人复盘 + 团队功能 |
| 普通用户 | user@review.com | user123 | 仅个人复盘 |

## 💻 本地开发

### 1. 克隆或下载项目
```bash
# 如果已有代码
cd /home/user/webapp

# 或下载备份
wget https://page.gensparksite.com/project_backups/review-system-complete.tar.gz
tar -xzf review-system-complete.tar.gz
```

### 2. 安装依赖
```bash
npm install
```

### 3. 初始化数据库
```bash
# 构建项目
npm run build

# 启动服务（会自动创建数据库）
pm2 start ecosystem.config.cjs

# 等待几秒后初始化数据
node init-db.cjs
```

### 4. 测试 API
```bash
# 运行测试脚本
./test-api.sh

# 或手动测试
curl http://localhost:3000
```

### 5. 访问应用
- 本地: http://localhost:3000
- 使用测试账号登录

## 🎯 功能演示

### 场景 1: 个人复盘
1. 使用普通用户登录 (user@review.com / user123)
2. 点击"创建复盘"
3. 填写复盘主题和9个问题
4. 保存为草稿或标记完成
5. 在列表中查看和编辑

### 场景 2: 团队协作
1. 使用高级用户登录 (premium@review.com / premium123)
2. 进入"团队"页面
3. 创建新团队
4. 邀请其他成员
5. 创建团队复盘
6. 团队成员可共同编辑

### 场景 3: 后台管理
1. 使用管理员登录 (admin@review.com / admin123)
2. 进入"管理后台"
3. 查看系统统计
4. 管理用户角色
5. 删除用户或内容

## 🔧 常用命令

### 开发命令
```bash
# 构建项目
npm run build

# 启动开发服务器
pm2 start ecosystem.config.cjs

# 查看日志
pm2 logs review-system --nostream

# 重启服务
pm2 restart review-system

# 停止服务
pm2 stop review-system

# 清理端口
npm run clean-port
```

### 数据库命令
```bash
# 重置数据库
npm run db:reset

# 初始化数据
node init-db.cjs

# 添加种子数据
npm run db:seed
```

### 测试命令
```bash
# 运行完整测试
./test-api.sh

# 测试登录
npm run test
```

## 📝 API 快速参考

### 认证
```bash
# 登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@review.com","password":"admin123"}'

# 注册
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","password":"pass123","username":"New User"}'
```

### 复盘记录
```bash
# 获取列表 (需要 token)
curl -X GET http://localhost:3000/api/reviews \
  -H "Authorization: Bearer YOUR_TOKEN"

# 创建复盘
curl -X POST http://localhost:3000/api/reviews \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"测试复盘","question1":"目标...","status":"draft"}'
```

### 团队管理（高级用户）
```bash
# 创建团队
curl -X POST http://localhost:3000/api/teams \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"我的团队","description":"团队描述"}'
```

### 管理后台（管理员）
```bash
# 获取统计
curl -X GET http://localhost:3000/api/admin/stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# 修改用户角色
curl -X PUT http://localhost:3000/api/admin/users/2/role \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"premium"}'
```

## 🐛 常见问题

### 1. 数据库表不存在
```bash
# 重新初始化
node init-db.cjs
```

### 2. 端口被占用
```bash
# 清理端口
fuser -k 3000/tcp

# 或使用 npm 脚本
npm run clean-port
```

### 3. 登录失败
- 确认密码正确
- 检查数据库是否初始化
- 查看服务器日志：`pm2 logs review-system --nostream`

### 4. 服务未启动
```bash
# 检查服务状态
pm2 list

# 重新构建并启动
npm run build
pm2 restart review-system
```

## 📚 下一步

### 功能扩展建议
1. **前端增强** - 完善复盘详情页面和编辑界面
2. **数据导出** - 支持 PDF/Excel 导出
3. **搜索筛选** - 添加全文搜索和高级筛选
4. **通知系统** - 团队协作通知
5. **数据分析** - 复盘数据统计和可视化

### 学习资源
- [Hono 文档](https://hono.dev/)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)

## 🔗 相关链接

- **项目备份**: https://page.gensparksite.com/project_backups/review-system-complete.tar.gz
- **在线演示**: https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev
- **完整文档**: 查看 README.md

## 📞 技术支持

如有问题，请：
1. 查看 README.md 完整文档
2. 检查 pm2 日志
3. 运行测试脚本验证功能
4. 查看 API 响应的错误信息

---

**祝你使用愉快！** 🎉
