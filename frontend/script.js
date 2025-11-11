// ==================================================
// 🔐 ESTADO GLOBAL
// ==================================================
let currentUser = null;

// ==================================================
// 🚀 INICIALIZACIÓN
// ==================================================
document.addEventListener('DOMContentLoaded', () => {
  // Solo login visible al inicio
  document.getElementById('main-nav').style.display = 'none';
  
  // Eventos de navegación
  document.querySelectorAll('[data-section]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showSection(btn.dataset.section);
      document.getElementById('settings-dropdown').classList.remove('show');
    });
  });

  // Toggle login/register
  document.querySelectorAll('[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      showAuth(btn.dataset.mode);
    });
  });

  // Dropdown y modal
  setupDropdown();
  setupPasswordStrength();

  console.log('✅ AdminSeguro2025 iniciado');
});

// ==================================================
// 🎮 NAVEGACIÓN (solo muestra secciones tras login)
// ==================================================
function showSection(sectionId) {
  const sections = ['auth', 'profile', 'materials', 'workers', 'change-password'];
  
  sections.forEach(id => {
    const el = document.getElementById(id + '-section');
    if (el) el.style.display = 'none';
  });

  const target = document.getElementById(sectionId + '-section');
  if (target) {
    target.style.display = 'block';
    target.classList.add('fade-in');
    setTimeout(() => target.classList.remove('fade-in'), 300);
  }
}

function showAuth(mode) {
  document.getElementById('login-form').style.display = mode === 'login' ? 'block' : 'none';
  document.getElementById('register-form').style.display = mode === 'register' ? 'block' : 'none';
}

// ==================================================
// 🔐 AUTENTICACIÓN
// ==================================================
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Credenciales inválidas');

    onLoginSuccess(data);
  } catch (err) {
    alert(`❌ ${err.message}`);
    document.getElementById('login-password').value = '';
  }
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;

  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Error al registrar');

    alert('✅ ' + data.message);
    showAuth('login');
  } catch (err) {
    alert(`❌ ${err.message}`);
  }
});

function onLoginSuccess(user) {
  currentUser = user;

  // Actualizar perfil
  document.getElementById('profile-email').textContent = user.email;
  document.getElementById('profile-role').textContent = user.rol === 'admin' ? 'Administrador' : 'Trabajador';
  document.getElementById('profile-status').textContent = user.activo ? 'Activo' : 'Pendiente';
  document.getElementById('profile-date').textContent = new Date(user.createdAt).toLocaleString('es-ES', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  // Mostrar menú y ocultar login
  document.getElementById('main-nav').style.display = 'block';
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('user-email').textContent = user.email;

  // Mostrar trabajadores solo si es admin
  const workersBtn = document.getElementById('workers-btn');
  if (user.rol === 'admin') {
    workersBtn.style.display = 'inline-flex';
    showSection('materials'); // Ir a materiales por defecto
    loadMaterials();
    loadWorkers();
  } else {
    workersBtn.style.display = 'none';
    showSection('materials');
    loadMaterials();
  }
}

function logout() {
  currentUser = null;
  document.getElementById('main-nav').style.display = 'none';
  document.getElementById('auth-section').style.display = 'block';
  showAuth('login');
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
}

// ==================================================
// ⚙️ UTILIDADES
// ==================================================
function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  return text.replace(/&/g, '&amp;').replace(/</g, '<').replace(/>/g, '>');
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('es-ES');
}

// ==================================================
// 📦 MATERIALES
// ==================================================
async function loadMaterials() {
  try {
    const res = await fetch('/api/materiales');
    const materiales = await res.json();

    const tbody = document.querySelector('#materials-table tbody');
    if (materiales.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-state">
            <div class="empty-state-icon">📦</div>
            <p>No hay materiales registrados</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = materiales.map(mat => `
      <tr>
        <td>${escapeHtml(mat.nombre)}</td>
        <td>${mat.tipo.charAt(0).toUpperCase() + mat.tipo.slice(1)}</td>
        <td>${mat.cantidad}</td>
        <td>${mat.unidad.charAt(0).toUpperCase() + mat.unidad.slice(1)}</td>
        <td>$${parseFloat(mat.precio).toFixed(2)}</td>
        <td class="actions-cell">
          <button class="action-btn edit-btn" onclick="editMaterial(${mat.id})">✏️ Editar</button>
          <button class="action-btn delete-btn" onclick="deleteMaterial(${mat.id})">🗑️ Eliminar</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    alert('❌ Error al cargar materiales');
  }
}

document.getElementById('add-material-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    nombre: document.getElementById('material-name').value.trim(),
    tipo: document.getElementById('material-type').value,
    cantidad: parseInt(document.getElementById('material-quantity').value),
    unidad: document.getElementById('material-unit').value,
    precio: parseFloat(document.getElementById('material-price').value)
  };

  if (!data.nombre || !data.tipo || !data.cantidad || !data.unidad || !data.precio) {
    alert('❌ Todos los campos son obligatorios');
    return;
  }

  try {
    const res = await fetch('/api/materiales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al guardar');
    }

    alert('✅ Material agregado');
    document.getElementById('add-material-form').reset();
    document.getElementById('add-material-section').style.display = 'none';
    loadMaterials();
  } catch (err) {
    alert(`❌ ${err.message}`);
  }
});

// Edición
async function editMaterial(id) {
  if (!id || isNaN(id) || id <= 0) {
    alert('❌ ID inválido');
    return;
  }

  try {
    const res = await fetch(`/api/materiales/${id}`);
    if (!res.ok) throw new Error('Material no encontrado');
    
    const material = await res.json();
    
    document.getElementById('edit-material-id').value = material.id;
    document.getElementById('edit-material-name').value = material.nombre;
    document.getElementById('edit-material-type').value = material.tipo;
    document.getElementById('edit-material-quantity').value = material.cantidad;
    document.getElementById('edit-material-unit').value = material.unidad;
    document.getElementById('edit-material-price').value = material.precio;
    
    document.getElementById('edit-modal').classList.add('show');
    document.body.style.overflow = 'hidden';
  } catch (err) {
    alert(`❌ ${err.message}`);
  }
}

document.getElementById('edit-material-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const id = document.getElementById('edit-material-id').value;
  const data = {
    nombre: document.getElementById('edit-material-name').value.trim(),
    tipo: document.getElementById('edit-material-type').value,
    cantidad: parseInt(document.getElementById('edit-material-quantity').value),
    unidad: document.getElementById('edit-material-unit').value,
    precio: parseFloat(document.getElementById('edit-material-price').value)
  };

  if (!data.nombre || !data.tipo || !data.cantidad || !data.unidad || !data.precio) {
    alert('❌ Todos los campos son obligatorios');
    return;
  }

  try {
    const res = await fetch(`/api/materiales/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al actualizar');
    }

    alert('✅ Material actualizado');
    closeEditModal();
    loadMaterials();
  } catch (err) {
    alert(`❌ ${err.message}`);
  }
});

async function deleteMaterial(id) {
  if (!confirm('⚠️ ¿Eliminar material? No se puede deshacer.')) return;

  try {
    const res = await fetch(`/api/materiales/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar');
    alert('✅ Material eliminado');
    loadMaterials();
  } catch (err) {
    alert(`❌ ${err.message}`);
  }
}

// ==================================================
// 👷 TRABAJADORES (solo admin)
// ==================================================
async function loadWorkers() {
  if (!currentUser || currentUser.rol !== 'admin') return;

  try {
    const res = await fetch('/api/workers');
    const workers = await res.json();

    const tbody = document.querySelector('#workers-table tbody');
    if (workers.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="empty-state">
            <div class="empty-state-icon">👷</div>
            <p>No hay trabajadores registrados</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = workers.map(w => `
      <tr>
        <td>${escapeHtml(w.email)}</td>
        <td>
          <span class="status ${w.activo ? 'status-active' : 'status-pending'}">
            ${w.activo ? '✅ Activo' : '⏳ Pendiente'}
          </span>
        </td>
        <td>${formatDate(w.createdAt)}</td>
        <td class="actions-cell">
          ${!w.activo ? `
            <button class="action-btn btn-success" onclick="approveWorker(${w.id})">✅ Aprobar</button>
            <button class="action-btn delete-btn" onclick="deleteWorker(${w.id})">🗑️ Eliminar</button>
          ` : ''}
        </td>
      </tr>
    `).join('');
  } catch (err) {
    alert('❌ Error al cargar trabajadores');
  }
}

async function approveWorker(id) {
  if (!confirm('✅ ¿Aprobar trabajador? Podrá iniciar sesión.')) return;

  try {
    const res = await fetch(`/api/workers/${id}/approve`, { method: 'PUT' });
    if (!res.ok) throw new Error('Error al aprobar');
    alert('✅ Trabajador aprobado');
    loadWorkers();
  } catch (err) {
    alert(`❌ ${err.message}`);
  }
}

async function deleteWorker(id) {
  if (!confirm('🗑️ ¿Eliminar trabajador? Se perderán sus datos.')) return;

  try {
    // Primero obtenemos el email para la API (necesario para DELETE)
    const workersRes = await fetch('/api/workers');
    const workers = await workersRes.json();
    const worker = workers.find(w => w.id === id);
    
    if (!worker) throw new Error('Trabajador no encontrado');

    // Eliminar usuario (necesitas esta ruta en server.js - la agrego abajo)
    const res = await fetch(`/api/workers/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: worker.email })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al eliminar');
    }

    alert('✅ Trabajador eliminado');
    loadWorkers();
  } catch (err) {
    alert(`❌ ${err.message}`);
  }
}

// ==================================================
// ⚙️ UI/UX
// ==================================================
function setupDropdown() {
  const settingsBtn = document.getElementById('settings-btn');
  const dropdown = document.getElementById('settings-dropdown');

  settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('show');
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && e.target !== settingsBtn) {
      dropdown.classList.remove('show');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      dropdown.classList.remove('show');
      closeEditModal();
    }
  });
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.remove('show');
  document.body.style.overflow = '';
}

function setupPasswordStrength() {
  const passInput = document.getElementById('new-password');
  const strengthBar = document.getElementById('password-strength');
  
  if (passInput && strengthBar) {
    passInput.addEventListener('input', () => {
      const pass = passInput.value;
      let strength = 'weak';
      
      if (pass.length >= 8) {
        const hasLower = /[a-z]/.test(pass);
        const hasUpper = /[A-Z]/.test(pass);
        const hasNumber = /\d/.test(pass);
        const hasSpecial = /[^A-Za-z0-9]/.test(pass);
        
        const score = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
        if (score >= 3) strength = 'strong';
        else if (score >= 2) strength = 'medium';
      }
      
      strengthBar.className = 'password-strength ' + strength;
    });
  }
}

// ==================================================
// 🔐 CAMBIO DE CONTRASEÑA
// ==================================================
document.getElementById('change-password-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const current = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirm = document.getElementById('confirm-password').value;

  if (newPassword !== confirm) {
    alert('❌ Las contraseñas no coinciden');
    return;
  }

  if (newPassword.length < 6) {
    alert('❌ La nueva contraseña debe tener al menos 6 caracteres');
    return;
  }

  try {
    const res = await fetch('/api/admin/change-password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: current, newPassword })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al cambiar contraseña');

    alert('✅ ' + data.message);
    document.getElementById('change-password-form').reset();
    document.getElementById('password-strength').className = 'password-strength';
  } catch (err) {
    alert(`❌ ${err.message}`);
  }
});