<?php
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/_layout.php';
$u = ds_require_admin();
$msg = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  ds_csrf_check();
  $accion = $_POST['accion'] ?? '';
  if ($accion === 'crear') {
    $email = trim($_POST['email'] ?? ''); $nombre = trim($_POST['nombre'] ?? '');
    $rol = in_array($_POST['rol'] ?? '', ['admin','gestor'], true) ? $_POST['rol'] : 'gestor';
    $pass = $_POST['password'] ?? '';
    if (filter_var($email, FILTER_VALIDATE_EMAIL) && $nombre && strlen($pass) >= 8) {
      $hash = password_hash($pass, PASSWORD_DEFAULT);
      $st = ds_db()->prepare('INSERT INTO admin_users (email,nombre,password_hash,rol) VALUES (?,?,?,?)
        ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), password_hash=VALUES(password_hash), rol=VALUES(rol)');
      $st->execute([$email,$nombre,$hash,$rol]); $msg = 'Usuario guardado.';
    } else { $msg = 'Datos inválidos (email válido, nombre, contraseña ≥8).'; }
  } elseif ($accion === 'borrar') {
    $del = (int)($_POST['id'] ?? 0);
    if ($del !== (int)$u['id']) { ds_db()->prepare('DELETE FROM admin_users WHERE id = ?')->execute([$del]); $msg = 'Usuario eliminado.'; }
    else { $msg = 'No puedes eliminar tu propia cuenta.'; }
  }
}
$users = ds_db()->query('SELECT id,email,nombre,rol,creado_en FROM admin_users ORDER BY creado_en')->fetchAll();
$csrf = ds_csrf_token();
ds_header($u, 'users');
?>
<?php if ($msg): ?><p class="err" style="background:#e6f6ec;color:#1e7d40"><?= ds_e($msg) ?></p><?php endif; ?>
<div class="card">
  <h2>Usuarios</h2>
  <table class="list">
    <tr><th>Nombre</th><th>Email</th><th>Rol</th><th></th></tr>
    <?php foreach ($users as $usr): ?>
    <tr><td><?= ds_e($usr['nombre']) ?></td><td><?= ds_e($usr['email']) ?></td><td><?= ds_e($usr['rol']) ?></td>
      <td><?php if ((int)$usr['id'] !== (int)$u['id']): ?>
        <form method="post" onsubmit="return confirm('¿Eliminar usuario?')" style="display:inline">
          <input type="hidden" name="csrf" value="<?= ds_e($csrf) ?>"><input type="hidden" name="accion" value="borrar"><input type="hidden" name="id" value="<?= (int)$usr['id'] ?>">
          <button type="submit">Eliminar</button>
        </form><?php endif; ?></td></tr>
    <?php endforeach; ?>
  </table>
</div>
<div class="card">
  <h2>Crear / actualizar usuario</h2>
  <form method="post">
    <input type="hidden" name="csrf" value="<?= ds_e($csrf) ?>"><input type="hidden" name="accion" value="crear">
    <p><input type="text" name="nombre" placeholder="Nombre" required></p>
    <p><input type="email" name="email" placeholder="Email" required></p>
    <p><input type="password" name="password" placeholder="Contraseña (≥8)" required></p>
    <p><select name="rol"><option value="gestor">gestor</option><option value="admin">admin</option></select></p>
    <button type="submit">Guardar usuario</button>
  </form>
</div>
<?php ds_footer();
