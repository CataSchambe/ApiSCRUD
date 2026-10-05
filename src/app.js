const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Montaje de rutas de la API bajo /api
app.use('/api', apiRoutes);

// Manejo de rutas desconocidas (404 Not Found)
app.use((req, res) => {
  res.status(404).json({
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

// Middleware centralizado de errores (siempre al final)
app.use(errorHandler);

module.exports = app;
