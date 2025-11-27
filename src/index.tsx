import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import auth from './routes/auth';
import reviews from './routes/reviews';
import teams from './routes/teams';
import admin from './routes/admin';
import notifications from './routes/notifications';
import resources from './routes/resources';
import templates from './routes/templates';
import testimonials from './routes/testimonials';
import payment from './routes/payment';
import cron from './routes/cron';
import cart from './routes/cart';
import invitations from './routes/invitations';
import calendar from './routes/calendar';
import answerSets from './routes/answer_sets';
import keywords from './routes/keywords';
import systemSettings from './routes/system_settings';
// Manhattan Project Phase 1 - AI Writing System & Marketplace
import aiBooks from './routes/ai_books';
import marketplace from './routes/marketplace';
import writingTemplates from './routes/writing_templates';
import agents from './routes/agents';

type Bindings = {
  DB: D1Database;
  GOOGLE_API_KEY?: string;
  GOOGLE_SEARCH_ENGINE_ID?: string;
  YOUTUBE_API_KEY?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  RESEND_API_KEY?: string;
  APP_URL?: string;
  PAYPAL_CLIENT_ID?: string;
  PAYPAL_CLIENT_SECRET?: string;
  PAYPAL_MODE?: string;
  GEMINI_API_KEY?: string; // Manhattan Project - AI Writing System
};

const app = new Hono<{ Bindings: Bindings }>();

// Global error handler - must be first
app.use('*', errorHandler);

// Enable CORS for API routes
app.use('/api/*', cors());

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }));

// API routes
app.route('/api/auth', auth);
app.route('/api/reviews', reviews);
app.route('/api/teams', teams);
app.route('/api/admin', admin);
app.route('/api/notifications', notifications);
app.route('/api/resources', resources);
app.route('/api/templates', templates);
app.route('/api/testimonials', testimonials);
app.route('/api/payment', payment);
app.route('/api/cron', cron);
app.route('/api/cart', cart);
app.route('/api/invitations', invitations);
app.route('/api/calendar', calendar);
app.route('/api/answer-sets', answerSets);
app.route('/api/keywords', keywords);
app.route('/api/system-settings', systemSettings);

// Manhattan Project Phase 1 - AI Writing System & Marketplace Routes
app.route('/api/ai-books', aiBooks);
app.route('/api/marketplace', marketplace);
app.route('/api/writing-templates', writingTemplates);
app.route('/api/agents', agents);

// Public API - Subscription Configuration (no auth required)
app.get('/api/subscription/config', async (c) => {
  try {
    const configs = await c.env.DB.prepare(
      'SELECT * FROM subscription_config WHERE is_active = 1 ORDER BY tier'
    ).all();
    
    // Format the data for frontend consumption
    const plans = (configs.results || []).map((config: any) => ({
      tier: config.tier,
      name: config.tier === 'premium' ? '高级会员' : config.tier === 'super' ? '超级会员' : '免费',
      price_usd: config.price_usd || 0,
      renewal_price_usd: config.renewal_price_usd || 0,
      duration_days: config.duration_days || 365,
      description: config.description || '',
      description_en: config.description_en || '',
      review_limit: config.tier === 'free' ? 10 : -1,
      template_limit: config.tier === 'free' ? 5 : -1,
      team_support: config.tier !== 'free',
      ai_features: config.tier === 'super'
    }));
    
    return c.json({ plans });
  } catch (error) {
    console.error('Get subscription config error:', error);
    return c.json({ error: 'Internal server error', plans: [] }, 500);
  }
});

// Mobile App - serve directly
app.get('/mobile', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="theme-color" content="#667eea">
    <title>审查系统 - 移动版</title>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="/static/mobile-styles.css?v=8.9.0" rel="stylesheet">
</head>
<body>
    <div id="mobile-app">
        <div id="mobile-content"></div>
        <div id="mobile-bottom-nav"></div>
    </div>
    
    <!-- 加载指示器 -->
    <div id="mobile-loading">
        <div class="mobile-loading-spinner"></div>
        <div class="mobile-loading-text">加载中...</div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/mobile-app.js?v=8.9.0"></script>
</body>
</html>
  `);
});

// Diagnostic page - serve directly
// Debug tool - inline HTML (Cloudflare Workers doesn't support file system)
// Support both /debug and /debug.html
const debugTool = (c: any) => {
  return c.html(`<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Review System - 快速诊断</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen flex items-center justify-center p-4">
    <div class="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-6 text-center">
            🔍 快速诊断工具
        </h1>
        
        <div class="space-y-4">
            <button onclick="quickFix()" class="w-full bg-red-600 text-white px-6 py-4 rounded-lg hover:bg-red-700 text-lg font-bold">
                🚀 一键修复 (清除缓存并重新登录)
            </button>
            
            <button onclick="checkToken()" class="w-full bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 text-lg font-bold">
                🔑 检查Token状态
            </button>
            
            <button onclick="testAPI()" class="w-full bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 text-lg font-bold">
                🧪 测试Review 275
            </button>
        </div>
        
        <div id="result" class="mt-6"></div>
    </div>
    
    <script>
        function quickFix() {
            if (confirm('这将清除所有本地数据并跳转到登录页面。确定继续吗？')) {
                localStorage.clear();
                sessionStorage.clear();
                alert('✅ 已清除所有数据！\\n\\n现在请重新登录。');
                window.location.href = '/';
            }
        }
        
        function checkToken() {
            const result = document.getElementById('result');
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            
            if (!token) {
                result.innerHTML = \`
                    <div class="p-4 bg-red-100 border-l-4 border-red-500 rounded">
                        <p class="font-bold text-red-800">❌ 未找到Token</p>
                        <p class="text-red-700 mt-2">请先登录系统</p>
                        <a href="/" class="inline-block mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                            前往登录
                        </a>
                    </div>
                \`;
                return;
            }
            
            try {
                const parts = token.split('.');
                if (parts.length !== 3) throw new Error('Token格式无效');
                
                const payload = JSON.parse(atob(parts[1]));
                const now = Math.floor(Date.now() / 1000);
                const isExpired = payload.exp && payload.exp < now;
                
                result.innerHTML = \`
                    <div class="p-4 \${isExpired ? 'bg-red-100 border-red-500' : 'bg-green-100 border-green-500'} border-l-4 rounded">
                        <p class="font-bold \${isExpired ? 'text-red-800' : 'text-green-800'}">
                            \${isExpired ? '❌ Token已过期' : '✅ Token有效'}
                        </p>
                        <div class="mt-2 text-sm">
                            <p><strong>用户:</strong> \${payload.username} (ID: \${payload.id})</p>
                            <p><strong>邮箱:</strong> \${payload.email}</p>
                            \${payload.exp ? \`<p><strong>过期时间:</strong> \${new Date(payload.exp * 1000).toLocaleString()}</p>\` : ''}
                        </div>
                        \${isExpired ? \`
                            <button onclick="quickFix()" class="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                                重新登录
                            </button>
                        \` : ''}
                    </div>
                \`;
            } catch (error) {
                result.innerHTML = \`
                    <div class="p-4 bg-red-100 border-l-4 border-red-500 rounded">
                        <p class="font-bold text-red-800">❌ Token无效</p>
                        <p class="text-red-700 mt-2">\${error.message}</p>
                        <button onclick="quickFix()" class="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                            清除并重新登录
                        </button>
                    </div>
                \`;
            }
        }
        
        async function testAPI() {
            const result = document.getElementById('result');
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            
            if (!token) {
                result.innerHTML = \`
                    <div class="p-4 bg-red-100 border-l-4 border-red-500 rounded">
                        <p class="font-bold text-red-800">❌ 请先检查Token</p>
                    </div>
                \`;
                return;
            }
            
            result.innerHTML = \`
                <div class="p-4 bg-blue-100 border-l-4 border-blue-500 rounded">
                    <p class="font-bold text-blue-800">🔄 正在测试...</p>
                </div>
            \`;
            
            try {
                const response = await fetch('/api/reviews/275', {
                    headers: { 'Authorization': \`Bearer \${token}\` }
                });
                const data = await response.json();
                
                if (response.ok) {
                    result.innerHTML = \`
                        <div class="p-4 bg-green-100 border-l-4 border-green-500 rounded">
                            <p class="font-bold text-green-800">✅ 测试成功！</p>
                            <div class="mt-2 text-sm">
                                <p><strong>标题:</strong> \${data.review?.title || 'N/A'}</p>
                                <p><strong>问题:</strong> \${data.questions?.length || 0}个</p>
                                <p><strong>状态:</strong> \${data.review?.status || 'N/A'}</p>
                            </div>
                            <a href="/" class="inline-block mt-3 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                                返回系统
                            </a>
                        </div>
                    \`;
                } else {
                    result.innerHTML = \`
                        <div class="p-4 bg-red-100 border-l-4 border-red-500 rounded">
                            <p class="font-bold text-red-800">❌ 测试失败</p>
                            <p class="text-red-700 mt-2">状态码: \${response.status}</p>
                            <p class="text-red-700">错误: \${data.error || 'Unknown'}</p>
                            \${response.status === 401 || response.status === 500 ? \`
                                <button onclick="quickFix()" class="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                                    一键修复
                                </button>
                            \` : ''}
                        </div>
                    \`;
                }
            } catch (error) {
                result.innerHTML = \`
                    <div class="p-4 bg-red-100 border-l-4 border-red-500 rounded">
                        <p class="font-bold text-red-800">❌ 请求失败</p>
                        <p class="text-red-700 mt-2">\${error.message}</p>
                    </div>
                \`;
            }
        }
        
        // Auto-check on load
        window.addEventListener('load', checkToken);
    </script>
</body>
</html>`);
};

// Register debug tool routes
app.get('/debug', debugTool);
app.get('/debug.html', debugTool);

app.get('/diagnostic.html', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>诊断工具 - Review System</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</head>
<body class="bg-gray-100 min-h-screen p-8">
    <div class="max-w-4xl mx-auto">
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h1 class="text-3xl font-bold text-gray-800 mb-4">
                <i class="fas fa-stethoscope mr-2"></i>
                系统诊断工具
            </h1>
            <p class="text-gray-600 mb-4">此页面帮助诊断缓存和部署问题</p>
        </div>

        <!-- 诊断结果 -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">诊断结果</h2>
            <div id="diagnostics" class="space-y-4">
                <!-- 诊断结果将显示在这里 -->
            </div>
        </div>

        <!-- 快速操作 -->
        <div class="bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">快速操作</h2>
            <div class="space-y-3">
                <button onclick="runDiagnostics()" class="w-full bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 transition">
                    <i class="fas fa-play mr-2"></i>运行诊断
                </button>
                <button onclick="clearCache()" class="w-full bg-yellow-600 text-white px-4 py-3 rounded hover:bg-yellow-700 transition">
                    <i class="fas fa-broom mr-2"></i>清除缓存并重新加载
                </button>
                <button onclick="testAPI()" class="w-full bg-green-600 text-white px-4 py-3 rounded hover:bg-green-700 transition">
                    <i class="fas fa-flask mr-2"></i>测试 API 端点
                </button>
            </div>
        </div>
    </div>

    <script>
        // 添加诊断结果项
        function addDiagnostic(title, status, message, details = '') {
            const container = document.getElementById('diagnostics');
            const statusColors = {
                'success': 'bg-green-100 border-green-500 text-green-800',
                'error': 'bg-red-100 border-red-500 text-red-800',
                'warning': 'bg-yellow-100 border-yellow-500 text-yellow-800',
                'info': 'bg-blue-100 border-blue-500 text-blue-800'
            };
            
            const statusIcons = {
                'success': 'fa-check-circle',
                'error': 'fa-times-circle',
                'warning': 'fa-exclamation-triangle',
                'info': 'fa-info-circle'
            };

            const div = document.createElement('div');
            div.className = \`border-l-4 p-4 \${statusColors[status]}\`;
            div.innerHTML = \`
                <div class="flex items-start">
                    <i class="fas \${statusIcons[status]} mr-3 mt-1"></i>
                    <div class="flex-1">
                        <h3 class="font-bold">\${title}</h3>
                        <p class="mt-1">\${message}</p>
                        \${details ? \`<pre class="mt-2 p-2 bg-white bg-opacity-50 rounded text-xs overflow-x-auto">\${details}</pre>\` : ''}
                    </div>
                </div>
            \`;
            container.appendChild(div);
        }

        // 运行诊断
        async function runDiagnostics() {
            const container = document.getElementById('diagnostics');
            container.innerHTML = '<p class="text-gray-500">正在运行诊断...</p>';

            // 1. 检查前端文件
            addDiagnostic('检查前端文件', 'info', '正在检查 app.js 文件...');
            
            try {
                const response = await fetch('/static/app.js', {cache: 'reload'});
                const text = await response.text();
                const fileSize = text.length;
                const hasOwner = text.includes('answerOwner');
                const hasRequired = text.includes('answerRequired');
                const hasAdminAll = text.includes('/api/templates/admin/all');
                
                if (hasOwner && hasRequired && hasAdminAll) {
                    addDiagnostic(
                        '前端代码',
                        'success',
                        '✅ 前端代码是最新版本',
                        \`文件大小: \${fileSize} bytes\\n包含 owner 字段: \${hasOwner}\\n包含 required 字段: \${hasRequired}\\n使用正确的 API 路径: \${hasAdminAll}\`
                    );
                } else {
                    addDiagnostic(
                        '前端代码',
                        'error',
                        '❌ 前端代码可能是旧版本',
                        \`文件大小: \${fileSize} bytes\\n包含 owner 字段: \${hasOwner}\\n包含 required 字段: \${hasRequired}\\n使用正确的 API 路径: \${hasAdminAll}\\n\\n请清除浏览器缓存！\`
                    );
                }
            } catch (error) {
                addDiagnostic('前端代码', 'error', '❌ 无法加载前端文件', error.message);
            }

            // 2. 检查浏览器信息
            const browserInfo = \`浏览器: \${navigator.userAgent}\\n时间: \${new Date().toISOString()}\\nURL: \${window.location.href}\`;
            addDiagnostic('浏览器信息', 'info', '当前浏览器环境', browserInfo);

            // 3. 检查 localStorage
            const localStorageSize = JSON.stringify(localStorage).length;
            addDiagnostic(
                'LocalStorage',
                'info',
                \`LocalStorage 大小: \${localStorageSize} bytes\`,
                \`Token 存在: \${!!localStorage.getItem('token')}\\nUser 存在: \${!!localStorage.getItem('user')}\`
            );

            // 4. 检查 Service Worker
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                if (registrations.length > 0) {
                    addDiagnostic(
                        'Service Worker',
                        'warning',
                        \`检测到 \${registrations.length} 个 Service Worker\`,
                        'Service Worker 可能会缓存旧版本代码。建议取消注册。'
                    );
                } else {
                    addDiagnostic('Service Worker', 'success', '未检测到 Service Worker');
                }
            }
        }

        // 清除缓存
        function clearCache() {
            // 清除 localStorage（保留认证信息）
            const token = localStorage.getItem('token');
            const user = localStorage.getItem('user');
            
            // 清除 Service Worker
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                    registrations.forEach(reg => reg.unregister());
                });
            }
            
            // 提示用户
            alert('即将清除缓存并重新加载页面。\\n\\n请按以下步骤操作：\\n1. 点击确定后，页面将重新加载\\n2. 如果问题仍然存在，请使用 Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac) 强制刷新');
            
            // 重新加载页面（强制从服务器获取）
            window.location.reload(true);
        }

        // 测试 API
        async function testAPI() {
            const container = document.getElementById('diagnostics');
            container.innerHTML = '<p class="text-gray-500">正在测试 API...</p>';

            // 测试公开端点
            addDiagnostic('API 测试', 'info', '测试 GET /api/templates');
            try {
                const response = await axios.get('/api/templates');
                if (response.status === 401) {
                    addDiagnostic('API 端点', 'success', '✅ GET /api/templates 返回 401（预期行为：需要认证）');
                } else {
                    addDiagnostic('API 端点', 'success', \`✅ GET /api/templates 返回 \${response.status}\`, JSON.stringify(response.data, null, 2));
                }
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    addDiagnostic('API 端点', 'success', '✅ GET /api/templates 返回 401（预期行为：需要认证）');
                } else {
                    addDiagnostic('API 端点', 'error', \`❌ GET /api/templates 失败: \${error.message}\`);
                }
            }

            // 测试管理员端点（需要认证）
            const token = localStorage.getItem('token');
            if (token) {
                addDiagnostic('API 测试', 'info', '测试 GET /api/templates/admin/all（带认证）');
                try {
                    const response = await axios.get('/api/templates/admin/all', {
                        headers: { 'Authorization': \`Bearer \${token}\` }
                    });
                    addDiagnostic(
                        'API 端点',
                        'success',
                        \`✅ GET /api/templates/admin/all 返回 \${response.status}\`,
                        \`模板数量: \${response.data.templates?.length || 0}\`
                    );
                } catch (error) {
                    addDiagnostic(
                        'API 端点',
                        'error',
                        \`❌ GET /api/templates/admin/all 失败\`,
                        \`状态码: \${error.response?.status}\\n错误: \${error.response?.data?.error || error.message}\`
                    );
                }
            } else {
                addDiagnostic('API 测试', 'warning', '⚠️ 未登录，跳过管理员端点测试');
            }
        }

        // 页面加载时自动运行诊断
        window.addEventListener('load', () => {
            setTimeout(runDiagnostics, 500);
        });
    </script>
</body>
</html>`);
});

// MarketPlace Admin page
app.get('/marketplace-admin.html', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MarketPlace 管理后台 - Review System</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <style>
      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      @keyframes fade-in {
        from { opacity: 0; transform: translateX(100%); }
        to { opacity: 1; transform: translateX(0); }
      }
      .animate-fade-in {
        animation: fade-in 0.3s ease-out;
      }
    </style>
</head>
<body class="bg-gray-50">
    <nav class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center space-x-8">
                    <a href="/" class="text-xl font-bold text-blue-600">
                        <i class="fas fa-store mr-2"></i>MarketPlace 管理
                    </a>
                    <div class="flex space-x-4">
                        <button onclick="MarketplaceAdmin.switchView('products')"
                            class="admin-tab px-3 py-2 text-sm font-medium border-b-2 border-blue-600 text-blue-600">
                            <i class="fas fa-shopping-bag mr-2"></i>产品管理
                        </button>
                        <button onclick="MarketplaceAdmin.switchView('templates')"
                            class="admin-tab px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                            <i class="fas fa-file-alt mr-2"></i>写作模板
                        </button>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <a href="/" class="text-gray-600 hover:text-gray-900">
                        <i class="fas fa-home mr-2"></i>返回首页
                    </a>
                </div>
            </div>
        </div>
    </nav>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div id="admin-content">
            <div class="text-center py-12">
                <i class="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
                <p class="text-gray-600">加载中...</p>
            </div>
        </div>
    </div>
    <div id="notification-container" class="fixed top-4 right-4 z-50 space-y-2"></div>
    <script src="/static/i18n.js"></script>
    <script src="/static/marketplace_admin.js"></script>
    <script>
        function showNotification(message, type = 'info') {
            const container = document.getElementById('notification-container');
            const notification = document.createElement('div');
            const bgColors = {
                'success': 'bg-green-500',
                'error': 'bg-red-500',
                'warning': 'bg-yellow-500',
                'info': 'bg-blue-500'
            };
            notification.className = \`\${bgColors[type] || bgColors.info} text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 animate-fade-in\`;
            notification.innerHTML = \`
                <span>\${message}</span>
                <button onclick="this.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            \`;
            container.appendChild(notification);
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transition = 'opacity 0.3s';
                setTimeout(() => notification.remove(), 300);
            }, 5000);
        }
        window.showNotification = showNotification;
    </script>
</body>
</html>`);
});

// My Documents page
app.get('/my-documents.html', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>我的文档复盘 - Review System</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</head>
<body class="bg-gray-50 min-h-screen">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <a href="/" class="flex items-center">
                        <i class="fas fa-book-open text-blue-600 text-2xl"></i>
                        <span class="ml-2 text-xl font-bold text-gray-900">Review System</span>
                    </a>
                    <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
                        <a href="/famous-books-documents" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                            <i class="fas fa-file-alt mr-2"></i>
                            创建文档复盘
                        </a>
                        <a href="/my-documents" class="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                            <i class="fas fa-list mr-2"></i>
                            我的文档复盘
                        </a>
                        <a href="/my-reviews" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                            <i class="fas fa-history mr-2"></i>
                            我的复盘
                        </a>
                    </div>
                </div>
                <div class="flex items-center">
                    <span id="userName" class="text-gray-700 mr-4"></span>
                    <button onclick="logout()" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                        <i class="fas fa-sign-out-alt mr-2"></i>
                        退出登录
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Header -->
        <div class="mb-8">
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">
                        <i class="fas fa-file-alt text-blue-600 mr-3"></i>
                        我的文档复盘
                    </h1>
                    <p class="mt-2 text-gray-600">查看和管理您的所有文档复盘记录</p>
                </div>
                <a href="/famous-books-documents" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    <i class="fas fa-plus mr-2"></i>
                    创建新文档复盘
                </a>
            </div>
        </div>

        <!-- Statistics Cards -->
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
            <div class="bg-white overflow-hidden shadow rounded-lg">
                <div class="px-4 py-5 sm:p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 bg-blue-500 rounded-md p-3">
                            <i class="fas fa-file-alt text-white text-2xl"></i>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-sm font-medium text-gray-500 truncate">总文档数</dt>
                                <dd class="text-3xl font-semibold text-gray-900" id="totalDocuments">0</dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
                <div class="px-4 py-5 sm:p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 bg-green-500 rounded-md p-3">
                            <i class="fas fa-check-circle text-white text-2xl"></i>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-sm font-medium text-gray-500 truncate">已完成</dt>
                                <dd class="text-3xl font-semibold text-gray-900" id="completedDocuments">0</dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
                <div class="px-4 py-5 sm:p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                            <i class="fas fa-clock text-white text-2xl"></i>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-sm font-medium text-gray-500 truncate">草稿</dt>
                                <dd class="text-3xl font-semibold text-gray-900" id="draftDocuments">0</dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Loading State -->
        <div id="loadingState" class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span class="ml-3 text-gray-600">加载中...</span>
        </div>

        <!-- Empty State -->
        <div id="emptyState" class="hidden bg-white rounded-lg shadow-sm p-12 text-center">
            <i class="fas fa-file-alt text-gray-400 text-6xl mb-4"></i>
            <h3 class="text-lg font-medium text-gray-900 mb-2">还没有文档复盘</h3>
            <p class="text-gray-500 mb-6">开始创建您的第一个文档复盘吧！</p>
            <a href="/famous-books-documents" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                <i class="fas fa-plus mr-2"></i>
                创建文档复盘
            </a>
        </div>

        <!-- Documents List -->
        <div id="documentsList" class="hidden bg-white shadow-sm rounded-lg overflow-hidden">
            <div class="px-4 py-5 sm:p-6">
                <div class="space-y-4" id="documentsContainer"></div>
            </div>
        </div>
    </div>

    <!-- View Document Modal -->
    <div id="viewModal" class="hidden fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div class="px-6 py-4 border-b border-gray-200">
                <div class="flex justify-between items-center">
                    <h3 class="text-xl font-semibold text-gray-900" id="modalTitle"></h3>
                    <button onclick="closeViewModal()" class="text-gray-400 hover:text-gray-500">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
            </div>
            <div class="px-6 py-4">
                <div id="modalContent" class="prose max-w-none"></div>
            </div>
            <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button onclick="closeViewModal()" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                    关闭
                </button>
                <button onclick="editDocument()" class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
                    编辑
                </button>
            </div>
        </div>
    </div>

    <script>
        let currentUser = null;
        let documents = [];
        let currentDocumentId = null;

        // Check authentication
        async function checkAuth() {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    window.location.href = '/login.html';
                    return;
                }

                const response = await axios.get('/api/auth/me', {
                    headers: { 'Authorization': \`Bearer \${token}\` }
                });

                currentUser = response.data.user;
                document.getElementById('userName').textContent = currentUser.username;

                // Check subscription
                if (currentUser.role !== 'admin' && (!currentUser.subscription_tier || currentUser.subscription_tier === 'free')) {
                    alert('需要高级订阅才能访问文档复盘功能');
                    window.location.href = '/';
                    return;
                }

                loadDocuments();
            } catch (error) {
                console.error('Auth check failed:', error);
                localStorage.removeItem('token');
                window.location.href = '/login.html';
            }
        }

        // Load documents
        async function loadDocuments() {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('/api/reviews/documents', {
                    headers: { 'Authorization': \`Bearer \${token}\` }
                });

                documents = response.data.reviews || [];
                
                // Hide loading
                document.getElementById('loadingState').classList.add('hidden');

                if (documents.length === 0) {
                    document.getElementById('emptyState').classList.remove('hidden');
                    updateStatistics(0, 0, 0);
                } else {
                    document.getElementById('documentsList').classList.remove('hidden');
                    displayDocuments();
                    updateStatistics();
                }
            } catch (error) {
                console.error('Load documents failed:', error);
                document.getElementById('loadingState').classList.add('hidden');
                alert('加载文档失败');
            }
        }

        // Update statistics
        function updateStatistics(total, completed, draft) {
            if (arguments.length === 0) {
                total = documents.length;
                completed = documents.filter(d => d.status === 'completed').length;
                draft = documents.filter(d => d.status === 'draft').length;
            }
            
            document.getElementById('totalDocuments').textContent = total;
            document.getElementById('completedDocuments').textContent = completed;
            document.getElementById('draftDocuments').textContent = draft;
        }

        // Display documents
        function displayDocuments() {
            const container = document.getElementById('documentsContainer');
            container.innerHTML = documents.map(doc => {
                const createdDate = new Date(doc.created_at).toLocaleDateString('zh-CN');
                const updatedDate = new Date(doc.updated_at).toLocaleDateString('zh-CN');
                const statusBadge = doc.status === 'completed' 
                    ? '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">已完成</span>'
                    : '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">草稿</span>';

                return \`
                    <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div class="flex justify-between items-start mb-3">
                            <div class="flex-1">
                                <h3 class="text-lg font-semibold text-gray-900 mb-1">\${escapeHtml(doc.title || '未命名文档')}</h3>
                                <p class="text-sm text-gray-600">\${escapeHtml(doc.description || '暂无描述')}</p>
                            </div>
                            \${statusBadge}
                        </div>
                        <div class="flex items-center justify-between text-sm text-gray-500 mb-3">
                            <div class="flex items-center space-x-4">
                                <span><i class="fas fa-calendar-plus mr-1"></i>创建: \${createdDate}</span>
                                <span><i class="fas fa-calendar-alt mr-1"></i>更新: \${updatedDate}</span>
                            </div>
                        </div>
                        <div class="flex space-x-2">
                            <button onclick="viewDocument(\${doc.id})" class="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-100">
                                <i class="fas fa-eye mr-2"></i>查看
                            </button>
                            <button onclick="editDocument(\${doc.id})" class="flex-1 px-3 py-2 bg-gray-50 text-gray-600 rounded-md text-sm font-medium hover:bg-gray-100">
                                <i class="fas fa-edit mr-2"></i>编辑
                            </button>
                            <button onclick="deleteDocument(\${doc.id})" class="px-3 py-2 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                \`;
            }).join('');
        }

        // View document
        function viewDocument(id) {
            const doc = documents.find(d => d.id === id);
            if (!doc) return;

            currentDocumentId = id;
            document.getElementById('modalTitle').textContent = doc.title || '未命名文档';
            
            // Format content
            let content = '<div class="space-y-4">';
            
            if (doc.description) {
                content += \`<div><p class="text-gray-700">\${escapeHtml(doc.description)}</p></div>\`;
            }
            
            // Try to parse answers
            try {
                const answers = JSON.parse(doc.answers || '{}');
                if (Object.keys(answers).length > 0) {
                    content += '<div class="border-t border-gray-200 pt-4 mt-4">';
                    content += '<h4 class="font-semibold text-gray-900 mb-3">分析内容</h4>';
                    for (const [key, value] of Object.entries(answers)) {
                        content += \`
                            <div class="mb-4">
                                <h5 class="font-medium text-gray-700 mb-2">\${escapeHtml(key)}</h5>
                                <p class="text-gray-600 whitespace-pre-wrap">\${escapeHtml(value)}</p>
                            </div>
                        \`;
                    }
                    content += '</div>';
                }
            } catch (e) {
                // If not JSON, display as plain text
                if (doc.answers) {
                    content += \`<div class="mt-4"><p class="text-gray-700 whitespace-pre-wrap">\${escapeHtml(doc.answers)}</p></div>\`;
                }
            }
            
            content += '</div>';
            
            document.getElementById('modalContent').innerHTML = content;
            document.getElementById('viewModal').classList.remove('hidden');
        }

        // Close view modal
        function closeViewModal() {
            document.getElementById('viewModal').classList.add('hidden');
            currentDocumentId = null;
        }

        // Edit document
        function editDocument(id = currentDocumentId) {
            if (!id && currentDocumentId) {
                id = currentDocumentId;
            }
            // Redirect to edit page (you can implement this)
            window.location.href = \`/famous-books-documents?edit=\${id}\`;
        }

        // Delete document
        async function deleteDocument(id) {
            if (!confirm('确定要删除这个文档复盘吗？此操作不可撤销。')) {
                return;
            }

            try {
                const token = localStorage.getItem('token');
                await axios.delete(\`/api/reviews/\${id}\`, {
                    headers: { 'Authorization': \`Bearer \${token}\` }
                });

                alert('删除成功');
                documents = documents.filter(d => d.id !== id);
                
                if (documents.length === 0) {
                    document.getElementById('documentsList').classList.add('hidden');
                    document.getElementById('emptyState').classList.remove('hidden');
                } else {
                    displayDocuments();
                }
                updateStatistics();
            } catch (error) {
                console.error('Delete failed:', error);
                alert('删除失败');
            }
        }

        // Logout
        function logout() {
            localStorage.removeItem('token');
            window.location.href = '/login.html';
        }

        // Escape HTML
        function escapeHtml(text) {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            return text ? text.replace(/[&<>"']/g, m => map[m]) : '';
        }

        // Initialize
        checkAuth();
    </script>
</body>
</html>`);
});

// Main page - Login/Dashboard
app.get('/', (c) => {
  // Get PayPal Client ID from environment variables
  const paypalClientId = c.env.PAYPAL_CLIENT_ID || 'YOUR_PAYPAL_CLIENT_ID';
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title id="page-title">系统复盘 - Review System</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
        <!-- TinyMCE - Rich Text Editor with Chinese language support -->
        <script src="https://cdn.jsdelivr.net/npm/tinymce@6.8.2/tinymce.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/tinymce-lang@2.0.0/langs6/zh_CN.js"></script>
        <!-- Marked.js - Markdown to HTML converter -->
        <script src="https://cdn.jsdelivr.net/npm/marked@11.0.0/marked.min.js"></script>
        <!-- Google Sign-In -->
        <script src="https://accounts.google.com/gsi/client" async defer></script>
        <!-- PayPal SDK - Client ID from environment variables -->
        <script src="https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD" data-sdk-integration-source="button-factory"></script>
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        <!-- 移动版快速入口 -->
        <a href="/mobile" class="fixed bottom-4 right-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all z-50 flex items-center gap-2 md:hidden">
            <i class="fas fa-mobile-alt"></i>
            <span>移动版</span>
        </a>
        
        <div id="app"></div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/i18n.js?v=9.0.0"></script>
        <script src="/static/review_enhancements.js?v=9.0.0"></script>
        <!-- Manhattan Project - AI Writing System -->
        <script src="/static/ai_books.js?v=9.0.0"></script>
        <script src="/static/agents.js?v=9.0.0"></script>
        <script src="/static/app.js?v=9.2.0"></script>
    </body>
    </html>
  `);
});

// 404 Handler - must be last
app.notFound(notFoundHandler);

export default app;
