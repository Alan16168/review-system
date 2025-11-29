# 功能需求：列表项字段类型（List Items）

## 📋 需求描述

**用户需求**：
> 用户用不同的行表示不同的条目，系统可以分别对每一行进行操作

**具体场景举例**：
```
问题：本次复盘的待办事项列表
答案：
  ☐ 修复登录页面的 UI 问题
  ☐ 优化数据库查询性能
  ☐ 更新用户文档
  ☑ 完成权限系统重构
```

**操作需求**：
- ✅ 添加新条目
- ✅ 删除某个条目
- ✅ 编辑某个条目
- ✅ 标记条目完成状态（勾选/未勾选）
- ✅ 条目排序/重新排列
- ✅ 每个条目独立保存

---

## 💡 实现方案对比

### 方案1：多行文本 + 前端解析（简单方案）❌

**实现方式**：
- 使用现有的 `multiline_text` 字段
- 用户输入多行，每行一个条目
- 前端用换行符 `\n` 分割成数组
- 前端渲染为列表展示

**示例数据**：
```json
{
  "answer": "修复登录页面的 UI 问题\n优化数据库查询性能\n更新用户文档"
}
```

**优点**：
- ✅ 无需修改数据库
- ✅ 实现简单快速
- ✅ 兼容现有系统

**缺点**：
- ❌ 无法单独操作每一行
- ❌ 无法标记完成状态
- ❌ 无法添加附加属性（优先级、截止日期等）
- ❌ 难以排序和重新排列
- ❌ 不符合需求

**结论**：❌ **不推荐**，无法满足"分别对每一行进行操作"的需求

---

### 方案2：独立子表存储（完整方案）✅ **推荐**

**实现方式**：
- 创建新的数据库表 `review_answer_items`
- 每个条目作为独立的数据库记录
- 支持丰富的属性和操作

**数据库设计**：
```sql
-- 列表项表
CREATE TABLE review_answer_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  answer_id INTEGER NOT NULL,           -- 关联到 review_answers
  item_order INTEGER NOT NULL,          -- 排序顺序
  content TEXT NOT NULL,                -- 条目内容
  is_completed BOOLEAN DEFAULT 0,       -- 完成状态
  priority TEXT DEFAULT 'normal',       -- 优先级：high/normal/low
  due_date DATE DEFAULT NULL,           -- 截止日期（可选）
  assigned_to INTEGER DEFAULT NULL,     -- 负责人（可选）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (answer_id) REFERENCES review_answers(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_answer_items_answer ON review_answer_items(answer_id);
CREATE INDEX idx_answer_items_order ON review_answer_items(answer_id, item_order);
```

**数据示例**：
```json
[
  {
    "id": 1,
    "answer_id": 123,
    "item_order": 1,
    "content": "修复登录页面的 UI 问题",
    "is_completed": false,
    "priority": "high"
  },
  {
    "id": 2,
    "answer_id": 123,
    "item_order": 2,
    "content": "优化数据库查询性能",
    "is_completed": false,
    "priority": "normal"
  },
  {
    "id": 3,
    "answer_id": 123,
    "item_order": 3,
    "content": "完成权限系统重构",
    "is_completed": true,
    "priority": "high"
  }
]
```

**优点**：
- ✅ 每个条目独立操作（增删改查）
- ✅ 支持完成状态标记
- ✅ 支持排序和重新排列
- ✅ 可扩展（优先级、截止日期、负责人）
- ✅ 数据结构清晰
- ✅ 完全符合需求

**缺点**：
- ⚠️ 需要新增数据库表
- ⚠️ 前后端都需要修改
- ⚠️ 开发工作量较大（4-6小时）

**结论**：✅ **强烈推荐**，完全满足需求，扩展性强

---

### 方案3：JSON 字段存储（折中方案）⚡

**实现方式**：
- 使用现有的 `answer` 字段，存储 JSON 数组
- 每个条目是数组中的一个对象
- 前端解析 JSON 并渲染

**数据示例**：
```json
{
  "answer": "[
    {\"id\":1,\"content\":\"修复登录页面的 UI 问题\",\"completed\":false,\"priority\":\"high\"},
    {\"id\":2,\"content\":\"优化数据库查询性能\",\"completed\":false,\"priority\":\"normal\"},
    {\"id\":3,\"content\":\"完成权限系统重构\",\"completed\":true,\"priority\":\"high\"}
  ]"
}
```

**优点**：
- ✅ 无需新增数据库表
- ✅ 支持条目独立操作
- ✅ 支持完成状态和附加属性
- ✅ 开发工作量中等（2-3小时）

**缺点**：
- ⚠️ 无法用 SQL 直接查询条目
- ⚠️ JSON 字符串操作较复杂
- ⚠️ 数据验证需要在应用层
- ⚠️ 性能略低于方案2

**结论**：⚡ **可选方案**，快速实现，但不如方案2优雅

---

## 🎯 推荐方案详细设计

### **方案2：独立子表存储**

#### 1. 数据库设计

**新增表**：`review_answer_items`

**字段说明**：
| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| id | INTEGER | 主键 | 1 |
| answer_id | INTEGER | 关联的答案ID | 123 |
| item_order | INTEGER | 排序顺序 | 1, 2, 3 |
| content | TEXT | 条目内容 | "修复登录问题" |
| is_completed | BOOLEAN | 完成状态 | 0/1 |
| priority | TEXT | 优先级 | high/normal/low |
| due_date | DATE | 截止日期 | 2025-12-01 |
| assigned_to | INTEGER | 负责人 | 用户ID |
| created_at | DATETIME | 创建时间 | 2025-11-29 |
| updated_at | DATETIME | 更新时间 | 2025-11-29 |

#### 2. 新增问题类型：`list_items`

在 `template_questions` 表中新增类型：
```sql
ALTER TABLE template_questions 
MODIFY question_type TEXT CHECK(question_type IN (
  'text', 'multiline_text', 'number', 
  'single_choice', 'multiple_choice', 'dropdown',
  'time_with_text', 'markdown',
  'list_items'  -- 新增类型
));
```

#### 3. 前端 UI 设计

**展示模式**（查看答案）：
```html
<div class="list-items-container">
  <div class="flex items-center justify-between mb-2">
    <h4>待办事项列表</h4>
    <button onclick="addListItem()">+ 添加</button>
  </div>
  
  <ul class="space-y-2">
    <li class="flex items-center space-x-3 p-2 hover:bg-gray-50">
      <input type="checkbox" checked disabled>
      <span class="flex-1 line-through text-gray-500">
        完成权限系统重构
      </span>
      <span class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">高优先级</span>
    </li>
    
    <li class="flex items-center space-x-3 p-2 hover:bg-gray-50">
      <input type="checkbox">
      <span class="flex-1">修复登录页面的 UI 问题</span>
      <span class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">高优先级</span>
      <button class="text-blue-600 hover:text-blue-800">编辑</button>
      <button class="text-red-600 hover:text-red-800">删除</button>
    </li>
    
    <li class="flex items-center space-x-3 p-2 hover:bg-gray-50">
      <input type="checkbox">
      <span class="flex-1">优化数据库查询性能</span>
      <span class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">普通</span>
      <button class="text-blue-600 hover:text-blue-800">编辑</button>
      <button class="text-red-600 hover:text-red-800">删除</button>
    </li>
  </ul>
  
  <div class="mt-2 text-xs text-gray-500">
    进度：1/3 已完成 (33%)
  </div>
</div>
```

**编辑模式**（添加/编辑条目）：
```html
<div class="modal">
  <h3>编辑条目</h3>
  <form>
    <div class="form-group">
      <label>内容</label>
      <input type="text" value="修复登录页面的 UI 问题" />
    </div>
    
    <div class="form-group">
      <label>优先级</label>
      <select>
        <option value="high" selected>高优先级</option>
        <option value="normal">普通</option>
        <option value="low">低优先级</option>
      </select>
    </div>
    
    <div class="form-group">
      <label>截止日期（可选）</label>
      <input type="date" />
    </div>
    
    <div class="form-group">
      <label>负责人（可选）</label>
      <select>
        <option value="">未指定</option>
        <option value="1">张三</option>
        <option value="2">李四</option>
      </select>
    </div>
    
    <div class="flex justify-end space-x-2">
      <button type="button" onclick="closeModal()">取消</button>
      <button type="submit">保存</button>
    </div>
  </form>
</div>
```

#### 4. API 端点设计

**获取列表项**：
```
GET /api/answer-sets/{setId}/answers/{answerId}/items
Response: [
  { id: 1, content: "...", is_completed: false, ... }
]
```

**添加列表项**：
```
POST /api/answer-sets/{setId}/answers/{answerId}/items
Body: { content: "新任务", priority: "high" }
```

**更新列表项**：
```
PUT /api/answer-sets/{setId}/answers/{answerId}/items/{itemId}
Body: { content: "更新的内容", is_completed: true }
```

**删除列表项**：
```
DELETE /api/answer-sets/{setId}/answers/{answerId}/items/{itemId}
```

**重新排序**：
```
PUT /api/answer-sets/{setId}/answers/{answerId}/items/reorder
Body: { items: [{ id: 1, order: 3 }, { id: 2, order: 1 }, ...] }
```

**切换完成状态**：
```
PATCH /api/answer-sets/{setId}/answers/{answerId}/items/{itemId}/toggle
```

#### 5. 前端功能

**核心功能**：
1. ✅ 添加新条目（点击 + 按钮）
2. ✅ 编辑条目内容（点击编辑按钮）
3. ✅ 删除条目（点击删除按钮，带确认）
4. ✅ 标记完成/未完成（点击复选框）
5. ✅ 拖拽排序（使用 Sortable.js 或原生 DnD）
6. ✅ 显示进度统计（X/Y 已完成）
7. ✅ 优先级标签和筛选
8. ✅ 截止日期提醒

---

## 🚀 实施计划

### 阶段1：最小可用版本（MVP）
**开发时间**：2-3小时

**功能范围**：
- ✅ 数据库表创建
- ✅ 基本 CRUD API
- ✅ 前端列表展示
- ✅ 添加/编辑/删除条目
- ✅ 完成状态切换

**不包含**：
- ❌ 优先级
- ❌ 截止日期
- ❌ 负责人
- ❌ 拖拽排序

### 阶段2：完整版本
**开发时间**：额外 2-3小时

**新增功能**：
- ✅ 优先级（高/中/低）
- ✅ 截止日期
- ✅ 拖拽排序
- ✅ 进度统计
- ✅ 筛选和排序

### 阶段3：高级功能（可选）
**开发时间**：额外 2-4小时

**可选功能**：
- ⭐ 负责人分配
- ⭐ 子任务（嵌套列表）
- ⭐ 标签系统
- ⭐ 批量操作
- ⭐ 导出为 Excel/CSV

---

## 📊 工作量估算

| 阶段 | 任务 | 工作量 |
|------|------|--------|
| **数据库** | 创建迁移脚本 | 30分钟 |
| **后端** | CRUD API 实现 | 2小时 |
| **前端** | UI 组件开发 | 2小时 |
| **前端** | API 集成 | 1小时 |
| **测试** | 功能测试 | 1小时 |
| **文档** | 用户文档 | 30分钟 |
| **总计** | | **约 7 小时** |

---

## 🎯 使用场景示例

### 场景1：项目复盘的待办事项
```
问题：本次 Sprint 遗留问题
答案类型：列表项
答案内容：
  ☐ [高] 修复登录页面 UI 问题（截止：2025-12-01）
  ☐ [中] 优化数据库查询性能
  ☐ [低] 更新用户文档
  ☑ [高] 完成权限系统重构
```

### 场景2：会议纪要的行动项
```
问题：会议行动项
答案类型：列表项
答案内容：
  ☐ 张三负责：调研新技术方案（截止：2025-12-05）
  ☐ 李四负责：准备演示 PPT（截止：2025-12-03）
  ☑ 王五负责：发送会议纪要给全员
```

### 场景3：问题清单
```
问题：发现的 Bug 列表
答案类型：列表项
答案内容：
  ☐ [高] 用户无法上传大于 10MB 的文件
  ☐ [高] 支付页面在 Safari 浏览器崩溃
  ☐ [中] 搜索功能返回重复结果
  ☑ [中] 注册邮箱验证码有时不发送
```

---

## 📋 决策建议

### 推荐选择：**方案2（独立子表）**

**理由**：
1. ✅ **完全满足需求**：每个条目可以独立操作
2. ✅ **扩展性强**：未来可轻松添加新属性
3. ✅ **性能优秀**：使用索引，查询高效
4. ✅ **数据规范**：符合关系型数据库设计原则
5. ✅ **易于维护**：数据结构清晰，逻辑简单

**开发投入**：
- 💰 **工作量**：约 7 小时（MVP 3小时）
- 🎯 **风险**：低
- 📈 **价值**：高（提升用户体验，增加产品功能）

**版本规划**：
- 🚀 **v10.1.0**：实现 MVP（基本 CRUD）
- 🚀 **v10.2.0**：完整功能（优先级、排序等）

---

## ❓ 需要确认的问题

在开始实施前，请确认：

1. **功能范围**：
   - 是否需要优先级功能？
   - 是否需要截止日期？
   - 是否需要负责人分配？
   - 是否需要拖拽排序？

2. **实施计划**：
   - 是否现在开始实施？
   - 先做 MVP 还是完整版本？
   - 目标发布版本是？

3. **UI 偏好**：
   - 是否需要拖拽排序的交互？
   - 优先级用颜色标签还是下拉选择？
   - 是否需要批量操作（全选/反选）？

---

**文档创建时间**: 2025-11-29  
**当前版本**: v10.0.0  
**建议实施版本**: v10.1.0
