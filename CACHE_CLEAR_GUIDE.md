# 清除缓存指南 - 修复 500 错误

## 🐛 问题现象

访问 https://review-system.pages.dev 时出现 500 错误，无法编辑草稿。

## 🔧 解决方案

### 方法 1：硬刷新（推荐）

**Windows/Linux:**
```
按住 Ctrl + Shift + R
```

**Mac:**
```
按住 Cmd + Shift + R
```

### 方法 2：清除浏览器缓存

**Chrome/Edge:**
1. 按 `Ctrl + Shift + Delete` (Windows) 或 `Cmd + Shift + Delete` (Mac)
2. 选择"缓存的图片和文件"
3. 选择时间范围："过去 1 小时"
4. 点击"清除数据"

**Firefox:**
1. 按 `Ctrl + Shift + Delete` (Windows) 或 `Cmd + Shift + Delete` (Mac)
2. 勾选"缓存"
3. 点击"立即清除"

### 方法 3：使用隐身模式（临时测试）

**Chrome/Edge:**
```
Ctrl + Shift + N (Windows)
Cmd + Shift + N (Mac)
```

**Firefox:**
```
Ctrl + Shift + P (Windows)
Cmd + Shift + P (Mac)
```

然后访问：https://review-system.pages.dev

### 方法 4：添加时间戳参数（快速测试）

访问：
```
https://review-system.pages.dev/?v=20251116
```

时间戳参数会绕过缓存。

## ✅ 验证修复

清除缓存后：

1. **访问主页**: https://review-system.pages.dev
2. **登录账户**
3. **打开浏览器控制台**（F12）
4. **进入"我的复盘"**
5. **点击草稿"编辑"按钮**
6. **查看控制台日志**

### 预期看到的日志

```javascript
[showEditReview] 开始加载复盘 ID: 217
[showEditReview] 服务器响应: {review: {...}, questions: [...]}
[showEditReview] 复盘信息: {...}
[showEditReview] 问题数量: ...
```

### 如果仍然出错

控制台可能显示：
```
GET https://review-system.pages.dev/api/reviews/217 500 (Internal Server Error)
```

这种情况请：
1. 截图控制台的完整错误信息
2. 检查 Network 标签中的请求详情
3. 等待 5-10 分钟让 Cloudflare CDN 完全更新
4. 联系我进行进一步调试

## 🕒 Cloudflare CDN 缓存更新时间

- **Workers**: 立即更新
- **静态资源**: 5-10 分钟
- **API 响应**: 不缓存（立即生效）

## 🔍 技术细节

### 最新部署信息
- **部署时间**: 2025-11-16 00:16 UTC
- **部署 ID**: c83a01cc
- **Worker 版本**: 最新（包含数据库查询修复）

### 修复内容
1. ✅ 移除了对 `name_en` 和 `description_en` 列的依赖
2. ✅ 简化了数据库查询
3. ✅ 增强了前端错误处理
4. ✅ 添加了详细的调试日志

### 数据库验证
```bash
# 生产数据库已确认：
# - templates 表结构正常
# - 不包含 name_en/description_en 列
# - 修复后的代码不再引用这些列
```

## 💡 预防措施

### 开发时
1. 定期清除浏览器缓存
2. 使用隐身模式测试新功能
3. 使用版本化的静态资源 URL

### 部署后
1. 等待 5-10 分钟让缓存更新
2. 使用硬刷新验证
3. 在多个浏览器中测试

## 📞 需要帮助？

如果按照以上步骤操作后仍然出现问题：

1. **截图以下信息**：
   - 浏览器控制台的完整错误
   - Network 标签中失败的请求详情
   - Sources 标签中的 app.js 文件（确认版本）

2. **提供以下信息**：
   - 浏览器类型和版本
   - 操作系统
   - 最后一次清除缓存的时间

3. **尝试以下操作**：
   - 换一个浏览器测试
   - 使用移动设备访问
   - 连接不同的网络（避免本地缓存）

---

**最后更新**: 2025-11-16 00:16 UTC  
**状态**: ✅ 修复已部署，等待缓存更新
