# 🌟 JobLink

JobLink es una plataforma integral que conecta profesionales y empresas, permitiendo la creación y gestión de perfiles, publicación de ofertas laborales y ejecución de acciones como reportar, marcar favoritos o eliminar ofertas.

## 🚀 Instalación

1. Clonar el repositorio:  
   git clone https://github.com/olvimiguelp/JobLink-main.git  

2. Acceder al directorio del proyecto:  
   cd C:/Users/nombre/OneDrive/Desktop/JobLink-main  

3. Instalar Node.js:  
   Descárgalo desde [nodejs.org](https://nodejs.org/en/download/) 

4. Instalar las dependencias:  
   npm install  
   npm install promise  
   npm install mysql2  

5. Configurar la base de datos:  
   npm run setup-db  

6. Iniciar el servidor:  
   npm run dev

## 🛠️ Configuración

- **Servidor:** El proyecto usa Express y se ejecuta en el puerto definido en `PORT` (por defecto 3006).  

- **Base de Datos:** MySQL se configura mediante el archivo `/src/config/setup-database.js`. Puedes usar una cadena de conexión en `DB_URL` o parámetros individuales (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).

## 📌 Estructura del Proyecto

- `/src/routes`: Contiene las rutas del API: autenticación, usuarios, y ofertas laborales.  
- `/src/config`: Configuración de la base de datos y otros ajustes.  
- `/public`: Archivos estáticos y subidas de imágenes (fotos, logos).  
- `/src/views`: Páginas HTML para las vistas (login, registro, perfil, interfaz).

## 🚀 Cómo Iniciar

Ejecuta el siguiente comando para iniciar el servidor y verificar la conexión a la base de datos:

```
npm run dev
```

El servidor se iniciará en el puerto configurado (por defecto 3006). Si el puerto está ocupado, se mostrará un error y se deberá elegir otro.

## 🔍 Funcionalidades Clave

- **Autenticación:** Registro, login, cierre de sesión y verificación activa de sesión.
- **Gestión de Usuario:** Visualización y actualización de perfiles, subida de fotos de perfil y portada.
- **Gestión de Ofertas:** Creación, actualización, eliminación (soft delete), reporte, y manejo de favoritos.
- **Subida y gestión de archivos:** Configuración de Multer para imágenes y logos.

## 📄 Estructura de la Base de Datos

La base de datos se compone de las siguientes tablas (entre otras):
- **usuarios:** Datos de perfiles, incluyendo nombre, correo, contraseña, fotos.
- **ofertas_de_empleo:** Información de las ofertas laborales (título, descripción, estado, etc.).
- **experiencia_laboral y educacion:** Datos profesionales del usuario.
- **habilidades_usuario y habilidades_oferta:** Habilidades relacionadas a usuario/oferta.
- **reportes y favoritos:** Gestión de reportes y ofertas favoritas.

## 📚 Documentación Adicional

- Revisa cada uno de los archivos de rutas en `/src/routes` para conocer los endpoints disponibles.  
- Consulta `/src/config/setup-database.js` para ver la configuración y creación de las tablas en MySQL.  
- Las vistas HTML se encuentran en `/src/views`.

## 🔗 Enlaces

- Repositorio: https://github.com/olvimiguelp/JobLink-main.git
- Node.js: https://nodejs.org/en/download/

## 📄 Licencia

Licenciado bajo la Licencia MIT.
