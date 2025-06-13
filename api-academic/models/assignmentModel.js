const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User' // Referencia lógica al usuario en api-auth
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Course'
  },
  role: {
    type: String,
    enum: ['student', 'teacher'],
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Admin o profesor que realizó la asignación
  }
}, {
  timestamps: true
});

// Prevenir duplicados: un usuario no puede tener la misma asignación dos veces
assignmentSchema.index({ userId: 1, courseId: 1, role: 1 }, { unique: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
