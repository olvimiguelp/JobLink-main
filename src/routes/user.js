const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Middleware para API autenticación
const isAuthenticatedApi = (req, res, next) => {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.status(401).json({ message: 'No autorizado' });
    }
};

// Ruta para obtener información del usuario
router.get('/info', isAuthenticatedApi, async (req, res) => {
    try {
        // Obtener información básica del usuario
        const [users] = await pool.query(
            'SELECT id, name, email FROM users WHERE id = ?',
            [req.session.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Obtener información adicional del perfil
        const [profiles] = await pool.query(
            'SELECT description, headline, profile_image_url, cover_image_url FROM user_profiles WHERE user_id = ?',
            [req.session.userId]
        );

        // Obtener habilidades del usuario
        const [skills] = await pool.query(
            'SELECT skill_name FROM user_skills WHERE user_id = ?',
            [req.session.userId]
        );

        // Obtener experiencia laboral
        const [experiences] = await pool.query(
            'SELECT company, position, start_year, end_year, description FROM user_experiences WHERE user_id = ? ORDER BY start_year DESC',
            [req.session.userId]
        );

        // Obtener educación
        const [education] = await pool.query(
            'SELECT institution, degree, start_year, end_year FROM user_education WHERE user_id = ? ORDER BY start_year DESC',
            [req.session.userId]
        );

        // Obtener idiomas
        const [languages] = await pool.query(
            'SELECT language_name, level FROM user_languages WHERE user_id = ?',
            [req.session.userId]
        );

        // Combinar toda la información
        const userInfo = {
            ...users[0],
            profile: profiles.length > 0 ? profiles[0] : {},
            skills: skills.map(s => s.skill_name),
            experiences: experiences,
            education: education,
            languages: languages.map(l => ({ name: l.language_name, level: l.level }))
        };

        res.json(userInfo);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Ruta para actualizar información del perfil
router.put('/profile', isAuthenticatedApi, async (req, res) => {
    try {
        const { name, description, headline } = req.body;
        
        // Actualizar información básica del usuario
        await pool.query(
            'UPDATE users SET name = ? WHERE id = ?',
            [name, req.session.userId]
        );

        // Actualizar o insertar perfil
        await pool.query(
            `INSERT INTO user_profiles (user_id, description, headline) 
             VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE description = ?, headline = ?`,
            [req.session.userId, description, headline, description, headline]
        );

        res.json({ message: 'Perfil actualizado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar el perfil' });
    }
});

// Aquí puedes agregar más rutas relacionadas con el usuario
// Por ejemplo:
// - Actualizar perfil
// - Cambiar contraseña
// - Obtener historial de actividad
// - etc.

module.exports = router; 