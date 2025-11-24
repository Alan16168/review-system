# 购物车 API 实现 v5.32.0

## 更新日期
2025-11-24

## 问题描述

用户点击"立即订阅"按钮时出现 404 错误：
```
POST https://review-system.pages.dev/api/cart/add
Status: 404 (Not Found)
```

### 错误详情
- **前端调用**: `axios.post('/api/cart/add', {...})`
- **后端端点**: 只有 `POST /api/cart/`，没有 `/api/cart/add`
- **参数格式不匹配**: 前端传递 `item_id`，后端期望 `subscription_tier`

## 解决方案

### 修改的文件
**src/routes/cart.ts**

### 关键修改

1. **添加 `/add` 端点支持**
   ```typescript
   cart.post('/', addToCartHandler);
   cart.post('/add', addToCartHandler);  // 新增
   ```

2. **兼容前端参数格式**
   ```typescript
   const subscription_tier = body.subscription_tier || body.item_id;
   const item_type = body.item_type || 'subscription';
   ```

3. **自动获取订阅配置**
   ```typescript
   // 从数据库获取 duration_days, description 等信息
   const config = await c.env.DB.prepare(
     'SELECT duration_days, description, description_en FROM subscription_config WHERE tier = ?'
   ).bind(subscription_tier).first();
   ```

4. **返回购物车数量**
   ```typescript
   return c.json({ 
     success: true,
     message: '已加入购物车',
     cart_id: result.meta.last_row_id,
     item_count: countResult?.count || 1
   });
   ```

## 完整代码

```typescript
const addToCartHandler = async (c: any) => {
  try {
    const user = c.get('user') as UserPayload;
    const body = await c.req.json();
    
    // 支持两种参数格式
    const subscription_tier = body.subscription_tier || body.item_id;
    const item_type = body.item_type || 'subscription';
    const price_usd = body.price_usd;
    const item_name = body.item_name;
    
    // 验证必填字段
    if (!subscription_tier || !price_usd) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    // 获取订阅配置
    let duration_days = 365;
    let description = item_name || (subscription_tier === 'premium' ? '高级会员年费' : '超级会员年费');
    let description_en = subscription_tier === 'premium' ? 'Premium Member - Annual' : 'Super Member - Annual';
    
    const config = await c.env.DB.prepare(
      'SELECT duration_days, description, description_en FROM subscription_config WHERE tier = ? AND is_active = 1'
    ).bind(subscription_tier).first();
    
    if (config) {
      duration_days = config.duration_days || 365;
      description = config.description || description;
      description_en = config.description_en || description_en;
    }
    
    // 检查是否已存在
    const existing = await c.env.DB.prepare(`
      SELECT id FROM shopping_cart 
      WHERE user_id = ? AND subscription_tier = ?
    `).bind(user.id, subscription_tier).first();
    
    if (existing) {
      return c.json({ 
        error: 'Item already in cart',
        message: '该商品已在购物车中'
      }, 400);
    }
    
    // 添加到购物车
    const result = await c.env.DB.prepare(`
      INSERT INTO shopping_cart (
        user_id, item_type, subscription_tier, price_usd, 
        duration_days, description, description_en
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.id,
      item_type,
      subscription_tier,
      price_usd,
      duration_days,
      description,
      description_en
    ).run();
    
    // 获取购物车总数
    const countResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM shopping_cart WHERE user_id = ?'
    ).bind(user.id).first();
    
    return c.json({ 
      success: true,
      message: '已加入购物车',
      cart_id: result.meta.last_row_id,
      item_count: countResult?.count || 1
    }, 201);
  } catch (error) {
    console.error('Add to cart error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
};

cart.post('/', addToCartHandler);
cart.post('/add', addToCartHandler);
```

## API 端点

### POST /api/cart/add

**请求头**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**:
```json
{
  "item_id": "premium",           // 或 "super"
  "price_usd": 20,                // 价格
  "item_name": "高级会员年费",    // 可选
  "item_type": "subscription",    // 可选，默认 "subscription"
  "quantity": 1                   // 可选，暂未使用
}
```

**成功响应** (201):
```json
{
  "success": true,
  "message": "已加入购物车",
  "cart_id": 123,
  "item_count": 1
}
```

**错误响应** (400):
```json
{
  "error": "Item already in cart",
  "message": "该商品已在购物车中"
}
```

**错误响应** (401):
```json
{
  "error": "Unauthorized"
}
```

## 数据库表

### shopping_cart 表结构
```sql
CREATE TABLE shopping_cart (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'subscription',
  subscription_tier TEXT NOT NULL,
  price_usd REAL NOT NULL,
  duration_days INTEGER DEFAULT 365,
  description TEXT,
  description_en TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 前端调用

### addToCart 函数
```javascript
async function addToCart(tier, price) {
  if (!currentUser) {
    showNotification('请先登录', 'error');
    showLogin();
    return;
  }
  
  try {
    // axios 自动使用全局配置的 Authorization header
    await axios.post('/api/cart/add', {
      item_type: 'subscription',
      item_id: tier,
      item_name: tier === 'premium' ? '高级会员年费' : '超级会员年费',
      price_usd: price,
      quantity: 1
    });
    
    showNotification('已加入购物车', 'success');
    await updateCartCount();
  } catch (error) {
    console.error('Add to cart error:', error);
    showNotification(error.response?.data?.error || '加入购物车失败', 'error');
  }
}
```

## 认证机制

### Token 存储和使用

1. **登录时设置**:
   ```javascript
   authToken = response.data.token;
   localStorage.setItem('authToken', authToken);
   axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
   ```

2. **页面加载时恢复**:
   ```javascript
   const token = localStorage.getItem('authToken');
   if (token) {
     authToken = token;
     axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
   }
   ```

3. **所有 API 调用自动携带**:
   - 使用 `axios.defaults.headers.common` 设置全局 header
   - 所有 axios 请求自动包含 `Authorization: Bearer <token>`

## 部署状态

- ✅ **本地测试**: 通过
- ✅ **构建**: 成功
- ✅ **部署**: 已部署到 Cloudflare Pages
- 🌐 **生产 URL**: https://4bb32279.review-system.pages.dev

## 测试验证

### 测试场景 1: 添加高级会员到购物车

1. **登录系统**
2. **点击价格方案**
3. **点击高级会员的"立即订阅"按钮**

**预期结果**:
- ✅ 显示通知："已加入购物车"
- ✅ 购物车图标更新数量
- ✅ 不再显示 404 错误

### 测试场景 2: 重复添加

1. **再次点击同一会员等级的"立即订阅"按钮**

**预期结果**:
- ❌ 显示错误："该商品已在购物车中"
- ✅ 购物车数量不变

### 测试场景 3: 添加不同会员等级

1. **点击超级会员的"立即订阅"按钮**

**预期结果**:
- ✅ 成功添加
- ✅ 购物车数量增加到 2

## API 调用流程

```
用户点击"立即订阅"按钮
    ↓
前端调用 addToCart(tier, price)
    ↓
检查用户登录状态
    ↓
axios.post('/api/cart/add', {...})
    ↓
自动携带 Authorization: Bearer <token>
    ↓
后端 authMiddleware 验证 token
    ↓
cart.post('/add', addToCartHandler)
    ↓
验证参数 (subscription_tier, price_usd)
    ↓
从数据库获取订阅配置
    ↓
检查购物车中是否已存在
    ↓
插入到 shopping_cart 表
    ↓
返回成功响应 + 购物车数量
    ↓
前端显示"已加入购物车"通知
    ↓
更新购物车徽章数量
```

## 相关 API 端点

### GET /api/cart
获取用户购物车内容
```json
{
  "items": [...],
  "count": 2
}
```

### DELETE /api/cart/:id
删除购物车中的某个商品

### GET /api/cart/total
获取购物车总计
```json
{
  "item_count": 2,
  "total_amount": 140
}
```

## 下一步开发

### 高优先级
1. **购物车页面**
   - 显示购物车内容
   - 删除商品
   - 修改数量（未来）
   - 结账按钮

2. **PayPal 支付集成**
   - 创建订单 API
   - 捕获支付 API
   - 更新用户订阅状态

### 中优先级
3. **购物车图标和徽章**
   - 顶部导航栏添加购物车图标
   - 显示商品数量徽章
   - 点击跳转到购物车页面

4. **订单管理**
   - 查看订单历史
   - 订单详情
   - 订单状态追踪

## 已知限制

1. **quantity 参数未使用**: 当前每个订阅等级只能添加一次
2. **没有购物车过期机制**: 购物车商品永久保存
3. **没有库存检查**: 订阅服务无限制

## 版本历史

- **v5.32.0** (2025-11-24) - 实现购物车 API
  - 支持 /api/cart/add 端点
  - 兼容前端参数格式
  - 自动获取订阅配置
  - 返回购物车数量

- **v5.31.0** (2025-11-24) - 界面设置自动刷新
- **v5.30.0** (2025-11-24) - 按钮布局更新

---

**开发者**: AI Assistant  
**版本**: v5.32.0  
**日期**: 2025-11-24  
**状态**: ✅ 生产就绪
