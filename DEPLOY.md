# Deploying to Vercel

## Why this setup exists

Vercel runs the app as serverless functions with a **read-only filesystem**. The
app previously used `better-sqlite3` against `data/evalley.db`, so `SELECT`
worked (the file ships in the bundle) but every `INSERT`/`UPDATE`/`DELETE`
failed — which is why products displayed fine while login, register, add-to-cart
and checkout all returned 500.

The database layer now talks to **Turso** (hosted libSQL) over the network, so
writes work on Vercel. Locally, with no env vars set, it still opens
`data/evalley.db` as a plain file — same code path, no separate driver.

## One-time setup

### 1. Create the Turso database

```bash
# install the CLI (macOS/Linux)
curl -sSfL https://get.tur.so/install.sh | bash
# Windows: use WSL, or scoop install turso

turso auth signup
turso db create evalley

turso db show evalley --url        # -> libsql://evalley-<org>.turso.io
turso db tokens create evalley     # -> a long token
```

### 2. Point your local app at it (optional but recommended)

Create `.env.local`:

```
TURSO_DATABASE_URL=libsql://evalley-<org>.turso.io
TURSO_AUTH_TOKEN=<token>
```

### 3. Create the schema and seed data

```bash
npm run db:migrate
```

This runs against whatever `TURSO_DATABASE_URL` points at (or the local file if
it is unset). It is safe to re-run: tables use `IF NOT EXISTS` and seeding is
skipped when products already exist.

Verify:

```bash
node inspect-db.js
```

### 4. Set the variables on Vercel

Project → **Settings → Environment Variables**, for **Production, Preview and
Development**:

| Name | Value |
|---|---|
| `TURSO_DATABASE_URL` | `libsql://evalley-<org>.turso.io` |
| `TURSO_AUTH_TOKEN` | the token from step 1 |

Optional, for real SMS OTP (otherwise the fixed test code `123456` is used):
`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`.

### 5. Redeploy

Push to the branch Vercel tracks, or hit **Redeploy** in the dashboard.
Environment variables are only picked up by a **new** deployment.

## Verifying the deploy

On the live site:

1. Register a new account → the OTP screen appears → enter `123456` → signed in.
2. Add a product to the cart → the header count increases.
3. Add an address, then check out with Cash on Delivery → an order appears
   under Account → Orders.

If a POST still fails, open **Vercel → Deployment → Logs** and read the error.
`TURSO_DATABASE_URL is not set` means step 4 was missed or the deploy predates it.

## Notes

- `data/evalley.db` is now only used for local development. Production data
  lives in Turso and is not affected by deploys.
- Sessions are rows in the `sessions` table, so they survive across serverless
  instances — this is what makes login work on Vercel at all.
- `npm run db:migrate` never drops anything; to reset, delete the Turso database
  and recreate it.
