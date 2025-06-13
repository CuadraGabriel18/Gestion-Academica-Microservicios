const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./data/config');
const attendanceRoutes = require('./routes/attendanceRoutes');

// 🔧 Variables de entorno
const PORT = process.env.PORT || 3005;
const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI;

console.log('🧪 JWT_SECRET usado en attendance:', JWT_SECRET);

if (!JWT_SECRET || !MONGO_URI) {
  console.error('❌ Error: Variables de entorno faltantes (.env)');
  process.exit(1);
}

// 🚀 Inicializar aplicación
const app = express();
app.use(cors());
app.use(express.json());

// 🌐 Conectar a MongoDB
connectDB();

// 📂 Rutas del microservicio de asistencia
app.use('/attendance', attendanceRoutes);

// 🧨 Middleware global de errores
app.use((err, req, res, next) => {
  console.error('❌ Error interno:', err.stack);
  res.status(500).json({ message: 'Error interno del servidor' });
});

// ▶️ Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`📊 Attendance API corriendo en http://0.0.0.0:${PORT}`);
});
