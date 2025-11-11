// reset-admin.js
const db = require('./database');
const { hashPassword } = require('./auth');

const EMAIL = 'admin@empresa.com';
const PASSWORD = 'AdminSeguro2025!'; // ← Contraseña nueva y segura (puedes cambiarla)

console.log('🔧 Reiniciando cuenta de administrador...');
console.log(`📧 Email: ${EMAIL}`);
console.log(`🔑 Contraseña temporal: ${PASSWORD}`);
console.log('');

// 1. Eliminar cualquier usuario existente (opcional, pero asegura limpieza)
db.run(`DELETE FROM usuarios`, function(err) {
  if (err) {
    console.error('❌ Error al limpiar usuarios:', err.message);
    db.close(() => process.exit(1));
    return;
  }
  console.log('🗑️  Todos los usuarios eliminados.');

  // 2. Crear nuevo admin
  hashPassword(PASSWORD)
    .then(hashed => {
      db.run(
        `INSERT INTO usuarios (email, password, rol, activo) VALUES (?, ?, ?, ?)`,
        [EMAIL, hashed, 'admin', 1],
        function(insertErr) {
          if (insertErr) {
            console.error('❌ Error al crear administrador:', insertErr.message);
            db.close(() => process.exit(1));
            return;
          }

          console.log('✅ Administrador creado con ÉXITO.');
          
          // 3. Verificar que esté en la DB
          db.get(`SELECT id, email, rol, activo FROM usuarios WHERE email = ?`, [EMAIL], (err, user) => {
            if (err || !user) {
              console.error('⚠️  ¡Advertencia! No se puede leer al admin recién creado.');
            } else {
              console.log('🔍 Verificación:');
              console.log(`   ID: ${user.id}`);
              console.log(`   Email: ${user.email}`);
              console.log(`   Rol: ${user.rol}`);
              console.log(`   Activo: ${user.activo ? '✅ Sí' : '❌ No'}`);
            }
            db.close(() => {
              console.log('\n🎉 Listo. Ahora prueba iniciar sesión con:');
              console.log(`   Email: ${EMAIL}`);
              console.log(`   Contraseña: ${PASSWORD}`);
              process.exit();
            });
          });
        }
      );
    })
    .catch(hashErr => {
      console.error('❌ Error al hashear contraseña:', hashErr);
      db.close(() => process.exit(1));
    });
});