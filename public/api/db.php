<?php
// Carga config + conexión PDO compartida.
function ds_config(): array {
  static $cfg = null;
  if ($cfg === null) {
    $path = __DIR__ . '/config.php';
    if (!file_exists($path)) {
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
