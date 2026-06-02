<?php
require_once __DIR__ . '/../api/db.php';
session_start();

function ds_csrf_token(): string {
  if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(16));
  return $_SESSION['csrf'];
}
function ds_csrf_check(): void {
  if (!hash_equals((string)($_SESSION['csrf'] ?? ''), (string)($_POST['csrf'] ?? ''))) { http_response_code(403); exit('CSRF'); }
}
function ds_user(): ?array { return $_SESSION['admin'] ?? null; }
function ds_require_login(): array {
  $u = ds_user();
  if (!$u) { header('Location: login.php'); exit; }
  return $u;
}
function ds_require_admin(): array {
  $u = ds_require_login();
  if ($u['rol'] !== 'admin') { http_response_code(403); exit('Solo administradores.'); }
  return $u;
}
function ds_e(string $s): string { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); }
