// db-config.js
const mysql = require('mysql2/promise');

// Configuración de la conexión a la base de datos
const dbConfig = {
 
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Clase para manejar las operaciones del perfil
class ProfileManager {
  // Obtener perfil completo del usuario
  async getFullProfile(userId) {
    try {
      const connection = await pool.getConnection();
      
      // Obtener información básica del usuario
      const [userInfo] = await connection.execute(
        'SELECT * FROM usuarios WHERE id_usuario = ?',
        [userId]
      );

      // Obtener experiencias
      const [experiences] = await connection.execute(
        'SELECT * FROM experiencias WHERE id_usuario = ? ORDER BY ano_inicio DESC',
        [userId]
      );

      // Obtener educación
      const [education] = await connection.execute(
        'SELECT * FROM educacion WHERE id_usuario = ? ORDER BY ano_inicio DESC',
        [userId]
      );

      // Obtener habilidades
      const [skills] = await connection.execute(
        'SELECT nombre_habilidad FROM habilidades WHERE id_usuario = ?',
        [userId]
      );

      // Obtener idiomas
      const [languages] = await connection.execute(
        'SELECT nombre_idioma FROM idiomas WHERE id_usuario = ?',
        [userId]
      );

      // Obtener intereses
      const [interests] = await connection.execute(
        'SELECT nombre_interes FROM intereses WHERE id_usuario = ?',
        [userId]
      );

      connection.release();

      return {
        userInfo: userInfo[0],
        experiences,
        education,
        skills: skills.map(s => s.nombre_habilidad),
        languages: languages.map(l => l.nombre_idioma),
        interests: interests.map(i => i.nombre_interes)
      };
    } catch (error) {
      console.error('Error al obtener el perfil:', error);
      throw error;
    }
  }

  // Actualizar información básica del perfil
  async updateBasicInfo(userId, userData) {
    try {
      const connection = await pool.getConnection();
      await connection.execute(
        `UPDATE usuarios 
         SET nombre_usuario = ?, 
             titular = ?,
             descripcion = ?,
             url_imagen_perfil = ?,
             url_foto_portada = ?
         WHERE id_usuario = ?`,
        [
          userData.nombre_usuario,
          userData.titular,
          userData.descripcion,
          userData.url_imagen_perfil,
          userData.url_foto_portada,
          userId
        ]
      );
      connection.release();
    } catch (error) {
      console.error('Error al actualizar información básica:', error);
      throw error;
    }
  }

  // Actualizar experiencias
  async updateExperiences(userId, experiences) {
    try {
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      // Eliminar experiencias existentes
      await connection.execute(
        'DELETE FROM experiencias WHERE id_usuario = ?',
        [userId]
      );

      // Insertar nuevas experiencias
      for (const exp of experiences) {
        await connection.execute(
          `INSERT INTO experiencias (id_usuario, empresa, cargo, ano_inicio, ano_fin)
           VALUES (?, ?, ?, ?, ?)`,
          [userId, exp.empresa, exp.cargo, exp.ano_inicio, exp.ano_fin]
        );
      }

      await connection.commit();
      connection.release();
    } catch (error) {
      console.error('Error al actualizar experiencias:', error);
      throw error;
    }
  }

  // Actualizar educación
  async updateEducation(userId, education) {
    try {
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      await connection.execute(
        'DELETE FROM educacion WHERE id_usuario = ?',
        [userId]
      );

      for (const edu of education) {
        await connection.execute(
          `INSERT INTO educacion (id_usuario, institucion, titulo, ano_inicio, ano_fin)
           VALUES (?, ?, ?, ?, ?)`,
          [userId, edu.institucion, edu.titulo, edu.ano_inicio, edu.ano_fin]
        );
      }

      await connection.commit();
      connection.release();
    } catch (error) {
      console.error('Error al actualizar educación:', error);
      throw error;
    }
  }

  // Actualizar habilidades
  async updateSkills(userId, skills) {
    try {
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      await connection.execute(
        'DELETE FROM habilidades WHERE id_usuario = ?',
        [userId]
      );

      for (const skill of skills) {
        await connection.execute(
          'INSERT INTO habilidades (id_usuario, nombre_habilidad) VALUES (?, ?)',
          [userId, skill]
        );
      }

      await connection.commit();
      connection.release();
    } catch (error) {
      console.error('Error al actualizar habilidades:', error);
      throw error;
    }
  }

  // Actualizar idiomas
  async updateLanguages(userId, languages) {
    try {
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      await connection.execute(
        'DELETE FROM idiomas WHERE id_usuario = ?',
        [userId]
      );

      for (const language of languages) {
        await connection.execute(
          'INSERT INTO idiomas (id_usuario, nombre_idioma) VALUES (?, ?)',
          [userId, language]
        );
      }

      await connection.commit();
      connection.release();
    } catch (error) {
      console.error('Error al actualizar idiomas:', error);
      throw error;
    }
  }

  // Actualizar intereses
  async updateInterests(userId, interests) {
    try {
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      await connection.execute(
        'DELETE FROM intereses WHERE id_usuario = ?',
        [userId]
      );

      for (const interest of interests) {
        await connection.execute(
          'INSERT INTO intereses (id_usuario, nombre_interes) VALUES (?, ?)',
          [userId, interest]
        );
      }

      await connection.commit();
      connection.release();
    } catch (error) {
      console.error('Error al actualizar intereses:', error);
      throw error;
    }
  }
}

module.exports = ProfileManager;
