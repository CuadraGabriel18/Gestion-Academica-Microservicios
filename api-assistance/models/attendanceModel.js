const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Course'
  },
  status: {
    type: String,
    enum: ['present', 'absent'], // ✅ Usamos valores correctos en inglés
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  ntpTime: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Attendance', attendanceSchema);
