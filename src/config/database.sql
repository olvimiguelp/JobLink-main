CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  correo_electronico VARCHAR(255) NOT NULL UNIQUE,
  contraseña VARCHAR(255) NOT NULL,
  titular VARCHAR(255),
  acerca_de TEXT,
  foto_perfil VARCHAR(500),
  foto_portada VARCHAR(500),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE ofertas_de_empleo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  requisitos TEXT,
  salario VARCHAR(100),
  tipo_contrato CHAR(2),
  modalidad CHAR(1),
  estado CHAR(1),
  logo VARCHAR(255),
  eliminado TINYINT DEFAULT 0,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE habilidades_oferta (
  id INT AUTO_INCREMENT PRIMARY KEY,
  oferta_id INT NOT NULL,
  habilidad VARCHAR(100),
  FOREIGN KEY (oferta_id) REFERENCES ofertas_de_empleo(id) ON DELETE CASCADE
);

CREATE TABLE reportes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  oferta_id INT NOT NULL,
  razon TEXT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (oferta_id) REFERENCES ofertas_de_empleo(id) ON DELETE CASCADE
);

CREATE TABLE favoritos (
  usuario_id INT NOT NULL,
  oferta_id INT NOT NULL,
  PRIMARY KEY (usuario_id, oferta_id),
  CONSTRAINT fk_favoritos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_favoritos_oferta FOREIGN KEY (oferta_id) REFERENCES ofertas_de_empleo(id) ON DELETE CASCADE
);

CREATE TABLE notificaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  mensaje TEXT NOT NULL,
  leido TINYINT DEFAULT 0,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notificaciones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE experiencia_laboral (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  empresa VARCHAR(255) NOT NULL,
  puesto VARCHAR(255) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  CONSTRAINT fk_experiencia_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE educacion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  institucion VARCHAR(255) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  CONSTRAINT fk_educacion_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE habilidades_usuario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  habilidad VARCHAR(100) NOT NULL,
  CONSTRAINT fk_habilidades_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
CREATE TABLE idiomas_usuario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT,
  idioma VARCHAR(100),
  CONSTRAINT fk_idiomas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE historial_busquedas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_buscador_id INT NOT NULL,
  usuario_buscado_id INT NOT NULL,
  termino_busqueda VARCHAR(255) NOT NULL,
  fecha_busqueda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_buscador_id) REFERENCES usuarios(id),
  FOREIGN KEY (usuario_buscado_id) REFERENCES usuarios(id)
);

CREATE TABLE mensajes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  remitente_id INT NOT NULL,
  destinatario_id INT NOT NULL,
  mensaje TEXT NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  leido TINYINT DEFAULT 0,
  CONSTRAINT fk_mensajes_remitente FOREIGN KEY (remitente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_mensajes_destinatario FOREIGN KEY (destinatario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla para solicitudes de amistad
CREATE TABLE solicitudes_amistad (
  id INT AUTO_INCREMENT PRIMARY KEY,
  remitente_id INT NOT NULL,
  receptor_id INT NOT NULL,
  estado ENUM('pendiente', 'aceptada', 'rechazada') DEFAULT 'pendiente',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_solicitud_remitente FOREIGN KEY (remitente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_solicitud_receptor FOREIGN KEY (receptor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT unique_friendship UNIQUE (remitente_id, receptor_id)
);

-- Tabla para amigos/conexiones
CREATE TABLE amigos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  amigo_id INT NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_amigos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_amigos_amigo FOREIGN KEY (amigo_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT unique_friendship_pair UNIQUE (usuario_id, amigo_id)
);
