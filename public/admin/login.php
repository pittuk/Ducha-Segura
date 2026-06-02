<?php
require_once __DIR__ . '/auth.php';
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  ds_csrf_check();
  $email = trim($_POST['email'] ?? '');
  $pass = $_POST['password'] ?? '';
  $stmt = ds_db()->prepare('SELECT * FROM admin_users WHERE email = ?');
  $stmt->execute([$email]);
  $u = $stmt->fetch();
  if ($u && password_verify($pass, $u['password_hash'])) {
    session_regenerate_id(true);
    $_SESSION['admin'] = ['id'=>$u['id'],'nombre'=>$u['nombre'],'email'=>$u['email'],'rol'=>$u['rol']];
    header('Location: index.php'); exit;
  }
  $error = 'Credenciales inválidas.';
}
$csrf = ds_csrf_token();
?>
<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Admin — Ducha Segura</title><link rel="stylesheet" href="styles.css"></head>
<body class="login-body">
  <form method="post" class="login-card">
    <h1>Ducha Segura · Admin</h1>
    <?php if ($error): ?><p class="err"><?= ds_e($error) ?></p><?php endif; ?>
    <input type="hidden" name="csrf" value="<?= ds_e($csrf) ?>">
    <label>Email<input type="email" name="email" required></label>
    <label>Contraseña<input type="password" name="password" required></label>
    <button type="submit">Entrar</button>
  </form>
</body></html>
