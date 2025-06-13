const API_ACADEMIC = 'http://192.168.42.142:3001';
const API_ATTENDANCE = 'http://192.168.42.142:3005';
const token = localStorage.getItem('token');
const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get('courseId');

if (!token || !courseId) {
  alert('No autorizado');
  window.location.href = 'login.html';
}

let asistenciaInicio = null;
const TOLERANCIA_MINUTOS = 15;
let estudiantesGlobal = [];

function goBack() {
  window.location.href = 'teacher_panel.html';
}

function iniciarHorarioAsistencia() {
  const ahora = new Date();
  asistenciaInicio = ahora.getHours() * 60 + ahora.getMinutes();

  const horaAMPM = ahora.toLocaleTimeString('es-MX', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  document.getElementById('asistenciaMessage').textContent =
    `🕒 Puedes registrar asistencia desde las ${horaAMPM} durante los próximos ${TOLERANCIA_MINUTOS} minutos.`;

  document.getElementById('fechaActual').textContent =
    ahora.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
}

function isDentroDelHorario() {
  if (asistenciaInicio === null) return false;
  const ahora = new Date();
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
  return minutosAhora <= asistenciaInicio + TOLERANCIA_MINUTOS;
}

async function loadCourseAndStudents() {
  try {
    const resCourse = await axios.get(`${API_ACADEMIC}/courses/${courseId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const course = resCourse.data.course;
    document.getElementById('courseName').textContent = course.name;
    document.getElementById('coursePeriod').textContent = course.period;
    document.getElementById('teacherName').textContent = course.teacherName || 'No disponible';

    const resStudents = await axios.get(`${API_ACADEMIC}/assignments/${courseId}/students`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    estudiantesGlobal = resStudents.data.students || [];

    const tbody = document.getElementById('studentAttendanceBody');
    tbody.innerHTML = '';

    if (!estudiantesGlobal.length) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="4">No hay estudiantes asignados.</td>`;
      tbody.appendChild(tr);
      return;
    }

    estudiantesGlobal.forEach(est => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${est.username}</td>
        <td>${est.email}</td>
        <td><span class="status" data-id="${est._id}">Pendiente</span></td>
        <td>
          <button class="btn-confirm" onclick="confirmAttendance('${est._id}', this)">✅</button>
          <button class="btn-deny" onclick="denyAttendance('${est._id}', this)">❌</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    alert('Error al cargar el curso o estudiantes.');
  }
}

async function confirmAttendance(userId, btn) {
  if (!isDentroDelHorario()) return alert('❌ Fuera del tiempo para registrar asistencia');

  const status = document.querySelector(`.status[data-id="${userId}"]`);
  status.textContent = 'Asistió';
  status.style.color = 'lightgreen';
  btn.disabled = true;
  btn.nextElementSibling.disabled = true;

  const payload = {
    studentId: userId,
    courseId,
    status: 'present'
  };

  console.log('📤 Enviando asistencia (present):', payload);

  await axios.post(`${API_ATTENDANCE}/attendance`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

async function denyAttendance(userId, btn) {
  if (!isDentroDelHorario()) return alert('❌ Fuera del tiempo para registrar asistencia');

  const status = document.querySelector(`.status[data-id="${userId}"]`);
  status.textContent = 'No asistió';
  status.style.color = 'red';
  btn.disabled = true;
  btn.previousElementSibling.disabled = true;

  const payload = {
    studentId: userId,
    courseId,
    status: 'absent'
  };

  console.log('📤 Enviando asistencia (absent):', payload);

  await axios.post(`${API_ATTENDANCE}/attendance`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

async function downloadAttendanceReport() {
  try {
    const res = await fetch(`${API_ATTENDANCE}/attendance/report/pdf/${courseId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error('No se pudo generar el PDF');

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_asistencia_${courseId}.pdf`;
    a.click();
  } catch (err) {
    alert('❌ Error al descargar PDF: ' + err.message);
  }
}

function downloadStudentList() {
  const rows = [['Nombre', 'Email']];
  estudiantesGlobal.forEach(est => {
    rows.push([est.username, est.email]);
  });

  const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lista_estudiantes_${courseId}.csv`;
  a.click();
}

loadCourseAndStudents().then(() => {
  iniciarHorarioAsistencia();
});
