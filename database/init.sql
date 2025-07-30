DROP DATABASE IF EXISTS sistema_clases;

CREATE DATABASE sistema_clases;

USE sistema_clases;

CREATE TABLE IF NOT EXISTS rol (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
); 
-- ✅

INSERT INTO rol (id, nombre) VALUES
(1, 'admin'),
(2, 'profesor'),
(3, 'alumno')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);  -- evita duplicados si ya existen
-- ✅

CREATE TABLE IF NOT EXISTS usuario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dni VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  mail VARCHAR(100) NOT NULL UNIQUE,
  contrasenia VARCHAR(255) NOT NULL,
  celular VARCHAR(20),
  rol_id INT NOT NULL,
  FOREIGN KEY (rol_id) REFERENCES rol(id)
); 
-- ✅

INSERT INTO usuario (dni, nombre, apellido, mail, contrasenia, celular, rol_id) VALUES
('67890999', 'Roberta', 'Fernández', 'roberta.perez@example.com', '$2b$10$whatKSjghqD9uecmrtpfjOiJwvIN9IaAgaH0yOLmn/j4Rda8DdTMe', '1167894321', 1),
('67890123', 'Laura', 'Fernández', 'laura.fernandez@example.com', '$2b$10$whatKSjghqD9uecmrtpfjOiJwvIN9IaAgaH0yOLmn/j4Rda8DdTMe', '1167894322', 3),
('67890124', 'Fernanda', 'Fernández', 'fernanda.fernandez@example.com', '$2b$10$whatKSjghqD9uecmrtpfjOiJwvIN9IaAgaH0yOLmn/j4Rda8DdTMe', '1167894323', 2);
-- ✅

CREATE TABLE IF NOT EXISTS institucion_educativa (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE
); -- ✅

INSERT INTO institucion_educativa (nombre) VALUES
  ('CNBA'),
  ('Pellegrini'),
  ('Ilse'),
  ('Agronomía'),
  ('Devoto School'),
  ('IEA'),
  ('Virgen Niña'),
  ('Juan B Justo'),
  ('Carlos Steeb'),
  ('Ceferino Namuncurá'); -- ✅

CREATE TABLE IF NOT EXISTS profesor (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT PRIMARY KEY,
  habilitado BOOLEAN NOT NULL DEFAULT TRUE,
  valor_hora DECIMAL(8,2) NOT NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuario(id)
); 
-- ✅

INSERT INTO profesor (usuario_id, habilitado, valor_hora) VALUES
  (2, TRUE, 50.00);
-- ✅

CREATE TABLE IF NOT EXISTS alumno (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT PRIMARY KEY,
  institucion_id INT,
  FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
  FOREIGN KEY (institucion_id) REFERENCES institucion_educativa(id)
);
-- ✅

INSERT INTO alumno (usuario_id, institucion_id) VALUES
  (1, 1);
-- ✅

CREATE TABLE IF NOT EXISTS nivel (
  id INT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
);
-- ✅

INSERT INTO nivel (id, nombre) VALUES
(1, 'Primario'),
(2, 'Secundario');
-- ✅

CREATE TABLE IF NOT EXISTS grado (
  id INT PRIMARY KEY,
  numero INT NOT NULL,
  nivel_id INT NOT NULL,
  FOREIGN KEY (nivel_id) REFERENCES nivel(id)
);
-- ✅

INSERT INTO grado (id, numero, nivel_id) VALUES
(1, 1, 1),
(2, 2, 1),
(3, 3, 1),
(4, 4, 1),
(5, 5, 1),
(6, 6, 1),
(7, 7, 1),
(8, 1, 2),
(9, 2, 2),
(10, 3, 2),
(11, 4, 2),
(12, 5, 2);
-- ✅

CREATE TABLE IF NOT EXISTS materia (
  id INT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  grado_id INT NOT NULL,
  habilitado BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (grado_id) REFERENCES grado(id)
);
-- ✅

INSERT INTO materia (id, nombre, grado_id, habilitado) VALUES
(1, 'Castellano/Lengua', 1, TRUE),
(2, 'Historia', 2, TRUE),
(3, 'Latín', 3, TRUE),
(4, 'GEOGRAFÍA', 2, TRUE),
(5, 'MATEMÁTICA', 1, TRUE),
(6, 'FÍSICA', 4, TRUE),
(7, 'QUÍMICA', 4, TRUE),
(8, 'HISTORIA DEL ARTE', 3, TRUE),
(9, 'BIOLOGÍA', 3, TRUE),
(10, 'EDUCACIÓN PARA LA SALUD', 2, TRUE),
(11, 'EDUCACIÓN CIUDADANA', 1, TRUE),
(12, 'INGLÉS', 1, TRUE),
(13, 'LITERATURA ESPAÑOLA', 3, TRUE),
(14, 'LITERATURA HISPANOAMERICANA/ARGENTINA', 3, TRUE);
-- ✅

CREATE TABLE IF NOT EXISTS tema (
  id INT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  materia_id INT NOT NULL,
  FOREIGN KEY (materia_id) REFERENCES materia(id)
);
-- ✅

INSERT INTO tema (id, nombre, materia_id) VALUES
(1, 'Análisis sintáctico', 1),
(2, 'Género lírico / poesía', 1),
(3, 'Pronombres', 1),
(4, '¿Qué es la historia?', 2),
(5, 'Edad Media / Feudalismo', 2),
(6, 'Invasiones bárbaras', 2),
(7, 'Trecera declinación', 3),
(8, 'Adjetivos de 2° clase', 3),
(9, 'Odisea', 3),
(10, 'Tito Livio', 3);
-- ✅

CREATE TABLE IF NOT EXISTS aula (
  id INT PRIMARY KEY,
  numero INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  disponible BOOLEAN NOT NULL DEFAULT TRUE
);
-- ✅

INSERT INTO aula (id, numero, nombre, disponible) VALUES
(1, 101, 'Aula Norte', TRUE);
-- ✅

CREATE TABLE IF NOT EXISTS pc (
  id INT PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL,
  disponible BOOLEAN NOT NULL DEFAULT TRUE
);
-- ✅

INSERT INTO pc (id, tipo, disponible) VALUES
(1, 'ESCRITORIO', TRUE),
(2, 'LAPTOP', TRUE);
-- ✅

CREATE TABLE IF NOT EXISTS reserva (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fecha_hora DATETIME NOT NULL,
  tiempo TIME NOT NULL,
  profesor_id INT NOT NULL, -- ✅
  alumno_id INT NOT NULL, -- ✅
  materia_id INT NOT NULL, -- ✅
  tema_id INT NOT NULL, -- ✅
  aula_id INT,  -- ✅
  estado ENUM('PENDIENTE','CONFIRMADA','CANCELADA') NOT NULL DEFAULT 'PENDIENTE',
  observaciones TEXT,
  modalidad BOOLEAN NOT NULL,
  pc_id INT, -- ✅
  en_instituto BOOLEAN NOT NULL DEFAULT TRUE,
  grupal BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (profesor_id) REFERENCES profesor(id),
  FOREIGN KEY (alumno_id) REFERENCES alumno(id),
  FOREIGN KEY (materia_id) REFERENCES materia(id),
  FOREIGN KEY (tema_id) REFERENCES tema(id),
  FOREIGN KEY (aula_id) REFERENCES aula(id),
  FOREIGN KEY (pc_id) REFERENCES pc(id)
);


CREATE TABLE disponible (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  fecha DATETIME NOT NULL,
  inicio TIME NOT NULL,
  fin TIME NOT NULL,
  en_uso BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (usuario_id) REFERENCES usuario(id)
); -- ✅

CREATE TABLE profesor_tiene_disponible (
  id INT AUTO_INCREMENT PRIMARY KEY,
  profesor_id INT NOT NULL,
  disponible_id INT NOT NULL,
  FOREIGN KEY (profesor_id) REFERENCES profesor(id),
  FOREIGN KEY (disponible_id) REFERENCES disponible(id),
  UNIQUE KEY unique_profesor_disponible (profesor_id, disponible_id)
); -- ✅

CREATE TABLE profesor_tiene_materia (
  id INT AUTO_INCREMENT PRIMARY KEY,
  profesor_id INT NOT NULL,
  materia_id INT NOT NULL,
  FOREIGN KEY (profesor_id) REFERENCES profesor(id),
  FOREIGN KEY (materia_id) REFERENCES materia(id),
  UNIQUE KEY unique_profesor_materia (profesor_id, materia_id)
); -- ✅

CREATE TABLE alumno_tiene_reserva (
  id INT AUTO_INCREMENT PRIMARY KEY,
  alumno_id INT NOT NULL,
  reserva_id INT NOT NULL,
  FOREIGN KEY (alumno_id) REFERENCES alumno(id),
  FOREIGN KEY (reserva_id) REFERENCES reserva(id),
  UNIQUE KEY unique_alumno_reserva (alumno_id, reserva_id)
); --

CREATE TABLE profesor_tiene_reserva (
  id INT AUTO_INCREMENT PRIMARY KEY,
  profesor_id INT NOT NULL,
  reserva_id INT NOT NULL,
  FOREIGN KEY (profesor_id) REFERENCES profesor(profesor_id),
  FOREIGN KEY (reserva_id) REFERENCES reserva(id),
  UNIQUE KEY unique_profesor_reserva (profesor_id, reserva_id)
); --

INSERT INTO alumno_tiene_reserva (alumno_id, reserva_id) VALUES
  (1, 1);

INSERT INTO profesor_tiene_materia (profesor_id, materia_id) VALUES
  (2, 1),
  (2, 2);
-- ✅

INSERT INTO reserva (
  id,
  fecha_hora,
  tiempo,
  profesor_id,
  alumno_id,
  materia_id,
  tema_id,
  aula_id,
  estado,
  observaciones,
  modalidad,
  pc_id,
  en_instituto,
  grupal
) VALUES (
  1,
  '2025-07-01 10:00:00',
  '01:00:00',
  2,
  1,
  1,
  1,
  1,
  'PENDIENTE',
  'Primera clase de fracciones.',
  TRUE,
  1,
  TRUE,
  FALSE
);
-- ✅

INSERT INTO disponible (usuario_id, fecha, inicio, fin, en_uso) VALUES
(2, '2025-07-10', '08:00', '12:00', FALSE),
(2, '2025-07-10', '14:00', '18:00', FALSE);
-- ✅


/*
CREATE TABLE IF NOT EXISTS nivel (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS grado (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero INT NOT NULL,
  nivel_id INT NOT NULL,
  UNIQUE (numero, nivel_id),
  FOREIGN KEY (nivel_id) REFERENCES nivel(id)
);

CREATE TABLE IF NOT EXISTS materia (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  grado_id INT NOT NULL,
  FOREIGN KEY (grado_id) REFERENCES grado(id)
);

CREATE TABLE IF NOT EXISTS tema (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  materia_id INT NOT NULL,
  habilitado BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (materia_id) REFERENCES materia(id)
);


CREATE TABLE IF NOT EXISTS aula (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero INT NOT NULL,
  nombre VARCHAR(100),
  disponible BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS pc (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo ENUM('ESCRITORIO','LAPTOP') NOT NULL,
  disponible BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS instituto_espantapajaro (
  id INT AUTO_INCREMENT PRIMARY KEY,
  institucion_id INT NOT NULL,
  FOREIGN KEY (institucion_id) REFERENCES institucion_educativa(id)
);

CREATE TABLE IF NOT EXISTS instituto_aula (
  instituto_id INT,
  aula_id INT,
  PRIMARY KEY (instituto_id, aula_id),
  FOREIGN KEY (instituto_id) REFERENCES instituto_espantapajaro(id),
  FOREIGN KEY (aula_id) REFERENCES aula(id)
);

CREATE TABLE IF NOT EXISTS instituto_pc (
  instituto_id INT,
  pc_id INT,
  PRIMARY KEY (instituto_id, pc_id),
  FOREIGN KEY (instituto_id) REFERENCES instituto_espantapajaro(id),
  FOREIGN KEY (pc_id) REFERENCES pc(id)
);


SELECT u.*, r.* as rol
FROM usuario u
JOIN rol r ON r.id = u.rol_id

INSERT INTO reserva (  id,
  fecha_hora,
  tiempo,
  profesor_id,
  alumno_id,
  materia_id,
  tema_id,
  aula_id,
  estado,
  observaciones,
  modalidad,
  pc_id,
  en_instituto,
  grupal
) VALUES (
  1,
  '2025-07-01T10:00:00',
  '01:00:00',
  1,
  2,
  1,
  1,
  1,
  'PENDIENTE',
  'Primera clase de fracciones.',
  true,
  1,
  true,
  false
);


INSERT INTO profesor (
  id,
  habilitado,
  valor_hora
) VALUES (
  2,
  true,
  50.00
);

CREATE TABLE IF NOT EXISTS profesor (
  usuario_id INT PRIMARY KEY,
  habilitado BOOLEAN NOT NULL DEFAULT TRUE,
  valor_hora DECIMAL(8,2) NOT NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
);


 */
