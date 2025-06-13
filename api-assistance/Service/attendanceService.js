const Attendance = require('../models/attendanceModel');
const ntpClient = require('ntp-client');
const { generateAttendancePDF } = require('../utils/pdfGenerator');
const path = require('path');
const fs = require('fs');

const ACADEMIC_API = 'http://192.168.42.142:3001';
const AUTH_API = 'https://api-auth-qaac.onrender.com/auth/users';

// 🔄 Validar si el estudiante está asignado al curso
async function isStudentAssigned(studentId, courseId, token) {
  try {
    const res = await fetch(`${ACADEMIC_API}/assignments/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token
      },
      body: JSON.stringify({ studentId, courseId })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ Error en validación de asignación:', errorText);
      throw new Error('No autorizado para registrar asistencia');
    }

    console.log('✅ Estudiante asignado al curso.');
    return true;
  } catch (error) {
    console.error('❌ Error al validar asignación:', error.message);
    throw new Error('Error validando asignación del estudiante');
  }
}

// ⏰ Obtener hora NTP exacta
async function getCurrentNtpTime() {
  return new Promise((resolve, reject) => {
    ntpClient.getNetworkTime("pool.ntp.org", 123, (err, date) => {
      if (err) return reject(err);
      resolve(date);
    });
  });
}

// ✅ Registrar asistencia
async function registerAttendance({ studentId, courseId, status }, token) {
  console.log('📩 Datos recibidos para registrar asistencia:', {
    studentId,
    courseId,
    status
  });

  if (!['present', 'absent'].includes(status)) {
    throw new Error('Estado de asistencia inválido (debe ser "present" o "absent")');
  }

  await isStudentAssigned(studentId, courseId, token);
  const ntpTime = await getCurrentNtpTime();

  const record = new Attendance({
    studentId,
    courseId,
    status,
    timestamp: new Date(),
    ntpTime
  });

  console.log('💾 Guardando registro en MongoDB...');
  return await record.save();
}

// 📄 Historial de asistencias por estudiante
async function getAttendanceByStudent(studentId) {
  return await Attendance.find({ studentId }).sort({ timestamp: -1 }).lean();
}

// 📄 Historial de asistencias por curso
async function getAttendanceByCourse(courseId) {
  return await Attendance.find({ courseId }).sort({ timestamp: -1 }).lean();
}

// 🧾 Generar PDF de asistencias por curso
async function generatePdfByCourse(courseId, token) {
  try {
    console.log('📥 Generando PDF para curso:', courseId);

    const records = await getAttendanceByCourse(courseId);
    console.log('📌 Registros encontrados:', records.length);

    if (!records.length) throw new Error('No hay asistencias para este curso');

    const courseRes = await fetch(`${ACADEMIC_API}/courses/${courseId}`, {
      headers: { Authorization: token }
    });

    console.log('🌐 Respuesta de academic-api:', courseRes.status);

    if (!courseRes.ok) {
      const errorText = await courseRes.text();
      console.error('❌ Error al obtener curso:', errorText);
      throw new Error('No se pudo obtener información del curso');
    }

    const courseInfo = await courseRes.json();
    console.log('📘 Curso obtenido:', courseInfo);

    const data = await Promise.all(
      records.map(async (r) => {
        let studentName = r.studentId;

        try {
          const userRes = await fetch(`${AUTH_API}/${r.studentId}`, {
            headers: { Authorization: token }
          });

          if (userRes.ok) {
            const user = await userRes.json();
            studentName = user.username || studentName;
          } else {
            console.warn(`⚠️ No se encontró usuario con ID ${r.studentId}`);
          }
        } catch (err) {
          console.error('⚠️ Error al consultar usuario:', err.message);
        }

        return {
          studentName,
          courseName: courseInfo.course?.name || 'Curso',
          timestamp: r.timestamp,
          status: r.status
        };
      })
    );

    console.log('🧾 Datos para PDF:', data);

    const reportDir = path.join(__dirname, '..', 'reportes');
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir);

    const outputPath = path.join(reportDir, `reporte_${Date.now()}.pdf`);

    await generateAttendancePDF({
      title: `Reporte de Asistencia - ${courseInfo.course?.name || 'Curso'}`,
      data,
      outputPath
    });

    console.log('✅ PDF generado en:', outputPath);
    return outputPath;

  } catch (error) {
    console.error('❌ Error interno al generar el PDF:', error.message);
    throw error;
  }
}

module.exports = {
  registerAttendance,
  getAttendanceByStudent,
  getAttendanceByCourse,
  getCurrentNtpTime,
  generatePdfByCourse
};
