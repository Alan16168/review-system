# 用户设置功能测试指南
# User Settings Feature Testing Guide

**版本**: V4.2.8  
**日期**: 2025-10-15  
**开发环境**: https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev

## 📋 功能概述 / Feature Overview

### 中文描述
本次更新实现了两个核心用户需求：

1. **语言偏好持久化**：
   - 系统默认显示英文版
   - 用户在使用过程中选择"中文"后，系统会记住这个偏好
   - 下次登录时，系统自动设置为中文版

2. **用户设置页面**：
   - 点击主菜单的"用户名"进入设置页面
   - 可设置的项目：
     - 用户名（可编辑）
     - 用户邮箱（可编辑）
     - 语言习惯：中文/English（可编辑）
     - 密码重设功能

### English Description
This update implements two core user requirements:

1. **Language Preference Persistence**:
   - System defaults to English
   - When user selects "Chinese" during usage, system remembers this preference
   - On next login, system automatically sets to Chinese

2. **User Settings Page**:
   - Click username in navigation bar to enter settings
   - Configurable items:
     - Username (editable)
     - Email address (editable)
     - Language preference: 中文/English (editable)
     - Password reset functionality

## 🧪 测试场景 / Test Scenarios

### 场景 1: 语言偏好持久化测试 / Scenario 1: Language Preference Persistence

#### 测试步骤 / Test Steps:

1. **首次访问（英文默认） / First Visit (English Default)**
   ```
   访问: https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev
   期望: 页面显示英文界面
   ```

2. **注册新用户 / Register New User**
   ```
   点击 "Register" 按钮
   填写信息:
   - Email: testuser@example.com
   - Password: test123456
   - Username: Test User
   - Confirm Password: test123456
   点击 "Register" 提交
   期望: 成功注册并登录到Dashboard（英文界面）
   ```

3. **手动切换到中文 / Switch to Chinese**
   ```
   点击右上角的语言切换按钮 (EN → 中文)
   期望: 页面刷新，显示中文界面
   ```

4. **退出登录 / Logout**
   ```
   点击右上角的 "退出" 按钮
   期望: 返回到登录页面
   ```

5. **重新登录验证语言偏好 / Re-login to Verify Preference**
   ```
   使用刚才的账号登录:
   - Email: testuser@example.com
   - Password: test123456
   期望: 登录后自动显示中文界面（记住了用户偏好）
   ```

6. **Google OAuth登录测试（如果配置了） / Google OAuth Test (if configured)**
   ```
   使用Google账号登录
   切换到中文
   退出后重新用Google登录
   期望: 自动显示中文界面
   ```

### 场景 2: 用户设置页面测试 / Scenario 2: User Settings Page

#### 测试步骤 / Test Steps:

1. **进入设置页面 / Enter Settings Page**
   ```
   登录到系统
   点击导航栏右上角的用户名（例如："Test User"）
   期望: 进入用户设置页面，显示当前设置信息
   ```

2. **验证当前设置显示 / Verify Current Settings Display**
   ```
   检查以下内容是否正确显示:
   - 用户名: Test User
   - 邮箱: testuser@example.com
   - 语言偏好: 中文 (或 English，取决于当前设置)
   ```

3. **修改用户名 / Modify Username**
   ```
   将用户名改为: "测试用户"
   点击 "保存修改" 按钮
   期望: 
   - 显示成功提示 "设置已更新"
   - 页面刷新，用户名更新为 "测试用户"
   - 导航栏也显示新用户名
   ```

4. **修改邮箱地址 / Modify Email**
   ```
   将邮箱改为: newemail@example.com
   点击 "保存修改" 按钮
   期望: 
   - 显示成功提示
   - 邮箱更新成功
   注意: 如果邮箱已被其他用户使用，会显示错误提示
   ```

5. **修改语言偏好 / Modify Language Preference**
   ```
   将语言偏好从 "中文" 改为 "English"
   点击 "保存修改" 按钮
   期望: 
   - 显示成功提示
   - 页面自动刷新并切换到英文界面
   - 下次登录会记住English偏好
   ```

6. **修改密码 / Change Password**
   ```
   在密码管理区域填写:
   - 当前密码: test123456
   - 新密码: newpassword123
   - 确认新密码: newpassword123
   点击 "修改密码" 按钮
   期望: 
   - 显示 "密码修改成功"
   - 密码字段被清空
   ```

7. **验证密码修改 / Verify Password Change**
   ```
   退出登录
   使用新密码登录: newpassword123
   期望: 成功登录
   ```

8. **错误处理测试 / Error Handling Tests**
   ```
   a) 密码不匹配:
      - 新密码: abc123
      - 确认密码: abc456
      期望: 显示 "两次输入的密码不一致"
   
   b) 密码太短:
      - 新密码: 12345
      期望: 显示 "密码长度至少为6个字符"
   
   c) 当前密码错误:
      - 当前密码: wrongpassword
      期望: 显示错误提示
   
   d) 邮箱已被使用:
      - 尝试修改为已存在的邮箱 (如 admin@review.com)
      期望: 显示 "Email already in use"
   ```

### 场景 3: 跨登录方式的语言偏好一致性 / Scenario 3: Language Consistency Across Login Methods

#### 测试步骤 / Test Steps:

1. **邮箱登录设置语言 / Email Login Language Setting**
   ```
   使用邮箱登录: user@review.com / user123
   切换到中文
   退出登录
   ```

2. **重新邮箱登录验证 / Re-login via Email**
   ```
   再次使用邮箱登录
   期望: 自动显示中文
   ```

3. **Google登录验证（如果同一邮箱） / Google Login Verification (if same email)**
   ```
   如果Google账号和邮箱账号使用同一邮箱
   用Google登录
   期望: 自动显示中文（共享同一语言偏好）
   ```

## 🔍 测试检查点 / Testing Checkpoints

### ✅ 语言偏好功能 / Language Preference Features

- [ ] 系统默认英文界面
- [ ] 手动切换语言后自动保存到服务器
- [ ] 登录后自动应用用户的语言偏好
- [ ] 邮箱登录应用语言偏好
- [ ] 注册后应用语言偏好
- [ ] Google OAuth登录应用语言偏好
- [ ] 在设置页面修改语言后页面自动切换
- [ ] 退出登录后重新登录，语言偏好保持

### ✅ 用户设置页面 / User Settings Page

- [ ] 点击用户名进入设置页面
- [ ] 正确显示当前用户名、邮箱、语言偏好
- [ ] 可以成功修改用户名
- [ ] 可以成功修改邮箱
- [ ] 可以成功修改语言偏好
- [ ] 修改语言后页面自动切换语言
- [ ] 可以成功修改密码
- [ ] 修改密码后新密码生效
- [ ] 密码字段验证正常（长度、匹配）
- [ ] 邮箱唯一性验证正常
- [ ] 当前密码验证正常
- [ ] 保存后导航栏用户名实时更新
- [ ] 错误提示正确显示（中英文）
- [ ] 成功提示正确显示（中英文）

### ✅ API接口测试 / API Testing

#### GET /api/auth/settings
```bash
# 测试获取设置
curl -X GET https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev/api/auth/settings \
  -H "Authorization: Bearer YOUR_TOKEN"

# 期望响应:
{
  "username": "Test User",
  "email": "testuser@example.com",
  "language": "zh"
}
```

#### PUT /api/auth/settings
```bash
# 测试更新设置
curl -X PUT https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev/api/auth/settings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "New Username",
    "email": "newemail@example.com",
    "language": "en"
  }'

# 期望响应:
{
  "message": "Settings updated successfully",
  "user": {
    "id": 1,
    "username": "New Username",
    "email": "newemail@example.com",
    "language": "en",
    "role": "user"
  }
}
```

## 🐛 已知问题 / Known Issues

目前没有已知问题。如果发现任何问题，请记录：
- 问题描述
- 复现步骤
- 期望行为
- 实际行为
- 浏览器和版本

No known issues at this time. If you find any issues, please record:
- Issue description
- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser and version

## 📝 测试账号 / Test Accounts

| 角色 / Role | 邮箱 / Email | 密码 / Password | 用途 / Purpose |
|------------|-------------|----------------|---------------|
| 管理员 / Admin | admin@review.com | admin123 | 全功能测试 / Full features |
| 高级用户 / Premium | premium@review.com | premium123 | 团队功能测试 / Team features |
| 普通用户 / User | user@review.com | user123 | 基础功能测试 / Basic features |

## 🎯 测试建议 / Testing Recommendations

1. **按顺序测试 / Test in Order**
   - 先测试场景1（语言偏好）
   - 再测试场景2（用户设置）
   - 最后测试场景3（跨登录方式）

2. **使用多个浏览器 / Use Multiple Browsers**
   - Chrome
   - Firefox
   - Safari
   - Edge

3. **清除缓存测试 / Clear Cache Testing**
   - 测试前清除浏览器缓存和localStorage
   - 确保测试的是服务器保存的偏好，而非本地缓存

4. **移动端测试 / Mobile Testing**
   - 测试移动设备上的响应式布局
   - 确保设置页面在小屏幕上正常显示

## 📊 测试报告模板 / Test Report Template

```markdown
### 测试日期 / Test Date: 2025-10-15

#### 测试环境 / Test Environment:
- URL: https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev
- Browser: Chrome 119
- OS: macOS

#### 测试结果 / Test Results:

| 功能 / Feature | 状态 / Status | 备注 / Notes |
|--------------|--------------|-------------|
| 语言偏好持久化 | ✅ 通过 / Pass | |
| 用户设置页面 | ✅ 通过 / Pass | |
| 修改用户名 | ✅ 通过 / Pass | |
| 修改邮箱 | ✅ 通过 / Pass | |
| 修改语言 | ✅ 通过 / Pass | |
| 修改密码 | ✅ 通过 / Pass | |

#### 发现的问题 / Issues Found:
无 / None

#### 建议 / Recommendations:
无 / None
```

## 🚀 下一步 / Next Steps

测试完成后，如果功能正常：
1. 部署到生产环境（Cloudflare Pages）
2. 更新生产环境数据库
3. 通知用户新功能已上线

After testing, if features work correctly:
1. Deploy to production (Cloudflare Pages)
2. Update production database
3. Notify users about new features

---

**测试联系人 / Testing Contact**: Claude AI Assistant  
**版本 / Version**: V4.2.8  
**创建日期 / Created**: 2025-10-15
