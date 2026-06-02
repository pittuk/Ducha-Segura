<?php
// USO (CLI): php public/admin/crear-admin.php email "Nombre" rol
// rol: admin | gestor. Pide la contraseña por stdin (no queda en el historial).
if (PHP_SAPI !== 'cli') { http_response_code(403); exit('Solo CLI.'); }
require_once __DIR__ . '/../api/db.php';
$email = $argv[1] ?? null; $nombre = $argv[2] ?? null; $rol = $argv[3] ?? 'gestor';
if (!$email || !$nombre || !in_array($rol, ['admin','gestor'], true)) {
  exit("Uso: php crear-admin.php email \"Nombre\" [admin|gestor]\n");
}
echo "Contraseña: "; $pass = trim(fgets(STDIN));
if (strlen($pass) < 8) exit("La contraseña debe tener al menos 8 caracteres.\n");
$hash = password_hash($pass, PASSWORD_DEFAULT);
$stmt = ds_db()->prepare('INSERT INTO admin_users (email,nombre,password_hash,rol) VALUES (?,?,?,?)
  ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), password_hash=VALUES(password_hash), rol=VALUES(rol)');
$stmt->execute([$email,$nombre,$hash,$rol]);
echo "Usuario $email ($rol) creado/actualizado.\n";
