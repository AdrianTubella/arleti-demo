// database.js
const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');

// Ruta de la base de datos (en la raíz del proyecto)
const dbPath = path.join(__dirname, 'materiales.db');
const db = new Database(dbPath);

console.log('✅ Conectado a la base de datos SQLite');

// Crear tablas si no existen
db.exec(`
  CREATE TABLE IF NOT EXISTS materiales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL,
    cantidad INTEGER NOT NULL,
    unidad TEXT NOT NULL,
    precio REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    rol TEXT NOT NULL CHECK(rol IN ('admin', 'worker')),
    activo INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ✅ CREAR ADMIN AUTOMÁTICO (para demos en Vercel)
const ADMIN_EMAIL = 'admin@arleti-demo.com';
const ADMIN_PASSWORD = 'Admin123!';

try {
  // Verificar si ya existe el admin
  const stmt = db.prepare('SELECT id FROM usuarios WHERE email = ?');
  const existingAdmin = stmt.get(ADMIN_EMAIL);

  if (!existingAdmin) {
    // Hashear contraseña
    const hashedPassword = bcrypt.hashSync(ADMIN_PASSWORD, 10);
    
    // Insertar admin
    const insert = db.prepare(`
      INSERT INTO usuarios (email, password, rol, activo) 
      VALUES (?, ?, ?, ?)
    `);
    insert.run(ADMIN_EMAIL, hashedPassword, 'admin', 1);
    
    console.log('✅ Admin creado para demo:');
    console.log(`   📧 Email: ${ADMIN_EMAIL}`);
    console.log(`   🔑 Contraseña: ${ADMIN_PASSWORD}`);
  } else {
    console.log('ℹ️ Admin ya existe en la base de datos');
  }
} catch (err) {
  console.error('❌ Error al configurar admin:', err.message);
}

// Exportar base de datos
module.exports = db;