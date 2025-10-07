# 筛选功能更新文档

## 更新日期
2025-10-07

## 更新概览

根据用户上传的设计图片，对"我的复盘"页面的筛选功能进行了全面升级。

## 更新内容

### 1. 筛选器布局变更

**之前**（3列布局）：
```
[状态] [搜索] [团队]
```

**现在**（4列布局）：
```
[状态] [搜索] [群体] [时间]
```

**响应式设计**：
- 手机端：1列（垂直排列）
- 平板端：2列
- 桌面端：4列

### 2. "团队"筛选器 → "群体"筛选器

**字段名称变更**：
- 中文：团队 → 群体类型
- 英文：Team → Group Type
- 字段ID：`filter-team` → `filter-group-type`

**筛选选项**：
| 值 | 中文显示 | 英文显示 | 图标 |
|---|---------|---------|------|
| all | 全部 | All | - |
| personal | 个人 | Personal | - |
| project | 项目 | Project | - |
| team | 团队 | Team | - |

**图标**：`fa-layer-group` (层叠方块图标)

**筛选逻辑**：
```javascript
// 之前：基于 team_id 筛选
if (teamFilter === 'personal' && review.team_id) return false;
if (teamFilter === 'team' && !review.team_id) return false;

// 现在：基于 group_type 字段筛选
if (groupTypeFilter !== 'all' && review.group_type !== groupTypeFilter) 
  return false;
```

### 3. 新增"时间"筛选器

**字段信息**：
- 中文标签：时间类型
- 英文标签：Time Type
- 字段ID：`filter-time-type`

**筛选选项**：
| 值 | 中文显示 | 英文显示 |
|---|---------|---------|
| all | 全部 | All |
| daily | 日复盘 | Daily Review |
| weekly | 周复盘 | Weekly Review |
| monthly | 月复盘 | Monthly Review |
| yearly | 年复盘 | Yearly Review |

**图标**：`fa-calendar-alt` (日历图标)

**筛选逻辑**：
```javascript
if (timeTypeFilter !== 'all' && review.time_type !== timeTypeFilter) 
  return false;
```

### 4. 新增"日复盘"支持

#### 数据库层面
```sql
-- 之前的默认值
ALTER TABLE reviews ADD COLUMN time_type TEXT DEFAULT 'weekly';

-- 现在的默认值
ALTER TABLE reviews ADD COLUMN time_type TEXT DEFAULT 'daily';
```

#### API 层面
```typescript
// src/routes/reviews.ts
// 之前
time_type || 'weekly'

// 现在
time_type || 'daily'
```

#### 前端表单
**创建复盘表单**：
```html
<select id="review-time-type">
  <option value="daily">日复盘</option>      <!-- 新增 -->
  <option value="weekly">周复盘</option>
  <option value="monthly">月复盘</option>
  <option value="yearly">年复盘</option>
</select>
```

**编辑复盘表单**：
```html
<select id="review-time-type">
  <option value="daily" ${review.time_type === 'daily' ? 'selected' : ''}>
    日复盘
  </option>
  <!-- ... 其他选项 -->
</select>
```

### 5. 翻译更新

#### 中文翻译
```javascript
'groupType': '群体类型',
'groupTypePersonal': '个人',
'groupTypeProject': '项目',
'groupTypeTeam': '团队',
'timeType': '时间类型',
'timeTypeDaily': '日复盘',      // 新增
'timeTypeWeekly': '周复盘',
'timeTypeMonthly': '月复盘',
'timeTypeYearly': '年复盘',
```

#### 英文翻译
```javascript
'groupType': 'Group Type',
'groupTypePersonal': 'Personal',
'groupTypeProject': 'Project',
'groupTypeTeam': 'Team',
'timeType': 'Time Type',
'timeTypeDaily': 'Daily Review',    // 新增
'timeTypeWeekly': 'Weekly Review',
'timeTypeMonthly': 'Monthly Review',
'timeTypeYearly': 'Yearly Review',
```

## 功能特点

### 1. 独立筛选
- 4个筛选器独立工作
- 可以单独使用任一筛选器
- 可以组合使用多个筛选器

### 2. 实时筛选
- 所有筛选器都绑定了 `onchange` 事件
- 搜索框使用 `oninput` 实现即时搜索
- 无需点击"筛选"按钮

### 3. 筛选组合示例

**示例1：查找所有项目的月复盘**
```
状态：全部
搜索：(空)
群体：项目
时间：月复盘
```

**示例2：查找已完成的个人日复盘**
```
状态：已完成
搜索：(空)
群体：个人
时间：日复盘
```

**示例3：搜索包含"产品"的周复盘**
```
状态：全部
搜索：产品
群体：全部
时间：周复盘
```

## 技术实现

### 筛选函数
```javascript
function filterReviews() {
  // 获取所有筛选条件
  const statusFilter = document.getElementById('filter-status').value;
  const searchText = document.getElementById('search-input').value.toLowerCase();
  const groupTypeFilter = document.getElementById('filter-group-type').value;
  const timeTypeFilter = document.getElementById('filter-time-type').value;

  // 应用所有筛选条件
  let filtered = allReviews.filter(review => {
    // 状态筛选
    if (statusFilter !== 'all' && review.status !== statusFilter) 
      return false;
    
    // 搜索筛选
    if (searchText && !review.title.toLowerCase().includes(searchText)) 
      return false;
    
    // 群体类型筛选
    if (groupTypeFilter !== 'all' && review.group_type !== groupTypeFilter) 
      return false;
    
    // 时间类型筛选
    if (timeTypeFilter !== 'all' && review.time_type !== timeTypeFilter) 
      return false;
    
    return true;
  });

  // 渲染筛选结果
  renderReviewsList(filtered);
}
```

### UI 代码
```html
<div class="bg-white rounded-lg shadow-md p-4 mb-6">
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- 状态筛选 -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        <i class="fas fa-filter mr-1"></i>状态
      </label>
      <select id="filter-status" onchange="filterReviews()" class="...">
        <option value="all">全部</option>
        <option value="draft">草稿</option>
        <option value="completed">已完成</option>
      </select>
    </div>

    <!-- 搜索框 -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        <i class="fas fa-search mr-1"></i>搜索
      </label>
      <input type="text" id="search-input" oninput="filterReviews()" 
             placeholder="复盘主题" class="...">
    </div>

    <!-- 群体类型筛选 -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        <i class="fas fa-layer-group mr-1"></i>群体类型
      </label>
      <select id="filter-group-type" onchange="filterReviews()" class="...">
        <option value="all">全部</option>
        <option value="personal">个人</option>
        <option value="project">项目</option>
        <option value="team">团队</option>
      </select>
    </div>

    <!-- 时间类型筛选 -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        <i class="fas fa-calendar-alt mr-1"></i>时间类型
      </label>
      <select id="filter-time-type" onchange="filterReviews()" class="...">
        <option value="all">全部</option>
        <option value="daily">日复盘</option>
        <option value="weekly">周复盘</option>
        <option value="monthly">月复盘</option>
        <option value="yearly">年复盘</option>
      </select>
    </div>
  </div>
</div>
```

## 测试结果

### 测试用例

#### 1. 创建不同类型的复盘
```bash
✅ 创建个人日复盘 - 成功
✅ 创建项目周复盘 - 成功
✅ 创建团队月复盘 - 成功
✅ 创建项目年复盘 - 成功
```

#### 2. 筛选功能测试
```bash
✅ 按状态筛选 - 正常工作
✅ 按搜索关键词筛选 - 正常工作
✅ 按群体类型筛选 - 正常工作
✅ 按时间类型筛选 - 正常工作
✅ 组合筛选（状态+群体+时间）- 正常工作
```

#### 3. 响应式测试
```bash
✅ 桌面端（4列布局）- 显示正常
✅ 平板端（2列布局）- 显示正常
✅ 手机端（1列布局）- 显示正常
```

## 文件变更

| 文件 | 变更类型 | 说明 |
|-----|---------|------|
| `public/static/app.js` | 修改 | 筛选UI和逻辑更新 |
| `public/static/i18n.js` | 修改 | 添加日复盘翻译 |
| `migrations/0003_add_review_types.sql` | 修改 | 更新默认值 |
| `src/routes/reviews.ts` | 修改 | API默认值更新 |

## 向后兼容性

✅ **完全向后兼容**

- 旧的复盘记录会使用默认值（group_type='personal', time_type='daily'）
- API 仍然接受没有这些字段的请求
- 筛选器的"全部"选项确保旧数据可见

## 用户指南

### 如何使用新筛选功能

1. **访问我的复盘页面**
   - 登录系统
   - 点击导航栏"我的复盘"

2. **使用单个筛选器**
   - 点击任一下拉框
   - 选择想要的选项
   - 列表自动更新

3. **使用多个筛选器**
   - 可以同时选择多个筛选条件
   - 例如：选择"已完成" + "项目" + "月复盘"
   - 只显示同时满足所有条件的复盘

4. **清除筛选**
   - 将所有筛选器设置为"全部"
   - 或刷新页面

## 未来改进建议

### 短期（1周内）
1. 添加筛选结果计数显示
   - 显示"共找到 X 个复盘"
2. 添加"清除筛选"按钮
   - 一键重置所有筛选器

### 中期（1个月内）
1. 保存筛选偏好
   - 记住用户上次使用的筛选条件
2. 预设筛选组合
   - "今日复盘"、"本周复盘"等快捷按钮

### 长期
1. 高级筛选
   - 日期范围筛选
   - 标签筛选（如果添加标签功能）
2. 筛选条件分享
   - 生成筛选链接
   - 团队成员可以共享筛选视图

## 总结

本次更新完全按照用户上传的设计图实现了新的筛选功能：

✅ "团队"类别改为"群体"类别（个人/项目/团队）
✅ 新增"时间"类别（日/周/月/年复盘）
✅ 4列响应式布局
✅ 独立的筛选逻辑
✅ 完整的双语支持
✅ 向后兼容旧数据

所有功能已测试通过，可以正常使用。

---

**更新版本**: V2.1  
**Git Commit**: e1d8a81  
**更新时间**: 2025-10-07
