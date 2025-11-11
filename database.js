// database.js — 100% compatible con Vercel
const path = require('path');
const fs = require('fs').promises;
const bcrypt = require('bcrypt');

// Ruta para datos persistentes en Vercel
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'usuarios.json');
const MATERIALES_FILE = path.join(DATA_DIR, 'materiales.json');

// Crear carpeta data si no existe
async function init() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Inicializar archivos si no existen
    if (!await fileExists(USERS_FILE)) {
      await fs.writeFile(USERS_FILE, JSON.stringify([]));
    }
    if (!await fileExists(MATERIALES_FILE)) {
      await fs.writeFile(MATERIALES_FILE, JSON.stringify([]));
    }

    // Crear admin si no existe
    await ensureAdmin();
    
    console.log('✅ Base de datos JSON inicializada');
  } catch (err) {
    console.error('❌ Error al inicializar:', err);
    throw err;
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// ✅ Garantizar que exista un admin
async function ensureAdmin() {
  const users = await getUsuarios();
  const adminExists = users.some(u => u.rol === 'admin');
  
  if (!adminExists) {
    const hashed = await bcrypt.hash('Admin123!', 10);
    const newAdmin = {
      id: Date.now(),
      email: 'admin@arleti-demo.com',
      password: hashed,
      rol: 'admin',
      activo: 1,
      createdAt: new Date().toISOString()
    };
    
    users.push(newAdmin);
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    console.log('✅ Admin creado: admin@arleti-demo.com / Admin123!');
  }
}

// Métodos para usuarios
async function getUsuarios() {
  const data = await fs.readFile(USERS_FILE, 'utf8');
  return JSON.parse(data);
}

async function getUsuarioByEmail(email) {
  const users = await getUsuarios();
  return users.find(u => u.email === email) || null;
}

async function crearUsuario(usuario) {
  const users = await getUsuarios();
  usuario.id = Date.now();
  usuario.createdAt = new Date().toISOString();
  users.push(usuario);
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
  return usuario;
}

async function actualizarUsuario(id, updates) {
  const users = await getUsuarios();
  const index = users.findIndex(u => u.id == id);
  if (index === -1) return null;
  
  users[index] = { ...users[index], ...updates };
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
  return users[index];
}

async function eliminarUsuario(id) {
  let users = await getUsuarios();
  const initialLength = users.length;
  users = users.filter(u => u.id != id);
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
  return users.length < initialLength;
}

// Métodos para materiales
async function getMateriales() {
  const data = await fs.readFile(MATERIALES_FILE, 'utf8');
  return JSON.parse(data);
}

async function getMaterial(id) {
  const materiales = await getMateriales();
  return materiales.find(m => m.id == id) || null;
}

async function crearMaterial(material) {
  const materiales = await getMateriales();
  material.id = Date.now();
  materiales.push(material);
  await fs.writeFile(MATERIALES_FILE, JSON.stringify(materiales, null, 2));
  return material;
}

async function actualizarMaterial(id, updates) {
  const materiales = await getMateriales();
  const index = materiales.findIndex(m => m.id == id);
  if (index === -1) return null;
  
  materiales[index] = { ...materiales[index], ...updates };
  await fs.writeFile(MATERIALES_FILE, JSON.stringify(materiales, null, 2));
  return materiales[index];
}

async function eliminarMaterial(id) {
  let materiales = await getMateriales();
  const initialLength = materiales.length;
  materiales = materiales.filter(m => m.id != id);
  await fs.writeFile(MATERIALES_FILE, JSON.stringify(materiales, null, 2));
  return materiales.length < initialLength;
}

// Inicializar al cargar
init().catch(console.error);

module.exports = {
  getUsuarios,
  getUsuarioByEmail,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  getMateriales,
  getMaterial,
  crearMaterial,
  actualizarMaterial,
  eliminarMaterial
};