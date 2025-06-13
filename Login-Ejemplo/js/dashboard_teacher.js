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

  if (sectionId === 'courses') loadTeacherCourses();
}

// 🔐 Cerrar sesión
function logout() {
  localStorage.clear();
  window.location.href = 'login.html';
}

// 📚 Cargar cursos asignados al maestro
async function loadTeacherCourses() {
  try {
    const res = await axios.get(`${API_ACADEMIC}/assignments/my-courses`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const tbody = document.querySelector('#teacherCourseTable tbody');
    tbody.innerHTML = '';

    const courses = res.data.courses;

    courses.forEach(course => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${course.name}</td>
        <td>${course.period}</td>
        <td>${course.joinCode}</td>
        <td>
          <button class="btn-view" onclick="viewCourse('${course._id}')">
            Ver Detalles
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('Error al cargar cursos del maestro:', error);
    alert('Error al cargar tus cursos');
  }
}

// 🔍 Ir al detalle del curso
function viewCourse(courseId) {
  window.location.href = `course_teacher.html?courseId=${courseId}`;
}

// ⚡ Cargar cursos automáticamente si ya está en la vista activa
if (document.getElementById('courses')?.classList.contains('active')) {
  loadTeacherCourses();
}
