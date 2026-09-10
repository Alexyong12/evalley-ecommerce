import { createClient } from '@libsql/client';

export { hashPassword, verifyPassword } from './password.mjs';

// Database client. Locally this opens data/evalley.db as a plain file; on Vercel
// TURSO_DATABASE_URL points at a hosted Turso database, because the serverless
// filesystem is read-only and every write against a bundled .db file fails.
const url = process.env.TURSO_DATABASE_URL || 'file:data/evalley.db';
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

// Fail loudly rather than falling back to a read-only bundled file, where reads
// would appear to work and every write would return an opaque 500.
if (process.env.VERCEL && url.startsWith('file:')) {
  throw new Error('TURSO_DATABASE_URL is not set. Add it in Vercel > Settings > Environment Variables.');
}

const client = globalThis.__evalleyClient || createClient({ url, authToken });
globalThis.__evalleyClient = client;

function isNamedArgs(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
    && !ArrayBuffer.isView(v) && Object.getPrototypeOf(v) === Object.prototype;
}

// libsql rejects undefined and booleans; better-sqlite3 call sites pass both.
function normalizeValue(v) {
  if (v === undefined) return null;
  if (typeof v === 'boolean') return v ? 1 : 0;
  return v;
}

function normalizeArgs(args) {
  if (args.length === 1 && isNamedArgs(args[0])) {
    return Object.fromEntries(Object.entries(args[0]).map(([k, v]) => [k, normalizeValue(v)]));
  }
  return args.map(normalizeValue);
}

// libsql Row objects carry both positional and named access; rebuild them as
// plain objects so they serialise cleanly through NextResponse.json.
function toObject(columns, row) {
  const out = {};
  for (let i = 0; i < columns.length; i++) out[columns[i]] = row[i];
  return out;
}

// better-sqlite3-shaped statement, except every method returns a Promise.
function statement(execute, sql) {
  return {
    async get(...args) {
      const rs = await execute(sql, normalizeArgs(args));
      return rs.rows.length ? toObject(rs.columns, rs.rows[0]) : undefined;
    },
    async all(...args) {
      const rs = await execute(sql, normalizeArgs(args));
      return rs.rows.map(r => toObject(rs.columns, r));
    },
    async run(...args) {
      const rs = await execute(sql, normalizeArgs(args));
      return {
        changes: rs.rowsAffected,
        lastInsertRowid: rs.lastInsertRowid == null ? null : Number(rs.lastInsertRowid),
      };
    },
  };
}

const clientExecute = (sql, args) => client.execute({ sql, args });

const db = {
  prepare: (sql) => statement(clientExecute, sql),

  // Runs fn inside a write transaction, rolling back if it throws.
  // Usage: await db.transaction(async (tx) => { await tx.prepare(...).run(...) })
  async transaction(fn) {
    const tx = await client.transaction('write');
    try {
      const result = await fn({ prepare: (sql) => statement((sql_, args) => tx.execute({ sql: sql_, args }), sql) });
      await tx.commit();
      return result;
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  },

  // Multiple statements in one round trip - used by the migration script.
  executeMultiple: (sql) => client.executeMultiple(sql),
};

export default db;
