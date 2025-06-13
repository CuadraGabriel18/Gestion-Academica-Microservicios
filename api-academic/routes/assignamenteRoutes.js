const express = require('express');
const router = express.Router();
const {
  authenticateJWT,
  authorizeRoles
} = require('../Middlewares/authMiddleware');

const {
  assignController,
  getStudentsController,
  getTeachersController,
  getCoursesForUserController,
  joinByCodeController,
  validateAssignmentController // ✅ nuevo controlador importado
} = require('../Controller/assignmentController');

// 🎓 RUTAS DE ASIGNACIONES — Relación usuario ↔ curso

// 🔹 Asignar usuario a curso
// - Admin puede asignar a cualquier usuario
// - Teacher solo puede asignarse a sí mismo como maestro
router.post(
  '/',
  authenticateJWT,
  authorizeRoles('admin', 'teacher'),
  assignController
);

// 🔑 Unirse a un curso mediante código
// - Solo estudiantes
router.post(
  '/join',
  authenticateJWT,
  authorizeRoles('student'),
  joinByCodeController
);

// 👥 Listar estudiantes asignados a un curso
// - Admin o maestro asignado al curso
router.get(
  '/:id/students',
  authenticateJWT,
  authorizeRoles('admin', 'teacher'),
  getStudentsController
);

// 👨‍🏫 Listar maestros asignados a un curso
// - Admin o estudiante asignado al curso
router.get(
  '/:id/teachers',
  authenticateJWT,
  authorizeRoles('admin', 'student'),
  getTeachersController
);

// 📚 Obtener cursos asignados al usuario autenticado
// - Teacher ve los cursos donde imparte clase
// - Student ve los cursos donde está inscrito
router.get(
  '/my-courses',
  authenticateJWT,
  authorizeRoles('teacher', 'student'),
  getCoursesForUserController
);

// ✅ Validar si estudiante está asignado a un curso (para asistencia)
router.post(
  '/validate',
  authenticateJWT,
  authorizeRoles('teacher'),
  validateAssignmentController
);

module.exports = router;
