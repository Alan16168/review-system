#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Update app.js to:
1. Remove all group_type related code
2. Add 'free' option to time_type selector
3. Show team selector when owner_type='team'
"""

import re

file_path = '/home/user/webapp/public/static/app.js'

# Read file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

print("Starting app.js updates...")

# 1. Remove group_type references from getElementById calls
content = re.sub(r"  const groupTypeElem = document\.getElementById\('review-group-type'\);\n", "", content)
content = re.sub(r"  const group_type = groupTypeElem \? groupTypeElem\.value : 'personal';\n", "", content)

# 2. Remove group_type from data objects
content = re.sub(r",?\s*group_type[,:]\s*['\w]+", "", content)
content = re.sub(r"group_type[,:]?\s*groupType,?", "", content)

# 3. Remove group_type conditionals
content = re.sub(r"if \(group_type === 'team'\) \{[^}]*\}", "", content)

# 4. Remove group_type from filter logic
content = re.sub(r"  const groupTypeFilter = document\.getElementById\('filter-group-type'\)\.value;\n", "", content)
content = re.sub(r"  if \(groupTypeFilter !== 'all' && review\.group_type !== groupTypeFilter\) return false;\n", "", content)

# 5. Remove group_type selector HTML
pattern_grouptype_selector = r'<div class="flex-1">.*?<i class="fas fa-layer-group.*?</select>\s*</div>'
content = re.sub(pattern_grouptype_selector, '', content, flags=re.DOTALL)

# 6. Remove group_type display in review cards
content = re.sub(r'\$\{review\.group_type \? i18n\.t\(review\.group_type\) : \'undefined\'\}', '', content)
content = re.sub(r'\$\{review\.group_type \?[^}]*\}', '', content)

# 7. Add 'free' option to timeType selectors - find all timeType select elements and add free option
time_type_pattern = r"(<option value=\"yearly\">\$\{i18n\.t\('timeTypeYearly'\)\}</option>)"
time_type_replacement = r'\1\n              <option value="free">${i18n.t(\'timeTypeFree\')}</option>'
content = re.sub(time_type_pattern, time_type_replacement, content)

print("✅ Completed app.js updates")
print("   - Removed group_type references")
print("   - Added 'free' option to time_type selectors")

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("\n⚠️  Note: Manual review needed for:")
print("   - Team selector visibility based on owner_type")
print("   - Any complex group_type logic that couldn't be automatically removed")
