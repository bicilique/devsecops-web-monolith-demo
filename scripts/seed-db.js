const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const { getConfig, getRequiredAdminPassword } = require('../src/config');
const { closeDb, connectToDb, initializeDatabase, seedDatabase } = require('../src/db');

async function main() {
  const config = getConfig(process.env);
  const db = connectToDb(config.dbPath);

  try {
    await initializeDatabase(db);
    const passwordHash = await bcrypt.hash(getRequiredAdminPassword(config), 10);
    await seedDatabase(db, passwordHash);
    console.log(`Database seeded at ${config.dbPath}`);
  } catch (err) {
    console.error('Failed to seed database.', err.message);
    process.exitCode = 1;
  } finally {
    await closeDb(db);
  }
}

main();
