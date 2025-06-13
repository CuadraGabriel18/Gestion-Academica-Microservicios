const {
  registerAttendance,
  getAttendanceByStudent,
  getAttendanceByCourse,
  getCurrentNtpTime,
  generatePdfByCourse
} = require('../Service/attendanceService');

const path = require('path');
const fs = require('fs');

// 🎯 Registrar asistencia (solo maestro)
const registerController = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== 'teacher') {
      console.warn('🔒 Intento no autorizado de registrar asistencia');
      return res.status(403).json({ message: 'Solo los maestros pueden registrar asistencia' });
    }

    const { studentId, courseId, status } = req.body;
    const token = req.headers.authorization;

    console.log('📩 Datos recibidos para registrar asistencia:', {
      studentId, courseId, status
    });

    if (!studentId || !courseId || !status) {
      console.warn('⚠️ Faltan campos requeridos para registrar asistencia');
      return res.status(400).json({
        message: 'Faltan campos requeridos: studentId, courseId, status'
      });
    }

    if (!['present', 'absent'].includes(status)) {
      return res.status(400).json({
        message: 'Estado inválido. Usa "present" o "absent"'
      });
    }

    const record = await registerAttendance({ studentId, courseId, status }, token);

    console.log('✅ Asistencia registrada exitosamente:', record);

    res.status(201).json({
      message: 'Asistencia registrada correctamente',
      record
    });
  } catch (error) {
    console.error('❌ Error al registrar asistencia:', error.message);
    res.status(400).json({ error: error.message });
  }
};

// 📄 Historial de asistencias por estudiante
const studentHistoryController = async (req, res) => {
  try {
    const { id } = req.params;
    const records = await getAttendanceByStudent(id);
    res.status(200).json({ attendances: records });
  } catch (error) {
    console.error('❌ Error al obtener historial del estudiante:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// 📄 Historial de asistencias por curso
const courseHistoryController = async (req, res) => {
  try {
    const { id } = req.params;
    const records = await getAttendanceByCourse(id);
    res.status(200).json({ attendances: records });
  } catch (error) {
    console.error('❌ Error al obtener historial del curso:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ⏰ Obtener hora exacta NTP
const ntpTimeController = async (req, res) => {
  try {
    const ntpTime = await getCurrentNtpTime();
    res.status(200).json({ ntpTime });
  } catch (error) {
    console.error('❌ Error al obtener hora NTP:', error.message);
    res.status(500).json({ error: 'No se pudo obtener la hora exacta' });
  }
};

// 🧾 Descargar PDF del historial de asistencias de un curso
const downloadReportController = async (req, res) => {
  try {
    const courseId = req.params.id;
    const token = req.headers.authorization;

    console.log('📥 Solicitando generación de PDF para curso:', courseId);
    const pdfPath = await generatePdfByCourse(courseId, token);

    if (!fs.existsSync(pdfPath)) {
      console.error('❌ Archivo PDF no encontrado en:', pdfPath);
      return res.status(500).json({ error: 'No se pudo generar el PDF' });
    }

    console.log('✅ PDF encontrado. Enviando descarga...');
    res.download(pdfPath);
  } catch (error) {
    console.error('❌ Error al generar el PDF:', error.message);
    res.status(500).json({ error: 'No se pudo generar el reporte PDF' });
  }
};

module.exports = {
  registerController,
  studentHistoryController,
  courseHistoryController,
  ntpTimeController,
  downloadReportController
};
