import express from "express"
import path from "path"
import { fileURLToPath } from "url"
import session from "express-session"
import bodyParser from "body-parser"
import dotenv from "dotenv"
import { testConnection } from "./src/config/database.js"
import authRoutes from "./src/routes/auth.js"
import userRoutes from "./src/routes/user.js"
import jobRoutes from "./src/routes/index.js"

// Configuración
dotenv.config()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const app = express()
const PORT = process.env.PORT || 3006; // Cambia 3006 por 3007 (o cualquier puerto libre)

// Middleware
app.use(express.static(path.join(__dirname, "public")))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secreto_del_session",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    },
  }),
)

// Servir archivos estáticos
app.use("/public", express.static(path.join(__dirname, "src/public")))
app.use("/public/uploads", express.static(path.join(__dirname, "public/uploads")))

// Rutas API
app.use("/auth", authRoutes)
app.use("/users", userRoutes)
app.use("/jobs", jobRoutes)

// Rutas de vistas
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "src/views/login.html"))
})

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "src/views/login.html"))
})

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "src/views/register.html"))
})

app.get("/home", (req, res) => {
  // Proteger ruta - solo usuarios autenticados
  if (!req.session.userId) {
    return res.redirect("/")
  }
  res.sendFile(path.join(__dirname, "src/views/interfaz.html"))
})

app.get("/profile", (req, res) => {
  // Proteger ruta - solo usuarios autenticados
  if (!req.session.userId) {
    return res.redirect("/")
  }
  res.sendFile(path.join(__dirname, "src/views/perfil.html"))
})

// Manejo de errores mejorado con la firma correcta:
app.use((err, req, res, next) => {
  console.error(err.stack || err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).send("¡Algo salió mal!");
});

// Verificar conexión a la base de datos y luego iniciar el servidor
(async function startServer() {
  const dbConnected = await testConnection()
  if (!dbConnected) {
    console.error("Error al conectar a la base de datos, terminando ejecución.")
    process.exit(1)
  }
  const server = app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
  });

  // Agregar manejo de error para evitar conflicto si el puerto ya está en uso
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`El puerto ${PORT} ya está en uso. Por favor, utiliza otro puerto o cierra la aplicación que lo usa.`);
      process.exit(1);
    }
  });
})()

