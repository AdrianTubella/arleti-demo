// server.js
const express = require('express');
const path = require('path');
const db = require('./database');
const { hashPassword, verifyPassword } = require('./auth');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'frontend')));
app.use(express.json());

// Ruta raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// === API: AUTENTICACIÓN ===

// POST /api/register → registrar trabajador (pendiente de aprobación)
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  try {
    const hashedPassword = await hashPassword(password);
    db.run(
      `INSERT INTO usuarios (email, password, rol, activo) VALUES (?, ?, 'worker', 0)`,
      [email, hashedPassword],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'El correo ya está registrado' });
          }
          return res.status(500).json({ error: 'Error al registrar usuario' });
        }
        res.status(201).json({ message: 'Registro exitoso. Espera aprobación del administrador.' });
      }
    );
  } catch (err) {
    console.error('Error al registrar:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// POST /api/login → iniciar sesión
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  db.get(`SELECT * FROM usuarios WHERE email = ?`, [email], async (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (user.rol === 'worker' && user.activo === 0) {
      return res.status(403).json({ error: 'Tu cuenta está pendiente de aprobación por el administrador' });
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Devolver datos del usuario (sin contraseña)
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });
});

// === API: GESTIÓN DE USUARIOS (solo admin) ===

// GET /api/workers → listar trabajadores (solo admin)
app.get('/api/workers', (req, res) => {
  db.all(`SELECT id, email, activo, createdAt FROM usuarios WHERE rol = 'worker'`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error al cargar trabajadores' });
    res.json(rows);
  });
});

// PUT /api/workers/:id/approve → aprobar trabajador
app.put('/api/workers/:id/approve', (req, res) => {
  const { id } = req.params;
  db.run(`UPDATE usuarios SET activo = 1 WHERE id = ? AND rol = 'worker'`, [id], function (err) {
    if (err) return res.status(500).json({ error: 'Error al aprobar' });
    if (this.changes === 0) return res.status(404).json({ error: 'Trabajador no encontrado' });
    res.json({ message: 'Trabajador aprobado' });
  });
});

// DELETE /api/workers/:id → eliminar trabajador
app.delete('/api/workers/:id', (req, res) => {
  const { id } = req.params;
  const { email } = req.body; // email para verificar

  if (!email) {
    return res.status(400).json({ error: 'Email requerido' });
  }

  db.run(`DELETE FROM usuarios WHERE id = ? AND email = ? AND rol = 'worker'`, [id, email], function (err) {
    if (err) return res.status(500).json({ error: 'Error al eliminar trabajador' });
    if (this.changes === 0) return res.status(404).json({ error: 'Trabajador no encontrado o no autorizado' });
    res.json({ message: 'Trabajador eliminado' });
  });
});

// PUT /api/admin/change-password → cambiar contraseña del administrador
app.put('/api/admin/change-password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Contraseña actual y nueva (mín. 6 caracteres) son obligatorias' });
  }

  db.get(`SELECT * FROM usuarios WHERE rol = 'admin'`, async (err, admin) => {
    if (err || !admin) {
      return res.status(404).json({ error: 'Administrador no encontrado' });
    }

    const isValid = await verifyPassword(currentPassword, admin.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    try {
      const newHash = await hashPassword(newPassword);
      db.run(
        `UPDATE usuarios SET password = ? WHERE id = ?`,
        [newHash, admin.id],
        function (updateErr) {
          if (updateErr) {
            console.error('Error al actualizar contraseña:', updateErr);
            return res.status(500).json({ error: 'Error al actualizar la contraseña' });
          }
          res.json({ message: '✅ Contraseña actualizada con éxito' });
        }
      );
    } catch (hashErr) {
      console.error('Error al hashear nueva contraseña:', hashErr);
      res.status(500).json({ error: 'Error interno al procesar la nueva contraseña' });
    }
  });
});

// === API: MATERIALES ===

// GET /api/materiales → listar todos
app.get('/api/materiales', (req, res) => {
  db.all('SELECT * FROM materiales', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error al cargar materiales' });
    res.json(rows);
  });
});

// 👇 NUEVA RUTA: GET /api/materiales/:id → obtener un material por ID
app.get('/api/materiales/:id', (req, res) => {
  const { id } = req.params;
  
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  db.get(`SELECT * FROM materiales WHERE id = ?`, [id], (err, material) => {
    if (err) {
      console.error('Error al buscar material:', err);
      return res.status(500).json({ error: 'Error interno' });
    }
    
    if (!material) {
      return res.status(404).json({ error: 'Material no encontrado' });
    }
    
    res.json(material);
  });
});

// POST /api/materiales → crear
app.post('/api/materiales', (req, res) => {
  const { nombre, tipo, cantidad, unidad, precio } = req.body;
  if (!nombre || !tipo || cantidad == null || unidad == null || precio == null) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  const stmt = db.prepare(`
    INSERT INTO materiales (nombre, tipo, cantidad, unidad, precio)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run([nombre, tipo, cantidad, unidad, precio], function (err) {
    if (err) return res.status(500).json({ error: 'Error al guardar' });
    res.status(201).json({ id: this.lastID, nombre, tipo, cantidad, unidad, precio });
  });
  stmt.finalize();
});

// PUT /api/materiales/:id → actualizar
app.put('/api/materiales/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, tipo, cantidad, unidad, precio } = req.body;
  if (!nombre || !tipo || cantidad == null || unidad == null || precio == null) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  db.run(
    `UPDATE materiales SET nombre = ?, tipo = ?, cantidad = ?, unidad = ?, precio = ? WHERE id = ?`,
    [nombre, tipo, cantidad, unidad, precio, id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Error al actualizar' });
      if (this.changes === 0) return res.status(404).json({ error: 'Material no encontrado' });
      res.json({ id: parseInt(id), nombre, tipo, cantidad, unidad, precio });
    }
  );
});

// DELETE /api/materiales/:id → eliminar
app.delete('/api/materiales/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM materiales WHERE id = ?`, id, function (err) {
    if (err) return res.status(500).json({ error: 'Error al eliminar' });
    if (this.changes === 0) return res.status(404).json({ error: 'Material no encontrado' });
    res.status(204).send();
  });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});