// database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, 'materiales.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al abrir la base de datos:', err.message);
  } else {
    console.log('✅ Conectado a la base de datos SQLite');
  }
});

// Crear tablas
db.serialize(() => {
  // Tabla de materiales
  db.run(`CREATE TABLE IF NOT EXISTS materiales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL,
    cantidad INTEGER NOT NULL,
    unidad TEXT NOT NULL,
    precio REAL NOT NULL
  )`);

  // Tabla de usuarios
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    rol TEXT NOT NULL CHECK(rol IN ('admin', 'worker')),
    activo INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // === CREAR ADMINISTRADOR PREDETERMINADO ===
  const adminEmail = 'admin@empresa.com';
  const adminPasswordPlain = 'admin123'; // ← Contraseña en texto plano

  // Verificar si ya existe
  db.get(`SELECT id FROM usuarios WHERE email = ?`, [adminEmail], async (err, row) => {
    if (!row) {
      try {
        const hashedPassword = await bcrypt.hash(adminPasswordPlain, 10);
        db.run(
          `INSERT INTO usuarios (email, password, rol, activo) VALUES (?, ?, 'admin', 1)`,
          [adminEmail, hashedPassword],
          (err) => {
            if (err) {
              console.error('❌ Error al crear administrador:', err.message);
            } else {
              console.log('✅ Administrador creado:');
              console.log(`   Correo: ${adminEmail}`);
              console.log(`   Contraseña: ${adminPasswordPlain}`);
            }
          }
        );
      } catch (hashErr) {
        console.error('❌ Error al hashear contraseña:', hashErr);
      }
    } else {
      console.log('ℹ️  Administrador ya existe en la base de datos.');
    }
  });
});

module.exports = db;