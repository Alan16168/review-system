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

type Bindings = {
  DB: D1Database;
  GOOGLE_API_KEY?: string;
  GOOGLE_SEARCH_ENGINE_ID?: string;
  YOUTUBE_API_KEY?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  RESEND_API_KEY?: string;
  APP_URL?: string;
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

// Main page - Login/Dashboard
app.get('/', (c) => {
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
        <!-- Google Sign-In -->
        <script src="https://accounts.google.com/gsi/client" async defer></script>
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        <div id="app"></div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/i18n.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `);
});

export default app;
