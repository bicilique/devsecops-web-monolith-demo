const fs = require('fs');
const os = require('os');
const path = require('path');
const bcrypt = require('bcryptjs');

const {
  closeDb,
  connectToDb,
  initializeDatabase,
  seedDatabase
} = require('../../src/db');

const TEST_ADMIN_PASSWORD = 'test-admin-password';

async function createSeededTempDb(options = {}) {
  const dbPath = path.join(os.tmpdir(), `minicart-phase2-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`);
  const db = connectToDb(dbPath);
  const passwordHash = await bcrypt.hash(options.adminPassword || TEST_ADMIN_PASSWORD, 10);

  await initializeDatabase(db);
  await seedDatabase(db, passwordHash);

  return { db, dbPath };
}

async function destroyTempDb(db, dbPath) {
  await closeDb(db);

  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
}

module.exports = {
  createSeededTempDb,
  destroyTempDb,
  TEST_ADMIN_PASSWORD
};
