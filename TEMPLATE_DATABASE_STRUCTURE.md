# 📊 模板数据库结构文档

## 🗂️ 数据库表概览

复盘系统的模板相关数据库包含以下核心表：

1. **templates** - 模板主表
2. **template_questions** - 模板问题表
3. **reviews** - 复盘表（引用模板）
4. **review_answer_sets** - 答案集表
5. **review_answers** - 答案表

---

## 📋 表结构详解

### 1. templates（模板表）

存储复盘模板的基本信息。

```sql
CREATE TABLE templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,                    -- 模板名称（中文）
  description TEXT,                             -- 模板描述（中文）
  name_en TEXT,                                 -- 模板名称（英文）
  description_en TEXT,                          -- 模板描述（英文）
  is_default INTEGER DEFAULT 0,                -- 是否默认模板（0=否，1=是）
  is_active INTEGER DEFAULT 1,                 -- 是否激活（0=停用，1=启用）
  created_by INTEGER,                          -- 创建者用户ID（NULL表示系统模板）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | INTEGER | 是 | 主键，自增 |
| `name` | TEXT | 是 | 模板中文名称，唯一 |
| `description` | TEXT | 否 | 模板中文描述 |
| `name_en` | TEXT | 否 | 模板英文名称（国际化支持） |
| `description_en` | TEXT | 否 | 模板英文描述（国际化支持） |
| `is_default` | INTEGER | 否 | 0=普通模板，1=默认模板 |
| `is_active` | INTEGER | 否 | 0=已停用，1=启用中 |
| `created_by` | INTEGER | 否 | 创建者用户ID，NULL表示系统模板 |
| `created_at` | DATETIME | 否 | 创建时间 |
| `updated_at` | DATETIME | 否 | 更新时间 |

#### 索引
```sql
CREATE INDEX idx_reviews_template_id ON reviews(template_id);
```

#### 系统内置模板

**模板1：灵魂9问（Nine Key Questions）**
```sql
id: 1
name: "灵魂9问"
name_en: "Nine Key Questions"
description: "这是系统的默认模版，可以适用于任何的复盘工作中"
description_en: "This is the default system template, suitable for any review work"
is_default: 1
is_active: 1
created_by: NULL
问题数: 10个
```

**模板2：个人年复盘（Personal Yearly Review）**
```sql
id: 2
name: "个人年复盘"
name_en: "Personal Yearly Review"
description: "此模板旨在帮助您回顾过去的一年并规划未来的一年..."
is_default: 0
is_active: 1
created_by: NULL
问题数: 53个
```

---

### 2. template_questions（模板问题表）

存储每个模板的问题列表。

```sql
CREATE TABLE template_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,                -- 所属模板ID
  question_number INTEGER NOT NULL,            -- 问题序号（1, 2, 3...）
  question_text TEXT NOT NULL,                 -- 问题文本（中文）
  question_text_en TEXT,                       -- 问题文本（英文）
  question_type TEXT DEFAULT 'text'            -- 问题类型
    CHECK(question_type IN ('text', 'multiple_choice', 'single_choice', 'time_with_text')),
  options TEXT DEFAULT NULL,                   -- 选项（JSON格式）
  correct_answer TEXT DEFAULT NULL,            -- 标准答案
  max_length INTEGER,                          -- 文本最大长度
  datetime_value DATETIME DEFAULT NULL,        -- 时间型问题的日期时间值
  datetime_title TEXT DEFAULT NULL,            -- 时间型问题的标题（最多12字符）
  datetime_answer_max_length INTEGER DEFAULT 200, -- 时间型问题答案的最大长度
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
  UNIQUE(template_id, question_number)
);
```

#### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | INTEGER | 是 | 主键，自增 |
| `template_id` | INTEGER | 是 | 所属模板ID |
| `question_number` | INTEGER | 是 | 问题序号（从1开始） |
| `question_text` | TEXT | 是 | 问题文本（中文） |
| `question_text_en` | TEXT | 否 | 问题文本（英文） |
| `question_type` | TEXT | 否 | 问题类型，默认'text' |
| `options` | TEXT | 否 | 选择题选项（JSON数组字符串） |
| `correct_answer` | TEXT | 否 | 标准答案 |
| `max_length` | INTEGER | 否 | 文本答案最大长度 |
| `datetime_value` | DATETIME | 否 | 时间型问题的默认时间 |
| `datetime_title` | TEXT | 否 | 时间型问题的标题 |
| `datetime_answer_max_length` | INTEGER | 否 | 时间型答案最大长度 |
| `created_at` | DATETIME | 否 | 创建时间 |

#### 问题类型（question_type）

1. **`text`** - 文本型问题（默认）
   - 用户输入文本答案
   - 可以设置 `max_length` 限制长度
   - 示例：`我的目标是什么？`

2. **`single_choice`** - 单选题
   - 用户从选项中选择一个答案
   - `options` 存储选项（JSON数组）
   - `correct_answer` 存储标准答案（如 "A"）
   - 示例选项：`["A. 选项1", "B. 选项2", "C. 选项3"]`

3. **`multiple_choice`** - 多选题
   - 用户从选项中选择多个答案
   - `options` 存储选项（JSON数组）
   - `correct_answer` 存储标准答案（如 "A,B,C"）
   - 示例选项：`["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"]`

4. **`time_with_text`** - 时间型问题（带文本答案）
   - 用户输入日期时间、标题和文本答案
   - `datetime_value`: 默认日期时间
   - `datetime_title`: 标题（最多12字符）
   - `datetime_answer_max_length`: 文本答案最大长度

#### 选项格式（options字段）

选择题的选项存储为JSON数组字符串：

```json
["A. 完全同意", "B. 同意", "C. 中立", "D. 不同意", "E. 完全不同意"]
```

或简单格式：
```json
["选项1", "选项2", "选项3"]
```

#### 索引
```sql
CREATE INDEX idx_template_questions_template_id ON template_questions(template_id);
CREATE INDEX idx_template_questions_type ON template_questions(question_type);
```

#### 约束
- `UNIQUE(template_id, question_number)` - 每个模板的问题序号唯一
- `CHECK(question_type IN (...))` - 问题类型必须是预定义的值

---

### 3. reviews（复盘表）

复盘表引用模板，每个复盘基于一个模板。

```sql
-- 部分字段
ALTER TABLE reviews ADD COLUMN template_id INTEGER REFERENCES templates(id);
```

#### 关键字段
- `template_id`: 使用的模板ID
- ⚠️ **重要**：`template_id` 在创建后不可修改（保护数据完整性）

---

### 4. review_answer_sets（答案集表）

**答案集系统**允许每个用户为同一个复盘创建多组答案。

```sql
CREATE TABLE review_answer_sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  review_id INTEGER NOT NULL,                  -- 所属复盘ID
  user_id INTEGER NOT NULL,                    -- 用户ID
  set_number INTEGER NOT NULL,                 -- 答案集序号（1, 2, 3...）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(review_id, user_id, set_number)
);
```

#### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | INTEGER | 是 | 主键，自增 |
| `review_id` | INTEGER | 是 | 所属复盘ID |
| `user_id` | INTEGER | 是 | 用户ID |
| `set_number` | INTEGER | 是 | 答案集序号（1, 2, 3...） |
| `created_at` | DATETIME | 否 | 创建时间 |
| `updated_at` | DATETIME | 否 | 更新时间 |

#### 答案集概念

- 每个用户可以为同一个复盘创建多个答案集
- 每个答案集包含该复盘所有问题的答案
- `set_number` 表示答案集的序号（第1组、第2组...）
- 用户可以通过导航按钮在不同答案集之间切换

#### 索引
```sql
CREATE INDEX idx_answer_sets_review ON review_answer_sets(review_id);
CREATE INDEX idx_answer_sets_user ON review_answer_sets(user_id);
CREATE INDEX idx_answer_sets_number ON review_answer_sets(review_id, set_number);
```

---

### 5. review_answers（答案表）

存储用户对问题的具体答案。

```sql
CREATE TABLE review_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  answer_set_id INTEGER NOT NULL,              -- 所属答案集ID
  question_number INTEGER NOT NULL,            -- 问题序号
  answer TEXT,                                 -- 文本/选择题答案
  datetime_value DATETIME,                     -- 时间型问题的日期时间
  datetime_title TEXT,                         -- 时间型问题的标题
  datetime_answer TEXT,                        -- 时间型问题的文本答案
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (answer_set_id) REFERENCES review_answer_sets(id) ON DELETE CASCADE
);
```

#### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | INTEGER | 是 | 主键，自增 |
| `answer_set_id` | INTEGER | 是 | 所属答案集ID |
| `question_number` | INTEGER | 是 | 问题序号 |
| `answer` | TEXT | 否 | 文本/选择题答案 |
| `datetime_value` | DATETIME | 否 | 时间型问题的日期时间值 |
| `datetime_title` | TEXT | 否 | 时间型问题的标题 |
| `datetime_answer` | TEXT | 否 | 时间型问题的文本答案 |
| `created_at` | DATETIME | 否 | 创建时间 |
| `updated_at` | DATETIME | 否 | 更新时间 |

#### 答案类型存储

**文本型问题（text）：**
```sql
answer_set_id: 1
question_number: 1
answer: "提高销售额20%"
datetime_value: NULL
datetime_title: NULL
datetime_answer: NULL
```

**单选题（single_choice）：**
```sql
answer_set_id: 1
question_number: 2
answer: "A"  -- 选择的选项（A、B、C等）
```

**多选题（multiple_choice）：**
```sql
answer_set_id: 1
question_number: 3
answer: "A,B,C"  -- 多个选项，逗号分隔
```

**时间型问题（time_with_text）：**
```sql
answer_set_id: 1
question_number: 4
answer: NULL
datetime_value: "2025-11-15 10:30:00"
datetime_title: "团队会议"
datetime_answer: "讨论了项目进度和下个月的计划"
```

#### 索引
```sql
CREATE INDEX idx_answers_v2_set ON review_answers(answer_set_id);
CREATE INDEX idx_answers_v2_question ON review_answers(answer_set_id, question_number);
```

---

## 🔗 表关系图

```
templates (模板表)
    ↓ 1:N
template_questions (问题表)

reviews (复盘表)
    ↑ N:1
templates (模板表)
    ↓ 1:N
review_answer_sets (答案集表)
    ↓ 1:N
review_answers (答案表)
```

完整关系：
```
templates
    ├── template_questions (1:N)
    └── reviews (1:N)

reviews
    └── review_answer_sets (1:N)
        └── review_answers (1:N)
```

---

## 📊 数据示例

### 示例1：灵魂9问模板

**templates表：**
```sql
id: 1
name: "灵魂9问"
name_en: "Nine Key Questions"
is_default: 1
is_active: 1
```

**template_questions表：**
```sql
-- 问题1
id: 1, template_id: 1, question_number: 1
question_text: "我的目标是什么？"
question_text_en: "What was my goal?"
question_type: "text"

-- 问题2
id: 2, template_id: 1, question_number: 2
question_text: "目标达成了吗？"
question_text_en: "Was the goal achieved?"
question_type: "text"

... (共10个问题)
```

### 示例2：带选择题的自定义模板

**templates表：**
```sql
id: 3
name: "项目评估模板"
description: "用于项目结束后的评估"
is_default: 0
is_active: 1
created_by: 42
```

**template_questions表：**
```sql
-- 问题1：文本题
id: 31, template_id: 3, question_number: 1
question_text: "项目名称是什么？"
question_type: "text"
max_length: 100

-- 问题2：单选题
id: 32, template_id: 3, question_number: 2
question_text: "项目完成度如何？"
question_type: "single_choice"
options: '["A. 100%完成", "B. 80-99%完成", "C. 60-79%完成", "D. 60%以下"]'
correct_answer: NULL

-- 问题3：多选题
id: 33, template_id: 3, question_number: 3
question_text: "项目中遇到了哪些挑战？"
question_type: "multiple_choice"
options: '["A. 时间不足", "B. 预算超支", "C. 人员流动", "D. 技术难题", "E. 需求变更"]'
correct_answer: NULL
```

### 示例3：答案集数据

**review_answer_sets表：**
```sql
-- 用户123为复盘456创建的第1组答案
id: 1001
review_id: 456
user_id: 123
set_number: 1
created_at: "2025-11-01 10:00:00"

-- 用户123为复盘456创建的第2组答案
id: 1002
review_id: 456
user_id: 123
set_number: 2
created_at: "2025-11-15 14:30:00"
```

**review_answers表：**
```sql
-- 第1组答案
-- 问题1的答案
id: 5001, answer_set_id: 1001, question_number: 1
answer: "提高销售额20%"

-- 问题2的答案（单选）
id: 5002, answer_set_id: 1001, question_number: 2
answer: "B"

-- 第2组答案
-- 问题1的答案
id: 5011, answer_set_id: 1002, question_number: 1
answer: "提高销售额30%（已调整目标）"

-- 问题2的答案（单选）
id: 5012, answer_set_id: 1002, question_number: 2
answer: "A"
```

---

## 🔍 常用SQL查询

### 1. 获取模板及其问题
```sql
-- 获取模板基本信息
SELECT * FROM templates WHERE id = 1;

-- 获取模板的所有问题
SELECT * FROM template_questions 
WHERE template_id = 1 
ORDER BY question_number;

-- 获取模板及问题数量
SELECT t.*, COUNT(tq.id) as question_count
FROM templates t
LEFT JOIN template_questions tq ON t.id = tq.template_id
WHERE t.id = 1
GROUP BY t.id;
```

### 2. 获取复盘的答案集
```sql
-- 获取某个用户在某个复盘中的所有答案集
SELECT * FROM review_answer_sets
WHERE review_id = 456 AND user_id = 123
ORDER BY set_number;

-- 获取某个答案集的所有答案
SELECT ra.*, tq.question_text, tq.question_type
FROM review_answers ra
JOIN review_answer_sets ras ON ra.answer_set_id = ras.id
JOIN reviews r ON ras.review_id = r.id
JOIN template_questions tq ON r.template_id = tq.template_id 
  AND ra.question_number = tq.question_number
WHERE ra.answer_set_id = 1001
ORDER BY ra.question_number;
```

### 3. 创建新答案集
```sql
-- 1. 创建答案集
INSERT INTO review_answer_sets (review_id, user_id, set_number)
VALUES (456, 123, 3);

-- 2. 获取新创建的答案集ID
SELECT last_insert_rowid();

-- 3. 添加答案到答案集
INSERT INTO review_answers (answer_set_id, question_number, answer)
VALUES (1003, 1, '我的新答案');
```

### 4. 获取模板的多语言版本
```sql
-- 根据语言获取模板信息
SELECT 
  id,
  CASE WHEN :lang = 'en' THEN COALESCE(name_en, name) ELSE name END as name,
  CASE WHEN :lang = 'en' THEN COALESCE(description_en, description) ELSE description END as description
FROM templates
WHERE id = 1;

-- 根据语言获取问题文本
SELECT 
  question_number,
  CASE WHEN :lang = 'en' THEN COALESCE(question_text_en, question_text) ELSE question_text END as question_text,
  question_type,
  options
FROM template_questions
WHERE template_id = 1
ORDER BY question_number;
```

---

## 📚 API接口使用示例

### 获取模板列表
```
GET /api/templates
Response: [
  {
    "id": 1,
    "name": "灵魂9问",
    "description": "...",
    "question_count": 10
  },
  {
    "id": 2,
    "name": "个人年复盘",
    "description": "...",
    "question_count": 53
  }
]
```

### 获取模板详情（含问题）
```
GET /api/templates/:id
Response: {
  "id": 1,
  "name": "灵魂9问",
  "description": "...",
  "questions": [
    {
      "question_number": 1,
      "question_text": "我的目标是什么？",
      "question_type": "text"
    },
    ...
  ]
}
```

### 创建复盘（基于模板）
```
POST /api/reviews
Body: {
  "title": "2025年Q1复盘",
  "template_id": 1,
  "time_type": "quarter",
  ...
}
```

### 获取复盘答案集
```
GET /api/reviews/:id/answer-sets
Response: [
  {
    "id": 1001,
    "set_number": 1,
    "user_id": 123,
    "created_at": "...",
    "answers": [...]
  },
  {
    "id": 1002,
    "set_number": 2,
    "user_id": 123,
    "created_at": "...",
    "answers": [...]
  }
]
```

---

## 🔒 数据完整性规则

### 1. template_id 保护
- ✅ **创建时设置**：复盘创建时必须指定 `template_id`
- ❌ **编辑时禁止修改**：复盘的 `template_id` 创建后不可更改
- 原因：防止数据不一致（问题和答案基于特定模板）

### 2. 级联删除
- 删除模板 → 级联删除模板问题
- 删除复盘 → 级联删除答案集 → 级联删除答案
- 删除答案集 → 级联删除答案

### 3. 唯一性约束
- `templates.name` - 模板名称唯一
- `template_questions(template_id, question_number)` - 每个模板的问题序号唯一
- `review_answer_sets(review_id, user_id, set_number)` - 每个用户在每个复盘中的答案集序号唯一

---

## 📝 最佳实践

### 1. 创建模板
- 为模板提供清晰的名称和描述
- 添加英文翻译支持国际化
- 按逻辑顺序编号问题
- 为选择题提供合理的选项

### 2. 使用答案集
- 每个答案集代表一次完整的答题
- 通过 `set_number` 区分不同答案集
- 可以通过时间戳排序答案集

### 3. 问题类型选择
- 简单回答 → `text`
- 固定选项 → `single_choice` 或 `multiple_choice`
- 需要时间记录 → `time_with_text`

---

## 🎯 总结

复盘系统的模板架构采用：
- ✅ **灵活的模板系统** - 支持自定义模板和系统模板
- ✅ **多种问题类型** - 文本、单选、多选、时间型
- ✅ **答案集机制** - 允许多次答题和版本对比
- ✅ **国际化支持** - 中英双语
- ✅ **数据完整性** - 级联删除和约束保护

**核心理念**：模板定义问题结构，复盘引用模板，答案集组织答案。

---

**文档版本**: v1.0  
**最后更新**: 2025-11-15  
**相关迁移**: 0009, 0010, 0011, 0016, 0025, 0030
