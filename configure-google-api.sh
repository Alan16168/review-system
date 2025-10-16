#!/bin/bash

# Google API Configuration Script for Review System
# This script helps configure Google Custom Search API credentials

echo "======================================"
echo "Google Custom Search API Configuration"
echo "======================================"
echo ""

# Check if wrangler is available
if ! command -v wrangler &> /dev/null; then
    echo "❌ Error: wrangler CLI not found"
    echo "Please ensure you're in the correct environment"
    exit 1
fi

echo "This script will help you configure Google API credentials for Cloudflare Pages."
echo ""
echo "You need to provide:"
echo "1. GOOGLE_API_KEY (from Google Cloud Console)"
echo "2. GOOGLE_SEARCH_ENGINE_ID (from Programmable Search Engine)"
echo ""
echo "📚 Follow the guide: GOOGLE_API_SETUP_GUIDE.md"
echo ""

# Prompt for API Key
read -p "Enter your GOOGLE_API_KEY: " GOOGLE_API_KEY
if [ -z "$GOOGLE_API_KEY" ]; then
    echo "❌ API Key cannot be empty"
    exit 1
fi

# Prompt for Search Engine ID
read -p "Enter your GOOGLE_SEARCH_ENGINE_ID: " GOOGLE_SEARCH_ENGINE_ID
if [ -z "$GOOGLE_SEARCH_ENGINE_ID" ]; then
    echo "❌ Search Engine ID cannot be empty"
    exit 1
fi

echo ""
echo "Setting environment variables for Cloudflare Pages..."
echo ""

# Set production environment variables
echo "📝 Setting GOOGLE_API_KEY for production..."
echo "$GOOGLE_API_KEY" | npx wrangler pages secret put GOOGLE_API_KEY --project-name review-system

echo ""
echo "📝 Setting GOOGLE_SEARCH_ENGINE_ID for production..."
echo "$GOOGLE_SEARCH_ENGINE_ID" | npx wrangler pages secret put GOOGLE_SEARCH_ENGINE_ID --project-name review-system

echo ""
echo "✅ Configuration complete!"
echo ""
echo "Next steps:"
echo "1. Deploy the application: npm run deploy:prod"
echo "2. Test the API: curl 'https://review-system.pages.dev/api/resources/articles?lang=zh'"
echo "3. Check that source is 'google_search' instead of 'mock'"
echo ""
echo "🎉 You're all set!"
