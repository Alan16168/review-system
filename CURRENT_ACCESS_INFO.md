# 当前访问信息

**更新时间**: 2025-11-23 19:20 UTC  
**状态**: ✅ 服务正常运行

---

## 🌐 正确的访问地址

### 开发环境 URL（请使用这个）
```
https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev
```

**重要提示**: 
- ✅ 这是正确的公共访问地址
- ⚠️ 不要使用其他的 sandbox URL
- ⚠️ URL 中的 `i1l7k2pbfdion8sxilbu1-6532622b` 是当前 sandbox 的唯一标识

### 本地访问（仅限沙盒内部）
```
http://localhost:3000
http://127.0.0.1:3000
```

---

## 📍 主要功能页面

| 功能 | 路径 | 完整 URL |
|-----|------|---------|
| 首页 | `/` | https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev/ |
| 名著文档复盘 | `/famous-books-documents` | https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev/famous-books-documents |
| AI 对话助手 | `/ai-library` | https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev/ai-library |
| 我的复盘 | `/my-reviews` | https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev/my-reviews |
| 用户设置 | `/user-settings` | https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev/user-settings |

---

## 🔍 如果遇到 "Sandbox Not Found" 错误

这个错误通常是因为：

1. **URL 错误** - 您访问的不是当前 sandbox 的 URL
2. **Sandbox 已过期** - Sandbox 会在一定时间后自动清理
3. **服务未启动** - PM2 服务可能已停止

### 解决方法

#### 1. 检查服务状态
```bash
pm2 list
```
应该看到 `review-system` 的状态是 `online`

#### 2. 如果服务未运行，重启服务
```bash
cd /home/user/webapp
fuser -k 3000/tcp 2>/dev/null || true
pm2 start ecosystem.config.cjs
```

#### 3. 重新获取公共 URL
如果 sandbox 重启了，URL 可能会改变，需要重新获取：
```bash
# 服务会在 http://localhost:3000 上运行
# 公共 URL 格式: https://3000-[sandbox-id].e2b.dev
```

---

## 📊 当前服务状态

### PM2 进程信息
- **进程名**: review-system
- **PID**: 2845343
- **状态**: online ✅
- **运行时间**: 50+ 分钟
- **内存使用**: ~57 MB
- **CPU 使用**: 0%

### 最近的访问日志
```
[wrangler:info] Ready on http://0.0.0.0:3000
[wrangler:info] GET / 200 OK (28ms)
[wrangler:info] GET / 200 OK (4ms)
[wrangler:info] POST /api/reviews/famous-books/analyze 401 Unauthorized (8ms)
```

所有请求都正常响应 ✅

---

## 🧪 测试连接

### 浏览器测试
直接在浏览器中打开：
```
https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev
```

应该看到登录页面或首页。

### 命令行测试
```bash
# 测试首页
curl -I https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev

# 应该返回 HTTP/2 200
```

---

## ⚠️ 重要注意事项

1. **Sandbox 生命周期**
   - Sandbox 在一定时间后会自动清理
   - 如果长时间不活动，可能需要重新启动服务
   - 每次重新启动后，URL 保持不变

2. **URL 固定性**
   - 在同一个 sandbox session 中，URL 不会改变
   - 只要 sandbox 不被销毁，URL 就保持有效

3. **服务自动重启**
   - PM2 会自动管理服务进程
   - 如果服务崩溃，PM2 会自动重启

---

## 🔧 常用命令

### 检查服务
```bash
pm2 list
pm2 logs review-system --nostream
```

### 重启服务
```bash
cd /home/user/webapp
pm2 restart review-system
```

### 测试功能
```bash
# 测试 Gemini API
./test_gemini_key.sh

# 测试所有功能
./test_gemini_features.sh
```

---

## 📱 移动端访问

开发环境的公共 URL 也支持移动设备访问：
- 在手机浏览器中输入完整 URL
- 响应式设计会自动适配移动端
- 所有功能在移动端也可正常使用

---

**最后验证时间**: 2025-11-23 19:20 UTC  
**验证结果**: HTTP 200 - 服务正常 ✅
