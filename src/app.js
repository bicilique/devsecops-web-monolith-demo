const path = require('path');
const express = require('express');
const session = require('express-session');

const { assertRuntimeConfig, getConfig } = require('./config');
const { all, findUserByUsername, get, getDashboardSnapshot, run } = require('./db');
const { createAuthRouter } = require('./routes/auth');
const { createAdminRouter } = require('./routes/admin');
const { createProductsRouter } = require('./routes/products');
const { createProductService } = require('./services/productService');
const { createAuditService } = require('./services/auditService');
const { createUploadMiddleware } = require('./middleware/upload');
const { requireAuth } = require('./middleware/auth');

function createApp(options = {}) {
  const app = express();
  const config = assertRuntimeConfig(options.config || getConfig(process.env));
  const db = options.db;
  const productService = options.productService || createProductService({
    all: (sql, params) => all(db, sql, params),
    get: (sql, params) => get(db, sql, params),
    run: (sql, params) => run(db, sql, params)
  });
  const auditService = options.auditService || createAuditService({
    all: (sql, params) => all(db, sql, params),
    get: (sql, params) => get(db, sql, params),
    run: (sql, params) => run(db, sql, params)
  });
  const uploadMiddleware = options.upload || createUploadMiddleware();
  const dbApi = {
    findUserByUsername: (username) => findUserByUsername(db, username),
    getDashboardSnapshot: (limit) => getDashboardSnapshot(db, limit)
  };

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(
    session({
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: false,
        sameSite: false,
        secure: false
      }
    })
  );
  app.use(express.static(path.join(__dirname, 'public')));
  app.locals.lessonBranch = 'lesson/03-sca-container-fixes';
  app.locals.lessonPurpose = 'Dependency and container fixes restored. DAST lessons remain intentionally unresolved.';

  app.get('/', (req, res) => {
    if (req.session && req.session.user) {
      res.redirect('/admin');
      return;
    }

    res.redirect('/login');
  });
  app.use(
    createAuthRouter({
      db: dbApi,
      passwordService: options.passwordService
    })
  );
  app.use(
    createAdminRouter({
      db: {
        ...dbApi,
        auditService
      },
      requireAuth
    })
  );
  app.use(
    createProductsRouter({
      productService,
      auditService,
      requireAuth,
      upload: uploadMiddleware
    })
  );

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use((req, res) => {
    res.status(404).render('error', {
      title: 'Not Found',
      heading: 'Page not found',
      message: 'Requested page does not exist.'
    });
  });

  app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = err.expose ? err.message : 'Unexpected error.';
    const title = status === 400 ? 'Bad Request' : status === 404 ? 'Not Found' : 'Application Error';
    const heading = status === 400 ? 'Request rejected' : status === 404 ? 'Page not found' : 'Something went wrong';

    res.status(status).render('error', {
      title,
      heading,
      message
    });
  });

  return app;
}

module.exports = {
  createApp,
  requireAuth
};
