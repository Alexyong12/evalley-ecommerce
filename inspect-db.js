// Quick database inspector.
// Usage:
//   node inspect-db.js                          -> list all tables + row counts
//   node inspect-db.js users                    -> show all rows of a table
//   node inspect-db.js "SELECT * FROM orders"   -> run any SELECT query
// Reads TURSO_DATABASE_URL from .env.local/.env when set, otherwise the local file.
const fs = require('fs');
const path = require('path');
const { createClient } = require('@libsql/client');

for (const file of ['.env.local', '.env']) {
  const full = path.join(process.cwd(), file);
  if (!fs.existsSync(full)) continue;
  for (const line of fs.readFileSync(full, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const value = m[2].replace(/^["']|["']$/g, '');
    if (process.env[m[1]] === undefined && value) process.env[m[1]] = value;
  }
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:data/evalley.db',
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

const arg = process.argv.slice(2).join(' ').trim();

const toObject = (rs, row) => Object.fromEntries(rs.columns.map((c, i) => [c, row[i]]));

async function main() {
  if (!arg) {
    const tables = await client.execute(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`);
    console.log('TABLES IN evalley.db:\n');
    for (const row of tables.rows) {
      const name = row[0];
      const c = await client.execute(`SELECT COUNT(*) c FROM "${name}"`);
      console.log(`  ${name.padEnd(16)} ${c.rows[0][0]} rows`);
    }
    console.log('\nTip: node inspect-db.js users   or   node inspect-db.js "SELECT * FROM orders WHERE status=\'Pending\'"');
    return;
  }

  const sql = /^select/i.test(arg) ? arg : `SELECT * FROM "${arg}"`;
  const rs = await client.execute(sql);
  console.log(`${rs.rows.length} row(s):\n`);
  console.table(rs.rows.map(r => {
    const out = {};
    for (const [k, v] of Object.entries(toObject(rs, r))) {
      out[k] = typeof v === 'string' && v.length > 60 ? v.slice(0, 57) + '...' : v;
    }
    return out;
  }));
}

main().catch(e => { console.error('Query error:', e.message); process.exitCode = 1; });
