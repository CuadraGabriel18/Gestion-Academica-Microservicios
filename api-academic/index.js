const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./data/config');

// 📦 Rutas del microservicio académico
const courseRoutes = require('./routes/courseRoutes');
const assignmentRoutes = require('./routes/assignamenteRoutes');

// 🔧 Variables de entorno requeridas
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI;

console.log('🧪 JWT_SECRET usado en academic:', JWT_SECRET);

if (!JWT_SECRET || !MONGO_URI) {
  console.error('❌ Error: Variables de entorno faltantes (.env)');
  process.exit(1);
}

// 🚀 Inicializar la aplicación
const app = express();
app.use(cors());
app.use(express.json());

// 🌐 Conexión a MongoDB
connectDB();

// 🧭 Registro de rutas del microservicio
app.use('/courses', courseRoutes);
app.use('/assignments', assignmentRoutes);

// 🧨 Middleware global de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor' });
});

// ▶️ Iniciar el servidor
app.listen(PORT, '0.0.0.0',() => {
  console.log(`🎓 Academic API corriendo en http://0.0.0.0:${PORT}`);
});
