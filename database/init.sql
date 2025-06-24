USE sistema_clases;

-- TABLAS PRINCIPALES EN SINGULAR
CREATE TABLE IF NOT EXISTS rol (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS usuario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dni VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  mail VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  celular VARCHAR(20),
  rol_id INT NOT NULL,
  FOREIGN KEY (rol_id) REFERENCES rol(id)
);

CREATE TABLE IF NOT EXISTS institucion_educativa (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS alumno (
  id INT PRIMARY KEY,
  institucion_id INT,
  FOREIGN KEY (id) REFERENCES usuario(id),
  FOREIGN KEY (institucion_id) REFERENCES institucion_educativa(id)
);

CREATE TABLE IF NOT EXISTS profesor (
  id INT PRIMARY KEY,
  habilitado BOOLEAN NOT NULL DEFAULT TRUE,
  valor_hora DECIMAL(8,2) NOT NULL,
  FOREIGN KEY (id) REFERENCES usuario(id)
);

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

CREATE TABLE IF NOT EXISTS profesor_materia (
  profesor_id INT,
  materia_id INT,
  PRIMARY KEY (profesor_id, materia_id),
  FOREIGN KEY (profesor_id) REFERENCES profesor(id),
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

CREATE TABLE IF NOT EXISTS reserva (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fecha_hora DATETIME NOT NULL,
  tiempo TIME NOT NULL,
  profesor_id INT NOT NULL,
  alumno_id INT NOT NULL,
  materia_id INT NOT NULL,
  tema_id INT NOT NULL,
  aula_id INT,
  estado ENUM('PENDIENTE','CONFIRMADA','CANCELADA') NOT NULL DEFAULT 'PENDIENTE',
  observaciones TEXT,
  modalidad BOOLEAN NOT NULL,
  pc_id INT,
  en_instituto BOOLEAN NOT NULL DEFAULT TRUE,
  grupal BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (profesor_id) REFERENCES profesor(id),
  FOREIGN KEY (alumno_id) REFERENCES alumno(id),
  FOREIGN KEY (materia_id) REFERENCES materia(id),
  FOREIGN KEY (tema_id) REFERENCES tema(id),
  FOREIGN KEY (aula_id) REFERENCES aula(id),
  FOREIGN KEY (pc_id) REFERENCES pc(id)
);

-- PRECARGA DE DATOS
INSERT IGNORE INTO rol (nombre) VALUES ('alumno'),('profesor'),('admin');

INSERT INTO usuario (dni,nombre,apellido,mail,password,celular,rol_id) VALUES
('12345678','Juan','Pérez','juan@ejemplo.com','hashalumno','099123456', (SELECT id FROM rol WHERE nombre='alumno')),
('23456789','Ana','Gómez','ana@ejemplo.com','hashdocente','098765432', (SELECT id FROM rol WHERE nombre='profesor')),
('34567890','Carlos','Ruiz','carlos@ejemplo.com','hashcoordinador','091112233', (SELECT id FROM rol WHERE nombre='admin'));

INSERT INTO institucion_educativa (nombre) VALUES
('CNBA'),('Pellegrini'),('Ilse'),('Agronomía'),('Devoto School'),
('IEA'),('Virgen Niña'),('Juan B Justo'),('Carlos Steeb'),('Ceferino Namuncurá');

INSERT IGNORE INTO nivel (nombre) VALUES ('Primario'),('Secundario');

INSERT IGNORE INTO grado (numero,nivel_id)
SELECT num, (SELECT id FROM nivel WHERE nombre='Primario') FROM (SELECT 1 AS num UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7) t;
INSERT IGNORE INTO grado (numero,nivel_id)
SELECT num, (SELECT id FROM nivel WHERE nombre='Secundario') FROM (SELECT 1 AS num UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5) t;

-- Materias y Temas de ejemplo
INSERT IGNORE INTO materia (nombre,grado_id)
VALUES ('Castellano/Lengua', 1);

INSERT IGNORE INTO tema (nombre,materia_id)
VALUES ('Análisis sintáctico', (SELECT id FROM materia WHERE nombre='Castellano/Lengua' AND grado_id=(SELECT id FROM grado WHERE numero=1 AND nivel_id=(SELECT id FROM nivel WHERE nombre='Primario'))));

INSERT IGNORE INTO materia (nombre,grado_id)
VALUES ('Historia', 1);

INSERT IGNORE INTO tema (nombre,materia_id)
VALUES ('¿Qué es la historia?', (SELECT id FROM materia WHERE nombre='Historia' AND grado_id=(SELECT id FROM grado WHERE numero=1 AND nivel_id=(SELECT id FROM nivel WHERE nombre='Primario'))));
