const dotenv = require('dotenv');

dotenv.config();

const { getConfig } = require('../src/config');
const { closeDb, connectToDb, initializeDatabase } = require('../src/db');

async function main() {
  const config = getConfig(process.env);
  const db = connectToDb(config.dbPath);

  try {
    await initializeDatabase(db);
    console.log(`Database ready at ${config.dbPath}`);
  } catch (err) {
    console.error('Failed to initialize database.', err.message);
    process.exitCode = 1;
  } finally {
    await closeDb(db);
  }
}

main();
