const API_URL = 'https://api-auth-qaac.onrender.com/auth';

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('registerUsername').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const role = document.getElementById('registerRole').value;
  const errorDiv = document.getElementById('errorRegister');

  try {
    const res = await axios.post(`${API_URL}/register`, {
      username,
      email,
      password,
      role
    });

    alert('Registro exitoso. Ahora puedes iniciar sesión.');
    window.location.href = 'login.html';
  } catch (err) {
    const msg = err?.response?.data?.message || 'Error en el registro';
    errorDiv.textContent = msg;
  }
});

// 🟢 Registro con Google OAuth
document.getElementById('googleLoginRegister').addEventListener('click', () => {
  const role = document.getElementById('googleRole').value;
  if (!role) {
    alert('Selecciona un rol antes de continuar con Google');
    return;
  }

  window.location.href = `${API_URL}/google/register?role=${role}`;
});
