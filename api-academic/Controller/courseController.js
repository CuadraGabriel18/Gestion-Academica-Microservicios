const {
  createCourse,
  listCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCourseByJoinCode
} = require('../Service/courseService');

// 🎓 Crear curso (admin o profesor creando para sí mismo)
const createController = async (req, res) => {
  try {
    const { name, teacherId, period } = req.body;
    const requesterRole = req.user.role;
    const requesterId = req.user.id;
    const token = req.headers.authorization;

    if (!name || !teacherId || !period) {
      return res.status(400).json({
        message: 'Faltan datos requeridos: name, teacherId, period'
      });
    }

    // 🔐 Validar si un maestro intenta crear un curso que no es suyo
    if (requesterRole === 'teacher' && requesterId !== teacherId) {
      return res.status(403).json({
        message: 'No puedes crear cursos para otros profesores'
      });
    }

    // 📚 Crear curso y asignar automáticamente al maestro
    const course = await createCourse({ name, teacherId, period }, token);

    res.status(201).json({
      message: 'Curso creado correctamente',
      course
    });
  } catch (error) {
    console.error('❌ Error en createController:', error.message);
    res.status(400).json({ error: error.message });
  }
};

// 📋 Listar cursos según el rol del usuario autenticado
const listController = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const token = req.headers.authorization;

    let courses = [];

    if (role === 'admin') {
      // Admin puede ver todos los cursos
      courses = await listCourses({}, token);
    } else if (role === 'teacher') {
      // Maestros solo ven los cursos donde son responsables
      courses = await listCourses({ teacherId: userId }, token);
    } else {
      return res.status(403).json({
        message: 'No autorizado para ver cursos'
      });
    }

    res.status(200).json({ courses });
  } catch (error) {
    console.error('❌ Error en listController:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// 🔎 Obtener curso por ID (ahora con token para obtener nombre del maestro)
const getByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization;
    const course = await getCourseById(id, token);
    res.status(200).json({ course });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

// ✏️ Actualizar curso por ID (solo admin)
const updateController = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Solo los administradores pueden actualizar cursos'
      });
    }

    const { id } = req.params;
    const updated = await updateCourse(id, req.body);
    res.status(200).json({
      message: 'Curso actualizado correctamente',
      course: updated
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 🗑️ Eliminar curso por ID (solo admin)
const deleteController = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Solo los administradores pueden eliminar cursos'
      });
    }

    const { id } = req.params;
    const deleted = await deleteCourse(id);
    res.status(200).json({
      message: 'Curso eliminado correctamente',
      course: deleted
    });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

// 🔍 Obtener curso por código de ingreso (estudiantes o maestros)
const getByJoinCodeController = async (req, res) => {
  try {
    const { joinCode } = req.params;
    const course = await getCourseByJoinCode(joinCode);
    res.status(200).json({ course });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

module.exports = {
  createController,
  listController,
  getByIdController,
  updateController,
  deleteController,
  getByJoinCodeController
};
