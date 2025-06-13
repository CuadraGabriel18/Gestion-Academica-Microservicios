const API_ACADEMIC = 'http://192.168.42.142:3001';
const token = localStorage.getItem('token');

// 🚫 Redirigir si no hay token
if (!token) {
  alert('No autorizado');
  window.location.href = 'login.html';
}

// 🧭 Navegación entre secciones
function navigate(sectionId) {
  document.querySelectorAll('.section').forEach(section =>
    section.classList.remove('active')
  );
  document.getElementById(sectionId).classList.add('active');

  if (sectionId === 'courses') loadStudentCourses();
}

// 🔐 Cerrar sesión
function logout() {
  localStorage.clear();
  window.location.href = 'login.html';
}

// 📚 Cargar cursos asignados al estudiante
async function loadStudentCourses() {
  try {
    const res = await axios.get(`${API_ACADEMIC}/assignments/my-courses`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const tbody = document.querySelector('#studentCourseTable tbody');
    tbody.innerHTML = '';

    const courses = res.data.courses;

    if (courses.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="3">No estás asignado a ningún curso aún.</td>`;
      tbody.appendChild(tr);
      return;
    }

    courses.forEach(course => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${course.name}</td>
        <td>${course.period}</td>
        <td>${course.joinCode}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (error) {
    console.error('Error al cargar cursos del estudiante:', error);
    alert('Error al cargar tus cursos');
  }
}

// ➕ Unirse a un curso usando código
const joinForm = document.getElementById('joinForm');
if (joinForm) {
  joinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = document.getElementById('joinCodeInput').value.trim();

    if (!code) {
      alert('Debes ingresar un código');
      return;
    }

    try {
      const res = await axios.post(`${API_ACADEMIC}/assignments/join`, {
        joinCode: code
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      document.getElementById('joinMessage').textContent = '✅ Te uniste al curso correctamente.';
      document.getElementById('joinMessage').style.color = '#4dd0e1';
      document.getElementById('joinCodeInput').value = '';
      navigate('courses');

    } catch (err) {
      const msg = err?.response?.data?.message || '❌ Error al unirse al curso';
      document.getElementById('joinMessage').textContent = msg;
      document.getElementById('joinMessage').style.color = 'red';
    }
  });
}

// ⚡ Si ya está en vista activa, cargar cursos automáticamente
if (document.getElementById('courses')?.classList.contains('active')) {
  loadStudentCourses();
}
