<?php
// Reservado para pagos online (Webpay/Flow/Mercado Pago). Aún no implementado.
header('Content-Type: application/json; charset=utf-8');
http_response_code(501);
echo json_encode(['ok' => false, 'reason' => 'coming_soon', 'message' => 'Pago online próximamente.']);
