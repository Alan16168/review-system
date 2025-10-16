# 快速配置指南

## ✅ 已获取
- **GOOGLE_API_KEY**: `AIzaSyBiRZv3WyH9xkK9hW4sy5dxJdhu5NeBUMs`

## ⏳ 还需要获取
- **GOOGLE_SEARCH_ENGINE_ID**: 需要创建自定义搜索引擎

---

## 🔧 下一步：创建自定义搜索引擎

### 步骤 1: 访问自定义搜索引擎控制台
打开浏览器，访问：
**https://programmablesearchengine.google.com/**

### 步骤 2: 创建新的搜索引擎
1. 点击 **"添加"** 或 **"Get Started"** 或 **"新建搜索引擎"**

2. 填写表单：
   - **要搜索的网站**：输入 `wenku.baidu.com`
   - **搜索引擎名称**：输入 `Review System Baidu Wenku`
   - **语言**：选择 `中文（简体）`

3. 点击 **"创建"**

### 步骤 3: 配置搜索设置（重要！）
创建成功后：

1. 点击 **"控制面板"** 或 **"自定义"**

2. 在左侧菜单找到 **"基本信息"** 或 **"设置"**

3. 找到 **"搜索引擎 ID"** 或 **"Search engine ID"**
   - 这是一串字符，类似：`a1b2c3d4e5f6g7h8i`
   - **复制这个 ID** ✅

4. **重要设置**：找到 **"要搜索的网站"** 或 **"Sites to search"**
   - 确保 `wenku.baidu.com` 已添加
   - 找到 **"搜索整个网络"** 或 **"Search the entire web"** 选项
   - **开启这个选项** ✅（这样可以搜索百度文库的所有页面）

5. 点击 **"更新"** 保存设置

### 步骤 4: 复制搜索引擎 ID
把你获取的搜索引擎 ID 复制并告诉我，格式类似：
```
GOOGLE_SEARCH_ENGINE_ID: a1b2c3d4e5f6g7h8i
```

---

## 📸 参考截图说明

### 创建页面示例：
```
搜索引擎名称: Review System Baidu Wenku
要搜索的网站: wenku.baidu.com
语言: 中文（简体）
```

### 设置页面示例：
```
基本信息：
  搜索引擎 ID: [复制这里的 ID]
  
要搜索的网站：
  ✅ wenku.baidu.com
  ✅ 搜索整个网络（重要！）
```

---

## 🎯 完成后告诉我

获取到 `GOOGLE_SEARCH_ENGINE_ID` 后，告诉我这个 ID，我会：
1. ✅ 配置到 Cloudflare Pages
2. ✅ 重新部署应用
3. ✅ 验证真实的百度文库链接

---

**当前进度**: ▓▓▓▓▓▓▓░░░ 70% 完成

接下来只需要：
1. 获取搜索引擎 ID（5 分钟）
2. 我帮你配置和部署（2 分钟）
3. 测试验证（1 分钟）

**总共还需要约 8 分钟！** 🚀
