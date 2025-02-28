const express = require('express');
const session = require('express-session');
const path = require('path');
const MySQLStore = require('express-mysql-session')(session);
const pool = require('./src/config/database');

// Importar rutas
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/user');
const indexRoutes = require('./src/routes/index');

const app = express();

// Configuración
app.set('port', process.env.PORT || 3001);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'src/public')));

// Configuración de sesión
const sessionStore = new MySQLStore({}, pool);
app.use(session({
    key: 'session_cookie_name',
    secret: 'session_cookie_secret',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 24 horas
    }
}));

// Rutas
app.use('/auth', authRoutes);     // Rutas de autenticación primero
app.use('/api/user', userRoutes); // Rutas de API después
app.use('/', indexRoutes);        // Rutas de vistas al final

// Manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'src/views/login.html'));
});

// Iniciar servidor
app.listen(app.get('port'), () => {
    console.log('Server on port', app.get('port'));
});
