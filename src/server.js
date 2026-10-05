require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`[Server] Servidor Kanban API corriendo en el puerto ${PORT}`);
    console.log(`[Server] Rutas disponibles bajo http://localhost:${PORT}/api/boards`);
  });
};

startServer();
