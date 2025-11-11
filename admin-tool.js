// admin-tool.js
const db = require('./database');
const { hashPassword } = require('./auth');

console.log('🛠️  Herramienta de administración - Usuarios');
console.log('---------------------------------------------');

// 1. Listar todos los usuarios
db.all(`SELECT id, email, rol, activo, createdAt FROM usuarios`, [], (err, rows) => {
  if (err) {
    console.error('❌ Error al leer usuarios:', err.message);
    db.close(() => process.exit(1));
    return;
  }

  if (rows.length === 0) {
    console.log('📭 No hay usuarios en la base de datos.');
  } else {
    console.log(`✅ Usuarios (${rows.length}):`);
    rows.forEach(u => {
      const estado = u.activo ? '🟢 activo' : '🟡 pendiente';
      console.log(`   ID: ${u.id} | ${u.email} | ${u.rol} | ${estado}`);
    });
  }

  console.log('');

  // 2. ¿Crear admin si no existe?
  const adminExists = rows.some(u => u.rol === 'admin');
  if (!adminExists) {
    console.log('❓ No se encontró administrador. Creando uno...');
    crearAdminPorDefecto();
  } else {
    console.log('✅ Ya existe al menos un administrador.');
    preguntarCambiarContrasena();
  }
});

function crearAdminPorDefecto() {
  const email = 'admin@empresa.com';
  const pass = 'admin123';

  hashPassword(pass)
    .then(hashed => {
      db.run(
        `INSERT INTO usuarios (email, password, rol, activo) VALUES (?, ?, ?, ?)`,
        [email, hashed, 'admin', 1],
        function (err) {
          if (err) {
            console.error('❌ Error al crear admin:', err.message);
          } else {
            console.log(`✅ Administrador creado:`);
            console.log(`   📧 ${email}`);
            console.log(`   🔑 ${pass}  ← ¡Guárdala!`);
          }
          db.close(() => process.exit());
        }
      );
    })
    .catch(err => {
      console.error('❌ Error al hashear contraseña:', err);
      db.close(() => process.exit(1));
    });
}

function preguntarCambiarContrasena() {
  // Solo mostramos opción (en un script simple, no usamos readline para no complicar)
  console.log('\n💡 Para cambiar la contraseña del admin:');
  console.log('   1. Inicia sesión con el admin');
  console.log('   2. Agrega una ruta PUT /api/admin/change-password (puedo ayudarte)');
  console.log('   3. O dime y te genero un script para cambiarla aquí mismo.');
  db.close(() => process.exit());
}