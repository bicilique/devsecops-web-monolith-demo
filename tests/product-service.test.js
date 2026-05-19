const { createProductService } = require('../src/services/productService');
const { createAuditService } = require('../src/services/auditService');
const { createSeededTempDb, destroyTempDb } = require('./helpers/temp-db');
const { all, get, run } = require('../src/db');

describe('Phase 3 product services', () => {
  let db;
  let dbPath;
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
  });

  afterEach(async () => {
    await destroyTempDb(db, dbPath);
  });

  test('lists seeded products', async () => {
    const products = await productService.listProducts();

    expect(products).toHaveLength(5);
    expect(products[0]).toHaveProperty('name');
  });

  test('searches by product name and category', async () => {
    const byName = await productService.searchProducts('lamp');
    const byCategory = await productService.searchProducts('office');
    const allProducts = await productService.searchProducts('   ');

    expect(byName.map((product) => product.name)).toContain('Studio Lamp');
    expect(byCategory.map((product) => product.name)).toContain('Studio Lamp');
    expect(allProducts).toHaveLength(5);
  });

  test('creates and updates product records', async () => {
    const createdProduct = await productService.createProduct({
      name: 'Signal Backpack',
      description: 'Workshop travel pack.',
      price: 75,
      category: 'Accessories',
      imagePath: '/uploads/signal-backpack.png'
    });

    expect(createdProduct.id).toBeDefined();
    expect(createdProduct.name).toBe('Signal Backpack');

    const updatedProduct = await productService.updateProduct(createdProduct.id, {
      name: 'Signal Backpack Pro',
      description: 'Workshop travel pack, revised.',
      price: 79,
      category: 'Accessories',
      imagePath: createdProduct.imagePath
    });

    expect(updatedProduct.name).toBe('Signal Backpack Pro');
    expect(updatedProduct.price).toBe(79);
  });

  test('writes and lists audit logs newest first', async () => {
    await auditService.logProductAction({
      username: 'admin',
      action: 'created product',
      entityId: 6,
      metadata: { name: 'Signal Backpack' }
    });

    const auditLogs = await auditService.listAuditLogs();

    expect(auditLogs[0].action).toBe('created product');
    expect(auditLogs[0].entityType).toBe('product');
  });

  test('validates parseProductId strictly', () => {
    expect(productService.parseProductId('12')).toBe(12);
    expect(productService.parseProductId('abc')).toBeNull();
    expect(productService.parseProductId('12.5')).toBeNull();
    expect(productService.parseProductId('-1')).toBeNull();
  });
});
