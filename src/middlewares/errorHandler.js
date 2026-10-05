/**
 * Middleware centralizado de manejo global de errores
 * Estandariza todas las respuestas de error en: { error: "mensaje" }
 */
const errorHandler = (err, req, res, next) => {
  // Error de casteo de Mongoose (ID no válido)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: `Formato inválido para el campo '${err.path}'. Se esperaba un ObjectId válido.`
    });
  }

  // Error de validación de campos requeridos de Mongoose
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      error: messages.join('. ')
    });
  }

  // Error con código de estado HTTP explícito
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message
    });
  }

  // Error genérico no controlado (500)
  console.error('[Unhandled Error]:', err);
  return res.status(500).json({
    error: 'Error interno del servidor.'
  });
};

module.exports = errorHandler;
