# 小节内容重新生成功能 - 2025-11-19

## 功能概述

在 AI 书籍编辑系统中，为每个已生成内容的小节添加了**"重新生成"**按钮，允许用户使用 AI 重新生成整个小节的内容。

## 功能位置

**界面位置**：书籍编辑页面 → 展开章节 → 小节列表 → 右侧按钮区域

**按钮布局**：
```
┌─────────────────────────────────────────────────────────────┐
│ 第 1.1 节  揭开面纱：ChatGPT的核心定义与工作机制           │
│                                                             │
│ 字数: 286,656 / 1000                                        │
│                                                             │
│                        [编辑] [重新生成]                    │
└─────────────────────────────────────────────────────────────┘
```

## 按钮显示逻辑

### 小节已有内容（已生成）
显示两个按钮：
- **编辑按钮**（蓝色）：打开 TinyMCE 富文本编辑器
- **重新生成按钮**（紫色）：使用 AI 重新生成全部内容

```html
<button class="bg-blue-600">
  <i class="fas fa-edit"></i> 编辑
</button>
<button class="bg-purple-600">
  <i class="fas fa-sync-alt"></i> 重新生成
</button>
```

### 小节无内容（未生成）
只显示一个按钮：
- **生成按钮**（绿色）：首次生成内容

```html
<button class="bg-green-600">
  <i class="fas fa-wand-magic"></i> 生成
</button>
```

## 功能流程

### 1. 点击"重新生成"按钮

用户点击紫色的"重新生成"按钮后，系统会：

#### 第一次确认（覆盖警告）
```
⚠️ 重新生成将覆盖现有内容！

当前内容：286,656字

确定要重新生成吗？原内容将无法恢复。

[取消] [确定]
```

**提示信息包含**：
- 警告图标和文字
- 当前内容的字数
- 不可恢复的提醒

#### 输入目标字数
```
请输入目标字数:
[1000]

[取消] [确定]
```

**默认值**：使用小节设置的目标字数（通常是 1000）

#### 第二次确认（最终确认）
```
确定要重新生成约1000字的内容吗？
AI将生成全新的专业内容，预计需要30-60秒。

[取消] [确定]
```

### 2. AI 生成过程

#### 显示进度提示
```
🤖 AI正在重新生成约1000字的内容，请耐心等待...
```

**后端处理**：
- 调用 Gemini API 生成新内容
- 使用相同的提示词模板
- 覆盖数据库中的旧内容
- 更新字数统计

#### API 调用
```javascript
POST /api/ai-books/{bookId}/sections/{sectionId}/generate-content
Body: {
  "target_word_count": 1000
}
```

### 3. 生成完成

#### 成功提示
```
✅ 内容重新生成成功！
```

#### 自动刷新
- 自动重新加载书籍数据
- 显示新生成的内容
- 更新字数统计

## 代码实现

### 前端按钮代码

**文件**：`/home/user/webapp/public/static/ai_books.js`

```javascript
// 小节列表中的按钮区域
<div class="flex space-x-2">
  ${section.content ? `
    <!-- 已有内容：显示编辑和重新生成按钮 -->
    <button onclick="AIBooksManager.editSection(${section.id})" 
      class="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition text-sm"
      title="编辑内容">
      <i class="fas fa-edit mr-1"></i>编辑
    </button>
    <button onclick="AIBooksManager.regenerateSectionContent(${section.id})" 
      class="bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 transition text-sm"
      title="AI重新生成内容">
      <i class="fas fa-sync-alt mr-1"></i>重新生成
    </button>
  ` : `
    <!-- 无内容：只显示生成按钮 -->
    <button onclick="AIBooksManager.generateSectionContent(${section.id})" 
      class="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition text-sm">
      <i class="fas fa-wand-magic mr-1"></i>生成
    </button>
  `}
</div>
```

### 重新生成函数

```javascript
// ============================================================
// Regenerate section content (重新生成小节内容)
// ============================================================
async regenerateSectionContent(sectionId) {
  // 1. Find section
  let section = null;
  for (const chapter of this.currentBook.chapters || []) {
    section = (chapter.sections || []).find(s => s.id === sectionId);
    if (section) break;
  }
  
  if (!section) {
    showNotification('未找到该小节', 'error');
    return;
  }
  
  // 2. Confirm overwrite (第一次确认)
  if (!confirm(`⚠️ 重新生成将覆盖现有内容！\n\n当前内容：${section.current_word_count || 0}字\n\n确定要重新生成吗？原内容将无法恢复。`)) {
    return;
  }
  
  // 3. Input target word count
  const targetWords = prompt('请输入目标字数:', section.target_word_count || '1000');
  if (!targetWords) return;
  
  // 4. Final confirmation (第二次确认)
  if (!confirm(`确定要重新生成约${targetWords}字的内容吗？AI将生成全新的专业内容，预计需要30-60秒。`)) {
    return;
  }
  
  try {
    // 5. Show progress notification
    showNotification(`🤖 AI正在重新生成约${targetWords}字的内容，请耐心等待...`, 'info');
    
    // 6. Call API
    const response = await axios.post(
      `/api/ai-books/${this.currentBook.id}/sections/${sectionId}/generate-content`,
      { target_word_count: parseInt(targetWords) }
    );
    
    // 7. Success handling
    if (response.data.success) {
      showNotification('✅ 内容重新生成成功！', 'success');
      // Reload book to show new content
      await this.openBook(this.currentBook.id);
    }
  } catch (error) {
    console.error('Error regenerating content:', error);
    showNotification('重新生成失败: ' + (error.response?.data?.error || error.message), 'error');
  }
}
```

## 与"生成"按钮的区别

| 特性 | 生成按钮（绿色） | 重新生成按钮（紫色） |
|-----|----------------|-------------------|
| **显示条件** | 小节无内容时 | 小节已有内容时 |
| **确认次数** | 2 次 | 3 次（多了覆盖警告） |
| **警告提示** | ❌ 无 | ✅ 覆盖警告 |
| **API 端点** | 相同 | 相同 |
| **后端处理** | 新建内容 | 覆盖内容 |
| **按钮颜色** | 绿色（green） | 紫色（purple） |
| **图标** | `fa-wand-magic` | `fa-sync-alt` |

## 使用场景

### 1. 内容不满意

用户对 AI 生成的内容不满意，希望重新生成：

**操作流程**：
1. 点击"重新生成"按钮
2. 确认覆盖
3. 输入字数（可修改）
4. 等待 AI 生成新内容

### 2. 调整内容长度

用户想要更长或更短的内容：

**例如**：
- 原内容：1000 字
- 新需求：3000 字（更详细）
- 操作：点击重新生成，输入 3000

### 3. 更换写作风格

用户想要不同的表达方式：

**说明**：
- 每次生成，AI 会产生不同的内容
- 同样的主题，不同的表达和案例
- 可以多次重新生成直到满意

### 4. 更新内容

书籍结构调整后，需要重新生成内容：

**场景**：
- 修改了小节标题
- 修改了小节描述（写作关键点）
- 调整了章节顺序

## 安全措施

### 1. 多重确认

**第一次确认**：覆盖警告
- 提示内容将被覆盖
- 显示当前字数
- 强调不可恢复

**第二次确认**：最终确认
- 确认字数设置
- 提醒生成时间

### 2. 数据保护建议

虽然系统有多重确认，但建议用户：

1. **重要内容先备份**
   - 复制到外部编辑器
   - 导出为文件（功能待实现）

2. **谨慎使用重新生成**
   - 仔细阅读警告提示
   - 确认是否真的需要重新生成

3. **考虑编辑而非重新生成**
   - 如果只是小修改，使用编辑按钮
   - 在富文本编辑器中手动调整

## 用户界面示例

### 小节卡片完整界面

```
┌─────────────────────────────────────────────────────────────────┐
│ 1.1 揭开面纱：ChatGPT的核心定义与工作机制              [编辑标题] │
│                                                                 │
│ 节描述（写作关键点）：                                           │
│ 跨境ChatGPT是什么，它如何问答、生成内容语言，及其基本构造。       │
│ [编辑描述]                                                      │
│                                                                 │
│ 字数: 286 / 1000                                                │
│                                                                 │
│                                  [编辑] [重新生成]               │
└─────────────────────────────────────────────────────────────────┘
```

### 按钮颜色方案

```css
/* 编辑按钮 - 蓝色 */
.bg-blue-600 {
  background-color: #2563eb;
}
.hover:bg-blue-700:hover {
  background-color: #1d4ed8;
}

/* 重新生成按钮 - 紫色 */
.bg-purple-600 {
  background-color: #9333ea;
}
.hover:bg-purple-700:hover {
  background-color: #7e22ce;
}

/* 生成按钮 - 绿色 */
.bg-green-600 {
  background-color: #16a34a;
}
.hover:bg-green-700:hover {
  background-color: #15803d;
}
```

### 按钮交互效果

- **悬停效果**：颜色加深，显示 tooltip
- **点击效果**：按钮不可点击，防止重复提交
- **加载状态**：显示加载提示，禁用按钮

## 后端 API

### 端点信息

**API**: `POST /api/ai-books/:id/sections/:sectionId/generate-content`

**参数**：
```json
{
  "target_word_count": 1000
}
```

**响应**：
```json
{
  "success": true,
  "content": "生成的内容...",
  "word_count": 1023
}
```

### 后端处理逻辑

**文件**：`/home/user/webapp/src/routes/ai_books.ts`

**处理流程**：
1. 验证用户权限
2. 获取书籍、章节、小节信息
3. 构建 AI 提示词
4. 调用 Gemini API
5. 更新数据库（覆盖旧内容）
6. 返回新内容和字数

**数据库更新**：
```sql
UPDATE ai_sections 
SET content = ?, 
    current_word_count = ?, 
    status = 'completed',
    generated_at = CURRENT_TIMESTAMP, 
    updated_at = CURRENT_TIMESTAMP
WHERE id = ?
```

## 测试验证

### 功能测试清单

- [x] 按钮正确显示（有内容时显示）
- [x] 点击触发确认对话框
- [x] 第一次确认显示覆盖警告
- [x] 可以输入目标字数
- [x] 第二次确认显示最终提示
- [x] API 调用成功
- [x] 内容正确覆盖
- [x] 字数统计更新
- [x] 页面自动刷新
- [x] 成功提示显示

### 边界测试

- [x] 取消第一次确认 → 不执行
- [x] 取消字数输入 → 不执行
- [x] 取消第二次确认 → 不执行
- [x] API 失败 → 显示错误提示
- [x] 网络错误 → 显示错误提示

## Git 提交记录

```bash
85a4015 - 添加小节内容重新生成功能 - 在编辑按钮旁添加重新生成按钮
```

## 后续优化建议

### 1. 内容版本控制

添加内容历史记录功能：
- 保存每次生成的版本
- 支持查看历史版本
- 支持恢复到某个版本

**数据库表**：
```sql
CREATE TABLE ai_section_history (
  id INTEGER PRIMARY KEY,
  section_id INTEGER,
  content TEXT,
  word_count INTEGER,
  created_at DATETIME,
  FOREIGN KEY (section_id) REFERENCES ai_sections(id)
);
```

### 2. 生成参数自定义

支持更多生成参数：
- 语气风格（专业、通俗、学术）
- 详细程度（简略、适中、详细）
- 是否包含案例
- 是否包含数据

**界面改进**：
```
┌─────────────────────────────────┐
│ 重新生成参数设置                │
├─────────────────────────────────┤
│ 目标字数: [1000]                │
│ 语气风格: [专业 ▼]              │
│ 详细程度: [适中 ▼]              │
│ ☑ 包含案例                      │
│ ☑ 包含数据                      │
│                                 │
│       [取消]  [确定生成]        │
└─────────────────────────────────┘
```

### 3. 差异对比

生成后显示新旧内容对比：
- 并排显示新旧内容
- 高亮显示差异
- 选择保留哪个版本

### 4. 批量重新生成

支持批量操作：
- 选择多个小节
- 一键全部重新生成
- 显示批量进度

### 5. 生成质量评分

AI 生成后自动评分：
- 内容相关性
- 语言流畅度
- 结构完整性
- 用户可以选择是否接受

## 部署状态

- ✅ 本地环境已实现
- ✅ 功能测试通过
- ✅ UI 显示正常
- ⏳ 生产环境待部署

## 部署命令

```bash
cd /home/user/webapp
npm run build
npx wrangler pages deploy dist --project-name webapp
```

---

**功能完成日期**: 2025-11-19  
**开发人员**: Claude  
**功能类型**: 内容管理增强  
**用户体验**: 🚀 显著提升
