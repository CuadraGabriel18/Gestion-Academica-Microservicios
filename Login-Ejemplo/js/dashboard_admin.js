const API_AUTH = 'https://api-auth-qaac.onrender.com/auth';
const API_ACADEMIC = 'http://192.168.42.142:3001';
const token = localStorage.getItem('token');

// 🚫 Redirige si no hay token
if (!token) {
  alert('No autorizado');
  window.location.href = 'login.html';
}

// 🧭 Navegación de secciones
function navigate(sectionId) {
  document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
  document.getElementById(sectionId).classList.add('active');

  if (sectionId === 'users') loadUsers();
  if (sectionId === 'courses') {
    loadCourses();
    loadTeachers(); // 👨‍🏫 Cargar maestros al abrir la sección cursos
  }
}

function logout() {
  localStorage.clear();
  window.location.href = 'login.html';
}

// 👥 Cargar usuarios
async function loadUsers() {
  try {
    const res = await axios.get(`${API_AUTH}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const tbody = document.querySelector('#userTable tbody');
    tbody.innerHTML = '';

    const users = res.data.users;

    users.forEach(user => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${user.username}</td>
        <td>${user.email}</td>
        <td>${user.role}</td>
        <td><button onclick="deleteUser('${user._id}')">🗑️</button></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
    alert('Error al cargar usuarios');
  }
}

// 🗑️ Eliminar usuario
async function deleteUser(userId) {
  if (!confirm('¿Eliminar usuario?')) return;

  try {
    await axios.delete(`${API_AUTH}/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    loadUsers();
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    alert('Error al eliminar usuario');
  }
}

// 👨‍🏫 Cargar maestros al <select>
async function loadTeachers() {
  try {
    const res = await axios.get(`${API_AUTH}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const select = document.getElementById('courseTeacherId');
    select.innerHTML = '<option value="" disabled selected>Selecciona un maestro</option>';

    const teachers = res.data.users.filter(u => u.role === 'teacher');

    teachers.forEach(teacher => {
      const option = document.createElement('option');
      option.value = teacher._id;
      option.textContent = `${teacher.username} (${teacher.email})`;
      select.appendChild(option);
    });
  } catch (err) {
    console.error('Error al cargar maestros:', err);
    alert('No se pudieron cargar los maestros');
  }
}

// 📚 Crear curso
document.getElementById('courseForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('courseName').value;
  const period = document.getElementById('coursePeriod').value;
  const teacherId = document.getElementById('courseTeacherId').value;

  try {
    await axios.post(`${API_ACADEMIC}/courses`, {
      name,
      period,
      teacherId
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    alert('Curso creado exitosamente');
    loadCourses();
  } catch (err) {
    console.error('Error al crear curso:', err);
    alert(err.response?.data?.error || 'Error al crear curso');
  }
});

// 📋 Cargar cursos
async function loadCourses() {
  try {
    const res = await axios.get(`${API_ACADEMIC}/courses`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const tbody = document.querySelector('#courseTable tbody');
    tbody.innerHTML = '';

    const courses = res.data.courses;

    courses.forEach(course => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${course.name}</td>
        <td>${course.teacherName}</td>
        <td>${course.period}</td>
        <td>${course.joinCode}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('Error al cargar cursos:', error);
    alert('Error al cargar cursos');
  }
}

// 🔗 Asignar usuario a curso
document.getElementById('assignForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const userId = document.getElementById('assignUserId').value;
  const courseId = document.getElementById('assignCourseId').value;
  const role = document.getElementById('assignRole').value;

  try {
    await axios.post(`${API_ACADEMIC}/assignments`, {
      userId,
      courseId,
      role
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    alert('Usuario asignado correctamente');
  } catch (err) {
    console.error('Error al asignar usuario:', err);
    alert(err.response?.data?.error || 'Error en la asignación');
  }
});
