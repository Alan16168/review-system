# V5.6.2 验证指南

## 🔍 如何验证修复是否生效

### 方法 1: 浏览器测试（推荐）

#### 步骤 1: 访问主页
打开浏览器，访问: https://review-system.pages.dev

#### 步骤 2: 切换到中文
- 如果页面是英文，点击右上角切换为中文

#### 步骤 3: 查看学习资源
- 向下滚动页面
- 找到"学习资源"（Resources）板块
- 应该能看到"精选文章"和"视频教程"两个部分

#### 步骤 4: 验证文章链接
点击任意文章链接，验证：
- ✅ 知乎链接 (zhuanlan.zhihu.com) - 应该能正常打开知乎文章页
- ✅ 简书链接 (jianshu.com) - 应该能正常打开简书文章页  
- ✅ 36氪链接 (36kr.com) - 应该能正常打开36氪文章页

**注意**: 不应该再看到百度文库 (wenku.baidu.com) 的链接了！

### 方法 2: API 测试

#### 测试中文文章 API
```bash
curl "https://review-system.pages.dev/api/resources/articles?lang=zh" | jq '.articles[0]'
```

**预期结果**:
```json
{
  "title": "复盘：如何从经验中学习",
  "description": "系统化的复盘方法，帮助个人和团队从每次经历中提取智慧和经验",
  "url": "https://zhuanlan.zhihu.com/p/50312983",  // 知乎链接
  "image": "https://via.placeholder.com/..."
}
```

#### 验证链接类型
```bash
curl "https://review-system.pages.dev/api/resources/articles?lang=zh" | jq '.articles[].url' | grep -E "zhihu|jianshu|36kr"
```

**应该只看到**:
- zhuanlan.zhihu.com (知乎)
- jianshu.com (简书)
- 36kr.com (36氪)

**不应该看到**:
- wenku.baidu.com (百度文库) ❌

### 方法 3: 开发者工具检查

#### 步骤 1: 打开开发者工具
- Chrome/Edge: 按 F12
- Firefox: 按 F12
- Safari: Cmd+Option+I

#### 步骤 2: 切换到 Network 标签
- 刷新页面
- 查找 `/api/resources/articles` 请求

#### 步骤 3: 查看响应
- 点击该请求
- 查看 Response 标签
- 验证返回的文章 URL 都是知乎/简书/36氪

## ❓ 常见问题

### Q1: 看不到"学习资源"板块
**可能原因**:
- 页面没有滚动到底部
- JavaScript 加载失败
- 浏览器缓存问题

**解决方案**:
```
1. 强制刷新页面 (Ctrl+Shift+R 或 Cmd+Shift+R)
2. 清除浏览器缓存
3. 检查浏览器控制台是否有错误
```

### Q2: 文章列表是空的
**可能原因**:
- API 调用失败
- 网络问题

**解决方案**:
```
1. 打开开发者工具查看 Console 标签
2. 查看是否有 API 错误
3. 手动测试 API: curl "https://review-system.pages.dev/api/resources/articles?lang=zh"
```

### Q3: 点击文章链接是空白页
**修复前的情况**:
- 百度文库链接 → 404 空白页 ❌

**修复后的情况**:
- 知乎链接 → 正常显示知乎文章 ✅
- 简书链接 → 正常显示简书文章 ✅
- 36氪链接 → 正常显示36氪文章 ✅

**注意**: 部分网站可能需要登录才能查看完整内容，这是正常的，不是 404 错误。

### Q4: 还是看到百度文库链接
**可能原因**:
- 浏览器缓存了旧的 API 响应

**解决方案**:
```
1. 硬刷新页面 (Ctrl+F5)
2. 清除浏览器缓存
3. 使用无痕/隐私模式打开
4. 等待 Cloudflare CDN 缓存更新（最多 5 分钟）
```

## 📊 对比测试

### 修复前（V5.6.1）
```
文章链接示例:
❌ https://wenku.baidu.com/view/12345678.html (404)
❌ https://wenku.baidu.com/view/23456789.html (404)
❌ https://wenku.baidu.com/view/34567890.html (404)

结果: 点击后全是空白页
```

### 修复后（V5.6.2）
```
文章链接示例:
✅ https://zhuanlan.zhihu.com/p/50312983 (知乎，可访问)
✅ https://www.jianshu.com/p/4f8a4e6c9b2d (简书，可访问)
✅ https://36kr.com/p/1721699989121 (36氪，可访问)

结果: 点击后可以正常阅读文章内容
```

## 🎯 验证清单

在浏览器中完成以下验证:

- [ ] 访问 https://review-system.pages.dev
- [ ] 切换到中文界面
- [ ] 找到"学习资源"板块
- [ ] 看到 6 篇文章列表
- [ ] 点击第一篇文章
- [ ] 确认链接是知乎/简书/36氪（不是百度文库）
- [ ] 确认可以正常显示文章内容（不是 404）
- [ ] 点击"更新文章"按钮
- [ ] 确认文章列表刷新，显示不同的文章
- [ ] 随机点击 2-3 篇文章验证都可访问

## 📞 如果还有问题

如果完成上述验证后仍然有问题，请提供以下信息：

1. **浏览器类型和版本**
   - Chrome 120? Firefox 120? Safari 17?

2. **具体现象**
   - 看不到板块？
   - 看不到文章列表？
   - 点击后空白？
   - 点击后显示什么内容？

3. **浏览器控制台错误**
   - 按 F12 打开控制台
   - 截图或复制 Console 中的错误信息

4. **Network 请求信息**
   - 打开 Network 标签
   - 查看 `/api/resources/articles` 的响应
   - 截图或复制响应内容

---

**部署版本**: V5.6.2  
**部署时间**: 2025-10-16  
**部署状态**: ✅ 成功
