const express = require('express');
const router = express.Router();

const {
  authenticateJWT,
  authorizeRoles
} = require('../Middlewares/authMiddleware');

const {
  registerController,
  studentHistoryController,
  courseHistoryController,
  ntpTimeController,
  downloadReportController
} = require('../Controller/attendanceController');

// ✅ Registrar asistencia (solo maestro)
router.post(
  '/',
  authenticateJWT,
  authorizeRoles('teacher'),
  registerController
);

// 📄 Obtener historial de asistencias por estudiante (admin o maestro)
router.get(
  '/student/:id',
  authenticateJWT,
  authorizeRoles('admin', 'teacher'),
  studentHistoryController
);

// 📄 Obtener historial de asistencias por curso (admin o maestro)
router.get(
  '/course/:id',
  authenticateJWT,
  authorizeRoles('admin', 'teacher'),
  courseHistoryController
);

// ⏰ Obtener hora exacta desde NTP (cualquier usuario autenticado)
router.get(
  '/ntp',
  authenticateJWT,
  ntpTimeController
);

// 🧾 Descargar PDF de asistencias por curso (admin o maestro)
router.get(
  '/report/pdf/:id',
  authenticateJWT,
  authorizeRoles('admin', 'teacher'),
  downloadReportController
);

module.exports = router;
