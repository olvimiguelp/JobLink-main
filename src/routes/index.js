const express = require('express');
const path = require('path');
const router = express.Router();

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

// Rutas protegidas
router.get('/interfaz', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/interfaz.html'));
});

router.get('/perfil', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/perfil.html'));
});


// Manejo de rutas no encontradas
router.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '../views/login.html'));
});

module.exports = router;
