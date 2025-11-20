# Token 检查和诊断指南 - 2025-11-20

## 问题症状

用户访问 AI 智能写作助手页面时,看到错误:
- "Error loading books: Request failed with status code 500"
- API 返回: "No authorization token provided"

## 根本原因

**用户没有有效的登录 token**

可能的原因:
1. 用户未登录
2. Token 已过期
3. Token 被清除或损坏
4. 浏览器的 localStorage 被清空

## 快速诊断步骤

### 步骤 1: 检查是否已登录

**打开浏览器开发者工具** (按 F12),然后在 Console 标签执行:

```javascript
// 检查 token 是否存在
const token = localStorage.getItem('token');
console.log('Token exists:', !!token);
console.log('Token:', token);

// 检查用户信息
const user = localStorage.getItem('user');
console.log('User info:', user);
```

**结果判断**:
- ✅ Token 存在且不为 null → 继续步骤 2
- ❌ Token 为 null → **需要登录**,跳转到"解决方案 A"

### 步骤 2: 检查 Token 是否有效

```javascript
const token = localStorage.getItem('token');
if (token) {
  try {
    // 解码 JWT token
    const parts = token.split('.');
    if (parts.length === 3) {
      // 转换 base64url 到 base64
      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }
      
      const payload = JSON.parse(atob(base64));
      
      console.log('Token payload:', payload);
      console.log('User ID:', payload.id);
      console.log('Email:', payload.email);
      console.log('Issued at:', new Date(payload.iat * 1000).toLocaleString());
      console.log('Expires at:', new Date(payload.exp * 1000).toLocaleString());
      console.log('Current time:', new Date().toLocaleString());
      
      // 检查是否过期
      const isExpired = payload.exp * 1000 < Date.now();
      console.log('Token expired:', isExpired);
      
      if (isExpired) {
        console.error('❌ Token has expired! Please login again.');
      } else {
        console.log('✅ Token is valid');
      }
    } else {
      console.error('❌ Invalid token format');
    }
  } catch (error) {
    console.error('❌ Failed to decode token:', error);
  }
} else {
  console.error('❌ No token found');
}
```

**结果判断**:
- ✅ Token 有效且未过期 → 继续步骤 3
- ❌ Token 过期或格式错误 → 跳转到"解决方案 A"

### 步骤 3: 测试 API 连接

```javascript
// 测试 AI Books API
const token = localStorage.getItem('token');
fetch('https://test.review-system.pages.dev/api/ai-books', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => {
  console.log('API Response:', data);
  if (data.success) {
    console.log('✅ API works! Books:', data.books);
  } else {
    console.error('❌ API error:', data.error);
  }
})
.catch(error => {
  console.error('❌ Request failed:', error);
});
```

**结果判断**:
- ✅ API 返回成功 → 问题已解决
- ❌ API 返回错误 → 查看错误信息并跳转到相应解决方案

## 解决方案

### 解决方案 A: 重新登录 (推荐)

**适用于**: Token 不存在、过期、或损坏

**步骤**:

1. **清除旧数据**:
```javascript
localStorage.clear();
```

2. **刷新页面**:
```javascript
location.reload();
```

3. **重新登录**:
   - 访问 https://test.review-system.pages.dev
   - 点击"登录"按钮
   - 使用您的账号登录

4. **验证登录成功**:
```javascript
const token = localStorage.getItem('token');
console.log('New token:', token);

const user = JSON.parse(localStorage.getItem('user') || '{}');
console.log('User info:', user);
```

### 解决方案 B: 检查 localStorage 权限

**适用于**: 浏览器阻止 localStorage 访问

**步骤**:

1. 检查浏览器设置:
   - Chrome: Settings → Privacy and security → Cookies and other site data
   - 确保"Allow all cookies"或至少允许网站的 cookies

2. 检查隐私模式:
   - 如果使用隐身模式/私密浏览,某些浏览器会限制 localStorage
   - 尝试在正常浏览模式下访问

3. 清除站点数据:
   - Chrome: F12 → Application → Clear storage → Clear site data
   - Firefox: F12 → Storage → Right-click → Clear

### 解决方案 C: 手动设置测试 Token (仅用于调试)

**警告**: 这仅用于开发调试,不要在生产环境使用

```javascript
// 这不会真正工作,因为需要服务器生成有效的签名
// 仅用于测试前端 UI
localStorage.setItem('token', 'test-token');
localStorage.setItem('user', JSON.stringify({
  id: 1,
  email: 'test@example.com',
  username: '测试用户'
}));
```

## 常见错误信息

### 错误 1: "No authorization token provided"

**原因**: 前端没有发送 Authorization header,或 token 为 null

**解决**: 重新登录 (解决方案 A)

### 错误 2: "Token expired. Please login again."

**原因**: JWT token 已过期 (有效期 1 小时)

**解决**: 重新登录 (解决方案 A)

### 错误 3: "Invalid token format"

**原因**: Token 格式不符合 JWT 标准

**解决**: 清除 localStorage 并重新登录 (解决方案 A)

### 错误 4: "User not found"

**原因**: Token 中的用户 ID 在数据库中不存在

**解决**: 联系管理员检查数据库,或重新注册账号

## 前端改进 (已实施)

### 新增功能

1. **Token 存在性检查** ✅
   - 在发送 API 请求前检查 token 是否存在
   - 如果不存在,显示友好提示并引导用户登录

2. **友好错误提示** ✅
   - 显示"请先登录以使用 AI 写作功能"
   - 提供"前往登录"按钮

### 代码示例

```javascript
async loadBooks() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      // 显示友好提示
      document.getElementById('books-list').innerHTML = `
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <i class="fas fa-exclamation-circle text-yellow-500 text-3xl mb-2"></i>
          <p class="text-yellow-700 mb-4">请先登录以使用 AI 写作功能</p>
          <button onclick="window.location.href='/'" class="px-6 py-2 bg-indigo-600 text-white rounded-lg">
            前往登录
          </button>
        </div>
      `;
      return;
    }
    // 继续 API 请求...
  } catch (error) {
    // 错误处理...
  }
}
```

## 测试检查清单

部署后,请确认以下功能:

- [ ] 未登录用户访问 AI Books 页面,看到"请先登录"提示
- [ ] 点击"前往登录"按钮,跳转到登录页面
- [ ] 登录成功后,可以正常查看书籍列表
- [ ] Token 过期后,后端返回明确的错误信息
- [ ] 创建书籍时,如果未登录也会提示登录

## 部署信息

- **测试环境**: https://test.review-system.pages.dev
- **部署 ID**: 488deeeb
- **Git Commit**: 4db7f42
- **修复内容**: 添加前端 token 存在性验证

## 后续改进建议

1. **自动 Token 刷新**:
   - 实现 refresh token 机制
   - Token 即将过期时自动刷新

2. **全局登录检查**:
   - 在 app.js 中添加全局 axios 拦截器
   - 统一处理 401 错误并提示登录

3. **Session 持久化**:
   - 使用 sessionStorage 作为备份
   - 防止用户意外关闭标签页丢失登录状态

4. **用户状态管理**:
   - 实现简单的状态管理
   - 避免频繁读取 localStorage

## 相关文档

- AI_BOOKS_TROUBLESHOOTING.md - 完整故障排除指南
- TOKEN_EXPIRATION_ISSUE.md - Token 过期问题详解
