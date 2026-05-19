const path = require('path');
const express = require('express');

const { createProductsRouter } = require('../src/routes/products');
const { createProductService } = require('../src/services/productService');
const { createAuditService } = require('../src/services/auditService');
const { all, get, run } = require('../src/db');
const { invokeApp } = require('./helpers/http');
const { createSeededTempDb, destroyTempDb } = require('./helpers/temp-db');

function buildProductsApp({ productService, auditService, upload }) {
  const app = express();

  app.set('view engine', 'ejs');
  app.set('views', path.join(process.cwd(), 'src', 'views'));
  app.use(
    createProductsRouter({
      productService,
      auditService,
      requireAuth: (req, res, next) => {
        if (!req.session || !req.session.user) {
          res.redirect('/login');
          return;
        }

        next();
      },
      upload
    })
  );
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

describe('Phase 5 products workflow coverage', () => {
  let db;
  let dbPath;
  let app;
  let productService;
  let auditService;
  let session;

  beforeEach(async () => {
    const tempDb = await createSeededTempDb();
    db = tempDb.db;
    dbPath = tempDb.dbPath;

    const dbApi = {
      all: (sql, params = []) => all(db, sql, params),
      get: (sql, params = []) => get(db, sql, params),
      run: (sql, params = []) => run(db, sql, params)
    };

    productService = createProductService(dbApi);
    auditService = createAuditService(dbApi);
    session = {
      user: {
        username: 'admin',
        role: 'admin'
      }
    };
    app = buildProductsApp({
      productService,
      auditService,
      upload: {
        single() {
          return (req, res, next) => {
            req.file = req.mockFile || null;
            next();
          };
        }
      }
    });
  });

  afterEach(async () => {
    await destroyTempDb(db, dbPath);
  });

  test('redirects unauthenticated catalog requests to login', async () => {
    const { res } = await invokeApp(app, {
      method: 'GET',
      url: '/admin/products'
    });

    expect(res.statusCode).toBe(302);
    expect(res._getRedirectUrl()).toBe('/login');
  });

  test('creates a valid product and redirects to its detail page', async () => {
    const response = await invokeApp(app, {
      method: 'POST',
      url: '/admin/products',
      body: {
        name: 'Signal Backpack',
        description: 'Workshop travel pack.',
        price: '75',
        category: 'Accessories'
      },
      file: {
        filename: 'signal-backpack.png'
      },
      session
    });

    const createdProduct = await productService.findProductById(6);

    expect(response.res.statusCode).toBe(302);
    expect(response.res._getRedirectUrl()).toBe('/admin/products/6');
    expect(createdProduct.name).toBe('Signal Backpack');
    expect(createdProduct.imagePath).toBe('/uploads/signal-backpack.png');
  });

  test('rejects missing product name inline', async () => {
    const response = await invokeApp(app, {
      method: 'POST',
      url: '/admin/products',
      body: {
        name: '',
        description: 'Workshop travel pack.',
        price: '75',
        category: 'Accessories'
      },
      session
    });

    expect(response.res.statusCode).toBe(400);
    expect(response.res._getData()).toContain('Product name is required.');
  });

  test('rejects invalid product price inline', async () => {
    const response = await invokeApp(app, {
      method: 'POST',
      url: '/admin/products',
      body: {
        name: 'Signal Backpack',
        description: 'Workshop travel pack.',
        price: 'not-a-price',
        category: 'Accessories'
      },
      session
    });

    expect(response.res.statusCode).toBe(400);
    expect(response.res._getData()).toContain('Product price must be numeric.');
  });

  test('returns matching product results for search', async () => {
    const response = await invokeApp(app, {
      method: 'GET',
      url: '/admin/products/search',
      query: { q: 'office' },
      session
    });

    expect(response.res.statusCode).toBe(200);
    expect(response.res._getData()).toContain('Studio Lamp');
    expect(response.res._getData()).not.toContain('Canvas Weekender');
  });

  test('rejects invalid product identifiers', async () => {
    const response = await invokeApp(app, {
      method: 'GET',
      url: '/admin/products/not-a-number',
      params: { id: 'not-a-number' },
      session
    });

    expect(response.res.statusCode).toBe(400);
    expect(response.res._getData()).toContain('Product ID must be an integer.');
  });

  test('accepts non-image file uploads on vulnerable branch', async () => {
    const response = await invokeApp(app, {
      method: 'POST',
      url: '/admin/products',
      body: {
        name: 'Signal Backpack',
        description: 'Workshop travel pack.',
        price: '75',
        category: 'Accessories'
      },
      file: {
        filename: 'payload.txt'
      },
      session
    });

    expect(response.res.statusCode).toBe(302);
    expect(response.res._getRedirectUrl()).toBe('/admin/products/6');
  });

  test('renders product descriptions without escaping on vulnerable branch', async () => {
    const createResponse = await invokeApp(app, {
      method: 'POST',
      url: '/admin/products',
      body: {
        name: 'Escaped Product',
        description: '<script>alert(1)</script>',
        price: '15',
        category: 'Testing'
      },
      session
    });
    const detailResponse = await invokeApp(app, {
      method: 'GET',
      url: '/admin/products/6',
      params: { id: '6' },
      session
    });

    expect(createResponse.res.statusCode).toBe(302);
    expect(detailResponse.res.statusCode).toBe(200);
    expect(detailResponse.res._getData()).toContain('<script>alert(1)</script>');
  });
});
