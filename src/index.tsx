import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
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

// Diagnostic page - serve directly
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
        <title>系统复盘 - Review System</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
        <!-- TinyMCE Editor - 支持表格和图片 -->
        <script src="https://cdn.tiny.cloud/1/1x8go7tqnj1rao7q5l4fwv1dkz2pg1z83edw2a4k5ffs004h/tinymce/6/tinymce.min.js" referrerpolicy="origin"></script>
        <!-- Marked.js - Markdown to HTML converter -->
        <script src="https://cdn.jsdelivr.net/npm/marked@11.0.0/marked.min.js"></script>
        <!-- Google Sign-In -->
        <script src="https://accounts.google.com/gsi/client" async defer></script>
        <!-- PayPal SDK - Client ID from environment variables -->
        <script src="https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD" data-sdk-integration-source="button-factory"></script>
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        <div id="app"></div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/i18n.js"></script>
        <!-- Manhattan Project - AI Writing System -->
        <script src="/static/ai_books.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `);
});

export default app;
