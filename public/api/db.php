<?php
// Carga config + conexión PDO compartida.
function ds_config(): array {
  static $cfg = null;
  if ($cfg === null) {
    // Busca config.php en orden de preferencia. Lo ideal en producción es tenerlo
    // FUERA del web root (las opciones 1 y 2): así los secretos no quedan dentro
    // de public_html y no dependen únicamente del .htaccess para no servirse.
    //   1) Ruta explícita vía variable de entorno DS_CONFIG_PATH.
    //   2) Un nivel sobre el web root (p. ej. ~/domains/<dominio>/config.php).
    //   3) Junto a este archivo (dev local / fallback; ya está denegado por .htaccess).
    $candidates = array_filter([
      getenv('DS_CONFIG_PATH') ?: null,
      __DIR__ . '/../../config.php',   // fuera del web root (no accesible por HTTP)
      __DIR__ . '/config.php',         // fallback dentro de /api
    ]);
    $path = null;
    foreach ($candidates as $candidate) {
      if (is_file($candidate)) { $path = $candidate; break; }
    }
    if ($path === null) {
      http_response_code(500);
      header('Content-Type: application/json');
      echo json_encode(['ok' => false, 'error' => 'config_missing']);
      exit;
    }
    $cfg = require $path;
  }
  return $cfg;
}

function ds_db(): PDO {
  static $pdo = null;
  if ($pdo === null) {
    $c = ds_config()['db'];
    $dsn = "mysql:host={$c['host']};dbname={$c['name']};charset=utf8mb4";
    $pdo = new PDO($dsn, $c['user'], $c['pass'], [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      PDO::ATTR_EMULATE_PREPARES => false,
    ]);
  }
  return $pdo;
}
