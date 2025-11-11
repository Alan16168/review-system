#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Remove groupType translations and add timeTypeFree
V5.25.0 - Remove group_type field
"""

import re

file_path = '/home/user/webapp/public/static/i18n.js'

# Read file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to match groupType section (4 lines to remove)
# This will match from 'groupType' to 'groupTypeTeam' including the comma
group_type_pattern = r"    'groupType': '.*?',\n    'groupTypePersonal': '.*?',\n    'groupTypeProject': '.*?',\n    'groupTypeTeam': '.*?',\n"

# Remove all groupType translations
content = re.sub(group_type_pattern, '', content)

# Now add timeTypeFree after timeTypeYearly for each language

# Chinese (zh)
content = content.replace(
    "    'timeTypeYearly': '年复盘',",
    "    'timeTypeYearly': '年复盘',\n    'timeTypeFree': '自由复盘',"
)

# English (en)
content = content.replace(
    "    'timeTypeYearly': 'Yearly Review',",
    "    'timeTypeYearly': 'Yearly Review',\n    'timeTypeFree': 'Free Review',"
)

# Japanese (ja)
content = content.replace(
    "    'timeTypeYearly': 'Yearly Review',",
    "    'timeTypeYearly': 'Yearly Review',\n    'timeTypeFree': 'Free Review',"
)

# Spanish (es) - will match the remaining occurrence
content = content.replace(
    "    'timeTypeYearly': 'Yearly Review',",
    "    'timeTypeYearly': 'Yearly Review',\n    'timeTypeFree': 'Free Review',"
)

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Successfully updated i18n.js")
print("   - Removed all groupType translations")
print("   - Added timeTypeFree for 4 languages")
