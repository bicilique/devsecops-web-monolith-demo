const bcrypt = require('bcryptjs');
const path = require('path');
const express = require('express');

const { createApp } = require('../src/app');
const { createAuthRouter } = require('../src/routes/auth');
const { createAdminRouter } = require('../src/routes/admin');
const { invokeApp } = require('./helpers/http');
const { createSeededTempDb, destroyTempDb, TEST_ADMIN_PASSWORD } = require('./helpers/temp-db');

describe('Phase 2 auth flow', () => {
  let app;
  let db;
  let dbPath;

  beforeAll(async () => {
    const tempDb = await createSeededTempDb();
    db = tempDb.db;
    dbPath = tempDb.dbPath;
    app = createApp({
      config: {
        sessionSecret: 'phase2-test-secret',
        isProduction: false
      },
      db,
      passwordService: bcrypt
    });
  });

  afterAll(async () => {
    await destroyTempDb(db, dbPath);
  });

  test('redirects unauthenticated administrator from dashboard to login', async () => {
    const { res } = await invokeApp(app, {
      method: 'GET',
      url: '/admin'
    });

    expect(res.statusCode).toBe(302);
    expect(res._getRedirectUrl()).toBe('/login');
  });

  test('renders login page with helmet headers', async () => {
    const { res } = await invokeApp(app, {
      method: 'GET',
      url: '/login'
    });

    expect(res.statusCode).toBe(200);
    expect(res.getHeader('x-dns-prefetch-control')).toBe('off');
    expect(res._getData()).toContain('Administrator login');
  });

  test('shows generic error on invalid login', async () => {
    const { res } = await invokeApp(app, {
      method: 'POST',
      url: '/login',
      body: {
        username: 'admin',
        password: 'wrong-password'
      }
    });

    expect(res.statusCode).toBe(401);
    expect(res._getData()).toContain('Invalid username or password.');
  });

  test('creates session on valid login, then loads dashboard', async () => {
    const loginResponse = await invokeApp(app, {
      method: 'POST',
      url: '/login',
      body: {
        username: 'admin',
        password: TEST_ADMIN_PASSWORD
      }
    });

    expect(loginResponse.res.statusCode).toBe(302);
    expect(loginResponse.res._getRedirectUrl()).toBe('/admin');
    expect(loginResponse.req.session.user.username).toBe('admin');
    expect(loginResponse.req.session.cookie.httpOnly).toBe(true);
    expect(loginResponse.req.session.cookie.sameSite).toBe('lax');

    const dashboardApp = express();
    dashboardApp.set('view engine', 'ejs');
    dashboardApp.set('views', path.join(process.cwd(), 'src', 'views'));
    dashboardApp.use(
      createAdminRouter({
        db: {
          getDashboardSnapshot: async () => ({
            productCount: 5,
            auditLogs: [
              {
                username: 'admin',
                action: 'published stationery spotlight',
                entityType: 'product',
                entityId: 5
              }
            ]
          })
        },
        requireAuth: (req, res, next) => next()
      })
    );

    const dashboardResponse = await invokeApp(dashboardApp, {
      method: 'GET',
      url: '/admin',
      session: {
        user: {
          username: 'admin',
          role: 'admin'
        }
      }
    });

    expect(dashboardResponse.res.statusCode).toBe(200);
    expect(dashboardResponse.res._getData()).toContain('Product count');
    expect(dashboardResponse.res._getData()).toContain('Recent audit activity');
    expect(dashboardResponse.res._getData()).toContain('published stationery spotlight');
    // WORKSHOP_CI_DEMO: Keep this assertion paired with the dashboard spotlight sentence in src/views/dashboard.ejs.
    expect(dashboardResponse.res._getData()).toContain('Workshop spotlight: CI/CD confidence starts with one safe small change.');
  });

  test('destroys session on logout', async () => {
    const authApp = express();
    authApp.set('view engine', 'ejs');
    authApp.set('views', path.join(process.cwd(), 'src', 'views'));
    authApp.use(
      createAuthRouter({
        db: {
          findUserByUsername: async () => null
        },
        passwordService: bcrypt
      })
    );

    const session = {
      destroy(callback) {
        this.user = null;
        callback();
      }
    };

    const logoutResponse = await invokeApp(authApp, {
      method: 'POST',
      url: '/logout',
      session
    });

    expect(logoutResponse.res.statusCode).toBe(302);
    expect(logoutResponse.res._getRedirectUrl()).toBe('/login');
    expect(session.user).toBeNull();
  });

  test('shows generic error when login payload missing required fields', async () => {
    const { res } = await invokeApp(app, {
      method: 'POST',
      url: '/login',
      body: {
        username: '',
        password: ''
      }
    });

    expect(res.statusCode).toBe(401);
    expect(res._getData()).toContain('Invalid username or password.');
  });
});
