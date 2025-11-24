# D1 数据库绑定配置指南

## 问题诊断

购物车 API 返回 500 错误的根本原因是 **Cloudflare Pages 项目缺少 D1 数据库绑定配置**。

虽然 `wrangler.jsonc` 中定义了 D1 数据库绑定,但 Cloudflare Pages 项目需要在 **Cloudflare Dashboard** 中单独配置这些绑定。

## 详细错误日志

最新部署的代码(v5.33)包含详细的日志记录。如果 D1 绑定缺失,后端会返回:

```json
{
  "error": "Database not configured",
  "details": "D1 database binding is missing. Please configure it in Cloudflare Pages settings."
}
```

## 配置步骤(重要!)

### 方法一:通过 Cloudflare Dashboard 配置(推荐)

1. **登录 Cloudflare Dashboard**
   - 访问: https://dash.cloudflare.com/
   - 选择你的账户

2. **进入 Pages 项目设置**
   - 点击左侧菜单 "Workers & Pages"
   - 找到并点击 "review-system" 项目

3. **配置生产环境绑定**
   - 点击 "Settings" 标签
   - 向下滚动到 "Functions" 部分
   - 找到 "D1 database bindings" 区域
   - 点击 "Add binding" 按钮

4. **添加 D1 绑定**
   - Variable name: `DB` (必须与代码中的 c.env.DB 一致)
   - D1 database: 选择 `review-system-production`
   - Environment: `Production`
   - 点击 "Save"

5. **配置预览环境绑定(可选)**
   - 在同一页面
   - Environment: `Preview`
   - 重复上述步骤添加相同的绑定

### 方法二:使用 wrangler CLI (实验性)

目前 wrangler CLI 不支持直接通过命令行为 Pages 项目配置 D1 绑定。你需要:

1. 创建 `wrangler.toml` (不是 `.jsonc`)
2. 使用 `wrangler pages project create` 时可能需要额外配置

**由于 Pages 项目已存在,推荐使用方法一(Dashboard 配置)**

## 验证配置

配置完成后,测试购物车功能:

1. 访问 https://review-system.pages.dev
2. 登录账户
3. 点击 "立即订阅" 按钮
4. 检查是否成功加入购物车

如果配置正确,你会看到成功提示:"已加入购物车"

## 数据库信息

- **数据库名称**: review-system-production
- **数据库 ID**: 02a7e4ac-ec90-4731-85f7-c03eb63e8391
- **绑定变量名**: DB
- **表名**: shopping_cart

## 故障排查

如果配置后仍然失败:

1. **检查浏览器开发者工具 Console**
   - 打开 F12 开发者工具
   - 切换到 Console 标签
   - 查看详细错误日志(带 ✅ ❌ 标记)

2. **检查 Cloudflare Dashboard 实时日志**
   - Workers & Pages > review-system > Logs
   - 查看实时请求日志
   - 寻找 "Add to cart error" 相关信息

3. **验证 D1 数据库表结构**
   ```bash
   npx wrangler d1 execute review-system-production --command="SELECT sql FROM sqlite_master WHERE type='table' AND name='shopping_cart'"
   ```

4. **测试数据库连接**
   ```bash
   npx wrangler d1 execute review-system-production --command="SELECT 1"
   ```

## 技术背景

### 为什么 wrangler.jsonc 配置不够?

Cloudflare Pages 使用不同的部署机制:

1. **Workers**: 通过 `wrangler.toml` 配置,绑定自动应用
2. **Pages**: 通过 Dashboard 配置,绑定需要在项目级别设置

Pages 项目的 `wrangler.jsonc` 主要用于:
- 本地开发(`wrangler pages dev`)
- 定义兼容性标志
- 构建输出目录

但 **生产环境的绑定必须在 Dashboard 中配置**。

## 相关文件

- `wrangler.jsonc` - D1 配置定义
- `src/routes/cart.ts` - 购物车 API(已添加详细日志)
- `migrations/` - 数据库迁移文件

## 部署版本

- **当前版本**: v5.33
- **部署时间**: 2025-11-24
- **部署 URL**: https://5bb52c65.review-system.pages.dev
- **生产 URL**: https://review-system.pages.dev

## 下一步

配置完 D1 绑定后:

1. ✅ 测试购物车添加功能
2. ⏭️ 实现购物车页面 UI
3. ⏭️ 集成 PayPal 支付
4. ⏭️ 完成订阅激活流程
