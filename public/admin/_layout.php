<?php
function ds_header(array $u, string $active = ''): void { ?>
<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Admin — Ducha Segura</title><link rel="stylesheet" href="styles.css"></head><body>
<div class="topbar">
  <nav>
    <a href="index.php"<?= $active==='list'?' style="color:#0072C0"':'' ?>>Cotizaciones</a>
    <?php if ($u['rol']==='admin'): ?><a href="usuarios.php"<?= $active==='users'?' style="color:#0072C0"':'' ?>>Usuarios</a><?php endif; ?>
  </nav>
  <div><?= ds_e($u['nombre']) ?> · <a href="logout.php">Salir</a></div>
</div>
<div class="wrap">
<?php }
function ds_footer(): void { echo '</div></body></html>'; }
