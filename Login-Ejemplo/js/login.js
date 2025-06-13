const API_URL = 'https://api-auth-qaac.onrender.com/auth';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errorDiv = document.getElementById('errorLogin');

  try {
    const res = await axios.post(`${API_URL}/login`, { email, password });

    const data = res.data;

    // Guardar token y datos
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.user.username);
    localStorage.setItem('role', data.user.role);

    // Redirigir según el rol
    if (data.user.role === 'admin') {
      window.location.href = 'admin_panel.html';
    } else if (data.user.role === 'teacher') {
      window.location.href = 'teacher_panel.html';
    } else if (data.user.role === 'student') {
      window.location.href = 'student_panel.html';
    }
  } catch (err) {
    const msg = err?.response?.data?.message || 'Error en el inicio de sesión';
    errorDiv.textContent = msg;
  }
});

// 🟢 Login con Google
document.getElementById('googleLoginLogin').addEventListener('click', () => {
  window.location.href = `${API_URL}/google`;
});

// 🟢 Captura automática de datos si se regresa de Google
const params = new URLSearchParams(window.location.search);
const token = params.get('token');
const role = params.get('role');
const username = params.get('username');

if (token) {
  localStorage.setItem('token', token);
  localStorage.setItem('username', username);
  localStorage.setItem('role', role);

  if (role === 'admin') {
    window.location.href = 'admin_panel.html';
  } else if (role === 'teacher') {
    window.location.href = 'teacher_panel.html';
  } else {
    window.location.href = 'student_panel.html';
  }
}
