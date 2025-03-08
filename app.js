import path from 'path'
import express from 'express'
const app = express()
// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, 'public')))

app.use(express.json());

import authRoutes from "./src/routes/auth.js";
import userRoutes from "./src/routes/user.js";

// Monta el router de autenticación en la raíz para que '/perfil' funcione
app.use("/", authRoutes); 
// Si prefieres montar en '/auth', actualiza el enlace en tu HTML a '/auth/perfil'
// app.use("/auth", authRoutes);
