-- Crear la base de datos (si no existe) y usarla
CREATE DATABASE IF NOT EXISTS sistema_clases;
USE sistema_clases;

-- Tabla de roles
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- Insertar roles base
INSERT INTO roles (nombre)
VALUES ('alumno'), ('profesor'), ('admin');

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

-- Insertar algunos usuarios de prueba
INSERT INTO usuarios (dni, nombre, apellido, mail, password, celular, rol_id) VALUES
('12345678', 'Juan', 'Pérez', 'juan@ejemplo.com', 'hashalumno', '099123456', 1), -- alumno
('23456789', 'Ana', 'Gómez', 'ana@ejemplo.com', 'hashdocente', '098765432', 2), -- profesor
('34567890', 'Carlos', 'Ruiz', 'carlos@ejemplo.com', 'hashcoordinador', '091112233', 3); -- admin
