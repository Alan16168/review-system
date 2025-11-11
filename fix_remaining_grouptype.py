#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fix remaining group_type references in app.js edit form
"""

file_path = '/home/user/webapp/public/static/app.js'

# Read file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

print("Fixing remaining group_type references...")

# Remove the entire Group Type section in edit form (lines ~2667-2680)
edit_group_type_section = r'''            <!-- Group Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                \$\{i18n\.t\('groupType'\)\} <span class="text-red-500">\*</span>
              </label>
              <select id="review-group-type" required
                      \$\{!isCreator \? 'disabled' : ''\}
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 \$\{!isCreator \? 'bg-gray-100 cursor-not-allowed' : ''\}">
                <option value="personal" \$\{review\.group_type === 'personal' \? 'selected' : ''\}\>\$\{i18n\.t\('groupTypePersonal'\)\}</option>
                <option value="project" \$\{review\.group_type === 'project' \? 'selected' : ''\}\>\$\{i18n\.t\('groupTypeProject'\)\}</option>
                <option value="team" \$\{review\.group_type === 'team' \? 'selected' : ''\}\>\$\{i18n\.t\('groupTypeTeam'\)\}</option>
              </select>
              \$\{!isCreator \? `<p class="mt-1 text-xs text-gray-500"><i class="fas fa-lock mr-1"></i>\$\{i18n\.t\('onlyCreatorCanEdit'\) \|\| '仅创建者可编辑'\}</p>` : ''\}
            </div>

'''

import re
content = re.sub(edit_group_type_section, '', content, flags=re.DOTALL)

# Add 'free' option to time_type in edit form
old_yearly_line = '''                <option value="yearly" ${review.time_type === 'yearly' ? 'selected' : ''}>${i18n.t('timeTypeYearly')}</option>
              </select>'''

new_yearly_with_free = '''                <option value="yearly" ${review.time_type === 'yearly' ? 'selected' : ''}>${i18n.t('timeTypeYearly')}</option>
                <option value="free" ${review.time_type === 'free' ? 'selected' : ''}>${i18n.t('timeTypeFree')}</option>
              </select>'''

content = content.replace(old_yearly_line, new_yearly_with_free)

# Fix the update review function - remove groupType variable
# Search for: const groupType = document.getElementById('review-group-type').value;
content = re.sub(r"  const groupType = document\.getElementById\('review-group-type'\)\.value;\n", "", content)

# Remove group_type from update data object in handleUpdateReview
content = re.sub(r",\s*group_type:\s*groupType", "", content)

print("✅ Fixed edit form group_type references")
print("✅ Added 'free' option to edit form time_type selector")

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ Successfully updated app.js")
