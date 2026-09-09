// Quick database inspector.
// Usage:
//   node inspect-db.js                          -> list all tables + row counts
//   node inspect-db.js users                    -> show all rows of a table
//   node inspect-db.js "SELECT * FROM orders"   -> run any SELECT query
const Database = require('better-sqlite3');
const db = new Database('data/evalley.db', { readonly: true });

const arg = process.argv.slice(2).join(' ').trim();

if (!arg) {
  const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`).all();
  console.log('TABLES IN evalley.db:\n');
  for (const t of tables) {
    const c = db.prepare(`SELECT COUNT(*) c FROM "${t.name}"`).get().c;
    console.log(`  ${t.name.padEnd(16)} ${c} rows`);
  }
  console.log('\nTip: node inspect-db.js users   or   node inspect-db.js "SELECT * FROM orders WHERE status=\'Pending\'"');
} else {
  const sql = /^select/i.test(arg) ? arg : `SELECT * FROM "${arg}"`;
  try {
    const rows = db.prepare(sql).all();
    console.log(`${rows.length} row(s):\n`);
    console.table(rows.map(r => {
      const out = {};
      for (const [k, v] of Object.entries(r)) out[k] = typeof v === 'string' && v.length > 60 ? v.slice(0, 57) + '...' : v;
      return out;
    }));
  } catch (e) {
    console.error('Query error:', e.message);
  }
}
