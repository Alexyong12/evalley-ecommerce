import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const dataDir = path.join(process.cwd(), 'data');
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, 'evalley.db');

let db = globalThis.__evalleyDb;
if (!db) {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  globalThis.__evalleyDb = db;
  init(db);
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
export function verifyPassword(password, stored) {
  if (!stored) return false;
  const [salt, hash] = stored.split(':');
  const check = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'));
}

function init(db) {
  db.exec(`
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
  `);
  seed(db);
}

function seed(db) {
  const count = db.prepare('SELECT COUNT(*) c FROM products').get().c;
  if (count > 0) return;

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
  const ic = db.prepare('INSERT INTO categories (slug,name,blurb,parent) VALUES (?,?,?,?)');
  cats.forEach(c => ic.run(...c));

  const brands = [
    ['apple', 'Apple', 'Consumer electronics and computing.'],
    ['samsung', 'Samsung', 'Phones, displays and home appliances.'],
    ['sony', 'Sony', 'Audio, imaging and entertainment.'],
    ['anker', 'Anker', 'Charging and mobile accessories.'],
    ['xiaomi', 'Xiaomi', 'Smartphones and connected home devices.'],
    ['uniqlo', 'Uniqlo', 'Everyday apparel basics.'],
    ['angkor', 'Angkor', 'Cambodian beverages.'],
  ];
  const ib = db.prepare('INSERT INTO brands (slug,name,blurb) VALUES (?,?,?)');
  brands.forEach(b => ib.run(...b));

  const vendors = [
    ['hour-lourk-macha', 'hour lourk macha', 'KH'],
    ['khmer-mart-168', 'Khmer Mart 168', 'KH'],
    ['ohhhwow', 'ohhhwow', 'KH'],
  ];
  const iv = db.prepare('INSERT INTO vendors (slug,name,country) VALUES (?,?,?)');
  vendors.forEach(v => iv.run(...v));

  const ip = db.prepare(`INSERT INTO products
    (slug,name,brand,category,subcategory,price,original_price,stock,sku,description,specification,is_featured,is_bestseller,vendor,color)
    VALUES (@slug,@name,@brand,@category,@subcategory,@price,@original_price,@stock,@sku,@description,@specification,@is_featured,@is_bestseller,@vendor,@color)`);
  const P = (o) => ip.run({ subcategory: null, original_price: null, specification: 'See description.', is_featured: 0, is_bestseller: 0, vendor: 'hour-lourk-macha', color: '#e8734a', ...o });

  P({ slug: 'amok-fish', name: 'Amok-fish', brand: 'angkor', category: 'kitchen', price: 1.00, stock: 25, sku: 'AMOK-FISH-9999', description: 'Traditional Khmer fish amok, ready to enjoy.', is_featured: 1, color: '#2f9e6e' });
  P({ slug: 'cotton-crew-neck-t-shirt', name: 'Cotton Crew Neck T-Shirt', brand: 'uniqlo', category: 'mens-clothing', price: 19.90, stock: 40, sku: 'UNI-TEE-001', description: 'Soft cotton crew neck tee for everyday wear.', is_featured: 1, color: '#5a7d5a' });
  P({ slug: 'sony-wh-1000xm5-headphones', name: 'Sony WH-1000XM5 Headphones', brand: 'sony', category: 'electronics', subcategory: 'audio', price: 399.00, stock: 12, sku: 'SONY-XM5', description: 'Industry-leading noise cancelling headphones.', is_featured: 1, is_bestseller: 1, color: '#2b2b2b' });
  P({ slug: 'macbook-air-13-m3', name: 'MacBook Air 13" M3', brand: 'apple', category: 'electronics', subcategory: 'laptops', price: 1299.00, stock: 8, sku: 'APL-MBA13-M3', description: 'Thin, light and fast with the M3 chip.', is_featured: 1, color: '#3b5b7d' });
  P({ slug: 'samsung-galaxy-s24-256gb', name: 'Samsung Galaxy S24 256GB', brand: 'samsung', category: 'electronics', subcategory: 'smartphones', price: 849.00, stock: 15, sku: 'SAM-S24-256', description: 'Galaxy AI flagship with a brilliant display.', is_featured: 1, color: '#6b6b8f' });
  P({ slug: 'iphone-15-pro-256gb', name: 'iPhone 15 Pro 256GB', brand: 'apple', category: 'electronics', subcategory: 'smartphones', price: 1099.00, stock: 19, sku: 'APL-IP15P-256', description: 'Titanium design, A17 Pro chip and a 48MP main camera.', is_featured: 1, is_bestseller: 1, color: '#8f8f96' });
  P({ slug: 'T-Shirt', name: 'T-Shirt', brand: 'uniqlo', category: 'mens-clothing', price: 9.00, original_price: 10.00, stock: 10, sku: 'O7-199', description: 'Classic tee at 10% off.', is_featured: 1, color: '#b0563c' });
  P({ slug: 'beer', name: 'Cambodia Beer', brand: 'angkor', category: 'drink', price: 1.00, stock: 0, sku: 'BEER-KH', description: 'Refreshing Cambodian lager.', is_featured: 1, color: '#c9a227' });
  P({ slug: 'anker-powercore-20000mah', name: 'Anker PowerCore 20000mAh', brand: 'anker', category: 'electronics', price: 49.99, stock: 30, sku: 'ANK-PC20K', description: 'High-capacity portable charger.', is_bestseller: 1, color: '#1f6f8b' });
  P({ slug: 'xiaomi-redmi-note-13-128gb', name: 'Xiaomi Redmi Note 13 128GB', brand: 'xiaomi', category: 'electronics', subcategory: 'smartphones', price: 229.00, stock: 22, sku: 'XIA-RN13', description: 'Big battery, sharp AMOLED display.', is_bestseller: 1, color: '#4f7d4f' });
  P({ slug: '16-piece-ceramic-dinner-set', name: '16-Piece Ceramic Dinner Set', brand: 'angkor', category: 'kitchen', price: 39.90, stock: 14, sku: 'KIT-CER16', description: 'Elegant ceramic set for four.', is_bestseller: 1, vendor: 'khmer-mart-168', color: '#7d5a7d' });
  P({ slug: '10-piece-stainless-cookware-set', name: '10-Piece Stainless Cookware Set', brand: 'angkor', category: 'kitchen', price: 129.00, stock: 9, sku: 'KIT-SS10', description: 'Durable stainless cookware for daily cooking.', is_bestseller: 1, vendor: 'khmer-mart-168', color: '#5a6b7d' });

  // T-Shirt variants: consistent stock (fixes the variant-stock bug found in E2E testing)
  const tshirt = db.prepare('SELECT id FROM products WHERE slug=?').get('T-Shirt');
  const ivt = db.prepare('INSERT INTO variants (product_id,size,color,stock,sku) VALUES (?,?,?,?,?)');
  ivt.run(tshirt.id, 'S', 'Black', 6, 'O7-199-S-BLK');
  ivt.run(tshirt.id, 'M', 'Black', 4, 'O7-199-M-BLK');

  // Test account: 0123456789 / 12345678
  const iu = db.prepare('INSERT INTO users (name,identifier,identifier_type,birthdate,password,verified) VALUES (?,?,?,?,?,1)');
  const u1 = iu.run('QA Tester', '0123456789', 'phone', '1995-05-15', hashPassword('12345678')).lastInsertRowid;
  const u2 = iu.run('Sokha Vann', 'sokha.vann@example.com', 'email', '1992-03-10', hashPassword('Sokha@12345')).lastInsertRowid;

  db.prepare(`INSERT INTO addresses (user_id,label,recipient_name,phone,country_code,line1,city,postal_code,is_default)
    VALUES (?,?,?,?,?,?,?,?,1)`).run(u1, 'Home', 'User 1', '012345678', 'KH', 'National Road No 2, near IIC University of Technology', 'Siem Reap', '32212');

  // Approved seed reviews (so product pages show real review data)
  const ir = db.prepare('INSERT INTO reviews (product_id,user_id,author,rating,body,status) VALUES (?,?,?,?,?,?)');
  const pid = (slug) => db.prepare('SELECT id FROM products WHERE slug=?').get(slug).id;
  ir.run(pid('iphone-15-pro-256gb'), u2, 'Sokha Vann', 5, 'Amazing camera and battery life. Worth it.', 'Approved');
  ir.run(pid('sony-wh-1000xm5-headphones'), u2, 'Sokha Vann', 4, 'Great noise cancelling for flights.', 'Approved');
  ir.run(pid('anker-powercore-20000mah'), u2, 'Sokha Vann', 4, 'Charges my phone four times.', 'Approved');
}

export default db;
