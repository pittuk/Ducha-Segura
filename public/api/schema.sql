-- Esquema de cotizaciones — Ducha Segura
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS cotizaciones (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(120) NOT NULL,
  telefono      VARCHAR(40)  NOT NULL,
  email         VARCHAR(180) NOT NULL,
  direccion     VARCHAR(200) NOT NULL,
  depto         VARCHAR(80)  NULL,
  region        VARCHAR(60)  NOT NULL,
  comuna        VARCHAR(80)  NOT NULL,
  referencia    VARCHAR(200) NULL,
  tipo_tina     VARCHAR(40)  NULL,
  notas         TEXT         NULL,
  total_estimado INT UNSIGNED NOT NULL DEFAULT 0,
  estado        ENUM('nueva','contactada','cotizada','cerrada') NOT NULL DEFAULT 'nueva',
  creado_en     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_estado (estado),
  INDEX idx_creado (creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cotizacion_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cotizacion_id INT UNSIGNED NOT NULL,
  producto_id   VARCHAR(120) NOT NULL,
  nombre        VARCHAR(200) NOT NULL,
  variante      VARCHAR(200) NULL,
  grupo         VARCHAR(20)  NOT NULL,
  cantidad      INT UNSIGNED NOT NULL DEFAULT 1,
  precio_unitario INT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_item_cot FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admin_users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(180) NOT NULL UNIQUE,
  nombre        VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol           ENUM('admin','gestor') NOT NULL DEFAULT 'gestor',
  creado_en     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
