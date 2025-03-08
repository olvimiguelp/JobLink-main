import express from 'express';
import bcrypt from "bcrypt"
import { pool } from "../config/database.js"

const router = express.Router()

// Registro de usuario
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body

    // Validaciones básicas
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son requeridos",
      })
    }

    // Verificar si el correo ya existe
    const [existingUsers] = await pool.query("SELECT * FROM usuarios WHERE correo_electronico = ?", [email])

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Este correo electrónico ya está registrado",
      })
    }

    // Hashear la contraseña
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Insertar el nuevo usuario
    const [result] = await pool.query(
      "INSERT INTO usuarios (nombre, correo_electronico, contraseña) VALUES (?, ?, ?)",
      [name, email, hashedPassword],
    )

    // Establecer sesión
    req.session.userId = result.insertId
    req.session.userName = name
    req.session.userEmail = email

    return res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente",
      userId: result.insertId,
    })
  } catch (error) {
    console.error("Error en el registro:", error)
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

// Ruta para mostrar el perfil del usuario
router.get('/perfil', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/');
  }
  // ...código para traer datos del perfil...
  res.render('perfil', { user: { id: req.session.userId, name: req.session.userName } });
});

// Agregar nueva ruta para obtener perfil de usuario
router.get("/user-profile", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ 
      success: false, 
      message: "No autorizado" 
    });
  }

  pool.query(
    "SELECT id, nombre, foto_perfil FROM usuarios WHERE id = ?",
    [req.session.userId]
  )
  .then(([users]) => {
    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Usuario no encontrado" 
      });
    }
    res.json({ 
      success: true, 
      user: users[0] 
    });
  })
  .catch(error => {
    console.error("Error al obtener perfil:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener perfil" 
    });
  });
});

// Login de usuario
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validaciones básicas
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Se requiere correo y contraseña",
      });
    }

    // Buscar el usuario - Modificada la consulta para incluir contraseña
    const [users] = await pool.query(
      "SELECT id, nombre, correo_electronico, titular, foto_perfil, contraseña FROM usuarios WHERE correo_electronico = ?", 
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      });
    }

    const user = users[0];

    // Verificar que la contraseña hasheada existe
    if (!user.contraseña) {
      console.error("Error: Contraseña hasheada no encontrada para el usuario");
      return res.status(500).json({
        success: false,
        message: "Error en la autenticación",
      });
    }

    // Verificar la contraseña
    const passwordMatch = await bcrypt.compare(password, user.contraseña);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      });
    }

    // Establecer sesión con datos adicionales
    req.session.userId = user.id;
    req.session.userName = user.nombre;
    req.session.userEmail = user.correo_electronico;
    req.session.userTitle = user.titular;
    req.session.userPhoto = user.foto_perfil;

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.nombre,
        email: user.correo_electronico,
        title: user.titular,
        photo: user.foto_perfil
      },
    });
  } catch (error) {
    console.error("Error en el login:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
})

// Cerrar sesión
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error al cerrar sesión",
      })
    }

    res.clearCookie("connect.sid")
    return res.status(200).json({
      success: true,
      message: "Sesión cerrada exitosamente",
    })
  })
})

// Verificar sesión actual
router.get("/session", (req, res) => {
  if (req.session.userId) {
    return res.status(200).json({
      success: true,
      isLoggedIn: true,
      user: {
        id: req.session.userId,
        name: req.session.userName,
        email: req.session.userEmail,
      },
    })
  } else {
    return res.status(200).json({
      success: true,
      isLoggedIn: false,
    })
  }
})

export default router

