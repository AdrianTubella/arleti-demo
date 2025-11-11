// test-login.js
const { hashPassword, verifyPassword } = require('./auth');

const EMAIL = 'admin@empresa.com';
const PASSWORD = 'AdminSeguro2025!';

async function test() {
  console.log('🔐 Probando hash y verificación...');

  // 1. Hashear la contraseña
  const hashed = await hashPassword(PASSWORD);
  console.log('✅ Hash generado (ejemplo):', hashed.substring(0, 20) + '...');

  // 2. Verificar con la misma contraseña → debe ser true
  const valido1 = await verifyPassword(PASSWORD, hashed);
  console.log('✅ ¿La contraseña correcta es válida?', valido1 ? 'SÍ' : '❌ NO');

  // 3. Verificar con una incorrecta → debe ser false
  const valido2 = await verifyPassword('contraseña_mal', hashed);
  console.log('✅ ¿Una contraseña incorrecta es rechazada?', !valido2 ? 'SÍ' : '❌ NO');

  if (valido1 && !valido2) {
    console.log('\n🟢 ¡auth.js funciona correctamente!');
    console.log('   El problema está en el login (ruta /api/login) o en el frontend.');
  } else {
    console.log('\n🔴 ¡auth.js tiene un error!');
  }
}

test().catch(console.error);