const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('La variable de entorno MONGODB_URI no está definida.');
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`[Database] MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database Error] Error conectando a MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
