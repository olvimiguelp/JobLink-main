import express from "express"
import { pool } from "../config/database.js"
import multer from "multer"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// Middleware de autenticación para vistas
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
      next();
  } else {
      res.redirect('/');
  }
};

// Ruta principal (login)
router.get('/', (req, res) => {
  if (req.session && req.session.userId) {
      res.redirect('/interfaz');
  } else {
      res.sendFile(path.join(__dirname, '../views/login.html'));
  }
});

// Ruta para el registro
router.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/register.html'));
});

// Rutas protegidas
router.get('/interfaz', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/interfaz.html'));
});

router.get('/perfil', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/perfil.html'));
});

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Verifica que la ruta para uploads se arme correctamente.
    const uploadPath = path.join(__dirname, "../../public/uploads/logos")
    // Crear el directorio si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, "job-logo-" + uniqueSuffix + ext)
  },
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // Limite de 15MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|svg/
    const mimetype = filetypes.test(file.mimetype)
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())

    if (mimetype && extname) {
      return cb(null, true)
    }
    cb(new Error("Solo se permiten imágenes (jpeg, jpg, png, svg)"))
  },
})

// Mover la ruta /all al principio de las rutas de jobs
router.get("/all", async (req, res) => {
  try {
    const [jobs] = await pool.query(`
      SELECT o.*, u.nombre as empresa_nombre
      FROM ofertas_de_empleo o
      JOIN usuarios u ON o.usuario_id = u.id
      WHERE o.eliminado = 0
      ORDER BY o.creado_en DESC
    `);

    // Convertir los estados a su forma completa
    const jobsWithSkills = await Promise.all(
      jobs.map(async (job) => {
        const [skills] = await pool.query(
          "SELECT habilidad FROM habilidades_oferta WHERE oferta_id = ?",
          [job.id]
        );
        
        // Mapear los estados abreviados a su forma completa
        const estadoCompleto = {
          'Active': 'Active',
          'Closed': 'Closed',
          'Draft': 'Draft'
        }[job.estado] || job.estado;

        return {
          ...job,
          estado: estadoCompleto,
          habilidades: skills.map((skill) => skill.habilidad),
        };
      })
    );

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ 
      success: true, 
      jobs: jobsWithSkills 
    });
  } catch (error) {
    console.error("Error al obtener ofertas de empleo:", error);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ 
      success: false, 
      message: "Error interno del servidor" 
    });
  }
});

// Obtener todas las ofertas de empleo activas
router.get("/jobs", async (req, res) => {
  try {
    const [jobs] = await pool.query(`
      SELECT o.*, u.nombre as empresa_nombre
      FROM ofertas_de_empleo o
      JOIN usuarios u ON o.usuario_id = u.id
      WHERE o.estado = 'Activo' AND o.eliminado = 0
      ORDER BY o.creado_en DESC
    `);

    const jobsWithSkills = await Promise.all(
      jobs.map(async (job) => {
        const [skills] = await pool.query(
          "SELECT habilidad FROM habilidades_oferta WHERE oferta_id = ?",
          [job.id]
        );
        return {
          ...job,
          habilidades: skills.map((skill) => skill.habilidad),
        };
      })
    );

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ 
      success: true, 
      jobs: jobsWithSkills 
    });
  } catch (error) {
    console.error("Error al obtener ofertas de empleo:", error);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ 
      success: false, 
      message: "Error interno del servidor" 
    });
  }
});

// Obtener una oferta de empleo específica
router.get("/:id", async (req, res) => {
  try {
    const jobId = req.params.id

    const [jobs] = await pool.query(
      `
            SELECT o.*, u.nombre as empresa_nombre
            FROM ofertas_de_empleo o
            JOIN usuarios u ON o.usuario_id = u.id
            WHERE o.id = ? AND o.eliminado = 0
        `,
      [jobId],
    )

    if (jobs.length === 0) {
      return res.status(404).json({ success: false, message: "Oferta no encontrada" })
    }

    const job = jobs[0]

    // Obtener habilidades para esta oferta
    const [skills] = await pool.query("SELECT habilidad FROM habilidades_oferta WHERE oferta_id = ?", [jobId])

    job.habilidades = skills.map((skill) => skill.habilidad)

    return res.status(200).json({ success: true, job })
  } catch (error) {
    console.error("Error al obtener oferta de empleo:", error)
    return res.status(500).json({ success: false, message: "Error interno del servidor" })
  }
})

// Crear una nueva oferta de empleo
router.post("/", async (req, res) => {
  try {
    // Verificar autenticación
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: "No autorizado - Debe iniciar sesión"
      });
    }

    const userId = req.session.userId;
    const { 
      titulo, 
      descripcion, 
      requisitos, 
      salario, 
      tipo_contrato, 
      modalidad, 
      estado, 
      habilidades, 
      logo 
    } = req.body;

    // Validar y normalizar los valores de los campos enum
    const tipoContratoValido = normalizarTipoContrato(tipo_contrato);
    const modalidadValida = normalizarModalidad(modalidad);
    const estadoValido = normalizarEstado(estado);

    // Iniciar transacción
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.query(
        `INSERT INTO ofertas_de_empleo 
        (usuario_id, titulo, descripcion, requisitos, salario, tipo_contrato, modalidad, estado, logo) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          String(titulo),
          String(descripcion),
          String(requisitos),
          Number(salario),
          tipoContratoValido,
          modalidadValida,
          estadoValido,
          logo || null
        ]
      );

      if (Array.isArray(habilidades) && habilidades.length > 0) {
        const skillValues = habilidades.map(skill => [result.insertId, String(skill)]);
        await connection.query(
          'INSERT INTO habilidades_oferta (oferta_id, habilidad) VALUES ?',
          [skillValues]
        );
      }

      await connection.commit();

      return res.status(201).json({
        success: true,
        message: "Oferta de empleo creada exitosamente",
        jobId: result.insertId
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error al crear oferta:', error);
    return res.status(500).json({ 
      success: false, 
      message: "Error al crear la oferta de empleo",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
})

// Funciones auxiliares para normalizar valores
function normalizarTipoContrato(tipo) {
  const tipos = {
    'Full-time': 'Full-time',
    'Part-time': 'Part-time',
    'Contract': 'Contract',
    'Freelance': 'Freelance',
    'Internship': 'Internship'
  };
  return tipos[tipo] || 'Full-time';
}

function normalizarModalidad(modalidad) {
  const modalidades = {
    'On-site': 'site',
    'Remote': 'Remote',
    'Hybrid': 'Hybrid'
  };
  return modalidades[modalidad] || 'site';
}

function normalizarEstado(estado) {
  const estados = {
    'Active': 'Active',
    'Closed': 'Closed',
    'Draft': 'Draft'
  };
  return estados[estado] || 'Active';
}

// Subir logo de oferta
router.post("/upload-logo", isAuthenticated, upload.single("logo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No se subió ninguna imagen" });
    }

    // Construir la ruta absoluta del archivo
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const logoUrl = `${baseUrl}/public/uploads/logos/${req.file.filename}`;

    return res.status(200).json({
      success: true,
      message: "Logo subido exitosamente",
      logoUrl: logoUrl,
    });
  } catch (error) {
    console.error("Error al subir logo:", error);
    return res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
});

// Actualizar una oferta de empleo
router.put("/:id", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId
    const jobId = req.params.id

    // Verificar que la oferta existe y pertenece al usuario
    const [jobs] = await pool.query("SELECT * FROM ofertas_de_empleo WHERE id = ? AND usuario_id = ?", [jobId, userId])

    if (jobs.length === 0) {
      return res.status(404).json({ success: false, message: "Oferta no encontrada o no autorizado" })
    }

    const { titulo, descripcion, requisitos, salario, tipo_contrato, modalidad, estado, habilidades, logo } = req.body

    // Actualizar la oferta
    await pool.query(
      `
            UPDATE ofertas_de_empleo 
            SET titulo = ?, descripcion = ?, requisitos = ?, salario = ?, 
                tipo_contrato = ?, modalidad = ?, estado = ?, logo = ?
            WHERE id = ?
        `,
      [titulo, descripcion, requisitos, salario, tipo_contrato, modalidad, estado, logo, jobId],
    )

    // Actualizar habilidades
    if (habilidades) {
      // Eliminar habilidades existentes
      await pool.query("DELETE FROM habilidades_oferta WHERE oferta_id = ?", [jobId])

      // Insertar nuevas habilidades
      if (habilidades.length > 0) {
        const skillValues = habilidades.map((skill) => [jobId, skill])

        await pool.query(
          `
                    INSERT INTO habilidades_oferta (oferta_id, habilidad) 
                    VALUES ?
                `,
          [skillValues],
        )
      }
    }

    return res.status(200).json({ success: true, message: "Oferta actualizada exitosamente" })
  } catch (error) {
    console.error("Error al actualizar oferta:", error)
    return res.status(500).json({ success: false, message: "Error interno del servidor" })
  }
})

// Marcar una oferta como eliminada (soft delete)
router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId
    const jobId = req.params.id

    // Verificar que la oferta existe y pertenece al usuario
    const [jobs] = await pool.query("SELECT * FROM ofertas_de_empleo WHERE id = ? AND usuario_id = ?", [jobId, userId])

    if (jobs.length === 0) {
      return res.status(404).json({ success: false, message: "Oferta no encontrada o no autorizado" })
    }

    // Marcar como eliminada (soft delete)
    await pool.query('UPDATE ofertas_de_empleo SET eliminado = 1, estado = "Borrador" WHERE id = ?', [jobId])

    return res.status(200).json({ success: true, message: "Oferta eliminada exitosamente" })
  } catch (error) {
    console.error("Error al eliminar oferta:", error)
    return res.status(500).json({ success: false, message: "Error interno del servidor" })
  }
})

// Obtener ofertas creadas por el usuario
router.get("/user/created", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId

    const [jobs] = await pool.query(
      `
            SELECT * FROM ofertas_de_empleo 
            WHERE usuario_id = ? AND eliminado = 0
            ORDER BY creado_en DESC
        `,
      [userId],
    )

    // Para cada oferta, obtener sus habilidades
    const jobsWithSkills = await Promise.all(
      jobs.map(async (job) => {
        const [skills] = await pool.query("SELECT habilidad FROM habilidades_oferta WHERE oferta_id = ?", [job.id])

        return {
          ...job,
          habilidades: skills.map((skill) => skill.habilidad),
        }
      }),
    )

    return res.status(200).json({ success: true, jobs: jobsWithSkills })
  } catch (error) {
    console.error("Error al obtener ofertas creadas:", error)
    return res.status(500).json({ success: false, message: "Error interno del servidor" })
  }
})

// Obtener ofertas eliminadas por el usuario
router.get("/user/deleted", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId

    const [jobs] = await pool.query(
      `
            SELECT * FROM ofertas_de_empleo 
            WHERE usuario_id = ? AND eliminado = 1
            ORDER BY actualizado_en DESC
        `,
      [userId],
    )

    // Para cada oferta, obtener sus habilidades
    const jobsWithSkills = await Promise.all(
      jobs.map(async (job) => {
        const [skills] = await pool.query("SELECT habilidad FROM habilidades_oferta WHERE oferta_id = ?", [job.id])

        return {
          ...job,
          habilidades: skills.map((skill) => skill.habilidad),
        }
      }),
    )

    return res.status(200).json({ success: true, jobs: jobsWithSkills })
  } catch (error) {
    console.error("Error al obtener ofertas eliminadas:", error)
    return res.status(500).json({ success: false, message: "Error interno del servidor" })
  }
})

// Restaurar una oferta eliminada
router.put("/:id/restore", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId
    const jobId = req.params.id

    // Verificar que la oferta existe, está eliminada y pertenece al usuario
    const [jobs] = await pool.query(
      "SELECT * FROM ofertas_de_empleo WHERE id = ? AND usuario_id = ? AND eliminado = 1",
      [jobId, userId],
    )

    if (jobs.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Oferta no encontrada, no está eliminada o no autorizado",
      })
    }

    // Restaurar la oferta (quitar soft delete)
    await pool.query("UPDATE ofertas_de_empleo SET eliminado = 0 WHERE id = ?", [jobId])

    return res.status(200).json({ success: true, message: "Oferta restaurada exitosamente" })
  } catch (error) {
    console.error("Error al restaurar oferta:", error)
    return res.status(500).json({ success: false, message: "Error interno del servidor" })
  }
})

// Reportar una oferta
router.post("/:id/report", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId
    const jobId = req.params.id
    const { razon } = req.body

    // Verificar que la oferta existe
    const [jobs] = await pool.query("SELECT * FROM ofertas_de_empleo WHERE id = ? AND eliminado = 0", [jobId])

    if (jobs.length === 0) {
      return res.status(404).json({ success: false, message: "Oferta no encontrada" })
    }

    // Verificar que el usuario no haya reportado esta oferta antes
    const [existingReports] = await pool.query("SELECT * FROM reportes WHERE usuario_id = ? AND oferta_id = ?", [
      userId,
      jobId,
    ])

    if (existingReports.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Ya has reportado esta oferta anteriormente",
      })
    }

    // Crear el reporte
    await pool.query("INSERT INTO reportes (usuario_id, oferta_id, razon) VALUES (?, ?, ?)", [userId, jobId, razon])

    return res.status(201).json({ success: true, message: "Oferta reportada exitosamente" })
  } catch (error) {
    console.error("Error al reportar oferta:", error)
    return res.status(500).json({ success: false, message: "Error interno del servidor" })
  }
})

// Marcar oferta como favorita
router.post("/:id/favorite", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId
    const jobId = req.params.id

    // Verificar que la oferta existe
    const [jobs] = await pool.query("SELECT * FROM ofertas_de_empleo WHERE id = ? AND eliminado = 0", [jobId])

    if (jobs.length === 0) {
      return res.status(404).json({ success: false, message: "Oferta no encontrada" })
    }

    // Verificar si ya está en favoritos
    const [favorites] = await pool.query("SELECT * FROM favoritos WHERE usuario_id = ? AND oferta_id = ?", [
      userId,
      jobId,
    ])

    if (favorites.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Esta oferta ya está en tus favoritos",
      })
    }

    // Agregar a favoritos
    await pool.query("INSERT INTO favoritos (usuario_id, oferta_id) VALUES (?, ?)", [userId, jobId])

    return res.status(201).json({ success: true, message: "Oferta agregada a favoritos" })
  } catch (error) {
    console.error("Error al agregar favorito:", error)
    return res.status(500).json({ success: false, message: "Error interno del servidor" })
  }
})

// Eliminar oferta de favoritos
router.delete("/:id/favorite", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId
    const jobId = req.params.id

    // Eliminar de favoritos
    await pool.query("DELETE FROM favoritos WHERE usuario_id = ? AND oferta_id = ?", [userId, jobId])

    return res.status(200).json({ success: true, message: "Oferta eliminada de favoritos" })
  } catch (error) {
    console.error("Error al eliminar favorito:", error)
    return res.status(500).json({ success: false, message: "Error interno del servidor" })
  }
})

// Obtener favoritos del usuario
router.get("/user/favorites", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId

    const [jobs] = await pool.query(
      `
            SELECT o.*, u.nombre as empresa_nombre
            FROM favoritos f
            JOIN ofertas_de_empleo o ON f.oferta_id = o.id
            JOIN usuarios u ON o.usuario_id = u.id
            WHERE f.usuario_id = ? AND o.eliminado = 0
            ORDER BY f.oferta_id DESC
        `,
      [userId],
    )

    // Para cada oferta, obtener sus habilidades
    const jobsWithSkills = await Promise.all(
      jobs.map(async (job) => {
        const [skills] = await pool.query("SELECT habilidad FROM habilidades_oferta WHERE oferta_id = ?", [job.id])

        return {
          ...job,
          habilidades: skills.map((skill) => skill.habilidad),
        }
      }),
    )

    return res.status(200).json({ success: true, jobs: jobsWithSkills })
  } catch (error) {
    console.error("Error al obtener favoritos:", error)
    return res.status(500).json({ success: false, message: "Error interno del servidor" })
  }
})

// Funciones auxiliares para convertir valores normalizados
function getTipoContratoTexto(tipo) {
  const tipos = {
    'Tiempo Completo': 'Tiempo Completo',
    'Tiempo Parcial': 'Tiempo Parcial',
    'Contrato': 'Contrato',
    'Freelance': 'Freelance',
    'Prácticas': 'Prácticas'
  };
  return tipos[tipo] || tipo;
}

function getModalidadTexto(modalidad) {
  const modalidades = {
    'Presencial': 'Presencial',
    'Remoto': 'Remoto',
    'Híbrido': 'Híbrido'
  };
  return modalidades[modalidad] || modalidad;
}

function getEstadoTexto(estado) {
  const estados = {
    'Active': 'Active',
    'Closed': 'Closed',
    'Draft': 'Draft'
  };
  return estados[estado] || estado;
}

// Manejo de rutas no encontradas
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada"
  });
});

export default router

