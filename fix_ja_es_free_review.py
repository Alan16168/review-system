#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fix Japanese and Spanish translations for timeTypeFree
"""

file_path = '/home/user/webapp/public/static/i18n.js'

# Read file
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Fix line 1423 (Japanese - 0-indexed, so 1422)
if len(lines) > 1422 and "'timeTypeFree': 'Free Review'," in lines[1422]:
    lines[1422] = "    'timeTypeFree': '自由レビュー',\n"
    print(f"✅ Fixed Japanese (line 1423): '自由レビュー'")

# Fix line 2065 (Spanish - 0-indexed, so 2064)
if len(lines) > 2064 and "'timeTypeFree': 'Free Review'," in lines[2064]:
    lines[2064] = "    'timeTypeFree': 'Revisión Libre',\n"
    print(f"✅ Fixed Spanish (line 2065): 'Revisión Libre'")

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("\n✅ Successfully updated translations")
