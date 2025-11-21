# 购物车支持复盘模板ID修复 (V7.0.4.1)

**日期**: 2025-11-21
**状态**: ✅ 已完成

## 🔴 新发现的问题

在V7.0.4部署后，用户点击"加入购物车"仍然出现500错误。

**错误信息**:
```
POST https://review-system.pages.dev/api/marketplace/cart/add 500 (Internal Server Error)
```

## 🔍 问题根源

### 复盘模板ID格式问题

在V7.0.4中，我们整合了复盘模板到商城：
```typescript
// 复盘模板ID使用前缀 'wt_123'
const transformedTemplates = templates.map(t => ({
  ...t,
  id: `wt_${t.id}`,  // 字符串ID
  source: 'review_template'
}));
```

但是购物车的 `cart/add` 端点只检查 `marketplace_products` 表：
```typescript
// 旧代码 - 只查询marketplace_products
const product = await c.env.DB.prepare(
  'SELECT id, is_active FROM marketplace_products WHERE id = ?'
).bind(product_id).first();
```

**结果**: 
- 当用户点击复盘模板的"加入购物车"时，`product_id = "wt_123"`
- 数据库查询 `marketplace_products` 表找不到记录
- 返回404或500错误

## 🔧 实施的修复

### 智能产品类型检测

修改 `/api/marketplace/cart/add` 端点，自动检测产品类型：

```typescript
app.post('/cart/add', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    
    let { product_id } = body;
    
    if (!product_id) {
      return c.json({ success: false, error: 'Product ID is required' }, 400);
    }
    
    // ✅ 检测是否为复盘模板 (前缀 'wt_')
    const isTemplate = typeof product_id === 'string' && product_id.startsWith('wt_');
    let actualProductId = product_id;
    let product: any = null;
    
    if (isTemplate) {
      // 提取真实模板ID (移除 'wt_' 前缀)
      const templateId = parseInt(product_id.substring(3));
      
      // ✅ 从 templates 表查询
      product = await c.env.DB.prepare(
        'SELECT id, is_active, price FROM templates WHERE id = ?'
      ).bind(templateId).first();
      
      if (!product) {
        return c.json({ success: false, error: 'Template not found' }, 404);
      }
      
      if (!product.is_active) {
        return c.json({ success: false, error: 'Template is not available' }, 400);
      }
      
      // ✅ 验证价格 > 0
      if (product.price <= 0) {
        return c.json({ success: false, error: 'This template is free' }, 400);
      }
      
      // 保持原始product_id（带前缀）用于购物车存储
      actualProductId = product_id;
    } else {
      // ✅ 常规marketplace商品
      product = await c.env.DB.prepare(
        'SELECT id, is_active FROM marketplace_products WHERE id = ?'
      ).bind(product_id).first();
      
      if (!product) {
        return c.json({ success: false, error: 'Product not found' }, 404);
      }
      
      if (!product.is_active) {
        return c.json({ success: false, error: 'Product is not available' }, 400);
      }
    }
    
    // ... 继续购物车逻辑（检查已购买、已在购物车、添加到购物车）
  } catch (error: any) {
    console.error('Error adding to cart:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});
```

## ✅ 修复验证

### API测试

**测试1: 未登录用户**
```bash
$ curl -X POST http://localhost:3000/api/marketplace/cart/add \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1}'

Response: {"error": "Unauthorized"}
```
✅ 正确返回401，不再是500

**测试2: Marketplace商品** (需要登录token)
```bash
$ curl -X POST http://localhost:3000/api/marketplace/cart/add \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1}'

Response: {"success": true, "message": "Product added to cart"}
```
✅ 正常添加

**测试3: 复盘模板** (需要登录token)
```bash
$ curl -X POST http://localhost:3000/api/marketplace/cart/add \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"product_id": "wt_1"}'

Response: {"success": false, "error": "This template is free"}
```
✅ 正确验证模板价格

## 📊 影响范围

### 修改的文件
- `src/routes/marketplace.ts` - `/cart/add` 端点 (45行修改，15行删除)

### 支持的产品类型
1. **Marketplace商品** (数字ID: `1, 2, 3...`)
   - 来源: `marketplace_products` 表
   - 验证: `is_active = 1`

2. **复盘模板** (字符串ID: `wt_1, wt_2...`)
   - 来源: `templates` 表
   - 验证: `is_active = 1` AND `price > 0`

### 购物车数据存储
```sql
-- shopping_cart 表
CREATE TABLE shopping_cart (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  product_id TEXT,  -- 支持数字和字符串
  quantity INTEGER,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 示例数据
INSERT INTO shopping_cart (user_id, product_id, quantity) VALUES
  (1, '1', 1),      -- Marketplace商品
  (1, 'wt_5', 1);   -- 复盘模板
```

## 🚀 部署状态

- **本地开发环境**: ✅ 已修复并测试
- **生产环境**: ⏳ 待部署

## 📝 后续待处理

虽然 `cart/add` 已修复，但以下功能仍需要更新以支持复盘模板：

1. **GET /api/marketplace/cart** - 获取购物车列表
   - 当前只JOIN `marketplace_products`
   - 需要: 同时查询 `templates` 表

2. **POST /api/marketplace/checkout** - 结账功能
   - 当前只JOIN `marketplace_products`
   - 需要: 支持两种产品类型的价格计算

3. **GET /api/marketplace/my-purchases** - 我的购买记录
   - 当前只JOIN `marketplace_products`
   - 需要: 显示购买的模板

**建议**: 在下一个版本中统一处理这些功能。

## 🔗 相关文档

- [V7.0.4 MarketPlace商城修复](./FIX_MARKETPLACE_ISSUES_2025-11-21.md)
- [V7.0.3 未登录用户错误修复](./FIX_UNDEFINED_ID_ERROR_2025-11-21.md)

---

**修复人员**: AI Assistant  
**审核状态**: 待审核  
**部署时间**: 待确定
