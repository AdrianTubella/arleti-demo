// server.js — compatible con Vercel
const express = require('express');
const path = require('path');
const db = require('./database');
const { hashPassword, verifyPassword } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'frontend')));
app.use(express.json());

// Ruta raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// === API: AUTENTICACIÓN ===
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  try {
    const existing = await db.getUsuarioByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }

    const hashedPassword = await hashPassword(password);
    const user = await db.crearUsuario({
      email,
      password: hashedPassword,
      rol: 'worker',
      activo: 0
    });

    res.status(201).json({ message: 'Registro exitoso. Espera aprobación del administrador.' });
  } catch (err) {
    console.error('Error al registrar:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  try {
    const user = await db.getUsuarioByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (user.rol === 'worker' && user.activo === 0) {
      return res.status(403).json({ error: 'Tu cuenta está pendiente de aprobación por el administrador' });
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// === API: GESTIÓN DE USUARIOS ===
app.get('/api/workers', async (req, res) => {
  try {
    const users = await db.getUsuarios();
    const workers = users.filter(u => u.rol === 'worker');
    res.json(workers);
  } catch (err) {
    res.status(500).json({ error: 'Error al cargar trabajadores' });
  }
});

app.put('/api/workers/:id/approve', async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await db.actualizarUsuario(id, { activo: 1 });
    if (!updated) return res.status(404).json({ error: 'Trabajador no encontrado' });
    res.json({ message: 'Trabajador aprobado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al aprobar' });
  }
});

app.delete('/api/workers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await db.eliminarUsuario(id);
    if (!deleted) return res.status(404).json({ error: 'Trabajador no encontrado' });
    res.json({ message: 'Trabajador eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar trabajador' });
  }
});

// === API: MATERIALES ===
app.get('/api/materiales', async (req, res) => {
  try {
    const materiales = await db.getMateriales();
    res.json(materiales);
  } catch (err) {
    res.status(500).json({ error: 'Error al cargar materiales' });
  }
});

app.get('/api/materiales/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const material = await db.getMaterial(id);
    if (!material) return res.status(404).json({ error: 'Material no encontrado' });
    res.json(material);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

app.post('/api/materiales', async (req, res) => {
  try {
    const material = await db.crearMaterial(req.body);
    res.status(201).json(material);
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar' });
  }
});

app.put('/api/materiales/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await db.actualizarMaterial(id, req.body);
    if (!updated) return res.status(404).json({ error: 'Material no encontrado' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar' });
  }
});

app.delete('/api/materiales/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await db.eliminarMaterial(id);
    if (!deleted) return res.status(404).json({ error: 'Material no encontrado' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

// === API: CAMBIO DE CONTRASEÑA ===
app.put('/api/admin/change-password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Contraseña actual y nueva (mín. 6 chars) son obligatorias' });
  }

  try {
    const users = await db.getUsuarios();
    const admin = users.find(u => u.rol === 'admin');
    if (!admin) return res.status(404).json({ error: 'Administrador no encontrado' });

    const isValid = await verifyPassword(currentPassword, admin.password);
    if (!isValid) return res.status(401).json({ error: 'Contraseña actual incorrecta' });

    const newHash = await hashPassword(newPassword);
    await db.actualizarUsuario(admin.id, { password: newHash });
    res.json({ message: '✅ Contraseña actualizada con éxito' });
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});