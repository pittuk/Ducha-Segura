<?php
// Copia este archivo a config.php y completa con credenciales reales (NO commitear config.php).
return [
  'db' => [
    'host' => 'localhost',
    'name' => 'ducha_cotizaciones',
    'user' => 'CAMBIAR',
    'pass' => 'CAMBIAR',
  ],
  'smtp' => [
    'host' => 'smtp.hostinger.com',
    'port' => 465,
    'secure' => 'ssl',          // 'ssl' (465) o 'tls' (587)
    'user' => 'cotizaciones@duchasegura.cl',
    'pass' => 'CAMBIAR',
    'from_email' => 'cotizaciones@duchasegura.cl',
    'from_name' => 'Ducha Segura',
  ],
  'manager_email' => 'CAMBIAR@duchasegura.cl', // copia al gestor
  'site_url' => 'https://www.duchasegura.cl',
  'cors_origin' => '*', // en prod, mismo origen; en dev permite localhost:4321
];
