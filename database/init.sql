-- Crear la base de datos (si no existe) y usarla
CREATE DATABASE IF NOT EXISTS sistema_clases;
USE sistema_clases;

-- Tabla de roles
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dni VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    mail VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    celular VARCHAR(20),
    rol_id INT NOT NULL,
    FOREIGN KEY (rol_id) REFERENCES roles(id)
);

-- Instituciones educativas
CREATE TABLE IF NOT EXISTS instituciones_educativas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
);

-- alumnos
CREATE TABLE IF NOT EXISTS alumnos (
    id INT PRIMARY KEY,  -- corresponde con id de usuario
    instituto_id INT,
    FOREIGN KEY (id) REFERENCES usuarios(id),
    FOREIGN KEY (instituto_id) REFERENCES instituciones_educativas(id)
);

-- profesores 
CREATE TABLE IF NOT EXISTS profesores (
    id INT PRIMARY KEY,  -- corresponde con id de usuario
    habilitado BOOLEAN NOT NULL DEFAULT TRUE,
    valor_hora DECIMAL(8,2) NOT NULL,
    FOREIGN KEY (id) REFERENCES usuarios(id)
);

CREATE TABLE niveles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE -- Ej: 'Primaria', 'Secundaria'
);

-- Redefinición de grados
CREATE TABLE IF NOT EXISTS grados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero INT NOT NULL, -- 1 a 7 para Primaria, 1 a 5 para Secundaria
    nivel_id INT NOT NULL,
    FOREIGN KEY (nivel_id) REFERENCES niveles(id),
    UNIQUE (numero, nivel_id) -- evita duplicados
);

-- materias
CREATE TABLE IF NOT EXISTS materias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    grado_id INT NOT NULL,
    FOREIGN KEY (grado_id) REFERENCES grados(id)
);

-- temas
CREATE TABLE IF NOT EXISTS temas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    materia_id INT NOT NULL,
    habilitado BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (materia_id) REFERENCES materias(id)
);

-- relaciones muchos a muchos entre profesores y materia
CREATE TABLE IF NOT EXISTS profesor_materia (
    profesor_id INT,
    materia_id INT,
    PRIMARY KEY (profesor_id, materia_id),
    FOREIGN KEY (profesor_id) REFERENCES profesores(id),
    FOREIGN KEY (materia_id) REFERENCES materias(id)
);

-- aulas
CREATE TABLE IF NOT EXISTS aulas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero INT NOT NULL,
    nombre VARCHAR(100),
    disponible BOOLEAN DEFAULT TRUE
);

-- pcs
CREATE TABLE IF NOT EXISTS pcs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('ESCRITORIO', 'LAPTOP') NOT NULL,
    disponible BOOLEAN DEFAULT TRUE
);

-- instituto_espantapajaros
CREATE TABLE IF NOT EXISTS instituto_espantapajaros (
    id INT AUTO_INCREMENT PRIMARY KEY
);

-- Aulas asociadas
CREATE TABLE IF NOT EXISTS instituto_aula (
    instituto_id INT,
    aula_id INT,
    PRIMARY KEY (instituto_id, aula_id),
    FOREIGN KEY (instituto_id) REFERENCES instituto_espantapajaros(id),
    FOREIGN KEY (aula_id) REFERENCES aulas(id)
);

-- PCs asociadas
CREATE TABLE IF NOT EXISTS instituto_pc (
    instituto_id INT,
    pc_id INT,
    PRIMARY KEY (instituto_id, pc_id),
    FOREIGN KEY (instituto_id) REFERENCES instituto_espantapajaros(id),
    FOREIGN KEY (pc_id) REFERENCES pcs(id)
);

-- reservas
CREATE TABLE IF NOT EXISTS reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha_hora DATETIME NOT NULL,
    tiempo TIME NOT NULL,
    profesor_id INT NOT NULL,
    alumno_id INT NOT NULL,
    materia_id INT NOT NULL,
    tema_id INT NOT NULL,
    aula_id INT,
    estado ENUM('PENDIENTE', 'CONFIRMADA', 'CANCELADA') DEFAULT 'PENDIENTE',
    observaciones TEXT,
    modalidad BOOLEAN NOT NULL,  -- true = presencial, false = virtual
    pc_id INT,
    en_instituto BOOLEAN DEFAULT TRUE,
    grupal BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (profesor_id) REFERENCES profesores(id),
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id),
    FOREIGN KEY (materia_id) REFERENCES materias(id),
    FOREIGN KEY (tema_id) REFERENCES temas(id),
    FOREIGN KEY (aula_id) REFERENCES aulas(id),
    FOREIGN KEY (pc_id) REFERENCES pcs(id)
);

-- Precarga de datos

-- Roles base
INSERT INTO roles (nombre)
VALUES ('alumno'), ('profesor'), ('admin');

-- Usuarios de prueba
INSERT INTO usuarios (dni, nombre, apellido, mail, password, celular, rol_id) VALUES
('12345678', 'Juan', 'Pérez', 'juan@ejemplo.com', 'hashalumno', '099123456', 1), -- alumno
('23456789', 'Ana', 'Gómez', 'ana@ejemplo.com', 'hashdocente', '098765432', 2), -- profesor
('34567890', 'Carlos', 'Ruiz', 'carlos@ejemplo.com', 'hashcoordinador', '091112233', 3); -- admin

-- Insertar instituciones educativas
INSERT INTO instituciones_educativas (nombre) VALUES 
('CNBA'), ('Pellegrini'), ('Ilse'), ('Agronomía'), ('Devoto School'),
('IEA'), ('Virgen Niña'), ('Juan B Justo'), ('Carlos Steeb'), 
('Ceferino Namuncurá');

INSERT INTO niveles (nombre) VALUES 
('Primario'), 
('Secundario');

-- Grados Primarios (1 a 7)
INSERT INTO grados (numero, nivel_id)
SELECT n, (SELECT id FROM niveles WHERE nombre = 'Primario')
FROM generate_series(1, 7) n;

-- Grados Secundarios (1 a 5)
INSERT INTO grados (numero, nivel_id)
SELECT n, (SELECT id FROM niveles WHERE nombre = 'Secundario')
FROM generate_series(1, 5) n;

-- CASTELLANO/LENGUA (1º a 7º)
-- Grado 1
INSERT INTO materias (nombre, grado_id) VALUES 
('Castellano/Lengua', (SELECT id FROM grados g JOIN niveles n ON g.nivel_id = n.id WHERE g.numero = 1 AND n.nombre = 'Primario'));
INSERT INTO temas (nombre, materia_id) VALUES
('Análisis sintáctico', (SELECT id FROM materias WHERE nombre = 'Castellano/Lengua' AND grado_id = (SELECT id FROM grados WHERE numero = 1 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario'))));

-- Grado 2 a 7
-- Mismo procedimiento pero cambiando el nombre del tema:
INSERT INTO materias (nombre, grado_id) VALUES 
('Castellano/Lengua', (SELECT id FROM grados WHERE numero = 2 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario')));
INSERT INTO temas (nombre, materia_id) VALUES
('Género lírico / poesía', (SELECT id FROM materias WHERE nombre = 'Castellano/Lengua' AND grado_id = (SELECT id FROM grados WHERE numero = 2 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario'))));

INSERT INTO materias (nombre, grado_id) VALUES 
('Castellano/Lengua', (SELECT id FROM grados WHERE numero = 3 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario')));
INSERT INTO temas (nombre, materia_id) VALUES
('Género narrativo (cuentos o novelas)', (SELECT id FROM materias WHERE nombre = 'Castellano/Lengua' AND grado_id = (SELECT id FROM grados WHERE numero = 3 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario'))));

INSERT INTO materias (nombre, grado_id) VALUES 
('Castellano/Lengua', (SELECT id FROM grados WHERE numero = 4 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario')));
INSERT INTO temas (nombre, materia_id) VALUES
('Género dramático', (SELECT id FROM materias WHERE nombre = 'Castellano/Lengua' AND grado_id = (SELECT id FROM grados WHERE numero = 4 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario'))));

INSERT INTO materias (nombre, grado_id) VALUES 
('Castellano/Lengua', (SELECT id FROM grados WHERE numero = 5 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario')));
INSERT INTO temas (nombre, materia_id) VALUES
('Verbos', (SELECT id FROM materias WHERE nombre = 'Castellano/Lengua' AND grado_id = (SELECT id FROM grados WHERE numero = 5 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario'))));

INSERT INTO materias (nombre, grado_id) VALUES 
('Castellano/Lengua', (SELECT id FROM grados WHERE numero = 6 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario')));
INSERT INTO temas (nombre, materia_id) VALUES
('Clases de palabras', (SELECT id FROM materias WHERE nombre = 'Castellano/Lengua' AND grado_id = (SELECT id FROM grados WHERE numero = 6 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario'))));

INSERT INTO materias (nombre, grado_id) VALUES 
('Castellano/Lengua', (SELECT id FROM grados WHERE numero = 7 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario')));
INSERT INTO temas (nombre, materia_id) VALUES
('Otro...', (SELECT id FROM materias WHERE nombre = 'Castellano/Lengua' AND grado_id = (SELECT id FROM grados WHERE numero = 7 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario'))));

-- HISTORIA (1º a 5º)
INSERT INTO materias (nombre, grado_id) 
SELECT 'Historia', id FROM grados WHERE nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario') AND numero BETWEEN 1 AND 5;

-- Temas Historia
INSERT INTO temas (nombre, materia_id) VALUES
('¿Qué es la historia?', (SELECT id FROM materias WHERE nombre = 'Historia' AND grado_id = (SELECT id FROM grados WHERE numero = 1 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario')))),
('Prehistoria', (SELECT id FROM materias WHERE nombre = 'Historia' AND grado_id = (SELECT id FROM grados WHERE numero = 2 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario')))),
('Egipto', (SELECT id FROM materias WHERE nombre = 'Historia' AND grado_id = (SELECT id FROM grados WHERE numero = 2 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario')))),
('Mesopotamia', (SELECT id FROM materias WHERE nombre = 'Historia' AND grado_id = (SELECT id FROM grados WHERE numero = 3 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario')))),
('Grecia', (SELECT id FROM materias WHERE nombre = 'Historia' AND grado_id = (SELECT id FROM grados WHERE numero = 4 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario')))),
('Roma', (SELECT id FROM materias WHERE nombre = 'Historia' AND grado_id = (SELECT id FROM grados WHERE numero = 5 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario'))));

-- CASTELLANO/LENGUA (1º a 7º)
-- Grado 1
INSERT INTO materias (nombre, grado_id) VALUES 
('Castellano/Lengua', (SELECT id FROM grados g JOIN niveles n ON g.nivel_id = n.id WHERE g.numero = 1 AND n.nombre = 'Primario'));
INSERT INTO temas (nombre, materia_id) VALUES
('Análisis sintáctico', (SELECT id FROM materias WHERE nombre = 'Castellano/Lengua' AND grado_id = (SELECT id FROM grados WHERE numero = 1 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario'))));

-- Grado 2 a 7
-- Mismo procedimiento pero cambiando el nombre del tema:
INSERT INTO materias (nombre, grado_id) VALUES 
('Castellano/Lengua', (SELECT id FROM grados WHERE numero = 2 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario')));
INSERT INTO temas (nombre, materia_id) VALUES
('Género lírico / poesía', (SELECT id FROM materias WHERE nombre = 'Castellano/Lengua' AND grado_id = (SELECT id FROM grados WHERE numero = 2 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario'))));

INSERT INTO materias (nombre, grado_id) VALUES 
('Castellano/Lengua', (SELECT id FROM grados WHERE numero = 3 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario')));
INSERT INTO temas (nombre, materia_id) VALUES
('Género narrativo (cuentos o novelas)', (SELECT id FROM materias WHERE nombre = 'Castellano/Lengua' AND grado_id = (SELECT id FROM grados WHERE numero = 3 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario'))));

INSERT INTO materias (nombre, grado_id) VALUES 
('Castellano/Lengua', (SELECT id FROM grados WHERE numero = 4 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario')));
INSERT INTO temas (nombre, materia_id) VALUES
('Género dramático', (SELECT id FROM materias WHERE nombre = 'Castellano/Lengua' AND grado_id = (SELECT id FROM grados WHERE numero = 4 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario'))));

INSERT INTO materias (nombre, grado_id) VALUES 
('Castellano/Lengua', (SELECT id FROM grados WHERE numero = 5 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario')));
INSERT INTO temas (nombre, materia_id) VALUES
('Verbos', (SELECT id FROM materias WHERE nombre = 'Castellano/Lengua' AND grado_id = (SELECT id FROM grados WHERE numero = 5 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario'))));

INSERT INTO materias (nombre, grado_id) VALUES 
('Castellano/Lengua', (SELECT id FROM grados WHERE numero = 6 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario')));
INSERT INTO temas (nombre, materia_id) VALUES
('Clases de palabras', (SELECT id FROM materias WHERE nombre = 'Castellano/Lengua' AND grado_id = (SELECT id FROM grados WHERE numero = 6 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario'))));

INSERT INTO materias (nombre, grado_id) VALUES 
('Castellano/Lengua', (SELECT id FROM grados WHERE numero = 7 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario')));
INSERT INTO temas (nombre, materia_id) VALUES
('Otro...', (SELECT id FROM materias WHERE nombre = 'Castellano/Lengua' AND grado_id = (SELECT id FROM grados WHERE numero = 7 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario'))));

-- HISTORIA (1º a 5º)
INSERT INTO materias (nombre, grado_id) 
SELECT 'Historia', id FROM grados WHERE nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario') AND numero BETWEEN 1 AND 5;

-- Temas Historia
INSERT INTO temas (nombre, materia_id) VALUES
('¿Qué es la historia?', (SELECT id FROM materias WHERE nombre = 'Historia' AND grado_id = (SELECT id FROM grados WHERE numero = 1 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario')))),
('Prehistoria', (SELECT id FROM materias WHERE nombre = 'Historia' AND grado_id = (SELECT id FROM grados WHERE numero = 2 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario')))),
('Egipto', (SELECT id FROM materias WHERE nombre = 'Historia' AND grado_id = (SELECT id FROM grados WHERE numero = 2 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario')))),
('Mesopotamia', (SELECT id FROM materias WHERE nombre = 'Historia' AND grado_id = (SELECT id FROM grados WHERE numero = 3 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario')))),
('Grecia', (SELECT id FROM materias WHERE nombre = 'Historia' AND grado_id = (SELECT id FROM grados WHERE numero = 4 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario')))),
('Roma', (SELECT id FROM materias WHERE nombre = 'Historia' AND grado_id = (SELECT id FROM grados WHERE numero = 5 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Primario'))));

-- CASTELLANO/LENGUA (1º a 4º)
INSERT INTO materias (nombre, grado_id)
SELECT 'Castellano/Lengua', id FROM grados WHERE nivel_id = (SELECT id FROM niveles WHERE nombre = 'Secundario') AND numero BETWEEN 1 AND 4;

-- Temas Castellano/Lengua
INSERT INTO temas (nombre, materia_id) VALUES
('Análisis sintáctico (Proposiciones incluidas)', (SELECT id FROM materias WHERE nombre = 'Castellano/Lengua' AND grado_id = (SELECT id FROM grados WHERE numero = 1 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Secundario')))),
('Análisis sintáctico (sin proposiciones)', (SELECT id FROM materias WHERE nombre = 'Castellano/Lengua' AND grado_id = (SELECT id FROM grados WHERE numero = 2 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Secundario')))),
('Pronombres', (SELECT id FROM materias WHERE nombre = 'Castellano/Lengua' AND grado_id = (SELECT id FROM grados WHERE numero = 3 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Secundario')))),
('Literatura', (SELECT id FROM materias WHERE nombre = 'Castellano/Lengua' AND grado_id = (SELECT id FROM grados WHERE numero = 4 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Secundario'))));

-- HISTORIA (1° y 2°)
INSERT INTO materias (nombre, grado_id)
SELECT 'Historia', id FROM grados WHERE nivel_id = (SELECT id FROM niveles WHERE nombre = 'Secundario') AND numero BETWEEN 1 AND 2;

-- Temas Historia
INSERT INTO temas (nombre, materia_id) VALUES
('Roma', (SELECT id FROM materias WHERE nombre = 'Historia' AND grado_id = (SELECT id FROM grados WHERE numero = 1 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Secundario')))),
('Edad Media / Feudalismo', (SELECT id FROM materias WHERE nombre = 'Historia' AND grado_id = (SELECT id FROM grados WHERE numero = 2 AND nivel_id = (SELECT id FROM niveles WHERE nombre = 'Secundario')))),
('Invasiones bárbaras', ...),
('Monarquías centralizadas', ...),
('Renacimiento', ...);

-- LATÍN (1° y 2°)
INSERT INTO materias (nombre, grado_id)
SELECT 'Latín', id FROM grados WHERE nivel_id = (SELECT id FROM niveles WHERE nombre = 'Secundario') AND numero IN (1, 2);

-- Temas Latín 1°
INSERT INTO temas (nombre, materia_id) VALUES
('Declinaciones', ...), ('Adjetivos de 1° clase', ...), ('Verbos', ...),
('Análisis sintáctico', ...), ('Odisea', ...), ('Tito Livio', ...), ('Locus', ...);

-- Temas Latín 2°
INSERT INTO temas (nombre, materia_id) VALUES
('Trecera declinación', ...), ('Adjetivos de 2° clase', ...), ('Perfectum', ...),
('Análisis sintáctico', ...), ('Comedia', ...), ('Tragedia', ...), ('Tito Livio', ...);

-- MATERIAS TRANSVERSALES (1° a 5° o 2° a 5° según indica imagen)
INSERT INTO materias (nombre, grado_id)
SELECT 'GEOGRAFÍA', id FROM grados WHERE nivel_id = (SELECT id FROM niveles WHERE nombre = 'Secundario') AND numero BETWEEN 1 AND 5;
-- Repetir para: MATEMÁTICA, FÍSICA (2-5), QUÍMICA (2-5), HISTORIA DEL ARTE, BIOLOGÍA, EDUCACIÓN PARA LA SALUD, EDUCACIÓN CIUDADANA, INGLÉS, LITERATURA ESPAÑOLA, LITERATURA HISPANOAMERICANA/ARGENTINA
