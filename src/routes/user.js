import express from "express"
import { pool } from "../config/database.js"
import multer from "multer"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


const router = express.Router()


// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../public/uploads")
    // Crear el directorio si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, file.fieldname + "-" + uniqueSuffix + ext)
  },
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/
    const mimetype = filetypes.test(file.mimetype)
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())

    if (mimetype && extname) {
      return cb(null, true)
    }
    cb(new Error("Solo se permiten imágenes (jpeg, jpg, png, gif)"))
  },
})

// Middleware para verificar autenticación
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    next()
  } else {
    res.status(401).json({ success: false, message: "No autorizado" })
  }
}

// Obtener perfil de usuario
router.get("/profile", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId

    const [users] = await pool.query(
      "SELECT id, nombre, correo_electronico, titular, acerca_de, foto_perfil, foto_portada FROM usuarios WHERE id = ?",
      [userId],
    )

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" })
    }

    // Obtener experiencia laboral
    const [experiencia] = await pool.query(
      "SELECT * FROM experiencia_laboral WHERE usuario_id = ? ORDER BY fecha_inicio DESC",
      [userId],
    )

    // Obtener educación
    const [educacion] = await pool.query("SELECT * FROM educacion WHERE usuario_id = ? ORDER BY fecha_inicio DESC", [
      userId,
    ])

    // Obtener habilidades
    const [habilidades] = await pool.query("SELECT * FROM habilidades_usuario WHERE usuario_id = ?", [userId])

    const usuario = users[0]

    return res.status(200).json({
      success: true,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo_electronico: usuario.correo_electronico,
        titular: usuario.titular,
        acerca_de: usuario.acerca_de,
        foto_perfil: usuario.foto_perfil,
        foto_portada: usuario.foto_portada,
      },
      experiencia: experiencia,
      educacion: educacion,
      habilidades: habilidades.map((h) => h.habilidad),
    })
  } catch (error) {
    console.error("Error al obtener perfil:", error)
    return res.status(500).json({ success: false, message: "Error interno del servidor" })
  }
})

// Obtener todos los datos del perfil
router.get("/profile/full", isAuthenticated, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // Ejecutar todas las consultas en paralelo
    const [
      [user],
      experience,
      education,
      skills,
      languages
    ] = await Promise.all([
      connection.query(
        "SELECT id, nombre, correo_electronico, titular, acerca_de, foto_perfil, foto_portada FROM usuarios WHERE id = ?",
        [req.session.userId]
      ),
      connection.query(
        "SELECT * FROM experiencia_laboral WHERE usuario_id = ? ORDER BY fecha_inicio DESC",
        [req.session.userId]
      ),
      connection.query(
        "SELECT * FROM educacion WHERE usuario_id = ? ORDER BY fecha_inicio DESC",
        [req.session.userId]
      ),
      connection.query(
        "SELECT habilidad FROM habilidades_usuario WHERE usuario_id = ?",
        [req.session.userId]
      ),
      connection.query(
        "SELECT idioma FROM idiomas_usuario WHERE usuario_id = ?",
        [req.session.userId]
      )
    ]);

    // Establecer headers para caché
    res.set({
      'Cache-Control': 'private, max-age=60', // Cache por 1 minuto
      'Vary': 'Cookie' // Variar caché por sesión
    });

    res.json({
      success: true,
      data: {
        user: user[0],
        experience: experience[0],
        education: education[0],
        skills: skills[0].map(s => s.habilidad),
        languages: languages[0].map(l => l.idioma)
      }
    });
  } catch (error) {
    console.error("Error al obtener datos del perfil:", error);
    res.status(500).json({ success: false, message: "Error al obtener datos" });
  } finally {
    connection.release();
  }
});

// Actualizar perfil de usuario
router.put("/profile", isAuthenticated, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const userId = req.session.userId;
    const { nombre, titular, acerca_de, experiencia, educacion, habilidades } = req.body;

    // Actualizar información básica
    await connection.query(
      "UPDATE usuarios SET nombre = ?, titular = ?, acerca_de = ? WHERE id = ?",
      [nombre, titular, acerca_de, userId]
    );

    // Actualizar habilidades
    if (Array.isArray(habilidades)) {
      // Eliminar habilidades anteriores
      await connection.query(
        "DELETE FROM habilidades_usuario WHERE usuario_id = ?",
        [userId]
      );

      // Insertar nuevas habilidades si existen
      if (habilidades.length > 0) {
        const skillValues = habilidades.map(habilidad => [userId, habilidad]);
        await connection.query(
          "INSERT INTO habilidades_usuario (usuario_id, habilidad) VALUES ?",
          [skillValues]
        );
      }
    }

    // Actualizar experiencia
    if (Array.isArray(experiencia)) {
      await connection.query("DELETE FROM experiencia_laboral WHERE usuario_id = ?", [userId]);
      for (const exp of experiencia) {
        const fechaInicio = `${exp.fecha_inicio}-01-01`;
        const fechaFin = exp.fecha_fin ? `${exp.fecha_fin}-01-01` : null;
        
        await connection.query(
          "INSERT INTO experiencia_laboral (usuario_id, empresa, puesto, fecha_inicio, fecha_fin) VALUES (?, ?, ?, ?, ?)",
          [userId, exp.empresa, exp.puesto, fechaInicio, fechaFin]
        );
      }
    }

    // Actualizar educación
    if (Array.isArray(educacion)) {
      await connection.query("DELETE FROM educacion WHERE usuario_id = ?", [userId]);
      for (const edu of educacion) {
        const fechaInicio = `${edu.fecha_inicio}-01-01`;
        const fechaFin = edu.fecha_fin ? `${edu.fecha_fin}-01-01` : null;
        
        await connection.query(
          "INSERT INTO educacion (usuario_id, institucion, titulo, fecha_inicio, fecha_fin) VALUES (?, ?, ?, ?, ?)",
          [userId, edu.institucion, edu.titulo, fechaInicio, fechaFin]
        );
      }
    }

    await connection.commit();
    return res.status(200).json({
      success: true,
      message: "Perfil actualizado exitosamente"
    });

  } catch (error) {
    await connection.rollback();
    console.error("Error al actualizar perfil:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error al actualizar el perfil"
    });
  } finally {
    connection.release();
  }
});

// Subir/actualizar foto de perfil
router.post("/profile/photo", isAuthenticated, upload.single("profilePhoto"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "No se subió ninguna imagen" 
      });
    }

    const userId = req.session.userId;
    const photoUrl = `/public/uploads/${req.file.filename}`;

    // Actualizar la base de datos con la nueva URL de la foto
    await pool.query(
      "UPDATE usuarios SET foto_perfil = ? WHERE id = ?",
      [photoUrl, userId]
    );

    return res.status(200).json({
      success: true,
      message: "Foto de perfil actualizada exitosamente",
      photoUrl: photoUrl
    });
  } catch (error) {
    console.error("Error al actualizar foto de perfil:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error al actualizar la foto de perfil" 
    });
  }
});

router.post("/profile/cover", isAuthenticated, upload.single("coverPhoto"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "No se subió ninguna imagen" 
      });
    }

    const userId = req.session.userId;
    const photoUrl = `/public/uploads/${req.file.filename}`;

    // Actualizar la base de datos con la nueva URL de la foto
    await pool.query(
      "UPDATE usuarios SET foto_portada = ? WHERE id = ?",
      [photoUrl, userId]
    );

    return res.status(200).json({
      success: true,
      message: "Foto de portada actualizada exitosamente",
      photoUrl: photoUrl
    });
  } catch (error) {
    console.error("Error al actualizar foto de portada:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error al actualizar la foto de portada" 
    });
  }
});

// Actualizar información "Acerca de"
router.put("/profile/about", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { acerca_de } = req.body;

    await pool.query(
      "UPDATE usuarios SET acerca_de = ? WHERE id = ?",
      [acerca_de, userId]
    );

    return res.status(200).json({
      success: true,
      message: "Información actualizada exitosamente"
    });
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    return res.status(500).json({
      success: false,
      message: "Error al actualizar la información"
    });
  }
});

// Experiencia laboral

// Agregar experiencia laboral
router.post("/experience", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId
    const { empresa, puesto, fecha_inicio, fecha_fin, descripcion } = req.body

    await pool.query(
      "INSERT INTO experiencia_laboral (usuario_id, empresa, puesto, fecha_inicio, fecha_fin, descripcion) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, empresa, puesto, fecha_inicio, fecha_fin, descripcion],
    )

    return res.status(201).json({ success: true, message: "Experiencia laboral agregada exitosamente" })
  } catch (error) {
    console.error("Error al agregar experiencia:", error)
    return res.status(500).json({ success: false, message: "Error interno del servidor" })
  }
})

// Actualizar experiencia laboral
router.put("/experience/:id", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId
    const experienceId = req.params.id
    const { empresa, puesto, fecha_inicio, fecha_fin, descripcion } = req.body

    // Verificar que la experiencia pertenece al usuario
    const [experiences] = await pool.query("SELECT * FROM experiencia_laboral WHERE id = ? AND usuario_id = ?", [
      experienceId,
      userId,
    ])

    if (experiences.length === 0) {
      return res.status(404).json({ success: false, message: "Experiencia no encontrada" })
    }

    await pool.query(
      "UPDATE experiencia_laboral SET empresa = ?, puesto = ?, fecha_inicio = ?, fecha_fin = ?, descripcion = ? WHERE id = ?",
      [empresa, puesto, fecha_inicio, fecha_fin, descripcion, experienceId],
    )

    return res.status(200).json({ success: true, message: "Experiencia actualizada exitosamente" })
  } catch (error) {
    console.error("Error al actualizar experiencia:", error)
    return res.status(500).json({ success: false, message: "Error interno del servidor" })
  }
})

// Eliminar experiencia laboral
router.delete("/experience/:id", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId
    const experienceId = req.params.id

    // Verificar que la experiencia pertenece al usuario
    const [experiences] = await pool.query("SELECT * FROM experiencia_laboral WHERE id = ? AND usuario_id = ?", [
      experienceId,
      userId,
    ])

    if (experiences.length === 0) {
      return res.status(404).json({ success: false, message: "Experiencia no encontrada" })
    }

    await pool.query("DELETE FROM experiencia_laboral WHERE id = ?", [experienceId])

    return res.status(200).json({ success: true, message: "Experiencia eliminada exitosamente" })
  } catch (error) {
    console.error("Error al eliminar experiencia:", error)
    return res.status(500).json({ success: false, message: "Error interno del servidor" })
  }
})

// Actualizar experiencia laboral
router.post("/profile/experience", isAuthenticated, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.session.userId;
    const { experiences } = req.body;

    if (!Array.isArray(experiences) || experiences.length === 0) {
      throw new Error('Datos de experiencia inválidos');
    }

    await connection.beginTransaction();

    // Limpiar experiencias existentes antes de insertar las nuevas
    await connection.query(
      "DELETE FROM experiencia_laboral WHERE usuario_id = ?",
      [userId]
    );

    // Insertar las nuevas experiencias
    for (const exp of experiences) {
      if (!exp.empresa || !exp.puesto || !exp.fecha_inicio) {
        throw new Error('Faltan campos requeridos');
      }

      const fechaInicio = `${exp.fecha_inicio}-01-01`;
      const fechaFin = exp.fecha_fin ? `${exp.fecha_fin}-01-01` : null;

      await connection.query(
        "INSERT INTO experiencia_laboral (usuario_id, empresa, puesto, fecha_inicio, fecha_fin) VALUES (?, ?, ?, ?, ?)",
        [userId, exp.empresa, exp.puesto, fechaInicio, fechaFin]
      );
    }

    await connection.commit();
    res.json({ 
      success: true, 
      message: 'Experiencia guardada exitosamente'
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al guardar experiencia:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Error al guardar la experiencia"
    });
  } finally {
    connection.release();
  }
});

// Actualizar la ruta de eliminación de experiencia
router.delete("/profile/experience/:id", isAuthenticated, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.session.userId;
    const experienceId = req.params.id;

    // Verificar que la experiencia pertenece al usuario
    const [experience] = await pool.query(
      "SELECT * FROM experiencia_laboral WHERE id = ? AND usuario_id = ?",
      [experienceId, userId]
    );

    if (experience.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Experiencia no encontrada o no autorizada"
      });
    }

    await connection.beginTransaction();

    // Eliminar la experiencia
    await connection.query(
      "DELETE FROM experiencia_laboral WHERE id = ? AND usuario_id = ?",
      [experienceId, userId]
    );

    await connection.commit();
    
    res.json({
      success: true,
      message: "Experiencia eliminada exitosamente"
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al eliminar experiencia:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar la experiencia"
    });
  } finally {
    connection.release();
  }
});

// Educación

// Agregar educación
router.post("/education", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId
    const { institucion, titulo, fecha_inicio, fecha_fin, descripcion } = req.body

    await pool.query(
      "INSERT INTO educacion (usuario_id, institucion, titulo, fecha_inicio, fecha_fin, descripcion) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, institucion, titulo, fecha_inicio, fecha_fin, descripcion],
    )

    return res.status(201).json({ success: true, message: "Educación agregada exitosamente" })
  } catch (error) {
    console.error("Error al agregar educación:", error)
    return res.status(500).json({ success: false, message: "Error interno del servidor" })
  }
})

// Actualizar educación
router.put("/education/:id", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId
    const educationId = req.params.id
    const { institucion, titulo, fecha_inicio, fecha_fin, descripcion } = req.body

    // Verificar que la educación pertenece al usuario
    const [education] = await pool.query("SELECT * FROM educacion WHERE id = ? AND usuario_id = ?", [
      educationId,
      userId,
    ])

    if (education.length === 0) {
      return res.status(404).json({ success: false, message: "Educación no encontrada" })
    }

    await pool.query(
      "UPDATE educacion SET institucion = ?, titulo = ?, fecha_inicio = ?, fecha_fin = ?, descripcion = ? WHERE id = ?",
      [institucion, titulo, fecha_inicio, fecha_fin, descripcion, educationId],
    )

    return res.status(200).json({ success: true, message: "Educación actualizada exitosamente" })
  } catch (error) {
    console.error("Error al actualizar educación:", error)
    return res.status(500).json({ success: false, message: "Error interno del servidor" })
  }
})

// Eliminar educación
router.delete("/education/:id", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId
    const educationId = req.params.id

    // Verificar que la educación pertenece al usuario
    const [education] = await pool.query("SELECT * FROM educacion WHERE id = ? AND usuario_id = ?", [
      educationId,
      userId,
    ])

    if (education.length === 0) {
      return res.status(404).json({ success: false, message: "Educación no encontrada" })
    }

    await pool.query("DELETE FROM educacion WHERE id = ?", [educationId])

    return res.status(200).json({ success: true, message: "Educación eliminada exitosamente" })
  } catch (error) {
    console.error("Error al eliminar educación:", error)
    return res.status(500).json({ success: false, message: "Error interno del servidor" })
  }
})

// Actualizar educación
router.post("/profile/education", isAuthenticated, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.session.userId;
    const { education } = req.body;

    if (!Array.isArray(education) || education.length === 0) {
      throw new Error('Datos de educación inválidos');
    }

    await connection.beginTransaction();

    // Verificar duplicados antes de insertar
    for (const edu of education) {
      if (!edu.institucion || !edu.titulo || !edu.fecha_inicio) {
        throw new Error('Faltan campos requeridos');
      }

      // Buscar si ya existe una educación similar
      const [existingEdu] = await connection.query(
        `SELECT * FROM educacion 
         WHERE usuario_id = ? 
         AND LOWER(institucion) = LOWER(?) 
         AND LOWER(titulo) = LOWER(?)`,
        [userId, edu.institucion, edu.titulo]
      );

      if (existingEdu.length > 0) {
        throw new Error(`Ya existe un registro para ${edu.institucion} con el título ${edu.titulo}`);
      }

      // Si no existe, insertar el nuevo registros
      const fechaInicio = `${edu.fecha_inicio}-01-01`;
      const fechaFin = edu.fecha_fin ? `${edu.fecha_fin}-01-01` : null;

      await connection.query(
        "INSERT INTO educacion (usuario_id, institucion, titulo, fecha_inicio, fecha_fin) VALUES (?, ?, ?, ?, ?)",
        [userId, edu.institucion, edu.titulo, fechaInicio, fechaFin]
      );
    }

    await connection.commit();
    res.json({ 
      success: true, 
      message: 'Educación guardada exitosamente'
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al guardar educación:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Error al guardar la educación"
    });
  } finally {
    connection.release();
  }
});

// Eliminar educación
router.delete("/profile/education/:id", isAuthenticated, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.session.userId;
    const educationId = req.params.id;

    // Verificar que la educación pertenece al usuario
    const [education] = await connection.query(
      "SELECT * FROM educacion WHERE id = ? AND usuario_id = ?",
      [educationId, userId]
    );

    if (education.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Educación no encontrada o no autorizada"
      });
    }

    await connection.beginTransaction();

    // Eliminar la educación
    await connection.query(
      "DELETE FROM educacion WHERE id = ? AND usuario_id = ?",
      [educationId, userId]
    );

    await connection.commit();
    
    res.json({
      success: true,
      message: "Educación eliminada exitosamente"
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al eliminar educación:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar la educación"
    });
  } finally {
    connection.release();
  }
});

// Habilidades

// Agregar habilidad
router.post("/skills", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId
    const { habilidad } = req.body

    // Verificar que la habilidad no exista ya para este usuario
    const [existingSkills] = await pool.query(
      "SELECT * FROM habilidades_usuario WHERE usuario_id = ? AND habilidad = ?",
      [userId, habilidad],
    )

    if (existingSkills.length > 0) {
      return res.status(400).json({ success: false, message: "Ya tienes esta habilidad" })
    }

    await pool.query("INSERT INTO habilidades_usuario (usuario_id, habilidad) VALUES (?, ?)", [userId, habilidad])

    return res.status(201).json({ success: true, message: "Habilidad agregada exitosamente" })
  } catch (error) {
    console.error("Error al agregar habilidad:", error)
    return res.status(500).json({ success: false, message: "Error interno del servidor" })
  }
})

// Eliminar habilidad
router.delete("/skills/:id", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId
    const skillId = req.params.id

    // Verificar que la habilidad pertenece al usuario
    const [skills] = await pool.query("SELECT * FROM habilidades_usuario WHERE id = ? AND usuario_id = ?", [
      skillId,
      userId,
    ])

    if (skills.length === 0) {
      return res.status(404).json({ success: false, message: "Habilidad no encontrada" })
    }

    await pool.query("DELETE FROM habilidades_usuario WHERE id = ?", [skillId])

    return res.status(200).json({ success: true, message: "Habilidad eliminada exitosamente" })
  } catch (error) {
    console.error("Error al eliminar habilidad:", error)
    return res.status(500).json({ success: false, message: "Error interno del servidor" })
  }
})

// Eliminar habilidad por texto
router.delete("/profile/skills", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { habilidad } = req.body;

    const [result] = await pool.query(
      "DELETE FROM habilidades_usuario WHERE usuario_id = ? AND habilidad = ?",
      [userId, habilidad]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Habilidad no encontrada"
      });
    }

    res.json({
      success: true,
      message: "Habilidad eliminada exitosamente"
    });
  } catch (error) {
    console.error("Error al eliminar habilidad:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar la habilidad"
    });
  }
});

// Actualizar habilidades
router.post("/profile/skills", isAuthenticated, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.session.userId;
    const { skills } = req.body;

    await connection.beginTransaction();

    // Eliminar habilidades anteriores
    await connection.query(
      "DELETE FROM habilidades_usuario WHERE usuario_id = ?",
      [userId]
    );

    // Insertar nuevas habilidades
    if (skills && skills.length > 0) {
      const values = skills.map(skill => [userId, skill]);
      await connection.query(
        "INSERT INTO habilidades_usuario (usuario_id, habilidad) VALUES ?",
        [values]
      );
    }

    await connection.commit();
    res.json({
      success: true,
      message: "Habilidades actualizadas exitosamente"
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al actualizar habilidades:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar habilidades"
    });
  } finally {
    connection.release();
  }
});

// Actualizar idiomas
router.post("/profile/languages", isAuthenticated, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.session.userId;
    const { languages } = req.body;

    await connection.beginTransaction();

    // Eliminar idiomas anteriores
    await connection.query("DELETE FROM idiomas_usuario WHERE usuario_id = ?", [userId]);

    // Insertar nuevos idiomas
    if (languages && languages.length > 0) {
      const values = languages.map(language => [userId, language]);
      await connection.query(
        "INSERT INTO idiomas_usuario (usuario_id, idioma) VALUES ?",
        [values]
      );
    }

    await connection.commit();
    res.json({
      success: true,
      message: "Idiomas actualizados exitosamente"
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al actualizar idiomas:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar idiomas"
    });
  } finally {
    connection.release();
  }
});

// Eliminar un idioma específico
router.delete("/profile/languages/:id", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const languageId = parseInt(req.params.id); // Convertir a número

    // Validar que el ID sea un número válido
    if (isNaN(languageId)) {
      return res.status(400).json({
        success: false,
        message: "ID de idioma inválido"
      });
    }

    const [result] = await pool.query(
      "DELETE FROM idiomas_usuario WHERE id = ? AND usuario_id = ?",
      [languageId, userId]
    );

    // Verificar si se eliminó algún registro
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Idioma no encontrado o no autorizado para eliminarlo"
      });
    }

    res.json({
      success: true,
      message: "Idioma eliminado exitosamente"
    });
  } catch (error) {
    console.error("Error al eliminar idioma:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar idioma"
    });
  }
});

// Eliminar idioma por texto
router.delete("/profile/languages", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { idioma } = req.body;

    const [result] = await pool.query(
      "DELETE FROM idiomas_usuario WHERE usuario_id = ? AND idioma = ?",
      [userId, idioma]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Idioma no encontrado"
      });
    }

    res.json({
      success: true,
      message: "Idioma eliminado exitosamente"
    });
  } catch (error) {
    console.error("Error al eliminar idioma:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar el idioma"
    });
  }
});

export default router

