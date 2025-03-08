import { connectMongoDB } from './config/database.js';

// Inicializar conexiones de base de datos
try {
  await connectMongoDB();
  // ...rest of your app initialization...
} catch (error) {
  console.error('Error al inicializar la base de datos:', error);
  process.exit(1);
}
