const dotenv = require('dotenv');
const fs = require('fs');
const bcrypt = require('bcryptjs');

dotenv.config();

const { getConfig, getRequiredAdminPassword } = require('../src/config');
const { closeDb, connectToDb, ensureDbDirectory, initializeDatabase, seedDatabase } = require('../src/db');

async function main() {
  const config = getConfig(process.env);

  ensureDbDirectory(config.dbPath);

  if (fs.existsSync(config.dbPath)) {
    fs.unlinkSync(config.dbPath);
  }

  const db = connectToDb(config.dbPath);

  try {
    await initializeDatabase(db);
    const passwordHash = await bcrypt.hash(getRequiredAdminPassword(config), 10);
    await seedDatabase(db, passwordHash);
    console.log(`Database reset at ${config.dbPath}`);
  } catch (err) {
    console.error('Failed to reset database.', err.message);
    process.exitCode = 1;
  } finally {
    await closeDb(db);
  }
}

main();
