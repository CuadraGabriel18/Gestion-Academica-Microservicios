const Course = require('../models/courseModel');
const Assignment = require('../models/assignmentModel');
const crypto = require('crypto');

const AUTH_API = 'https://api-auth-qaac.onrender.com/auth/users';

// 🔐 Generador de código de ingreso único
function generateJoinCode(length = 6) {
  return crypto.randomBytes(length).toString('hex').slice(0, length).toUpperCase();
}

// 🔄 Obtener usuario desde el microservicio de autenticación
async function getUserById(userId, token) {
  if (!token) throw new Error('Token requerido para autenticación');

  const response = await fetch(`${AUTH_API}/${userId}`, {
    headers: { Authorization: token }
  });

  if (!response.ok) {
    throw new Error('Usuario no válido o no encontrado');
  }

  const user = await response.json();
  return user;
}

// 📚 Crear un curso con validación del maestro y asignación automática
async function createCourse({ name, teacherId, period }, token) {
  if (!token) throw new Error('Token requerido');
  if (!name || !teacherId || !period) {
    throw new Error('Todos los campos son obligatorios: name, teacherId, period');
  }

  const teacher = await getUserById(teacherId, token);
  if (!teacher || teacher.role !== 'teacher') {
    throw new Error('El ID proporcionado no corresponde a un profesor válido');
  }

  // 🔁 Generar joinCode único
  let joinCode;
  do {
    joinCode = generateJoinCode();
  } while (await Course.findOne({ joinCode }));

  const course = new Course({
    name: name.trim(),
    teacherId,
    period: period.trim(),
    joinCode
  });

  await course.save();

  // ✅ Asignar automáticamente al maestro al curso
  await Assignment.create({
    userId: teacherId,
    courseId: course._id,
    role: 'teacher',
    assignedBy: teacherId // ✅ Se evita el error de tipo ObjectId
  });

  return course;
}

// 📋 Listar cursos con el nombre del maestro
async function listCourses(filter = {}, token) {
  const courses = await Course.find(filter).lean();

  const enrichedCourses = await Promise.all(
    courses.map(async (course) => {
      let teacherName = 'Sin nombre';
      try {
        const res = await fetch(`${AUTH_API}/${course.teacherId}`, {
          headers: { Authorization: token }
        });
        if (res.ok) {
          const data = await res.json();
          teacherName = data.username || 'Sin nombre';
        }
      } catch (_) {}
      return { ...course, teacherName };
    })
  );

  return enrichedCourses;
}

// 🔎 Buscar curso por ID (con nombre del maestro)
async function getCourseById(courseId, token) {
  const course = await Course.findById(courseId).lean();
  if (!course) throw new Error('Curso no encontrado');

  let teacherName = 'No disponible';

  try {
    const response = await fetch(`${AUTH_API}/${course.teacherId}`, {
      headers: { Authorization: token }
    });

    if (response.ok) {
      const data = await response.json();
      teacherName = data.username || 'No disponible';
    }
  } catch (_) {}

  return {
    ...course,
    teacherName
  };
}

// ✏️ Actualizar curso con validación de joinCode duplicado
async function updateCourse(courseId, updateData) {
  if (updateData.joinCode) {
    const duplicate = await Course.findOne({ joinCode: updateData.joinCode });
    if (duplicate && duplicate._id.toString() !== courseId) {
      throw new Error('Ya existe otro curso con ese código de ingreso');
    }
  }

  const updated = await Course.findByIdAndUpdate(courseId, updateData, {
    new: true,
    runValidators: true
  });

  if (!updated) throw new Error('Curso no encontrado');
  return updated;
}

// 🗑️ Eliminar curso
async function deleteCourse(courseId) {
  const deleted = await Course.findByIdAndDelete(courseId);
  if (!deleted) throw new Error('Curso no encontrado o ya eliminado');
  return deleted;
}

// 🔍 Buscar curso por código de ingreso
async function getCourseByJoinCode(joinCode) {
  const course = await Course.findOne({ joinCode });
  if (!course) throw new Error('Código de curso no válido');
  return course;
}

module.exports = {
  createCourse,
  listCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCourseByJoinCode
};
