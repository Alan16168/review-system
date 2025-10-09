# 🌐 自定义域名绑定指南

**项目**: Review System  
**当前 URL**: https://review-system.pages.dev  
**更新日期**: 2025-10-09

---

## 📋 准备工作

### 您需要准备的信息

1. **您的域名** (例如: myreview.com)
2. **域名注册商** (例如: 阿里云、GoDaddy、Namecheap)
3. **域名配置方式**:
   - 选项 A: 根域名 (example.com)
   - 选项 B: 子域名 (www.example.com)
   - 选项 C: 两者都要

---

## 🚀 绑定步骤

### 方法 1: 使用 Wrangler CLI (推荐)

#### **绑定根域名** (example.com)
```bash
cd /home/user/webapp
export CLOUDFLARE_API_TOKEN="E_R_l4LN5Lb7Yt5PzaKdZdjOUvlxyoFrlfLpSkMs"
npx wrangler pages domain add example.com --project-name review-system
```

#### **绑定子域名** (www.example.com)
```bash
npx wrangler pages domain add www.example.com --project-name review-system
```

#### **绑定多个域名**
```bash
# 绑定根域名
npx wrangler pages domain add example.com --project-name review-system

# 绑定 www 子域名
npx wrangler pages domain add www.example.com --project-name review-system

# 绑定其他子域名
npx wrangler pages domain add review.example.com --project-name review-system
```

---

### 方法 2: 使用 Cloudflare Dashboard

#### 1. 访问 Pages 项目设置
```
https://dash.cloudflare.com/pages/view/review-system/settings/domains
```

#### 2. 点击 "Add a custom domain"

#### 3. 输入您的域名

#### 4. 选择配置方式
- **如果域名已在 Cloudflare**: 自动配置 DNS
- **如果域名在其他注册商**: 显示 DNS 记录配置说明

---

## 🔧 DNS 配置详解

### 场景 1: 域名已托管在 Cloudflare

✅ **最简单！自动配置！**

1. 访问: https://dash.cloudflare.com/
2. 选择您的域名
3. 在 Pages 中添加自定义域名
4. Cloudflare 自动添加所需的 DNS 记录
5. 等待 SSL 证书生成 (通常 1-5 分钟)
6. ✅ 完成！

---

### 场景 2: 域名在其他注册商 (阿里云、GoDaddy 等)

#### **选项 A: 迁移 DNS 到 Cloudflare (推荐)**

✅ **优点**:
- 自动配置
- 免费 SSL
- CDN 加速
- DDoS 防护
- 更简单的管理

**步骤**:

1. **在 Cloudflare 添加网站**
   ```
   https://dash.cloudflare.com/
   点击 "Add a site"
   输入您的域名
   选择 Free 计划
   ```

2. **Cloudflare 会显示两个 Nameserver**
   ```
   例如:
   alex.ns.cloudflare.com
   lucy.ns.cloudflare.com
   ```

3. **在域名注册商修改 Nameserver**
   
   **阿里云示例**:
   ```
   1. 登录阿里云控制台
   2. 进入 "域名管理"
   3. 找到您的域名，点击 "管理"
   4. 点击 "DNS 修改"
   5. 选择 "修改 DNS 服务器"
   6. 输入 Cloudflare 提供的两个 Nameserver
   7. 保存更改
   ```

4. **等待 DNS 传播** (通常 5 分钟 - 24 小时)

5. **在 Cloudflare Pages 添加自定义域名**
   ```bash
   npx wrangler pages domain add example.com --project-name review-system
   ```

6. ✅ **完成！自动配置 SSL 和 CDN**

---

#### **选项 B: 保持在原注册商，手动配置 DNS**

⚠️ **需要手动配置 DNS 记录**

**根域名配置** (example.com):

在您的 DNS 管理面板添加以下记录:

```
类型: A
名称: @
值: 复制 Cloudflare 提供的 IP 地址
TTL: 自动 或 3600

类型: AAAA (IPv6)
名称: @
值: 复制 Cloudflare 提供的 IPv6 地址
TTL: 自动 或 3600
```

**子域名配置** (www.example.com):

```
类型: CNAME
名称: www
值: review-system.pages.dev
TTL: 自动 或 3600
```

**注意**: Cloudflare 会在添加域名时提供具体的 IP 地址。

---

## 📱 不同注册商的 DNS 配置位置

### **阿里云 (万网)**
```
1. 登录: https://dc.console.aliyun.com/
2. 域名管理 → 选择域名 → 解析设置
3. 添加记录
```

### **腾讯云**
```
1. 登录: https://console.cloud.tencent.com/domain
2. 我的域名 → 解析
3. 添加记录
```

### **GoDaddy**
```
1. 登录: https://dcc.godaddy.com/
2. My Products → Domains → DNS
3. Add Record
```

### **Namecheap**
```
1. 登录: https://ap.www.namecheap.com/
2. Domain List → Manage → Advanced DNS
3. Add New Record
```

### **Google Domains**
```
1. 登录: https://domains.google.com/
2. My domains → DNS
3. Custom records
```

---

## ✅ 验证域名配置

### 1. 检查 DNS 传播
```bash
# 检查 A 记录
dig example.com

# 检查 CNAME 记录
dig www.example.com

# 或使用在线工具
https://dnschecker.org/
```

### 2. 检查 SSL 证书状态
```bash
# 访问 Cloudflare Dashboard
https://dash.cloudflare.com/pages/view/review-system/settings/domains

# 状态应该显示:
✅ Active - SSL 证书已生成
```

### 3. 测试访问
```bash
# 根域名
curl -I https://example.com

# 子域名
curl -I https://www.example.com

# 应该返回 200 OK
```

---

## 🔒 SSL 证书配置

### 自动 SSL (推荐)

Cloudflare 会自动为您的自定义域名生成免费的 SSL 证书：

- ✅ 自动续期
- ✅ 支持通配符
- ✅ 支持多个子域名
- ✅ Let's Encrypt 或 Cloudflare 证书

**等待时间**: 通常 1-5 分钟，最多 24 小时

### 检查 SSL 状态

在 Cloudflare Dashboard 中查看:
```
https://dash.cloudflare.com/pages/view/review-system/settings/domains
```

状态应该显示:
- 🟢 **Active**: SSL 证书已生成且有效
- 🟡 **Pending**: 正在生成证书
- 🔴 **Error**: 配置错误

---

## 🎯 完整配置示例

### 示例域名: myreview.com

#### **1. 绑定域名**
```bash
cd /home/user/webapp
export CLOUDFLARE_API_TOKEN="E_R_l4LN5Lb7Yt5PzaKdZdjOUvlxyoFrlfLpSkMs"

# 绑定根域名
npx wrangler pages domain add myreview.com --project-name review-system

# 绑定 www 子域名
npx wrangler pages domain add www.myreview.com --project-name review-system
```

#### **2. 配置 DNS**

如果域名在阿里云:
```
类型: CNAME
名称: www
值: review-system.pages.dev
TTL: 600

类型: A
名称: @
值: (Cloudflare 提供的 IP)
TTL: 600
```

#### **3. 等待 DNS 传播**
```bash
# 检查 DNS
dig www.myreview.com
dig myreview.com

# 通常 5-30 分钟生效
```

#### **4. 验证访问**
```
https://myreview.com
https://www.myreview.com
```

#### **5. 更新 Google OAuth**

在 Google Cloud Console 添加新域名:
```
Authorized JavaScript origins:
https://myreview.com
https://www.myreview.com

Authorized redirect URIs:
https://myreview.com/
https://www.myreview.com/
```

---

## 🔄 域名重定向配置

### 自动重定向 www → 根域名

在 Cloudflare Pages 中自动配置:

```
www.example.com → 自动重定向到 → example.com
```

### 自定义重定向规则

如果需要其他重定向规则，可以在 Cloudflare Dashboard 配置:

```
https://dash.cloudflare.com/pages/view/review-system/settings/redirects
```

---

## 📊 域名管理

### 查看已绑定的域名
```bash
# 使用 Wrangler CLI
npx wrangler pages domain list --project-name review-system

# 或访问 Dashboard
https://dash.cloudflare.com/pages/view/review-system/settings/domains
```

### 删除域名
```bash
npx wrangler pages domain remove example.com --project-name review-system
```

### 更新域名配置
```bash
# 删除旧域名
npx wrangler pages domain remove old-domain.com --project-name review-system

# 添加新域名
npx wrangler pages domain add new-domain.com --project-name review-system
```

---

## 🐛 常见问题

### Q1: DNS 配置后无法访问

**检查项**:
1. DNS 是否已传播 (使用 dnschecker.org)
2. DNS 记录类型是否正确 (A/CNAME)
3. DNS 记录值是否正确
4. 是否等待足够时间 (5-30 分钟)

**解决方法**:
```bash
# 清除本地 DNS 缓存
# macOS
sudo dscacheutil -flushcache

# Windows
ipconfig /flushdns

# Linux
sudo systemd-resolve --flush-caches
```

---

### Q2: SSL 证书错误

**可能原因**:
- DNS 记录配置错误
- 域名验证未通过
- 证书生成中

**解决方法**:
1. 检查 DNS 配置
2. 等待 24 小时
3. 联系 Cloudflare 支持

---

### Q3: "ERR_TOO_MANY_REDIRECTS" 错误

**原因**: 重定向循环

**解决方法**:
1. 检查 SSL/TLS 加密模式
2. 在 Cloudflare 设置中改为 "Full" 或 "Full (strict)"
3. 清除浏览器缓存

---

### Q4: 多个域名如何选择主域名？

**建议**:
- 主域名: example.com (根域名)
- 其他域名自动重定向到主域名

**配置**:
在 Cloudflare Dashboard 设置重定向规则

---

## 📞 获取帮助

### Cloudflare 文档
- 自定义域名: https://developers.cloudflare.com/pages/how-to/custom-domain/
- DNS 设置: https://developers.cloudflare.com/dns/
- SSL 证书: https://developers.cloudflare.com/ssl/

### Cloudflare 支持
- 社区论坛: https://community.cloudflare.com/
- 支持中心: https://support.cloudflare.com/

---

## ✅ 配置完成检查清单

配置自定义域名后，请验证:

- [ ] 域名可以正常访问 (https://yourdomain.com)
- [ ] SSL 证书有效 (浏览器显示锁图标)
- [ ] www 和根域名都能访问
- [ ] 所有页面正常加载
- [ ] Google OAuth 已更新授权域名
- [ ] 邮箱登录功能正常
- [ ] Google 登录功能正常
- [ ] API 接口正常工作
- [ ] 静态资源正常加载

---

## 🎊 完成后的访问地址

配置完成后，您的应用将通过以下地址访问:

- ✅ **自定义域名**: https://yourdomain.com
- ✅ **备用域名**: https://review-system.pages.dev (仍然可用)

**推荐**: 使用自定义域名作为主要访问地址，Cloudflare 提供的域名作为备份。

---

**准备好后，请告诉我您的域名信息，我将协助您完成绑定！** 🚀
