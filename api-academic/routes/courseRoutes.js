const express = require('express');
const router = express.Router();
const {
  authenticateJWT,
  authorizeRoles
} = require('../Middlewares/authMiddleware');

const {
  createController,
  listController,
  getByIdController,
  updateController,
  deleteController,
  getByJoinCodeController
} = require('../Controller/courseController');

// 📘 RUTAS DE CURSOS — CRUD protegido por JWT y roles

// 🆕 Crear un curso (solo admin o el mismo maestro)
router.post(
  '/',
  authenticateJWT,
  authorizeRoles('admin', 'teacher'),
  createController
);

// 📄 Listar todos los cursos
// - Admin: todos los cursos
// - Maestro: solo los cursos donde él es el responsable
router.get(
  '/',
  authenticateJWT,
  authorizeRoles('admin', 'teacher'),
  listController
);

// 🔍 Buscar curso por código de ingreso (para unirse con joinCode)
// - Usado por estudiantes o maestros que reciben el código
router.get(
  '/join/:joinCode',
  authenticateJWT,
  authorizeRoles('student', 'teacher'),
  getByJoinCodeController
);

// 🔎 Obtener un curso por su ID (admin, teacher, student)
router.get(
  '/:id',
  authenticateJWT,
  authorizeRoles('admin', 'teacher', 'student'),
  getByIdController
);

// ✏️ Actualizar curso por ID (solo admin)
router.put(
  '/:id',
  authenticateJWT,
  authorizeRoles('admin'),
  updateController
);

// 🗑️ Eliminar curso por ID (solo admin)
router.delete(
  '/:id',
  authenticateJWT,
  authorizeRoles('admin'),
  deleteController
);

module.exports = router;
