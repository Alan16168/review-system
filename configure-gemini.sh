#!/bin/bash
# Gemini API Key 配置脚本
# 使用方法：./configure-gemini.sh YOUR_API_KEY

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目目录
PROJECT_DIR="/home/user/webapp"
DEV_VARS_FILE="$PROJECT_DIR/.dev.vars"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Gemini API Key 配置工具${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 检查参数
if [ -z "$1" ]; then
    echo -e "${YELLOW}使用方法：${NC}"
    echo -e "  ./configure-gemini.sh YOUR_API_KEY"
    echo ""
    echo -e "${YELLOW}或者交互式输入：${NC}"
    read -p "请输入你的 Gemini API Key: " API_KEY
    
    if [ -z "$API_KEY" ]; then
        echo -e "${RED}❌ 错误：API Key 不能为空${NC}"
        exit 1
    fi
else
    API_KEY="$1"
fi

# 验证API Key格式
if [[ ! $API_KEY =~ ^AIzaSy[0-9A-Za-z_-]{33}$ ]]; then
    echo -e "${YELLOW}⚠️  警告：API Key 格式可能不正确${NC}"
    echo -e "   正确格式应该是：AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
    read -p "是否继续？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 检查 .dev.vars 文件
if [ ! -f "$DEV_VARS_FILE" ]; then
    echo -e "${RED}❌ 错误：找不到 .dev.vars 文件${NC}"
    exit 1
fi

# 备份原文件
BACKUP_FILE="$DEV_VARS_FILE.backup.$(date +%Y%m%d_%H%M%S)"
cp "$DEV_VARS_FILE" "$BACKUP_FILE"
echo -e "${GREEN}✓${NC} 已备份原文件到: $BACKUP_FILE"

# 检查是否已存在 GEMINI_API_KEY
if grep -q "^GEMINI_API_KEY=" "$DEV_VARS_FILE"; then
    # 替换现有的key
    sed -i "s|^GEMINI_API_KEY=.*|GEMINI_API_KEY=$API_KEY|" "$DEV_VARS_FILE"
    echo -e "${GREEN}✓${NC} 已更新 GEMINI_API_KEY"
else
    # 添加新的key
    echo "" >> "$DEV_VARS_FILE"
    echo "# Gemini API Key（用于AI对话功能）" >> "$DEV_VARS_FILE"
    echo "GEMINI_API_KEY=$API_KEY" >> "$DEV_VARS_FILE"
    echo -e "${GREEN}✓${NC} 已添加 GEMINI_API_KEY"
fi

# 显示配置结果
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ 配置完成！${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}下一步操作：${NC}"
echo ""
echo "1. 重新构建项目："
echo -e "   ${BLUE}cd $PROJECT_DIR && npm run build${NC}"
echo ""
echo "2. 重启服务："
echo -e "   ${BLUE}pm2 restart review-system${NC}"
echo ""
echo "3. 测试API："
echo -e "   ${BLUE}curl -X POST http://localhost:3000/api/resources/ai-chat \\${NC}"
echo -e "   ${BLUE}  -H \"Content-Type: application/json\" \\${NC}"
echo -e "   ${BLUE}  -H \"X-Language: zh\" \\${NC}"
echo -e "   ${BLUE}  -d '{\"question\":\"测试问题\"}'${NC}"
echo ""
echo "4. 查看日志："
echo -e "   ${BLUE}pm2 logs review-system --nostream --lines 50${NC}"
echo ""
echo -e "${YELLOW}提示：${NC}"
echo "- 如果看到 '403 Forbidden' 错误，请检查API Key权限"
echo "- 如果看到 'Using API Key for Gemini' 说明配置成功"
echo "- 详细文档请查看: GEMINI_API_SETUP.md"
echo ""

# 询问是否立即重启
read -p "是否立即重新构建并重启服务？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${BLUE}正在重新构建...${NC}"
    cd "$PROJECT_DIR"
    npm run build
    
    echo ""
    echo -e "${BLUE}正在重启服务...${NC}"
    pm2 restart review-system
    
    echo ""
    echo -e "${GREEN}✓ 完成！${NC}"
    echo ""
    echo "现在你可以访问应用并测试AI对话功能了："
    echo -e "${BLUE}https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev${NC}"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}配置完成！祝使用愉快！${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
