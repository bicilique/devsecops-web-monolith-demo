const path = require('path');
const express = require('express');

const { createProductsRouter } = require('../src/routes/products');
const { createProductService } = require('../src/services/productService');
const { createAuditService } = require('../src/services/auditService');
const { createSeededTempDb, destroyTempDb } = require('./helpers/temp-db');
const { all, get, run } = require('../src/db');
const { invokeApp } = require('./helpers/http');

describe('Phase 3 product routes', () => {
  let db;
  let dbPath;
  let app;
  let productService;
  let auditService;

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

    app = express();
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
        upload: {
          single() {
            return (req, res, next) => {
              req.file = req.mockFile || null;
              next();
            };
          }
        }
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
  });

  afterEach(async () => {
    await destroyTempDb(db, dbPath);
  });

  test('protects product list', async () => {
    const { res } = await invokeApp(app, {
      method: 'GET',
      url: '/admin/products'
    });

    expect(res.statusCode).toBe(302);
    expect(res._getRedirectUrl()).toBe('/login');
  });

  test('renders product list and search results', async () => {
    const session = {
      user: {
        username: 'admin',
        role: 'admin'
      }
    };

    const listResponse = await invokeApp(app, {
      method: 'GET',
      url: '/admin/products',
      session
    });
    const searchResponse = await invokeApp(app, {
      method: 'GET',
      url: '/admin/products/search',
      query: { q: 'office' },
      session
    });
    const emptySearchResponse = await invokeApp(app, {
      method: 'GET',
      url: '/admin/products/search',
      query: { q: '   ' },
      session
    });

    expect(listResponse.res.statusCode).toBe(200);
    expect(listResponse.res._getData()).toContain('Canvas Weekender');
    expect(searchResponse.res._getData()).toContain('Studio Lamp');
    expect(searchResponse.res._getData()).not.toContain('Canvas Weekender');
    expect(emptySearchResponse.res._getData()).toContain('Canvas Weekender');
  });

  test('rejects overlong search keyword inline', async () => {
    const session = {
      user: {
        username: 'admin',
        role: 'admin'
      }
    };

    const response = await invokeApp(app, {
      method: 'GET',
      url: '/admin/products/search',
      query: { q: 'x'.repeat(101) },
      session
    });

    expect(response.res.statusCode).toBe(200);
    expect(response.res._getData()).toContain('Search keyword must be 100 characters or fewer.');
    expect(response.res._getData()).toContain('Canvas Weekender');
  });

  test('renders detail view and rejects invalid id', async () => {
    const session = {
      user: {
        username: 'admin',
        role: 'admin'
      }
    };

    const detailResponse = await invokeApp(app, {
      method: 'GET',
      url: '/admin/products/1',
      params: { id: '1' },
      session
    });
    const invalidIdResponse = await invokeApp(app, {
      method: 'GET',
      url: '/admin/products/not-a-number',
      params: { id: 'not-a-number' },
      session
    });

    expect(detailResponse.res.statusCode).toBe(200);
    expect(detailResponse.res._getData()).toContain('Canvas Weekender');
    expect(invalidIdResponse.res.statusCode).toBe(400);
    expect(invalidIdResponse.res._getData()).toContain('Product ID must be an integer.');
  });

  test('creates product and audit log', async () => {
    const session = {
      user: {
        username: 'admin',
        role: 'admin'
      }
    };

    const createResponse = await invokeApp(app, {
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

    expect(createResponse.res.statusCode).toBe(302);
    expect(createResponse.res._getRedirectUrl()).toBe('/admin/products/6');

    const createdProduct = await productService.findProductById(6);
    const auditLogs = await auditService.listAuditLogs();

    expect(createdProduct.name).toBe('Signal Backpack');
    expect(createdProduct.imagePath).toBe('/uploads/signal-backpack.png');
    expect(auditLogs[0].action).toBe('created product');
  });

  test('updates product, preserves image when no file uploaded, shows audit page', async () => {
    const session = {
      user: {
        username: 'admin',
        role: 'admin'
      }
    };
    const existingProduct = await productService.findProductById(1);

    const updateResponse = await invokeApp(app, {
      method: 'POST',
      url: '/admin/products/1',
      params: { id: '1' },
      body: {
        name: 'Canvas Weekender Deluxe',
        description: existingProduct.description,
        price: '95',
        category: existingProduct.category
      },
      session
    });
    const updatedProduct = await productService.findProductById(1);
    const auditPageResponse = await invokeApp(app, {
      method: 'GET',
      url: '/admin/audit-logs',
      session
    });

    expect(updateResponse.res.statusCode).toBe(302);
    expect(updateResponse.res._getRedirectUrl()).toBe('/admin/products/1');
    expect(updatedProduct.name).toBe('Canvas Weekender Deluxe');
    expect(updatedProduct.imagePath).toBe(existingProduct.imagePath);
    expect(auditPageResponse.res.statusCode).toBe(200);
    expect(auditPageResponse.res._getData()).toContain('updated product');
  });

  test('rerenders form with full error list on invalid product input', async () => {
    const session = {
      user: {
        username: 'admin',
        role: 'admin'
      }
    };

    const response = await invokeApp(app, {
      method: 'POST',
      url: '/admin/products',
      body: {
        name: '',
        description: 'x'.repeat(2001),
        price: '-5',
        category: 'y'.repeat(101)
      },
      session
    });

    expect(response.res.statusCode).toBe(400);
    expect(response.res._getData()).toContain('Product name is required.');
    expect(response.res._getData()).toContain('Product description must be 2000 characters or fewer.');
    expect(response.res._getData()).toContain('Product price must be non-negative.');
    expect(response.res._getData()).toContain('Product category must be 100 characters or fewer.');
  });

  test('renders friendly upload error for rejected file', async () => {
    const session = {
      user: {
        username: 'admin',
        role: 'admin'
      }
    };

    const uploadErrorApp = express();
    uploadErrorApp.set('view engine', 'ejs');
    uploadErrorApp.set('views', path.join(process.cwd(), 'src', 'views'));
    uploadErrorApp.use(
      createProductsRouter({
        productService,
        auditService,
        requireAuth: (req, res, next) => next(),
        upload: {
          single() {
            return (req, res, next) => {
              next({
                status: 400,
                expose: true,
                message: 'Only image uploads are allowed.'
              });
            };
          }
        }
      })
    );
    uploadErrorApp.use((err, req, res, next) => {
      res.status(err.status || 500).render('error', {
        title: 'Bad Request',
        heading: 'Request rejected',
        message: err.expose ? err.message : 'Unexpected error.'
      });
    });

    const response = await invokeApp(uploadErrorApp, {
      method: 'POST',
      url: '/admin/products',
      body: {
        name: 'Signal Backpack',
        description: 'desc',
        price: '75',
        category: 'Accessories'
      },
      session
    });

    expect(response.res.statusCode).toBe(400);
    expect(response.res._getData()).toContain('Only image uploads are allowed.');
  });
});
