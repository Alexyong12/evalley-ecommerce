// Creates the schema and seeds starter data in whatever database the
// environment points at. Run once against Turso before the first deploy:
//   npm run db:migrate
// Safe to re-run: tables use IF NOT EXISTS and seeding is skipped when
// products already exist.

import fs from 'fs';
import path from 'path';
import { createClient } from '@libsql/client';
import { hashPassword } from '../lib/password.mjs';

loadEnvFile('.env.local');
loadEnvFile('.env');

function loadEnvFile(file) {
  const full = path.join(process.cwd(), file);
  if (!fs.existsSync(full)) return;
  for (const line of fs.readFileSync(full, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const value = m[2].replace(/^["']|["']$/g, '');
    if (process.env[m[1]] === undefined && value) process.env[m[1]] = value;
  }
}

const url = process.env.TURSO_DATABASE_URL || 'file:data/evalley.db';
const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN || undefined });

const run = (sql, args = []) => client.execute({ sql, args });

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  identifier TEXT UNIQUE NOT NULL,
  identifier_type TEXT NOT NULL,
  birthdate TEXT,
  password TEXT NOT NULL,
  avatar TEXT,
  verified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS categories (
  slug TEXT PRIMARY KEY, name TEXT, blurb TEXT, parent TEXT
);
CREATE TABLE IF NOT EXISTS brands (
  slug TEXT PRIMARY KEY, name TEXT, blurb TEXT
);
CREATE TABLE IF NOT EXISTS vendors (
  slug TEXT PRIMARY KEY, name TEXT, country TEXT
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT REFERENCES brands(slug),
  category TEXT REFERENCES categories(slug),
  subcategory TEXT,
  price REAL NOT NULL,
  original_price REAL,
  stock INTEGER NOT NULL DEFAULT 0,
  sku TEXT,
  description TEXT,
  specification TEXT,
  is_featured INTEGER DEFAULT 0,
  is_bestseller INTEGER DEFAULT 0,
  vendor TEXT REFERENCES vendors(slug),
  color TEXT DEFAULT '#e8734a'
);
CREATE TABLE IF NOT EXISTS variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER REFERENCES products(id),
  size TEXT, color TEXT, stock INTEGER NOT NULL DEFAULT 0, sku TEXT
);
CREATE TABLE IF NOT EXISTS cart_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cart_key TEXT NOT NULL,
  product_id INTEGER REFERENCES products(id),
  variant_id INTEGER,
  qty INTEGER NOT NULL DEFAULT 1,
  UNIQUE(cart_key, product_id, variant_id)
);
CREATE TABLE IF NOT EXISTS wishlist (
  user_id INTEGER REFERENCES users(id),
  product_id INTEGER REFERENCES products(id),
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, product_id)
);
CREATE TABLE IF NOT EXISTS addresses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  label TEXT, recipient_name TEXT NOT NULL, phone TEXT NOT NULL,
  country_code TEXT NOT NULL, line1 TEXT NOT NULL, line2 TEXT,
  city TEXT NOT NULL, state TEXT, postal_code TEXT NOT NULL,
  is_default INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'Pending',
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'Unpaid',
  pay_token TEXT,
  note TEXT,
  coupon TEXT,
  subtotal REAL NOT NULL, delivery REAL NOT NULL, discount REAL DEFAULT 0, total REAL NOT NULL,
  address_text TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  cancelled_at TEXT
);
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER, name TEXT, variant TEXT, sku TEXT, price REAL, qty INTEGER
);
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER REFERENCES products(id),
  user_id INTEGER REFERENCES users(id),
  author TEXT,
  rating INTEGER NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  title TEXT, body TEXT, kind TEXT DEFAULT 'Order',
  read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  sender TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS otps (
  identifier TEXT NOT NULL,
  purpose TEXT NOT NULL,
  code TEXT NOT NULL,
  payload TEXT,
  attempts INTEGER DEFAULT 0,
  expires_at INTEGER NOT NULL,
  last_sent INTEGER,
  PRIMARY KEY (identifier, purpose)
);
CREATE TABLE IF NOT EXISTS login_attempts (
  identifier TEXT PRIMARY KEY,
  count INTEGER DEFAULT 0,
  locked_until INTEGER
);
`;

async function seed() {
  const existing = await run('SELECT COUNT(*) c FROM products');
  if (existing.rows[0].c > 0) {
    console.log('Products already present - skipping seed.');
    return;
  }

  const cats = [
    ['electronics', 'Electronics', 'Phones, laptops, audio and everyday tech.', null],
    ['smartphones', 'Smartphones', 'Flagship and mid-range handsets.', 'electronics'],
    ['kitchen', 'Kitchen', 'Cookware, tableware and small appliances.', null],
    ['mens-clothing', "Men's Clothing", 'Shirts, tees and outerwear.', null],
    ['drink', 'Drink', 'Beverages for every occasion.', null],
    ['laptops', 'Laptops', 'Work and play machines.', 'electronics'],
    ['home-living', 'Home & Living', 'Comfort for every room.', null],
    ['furniture', 'Furniture', 'Tables, chairs and storage.', null],
    ['audio', 'Audio', 'Headphones and speakers.', 'electronics'],
    ['fashion', 'Fashion', 'Style for every season.', null],
  ];
  for (const c of cats) {
    await run('INSERT INTO categories (slug,name,blurb,parent) VALUES (?,?,?,?)', c);
  }

  const brands = [
    ['apple', 'Apple', 'Consumer electronics and computing.'],
    ['samsung', 'Samsung', 'Phones, displays and home appliances.'],
    ['sony', 'Sony', 'Audio, imaging and entertainment.'],
    ['anker', 'Anker', 'Charging and mobile accessories.'],
    ['xiaomi', 'Xiaomi', 'Smartphones and connected home devices.'],
    ['uniqlo', 'Uniqlo', 'Everyday apparel basics.'],
    ['angkor', 'Angkor', 'Cambodian beverages.'],
  ];
  for (const b of brands) {
    await run('INSERT INTO brands (slug,name,blurb) VALUES (?,?,?)', b);
  }

  const vendors = [
    ['hour-lourk-macha', 'hour lourk macha', 'KH'],
    ['khmer-mart-168', 'Khmer Mart 168', 'KH'],
    ['ohhhwow', 'ohhhwow', 'KH'],
  ];
  for (const v of vendors) {
    await run('INSERT INTO vendors (slug,name,country) VALUES (?,?,?)', v);
  }

  const PRODUCT_SQL = `INSERT INTO products
    (slug,name,brand,category,subcategory,price,original_price,stock,sku,description,specification,is_featured,is_bestseller,vendor,color)
    VALUES (:slug,:name,:brand,:category,:subcategory,:price,:original_price,:stock,:sku,:description,:specification,:is_featured,:is_bestseller,:vendor,:color)`;
  const P = (o) => run(PRODUCT_SQL, {
    subcategory: null, original_price: null, specification: 'See description.',
    is_featured: 0, is_bestseller: 0, vendor: 'hour-lourk-macha', color: '#e8734a', ...o,
  });

  await P({ slug: 'amok-fish', name: 'Amok-fish', brand: 'angkor', category: 'kitchen', price: 1.00, stock: 25, sku: 'AMOK-FISH-9999', description: 'Traditional Khmer fish amok, ready to enjoy.', is_featured: 1, color: '#2f9e6e' });
  await P({ slug: 'cotton-crew-neck-t-shirt', name: 'Cotton Crew Neck T-Shirt', brand: 'uniqlo', category: 'mens-clothing', price: 19.90, stock: 40, sku: 'UNI-TEE-001', description: 'Soft cotton crew neck tee for everyday wear.', is_featured: 1, color: '#5a7d5a' });
  await P({ slug: 'sony-wh-1000xm5-headphones', name: 'Sony WH-1000XM5 Headphones', brand: 'sony', category: 'electronics', subcategory: 'audio', price: 399.00, stock: 12, sku: 'SONY-XM5', description: 'Industry-leading noise cancelling headphones.', is_featured: 1, is_bestseller: 1, color: '#2b2b2b' });
  await P({ slug: 'macbook-air-13-m3', name: 'MacBook Air 13" M3', brand: 'apple', category: 'electronics', subcategory: 'laptops', price: 1299.00, stock: 8, sku: 'APL-MBA13-M3', description: 'Thin, light and fast with the M3 chip.', is_featured: 1, color: '#3b5b7d' });
  await P({ slug: 'samsung-galaxy-s24-256gb', name: 'Samsung Galaxy S24 256GB', brand: 'samsung', category: 'electronics', subcategory: 'smartphones', price: 849.00, stock: 15, sku: 'SAM-S24-256', description: 'Galaxy AI flagship with a brilliant display.', is_featured: 1, color: '#6b6b8f' });
  await P({ slug: 'iphone-15-pro-256gb', name: 'iPhone 15 Pro 256GB', brand: 'apple', category: 'electronics', subcategory: 'smartphones', price: 1099.00, stock: 19, sku: 'APL-IP15P-256', description: 'Titanium design, A17 Pro chip and a 48MP main camera.', is_featured: 1, is_bestseller: 1, color: '#8f8f96' });
  await P({ slug: 'T-Shirt', name: 'T-Shirt', brand: 'uniqlo', category: 'mens-clothing', price: 9.00, original_price: 10.00, stock: 10, sku: 'O7-199', description: 'Classic tee at 10% off.', is_featured: 1, color: '#b0563c' });
  await P({ slug: 'beer', name: 'Cambodia Beer', brand: 'angkor', category: 'drink', price: 1.00, stock: 0, sku: 'BEER-KH', description: 'Refreshing Cambodian lager.', is_featured: 1, color: '#c9a227' });
  await P({ slug: 'anker-powercore-20000mah', name: 'Anker PowerCore 20000mAh', brand: 'anker', category: 'electronics', price: 49.99, stock: 30, sku: 'ANK-PC20K', description: 'High-capacity portable charger.', is_bestseller: 1, color: '#1f6f8b' });
  await P({ slug: 'xiaomi-redmi-note-13-128gb', name: 'Xiaomi Redmi Note 13 128GB', brand: 'xiaomi', category: 'electronics', subcategory: 'smartphones', price: 229.00, stock: 22, sku: 'XIA-RN13', description: 'Big battery, sharp AMOLED display.', is_bestseller: 1, color: '#4f7d4f' });
  await P({ slug: '16-piece-ceramic-dinner-set', name: '16-Piece Ceramic Dinner Set', brand: 'angkor', category: 'kitchen', price: 39.90, stock: 14, sku: 'KIT-CER16', description: 'Elegant ceramic set for four.', is_bestseller: 1, vendor: 'khmer-mart-168', color: '#7d5a7d' });
  await P({ slug: '10-piece-stainless-cookware-set', name: '10-Piece Stainless Cookware Set', brand: 'angkor', category: 'kitchen', price: 129.00, stock: 9, sku: 'KIT-SS10', description: 'Durable stainless cookware for daily cooking.', is_bestseller: 1, vendor: 'khmer-mart-168', color: '#5a6b7d' });

  // T-Shirt variants: consistent stock (fixes the variant-stock bug found in E2E testing)
  const tshirt = await run('SELECT id FROM products WHERE slug=?', ['T-Shirt']);
  const tshirtId = tshirt.rows[0].id;
  const VARIANT_SQL = 'INSERT INTO variants (product_id,size,color,stock,sku) VALUES (?,?,?,?,?)';
  await run(VARIANT_SQL, [tshirtId, 'S', 'Black', 6, 'O7-199-S-BLK']);
  await run(VARIANT_SQL, [tshirtId, 'M', 'Black', 4, 'O7-199-M-BLK']);

  // Test account: 0123456789 / 12345678
  const USER_SQL = 'INSERT INTO users (name,identifier,identifier_type,birthdate,password,verified) VALUES (?,?,?,?,?,1)';
  const u1 = Number((await run(USER_SQL, ['QA Tester', '0123456789', 'phone', '1995-05-15', hashPassword('12345678')])).lastInsertRowid);
  const u2 = Number((await run(USER_SQL, ['Sokha Vann', 'sokha.vann@example.com', 'email', '1992-03-10', hashPassword('Sokha@12345')])).lastInsertRowid);

  await run(`INSERT INTO addresses (user_id,label,recipient_name,phone,country_code,line1,city,postal_code,is_default)
    VALUES (?,?,?,?,?,?,?,?,1)`,
    [u1, 'Home', 'User 1', '012345678', 'KH', 'National Road No 2, near IIC University of Technology', 'Siem Reap', '32212']);

  // Approved seed reviews (so product pages show real review data)
  const pid = async (slug) => (await run('SELECT id FROM products WHERE slug=?', [slug])).rows[0].id;
  const REVIEW_SQL = 'INSERT INTO reviews (product_id,user_id,author,rating,body,status) VALUES (?,?,?,?,?,?)';
  await run(REVIEW_SQL, [await pid('iphone-15-pro-256gb'), u2, 'Sokha Vann', 5, 'Amazing camera and battery life. Worth it.', 'Approved']);
  await run(REVIEW_SQL, [await pid('sony-wh-1000xm5-headphones'), u2, 'Sokha Vann', 4, 'Great noise cancelling for flights.', 'Approved']);
  await run(REVIEW_SQL, [await pid('anker-powercore-20000mah'), u2, 'Sokha Vann', 4, 'Charges my phone four times.', 'Approved']);
  console.log('Seeded starter catalogue and test accounts.');
}

console.log('Migrating', url.startsWith('file:') ? url : url.replace(/\/\/.*@/, '//'));
await client.executeMultiple(SCHEMA);
console.log('Schema ready.');
await seed();
console.log('Done.');
