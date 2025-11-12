// ==================================================
// 🔐 ESTADO GLOBAL (SIMULADO)
// ==================================================
let currentUser = null;

// Datos simulados (persisten mientras dura la sesión)
let materiales = JSON.parse(sessionStorage.getItem('materiales')) || [
  { id: 1, nombre: "Cemento Portland", tipo: "construccion", cantidad: 50, unidad: "bolsa", precio: 12.50 },
  { id: 2, nombre: "Varilla corrugada", tipo: "estructura", cantidad: 100, unidad: "barra", precio: 8.20 }
];

let trabajadores = JSON.parse(sessionStorage.getItem('trabajadores')) || [
  { id: 1, email: "trabajador@empresa.com", activo: false, createdAt: "2024-11-10T10:00:00" },
  { id: 2, email: "carlos@empresa.com", activo: true, createdAt: "2024-11-09T14:30:00" }
];

// Usuarios predefinidos (¡solo para demo!)
const users = [
  {
    id: 1,
    email: "admin@empresa.com",
    password: "AdminSeguro2025!", // ✅ usa esta contraseña
    rol: "admin",
    activo: true,
    createdAt: "2024-11-01T08:00:00"
  }
];

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

  console.log('✅ AdminSeguro2025 (modo demo) iniciado');
});

// ==================================================
// 🎮 NAVEGACIÓN
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
// 🔐 AUTENTICACIÓN (SIMULADA)
// ==================================================
document.getElementById('login-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  const user = users.find(u => 
    u.email === email && 
    u.password === password &&
    u.activo
  );

  if (user) {
    onLoginSuccess(user);
    alert('✅ Bienvenido, ' + (user.rol === 'admin' ? 'Administrador' : 'Trabajador'));
  } else {
    alert('❌ Credenciales incorrectas o usuario inactivo');
    document.getElementById('login-password').value = '';
  }
});

// Registro (solo para trabajadores — simulado)
document.getElementById('register-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;

  if (!email || !password || password.length < 6) {
    alert('❌ Email y contraseña (mín. 6 caracteres) son obligatorios');
    return;
  }

  const nuevoId = trabajadores.length ? Math.max(...trabajadores.map(w => w.id)) + 1 : 1;
  trabajadores.push({
    id: nuevoId,
    email: email,
    activo: false,
    createdAt: new Date().toISOString()
  });
  sessionStorage.setItem('trabajadores', JSON.stringify(trabajadores));

  alert('✅ Registro exitoso. Espera aprobación del administrador.');
  showAuth('login');
});

function onLoginSuccess(user) {
  currentUser = user;
  sessionStorage.setItem('currentUser', JSON.stringify(user));

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
    showSection('materials');
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
  sessionStorage.removeItem('currentUser');
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
// 📦 MATERIALES (SIMULADOS)
// ==================================================
function loadMaterials() {
  const tbody = document.querySelector('#materials-table tbody');
  if (!tbody) return;

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
}

document.getElementById('add-material-form')?.addEventListener('submit', (e) => {
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

  const nuevoId = materiales.length ? Math.max(...materiales.map(m => m.id)) + 1 : 1;
  materiales.push({ id: nuevoId, ...data });
  sessionStorage.setItem('materiales', JSON.stringify(materiales));

  alert('✅ Material agregado');
  document.getElementById('add-material-form').reset();
  document.getElementById('add-material-section')?.style.display = 'none';
  loadMaterials();
});

// Edición
function editMaterial(id) {
  const mat = materiales.find(m => m.id === id);
  if (!mat) return;

  document.getElementById('edit-material-id').value = mat.id;
  document.getElementById('edit-material-name').value = mat.nombre;
  document.getElementById('edit-material-type').value = mat.tipo;
  document.getElementById('edit-material-quantity').value = mat.cantidad;
  document.getElementById('edit-material-unit').value = mat.unidad;
  document.getElementById('edit-material-price').value = mat.precio;
  
  document.getElementById('edit-modal').classList.add('show');
  document.body.style.overflow = 'hidden';
}

document.getElementById('edit-material-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const id = parseInt(document.getElementById('edit-material-id').value);
  const data = {
    nombre: document.getElementById('edit-material-name').value.trim(),
    tipo: document.getElementById('edit-material-type').value,
    cantidad: parseInt(document.getElementById('edit-material-quantity').value),
    unidad: document.getElementById('edit-material-unit').value,
    precio: parseFloat(document.getElementById('edit-material-price').value)
  };

  const index = materiales.findIndex(m => m.id === id);
  if (index !== -1) {
    materiales[index] = { id, ...data };
    sessionStorage.setItem('materiales', JSON.stringify(materiales));
    alert('✅ Material actualizado');
    closeEditModal();
    loadMaterials();
  }
});

function deleteMaterial(id) {
  if (!confirm('⚠️ ¿Eliminar material? No se puede deshacer.')) return;

  materiales = materiales.filter(m => m.id !== id);
  sessionStorage.setItem('materiales', JSON.stringify(materiales));
  
  alert('✅ Material eliminado');
  loadMaterials();
}

// ==================================================
// 👷 TRABAJADORES (solo admin — simulados)
// ==================================================
function loadWorkers() {
  if (!currentUser || currentUser.rol !== 'admin') return;

  const tbody = document.querySelector('#workers-table tbody');
  if (!tbody) return;

  if (trabajadores.length === 0) {
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

  tbody.innerHTML = trabajadores.map(w => `
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
}

function approveWorker(id) {
  if (!confirm('✅ ¿Aprobar trabajador? Podrá iniciar sesión.')) return;

  const worker = trabajadores.find(w => w.id === id);
  if (worker) {
    worker.activo = true;
    sessionStorage.setItem('trabajadores', JSON.stringify(trabajadores));
    alert('✅ Trabajador aprobado');
    loadWorkers();
  }
}

function deleteWorker(id) {
  if (!confirm('🗑️ ¿Eliminar trabajador? Se perderán sus datos.')) return;

  trabajadores = trabajadores.filter(w => w.id !== id);
  sessionStorage.setItem('trabajadores', JSON.stringify(trabajadores));
  
  alert('✅ Trabajador eliminado');
  loadWorkers();
}

// ==================================================
// ⚙️ UI/UX
// ==================================================
function setupDropdown() {
  const settingsBtn = document.getElementById('settings-btn');
  const dropdown = document.getElementById('settings-dropdown');

  if (!settingsBtn || !dropdown) return;

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
  const modal = document.getElementById('edit-modal');
  if (modal) modal.classList.remove('show');
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
// 🔐 CAMBIO DE CONTRASEÑA (solo actualiza localmente)
// ==================================================
document.getElementById('change-password-form')?.addEventListener('submit', (e) => {
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

  // Verificar contraseña actual (solo admin por ahora)
  const admin = users[0];
  if (current !== admin.password) {
    alert('❌ Contraseña actual incorrecta');
    return;
  }

  // Actualizar
  admin.password = newPassword;
  alert('✅ Contraseña cambiada. Por seguridad, deberás iniciar sesión nuevamente.');
  logout();
});
