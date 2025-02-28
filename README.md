# 🌟 JobLink

## 📋 Descripción
JobLink es una plataforma web que conecta profesionales y empresas, facilitando la gestión de perfiles profesionales y la búsqueda de oportunidades laborales.

## ✨ Características

### ✅ Implementado:
- **Autenticación**
  - Registro de usuarios
  - Inicio de sesión
  - Cierre de sesión
  - Protección de rutas privadas
  - Manejo de sesiones

- **Perfil de Usuario**
  - Información básica (nombre, email)
  - Descripción y titular
  - Experiencia laboral
  - Educación
  - Habilidades
  - Idiomas
  - Edición de perfil

### 🚧 En Desarrollo:
- **Funcionalidades Sociales**
  - Sistema de mensajería
  - Red de conexiones
  - Feed de actualizaciones
  - Notificaciones

- **Características Adicionales**
  - Búsqueda de perfiles y empleos
  - Subida de imágenes de perfil/portada
  - Sistema de recomendaciones
  - Modo oscuro/claro

## 🛠️ Tecnologías
- Frontend: HTML5, CSS3, JavaScript
- Backend: Node.js, Express.js
- Base de datos: MySQL
- Seguridad: Bcrypt, Express Session

## 📦 Instalación

1. **Clonar e Instalar**
   ```bash
   git clone https://github.com/tu-usuario/JobLink.git
   cd JobLink
   npm install
   ```

2. **Configurar**
   ```bash
   # Crear y configurar .env
   DB_HOST=mysql://usuario:contraseña@host:puerto/basededatos
   ```

3. **Iniciar**
   ```bash
   # Configurar base de datos
   node src/config/setup-database.js

   # Iniciar servidor
   npm start
   ```

## 📱 Rutas

### ✅ Funcionales:
- **Autenticación**
  - `POST /auth/register` - Registro
  - `POST /auth/login` - Inicio de sesión
  - `POST /auth/logout` - Cierre de sesión

- **Perfil**
  - `GET /api/user/info` - Obtener información
  - `PUT /api/user/profile` - Actualizar perfil

- **Vistas**
  - `/` - Página de login
  - `/register` - Página de registro
  - `/interfaz` - Dashboard
  - `/perfil` - Perfil de usuario

### 🚧 Próximamente:
- `/mensajes` - Sistema de mensajería
- `/conexiones` - Red de contactos
- `/busqueda` - Búsqueda de perfiles
- `/notificaciones` - Centro de notificaciones

## 🤝 Contribuir
1. Fork del repositorio
2. Crear rama (`git checkout -b feature/nueva-caracteristica`)
3. Commit (`git commit -am 'Nueva característica'`)
4. Push (`git push origin feature/nueva-caracteristica`)
5. Crear Pull Request

## 📄 Licencia
MIT - ver [LICENSE](LICENSE) para más detalles.

## ❓ Soporte
Crear un [issue](https://github.com/tu-usuario/JobLink/issues) para reportar bugs o sugerir funcionalidades.
