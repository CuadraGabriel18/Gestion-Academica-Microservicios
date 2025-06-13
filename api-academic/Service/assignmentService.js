const Assignment = require('../models/assignmentModel');
const Course = require('../models/courseModel');

const AUTH_API = 'https://api-auth-qaac.onrender.com/auth/users';

// 🔍 Consultar usuario desde API-AUTH con JWT
async function getUserById(userId, token) {
  if (!token) throw new Error('Token requerido');

  const response = await fetch(`${AUTH_API}/${userId}`, {
    headers: {
      Authorization: token
    }
  });

  if (!response.ok) {
    throw new Error('Usuario no válido o no encontrado');
  }

  const user = await response.json();
  return user;
}

// ✅ Asignar usuario (teacher o student) a un curso
async function assignUserToCourse({ userId, courseId, role, assignedBy }, token) {
  if (!userId || !courseId || !role) {
    throw new Error('Faltan datos: userId, courseId o role');
  }

  const existing = await Assignment.findOne({ userId, courseId, role });
  if (existing) {
    throw new Error('El usuario ya está asignado a este curso con ese rol');
  }

  const course = await Course.findById(courseId);
  if (!course) {
    throw new Error('Curso no encontrado');
  }

  const user = await getUserById(userId, token);
  if (user.role !== role) {
    throw new Error(`El usuario no tiene el rol "${role}"`);
  }

  const assignment = new Assignment({ userId, courseId, role, assignedBy });
  await assignment.save();
  return assignment;
}

// 👥 Listar IDs de estudiantes asignados a un curso
async function getStudentsByCourse(courseId) {
  const assignments = await Assignment.find({ courseId, role: 'student' });
  return assignments.map(a => a.userId);
}

// 👨‍🏫 Listar IDs de maestros asignados a un curso
async function getTeachersByCourse(courseId) {
  const assignments = await Assignment.find({ courseId, role: 'teacher' });
  return assignments.map(a => a.userId);
}

// 🔎 Verificar si un usuario está asignado a un curso
async function isUserAssignedToCourse(userId, courseId) {
  const assignment = await Assignment.findOne({ userId, courseId });
  return !!assignment;
}

// 📚 Obtener todos los cursos asignados a un usuario
async function getCoursesAssignedToUser(userId) {
  const assignments = await Assignment.find({ userId });
  const courseIds = assignments.map(a => a.courseId);
  return await Course.find({ _id: { $in: courseIds } });
}

// 🔑 Unirse a curso mediante joinCode
async function joinCourseByCode(joinCode, userId, token) {
  if (!joinCode) throw new Error('Código de curso requerido');

  const course = await Course.findOne({ joinCode: joinCode.trim().toUpperCase() });
  if (!course) throw new Error('Código de curso inválido');

  const alreadyAssigned = await Assignment.findOne({ userId, courseId: course._id, role: 'student' });
  if (alreadyAssigned) throw new Error('Ya estás inscrito en este curso');

  const user = await getUserById(userId, token);
  if (user.role !== 'student') {
    throw new Error('Solo los estudiantes pueden unirse por código');
  }

  const assignment = new Assignment({
    userId,
    courseId: course._id,
    role: 'student',
    assignedBy: userId
  });

  await assignment.save();
  return course;
}

// ✅ NUEVO: Validar si un estudiante está asignado a un curso
async function validateStudentAssignment(studentId, courseId) {
  if (!studentId || !courseId) {
    throw new Error('Faltan studentId o courseId');
  }

  const assigned = await Assignment.findOne({ userId: studentId, courseId, role: 'student' });
  if (!assigned) {
    throw new Error('Estudiante no asignado al curso');
  }

  return true;
}

module.exports = {
  assignUserToCourse,
  getStudentsByCourse,
  getTeachersByCourse,
  isUserAssignedToCourse,
  getCoursesAssignedToUser,
  joinCourseByCode,
  validateStudentAssignment // ← ¡Nuevo export!
};
