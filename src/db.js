const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    category TEXT,
    image_path TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id INTEGER,
    metadata TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`
];

const SEEDED_PRODUCTS = [
  {
    name: 'Canvas Weekender',
    description: 'Travel-ready duffel bag for short warehouse runs.',
    price: 89.9,
    category: 'Accessories',
    imagePath: '/uploads/canvas-weekender.webp'
  },
  {
    name: 'Studio Lamp',
    description: 'Adjustable desk lamp for product photography station.',
    price: 59.5,
    category: 'Office',
    imagePath: '/uploads/studio-lamp.webp'
  },
  {
    name: 'Trail Bottle',
    description: 'Insulated bottle used in seasonal outdoor bundle.',
    price: 24.75,
    category: 'Outdoor',
    imagePath: '/uploads/trail-bottle.webp'
  },
  {
    name: 'Merino Throw',
    description: 'Soft throw blanket featured in premium catalog set.',
    price: 120,
    category: 'Home',
    imagePath: '/uploads/merino-throw.webp'
  },
  {
    name: 'Signal Notebook',
    description: 'Hardcover notebook used in welcome kit collection.',
    price: 18.25,
    category: 'Stationery',
    imagePath: '/uploads/signal-notebook.webp'
  }
];

const SEEDED_AUDIT_LOGS = [
  {
    username: 'admin',
    action: 'created sample catalog launch set',
    entityType: 'product',
    entityId: 1,
    metadata: JSON.stringify({ channel: 'seed', note: 'Initial workshop catalog import' })
  },
  {
    username: 'admin',
    action: 'updated merchandising copy',
    entityType: 'product',
    entityId: 2,
    metadata: JSON.stringify({ channel: 'seed', note: 'Refreshed office collection wording' })
  },
  {
    username: 'admin',
    action: 'reviewed seasonal pricing',
    entityType: 'product',
    entityId: 3,
    metadata: JSON.stringify({ channel: 'seed', note: 'Validated outdoor bundle pricing' })
  },
  {
    username: 'admin',
    action: 'approved premium home feature',
    entityType: 'product',
    entityId: 4,
    metadata: JSON.stringify({ channel: 'seed', note: 'Prepared hero product for dashboard demo' })
  },
  {
    username: 'admin',
    action: 'published stationery spotlight',
    entityType: 'product',
    entityId: 5,
    metadata: JSON.stringify({ channel: 'seed', note: 'Final seeded audit entry' })
  }
];

function ensureDbDirectory(dbPath) {
  const dirPath = path.dirname(dbPath);
  fs.mkdirSync(dirPath, { recursive: true });
}

function connectToDb(dbPath) {
  ensureDbDirectory(dbPath);

  return new sqlite3.Database(dbPath);
}

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function handleRun(err) {
      if (err) {
        reject(err);
        return;
      }

      resolve({
        lastID: this.lastID,
        changes: this.changes
      });
    });
  });
}

function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(row);
    });
  });
}

function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(rows);
    });
  });
}

function exec(db, sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}

function closeDb(db) {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}

async function initializeDatabase(db) {
  await exec(db, 'PRAGMA journal_mode = WAL;');

  for (const statement of SCHEMA_STATEMENTS) {
    await run(db, statement);
  }
}

async function seedDatabase(db, passwordHash) {
  const existingUser = await get(db, 'SELECT id FROM users WHERE username = ?', ['admin']);

  if (!existingUser) {
    await run(
      db,
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      ['admin', passwordHash, 'admin']
    );
  }

  const productCount = await get(db, 'SELECT COUNT(*) AS count FROM products');

  if (!productCount || productCount.count === 0) {
    for (const product of SEEDED_PRODUCTS) {
      await run(
        db,
        `INSERT INTO products (name, description, price, category, image_path)
         VALUES (?, ?, ?, ?, ?)`,
        [product.name, product.description, product.price, product.category, product.imagePath]
      );
    }
  }

  const auditCount = await get(db, 'SELECT COUNT(*) AS count FROM audit_logs');

  if (!auditCount || auditCount.count === 0) {
    for (const logEntry of SEEDED_AUDIT_LOGS) {
      await run(
        db,
        `INSERT INTO audit_logs (username, action, entity_type, entity_id, metadata)
         VALUES (?, ?, ?, ?, ?)`,
        [logEntry.username, logEntry.action, logEntry.entityType, logEntry.entityId, logEntry.metadata]
      );
    }
  }
}

async function getDashboardSnapshot(db, limit = 5) {
  const productCountRow = await get(db, 'SELECT COUNT(*) AS count FROM products');
  const auditCountRow = await get(db, 'SELECT COUNT(*) AS count FROM audit_logs');
  const auditLogs = await all(
    db,
    `SELECT username, action, entity_type AS entityType, entity_id AS entityId, metadata, created_at AS createdAt
     FROM audit_logs
     ORDER BY datetime(created_at) DESC, id DESC
     LIMIT ?`,
    [limit]
  );

  return {
    productCount: productCountRow ? productCountRow.count : 0,
    totalAuditLogCount: auditCountRow ? auditCountRow.count : 0,
    auditLogs
  };
}

function findUserByUsername(db, username) {
  return get(
    db,
    `SELECT id, username, password_hash AS passwordHash, role, created_at AS createdAt
     FROM users
     WHERE username = ?`,
    [username]
  );
}

module.exports = {
  SEEDED_AUDIT_LOGS,
  SEEDED_PRODUCTS,
  all,
  closeDb,
  connectToDb,
  ensureDbDirectory,
  exec,
  findUserByUsername,
  get,
  getDashboardSnapshot,
  initializeDatabase,
  run,
  seedDatabase
};
