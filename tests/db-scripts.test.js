const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const { closeDb, connectToDb, get } = require('../src/db');

describe('Phase 2 database scripts', () => {
  const dbPath = path.join(os.tmpdir(), `minicart-script-${Date.now()}.sqlite`);
  const env = {
    ...process.env,
    SQLITE_DB_PATH: dbPath,
    SESSION_SECRET: 'phase2-test-secret',
    ADMIN_PASSWORD: 'script-seeded-password'
  };

  afterAll(() => {
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  });

  test('db:init creates required tables', async () => {
    execFileSync('node', ['scripts/init-db.js'], {
      cwd: process.cwd(),
      env,
      stdio: 'pipe'
    });

    const db = connectToDb(dbPath);
    const usersTable = await get(db, "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'");
    const productsTable = await get(db, "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'products'");
    const auditLogsTable = await get(db, "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'audit_logs'");
    await closeDb(db);

    expect(usersTable.name).toBe('users');
    expect(productsTable.name).toBe('products');
    expect(auditLogsTable.name).toBe('audit_logs');
  });

  test('db:seed inserts demo data', async () => {
    execFileSync('node', ['scripts/seed-db.js'], {
      cwd: process.cwd(),
      env,
      stdio: 'pipe'
    });

    const db = connectToDb(dbPath);
    const userCount = await get(db, 'SELECT COUNT(*) AS count FROM users');
    const productCount = await get(db, 'SELECT COUNT(*) AS count FROM products');
    const auditCount = await get(db, 'SELECT COUNT(*) AS count FROM audit_logs');
    const seededAdmin = await get(db, 'SELECT username, role, password_hash AS passwordHash FROM users WHERE username = ?', ['admin']);
    await closeDb(db);

    expect(userCount.count).toBe(1);
    expect(productCount.count).toBe(5);
    expect(auditCount.count).toBe(5);
    expect(seededAdmin.role).toBe('admin');
    expect(seededAdmin.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  test('db:reset recreates seeded state', async () => {
    execFileSync('node', ['scripts/reset-db.js'], {
      cwd: process.cwd(),
      env,
      stdio: 'pipe'
    });

    const db = connectToDb(dbPath);
    const productCount = await get(db, 'SELECT COUNT(*) AS count FROM products');
    const auditCount = await get(db, 'SELECT COUNT(*) AS count FROM audit_logs');
    await closeDb(db);

    expect(productCount.count).toBe(5);
    expect(auditCount.count).toBe(5);
  });

  test('db:seed fails without admin password env', () => {
    expect(() =>
      execFileSync('node', ['scripts/seed-db.js'], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          SQLITE_DB_PATH: dbPath,
          SESSION_SECRET: 'phase2-test-secret'
        },
        stdio: 'pipe'
      })
    ).toThrow();
  });
});
