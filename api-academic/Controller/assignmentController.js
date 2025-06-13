const {
  assignUserToCourse,
  getStudentsByCourse,
  getTeachersByCourse,
  isUserAssignedToCourse,
  getCoursesAssignedToUser,
  joinCourseByCode,
  validateStudentAssignment // ✅ Nuevo import
} = require('../Service/assignmentService');

const AUTH_API = 'https://api-auth-qaac.onrender.com/auth/users';

// 🔍 Obtener información del usuario desde API-AUTH
const getUserData = async (userId, token) => {
  const res = await fetch(`${AUTH_API}/${userId}`, {
    headers: { Authorization: token }
  });
  if (!res.ok) return null;
  return await res.json();
};

// ✅ Asignar usuario (student o teacher) a un curso
const assignController = async (req, res) => {
  try {
    const { userId, courseId, role } = req.body;
    const requesterId = req.user.id;
    const requesterRole = req.user.role;
    const token = req.headers.authorization;

    if (!userId || !courseId || !role) {
      return res.status(400).json({ message: 'Faltan datos: userId, courseId o role' });
    }

    // 🔐 Validación de permisos
    if (role === 'teacher' && requesterRole === 'teacher' && requesterId !== userId) {
      return res.status(403).json({ message: 'No puedes asignar a otro profesor que no seas tú' });
    }

    if (requesterRole !== 'admin' && requesterRole !== 'teacher') {
      return res.status(403).json({ message: 'No autorizado para asignar usuarios a cursos' });
    }

    // 🧾 Registrar asignación
    const assignment = await assignUserToCourse(
      { userId, courseId, role, assignedBy: requesterId },
      token
    );

    res.status(201).json({
      message: `Usuario asignado como ${role} al curso correctamente`,
      assignment
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 👥 Obtener todos los estudiantes de un curso
const getStudentsController = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;
    const token = req.headers.authorization;

    // Validar acceso del profesor asignado
    if (userRole === 'teacher') {
      const assigned = await isUserAssignedToCourse(userId, courseId);
      if (!assigned) {
        return res.status(403).json({ message: 'No estás asignado a este curso como maestro' });
      }
    }

    const studentIds = await getStudentsByCourse(courseId);
    const students = await Promise.all(
      studentIds.map(async (id) => await getUserData(id, token))
    );

    res.status(200).json({ students });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

// 👨‍🏫 Obtener todos los profesores de un curso
const getTeachersController = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;
    const token = req.headers.authorization;

    // Validar acceso del estudiante asignado
    if (userRole === 'student') {
      const assigned = await isUserAssignedToCourse(userId, courseId);
      if (!assigned) {
        return res.status(403).json({ message: 'No estás asignado a este curso como estudiante' });
      }
    }

    const teacherIds = await getTeachersByCourse(courseId);
    const teachers = await Promise.all(
      teacherIds.map(async (id) => await getUserData(id, token))
    );

    res.status(200).json({ teachers });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

// 📚 Obtener todos los cursos asignados al usuario actual
const getCoursesForUserController = async (req, res) => {
  try {
    const userId = req.user.id;
    const token = req.headers.authorization;

    const courses = await getCoursesAssignedToUser(userId);
    res.status(200).json({ courses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🔑 Unirse a un curso con código
const joinByCodeController = async (req, res) => {
  try {
    const { joinCode } = req.body;
    const userId = req.user.id;
    const token = req.headers.authorization;

    const course = await joinCourseByCode(joinCode, userId, token);

    res.status(200).json({
      message: 'Te uniste al curso correctamente',
      course
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ✅ Validar si estudiante está asignado (nuevo endpoint)
const validateAssignmentController = async (req, res) => {
  try {
    const { studentId, courseId } = req.body;

    if (!studentId || !courseId) {
      return res.status(400).json({ message: 'Faltan studentId o courseId' });
    }

    await validateStudentAssignment(studentId, courseId);
    res.status(200).json({ message: 'Estudiante asignado correctamente al curso' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  assignController,
  getStudentsController,
  getTeachersController,
  getCoursesForUserController,
  joinByCodeController,
  validateAssignmentController // ✅ Exportado
};
