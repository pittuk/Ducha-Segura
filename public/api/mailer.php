<?php
require_once __DIR__ . '/lib/phpmailer/Exception.php';
require_once __DIR__ . '/lib/phpmailer/PHPMailer.php';
require_once __DIR__ . '/lib/phpmailer/SMTP.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Envía un email HTML. Devuelve true/false (no lanza: el caller decide).
function ds_send_mail(string $toEmail, string $toName, string $subject, string $html): bool {
  $cfg = ds_config()['smtp'];
  $mail = new PHPMailer(true);
  try {
    $mail->isSMTP();
    $mail->Host = $cfg['host'];
    $mail->SMTPAuth = true;
    $mail->Username = $cfg['user'];
    $mail->Password = $cfg['pass'];
    $mail->SMTPSecure = $cfg['secure'];
    $mail->Port = (int)$cfg['port'];
    $mail->CharSet = 'UTF-8';
    $mail->setFrom($cfg['from_email'], $cfg['from_name']);
    $mail->addAddress($toEmail, $toName);
    $mail->isHTML(true);
    $mail->Subject = $subject;
    $mail->Body = $html;
    $mail->AltBody = strip_tags(str_replace(['<br>', '<br/>', '</p>'], "\n", $html));
    $mail->send();
    return true;
  } catch (\Throwable $e) {
    error_log('ds_send_mail error: ' . $mail->ErrorInfo);
    return false;
  }
}

function ds_email_layout(string $title, string $bodyHtml): string {
  return '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1d2b36">'
    . '<div style="background:#0072C0;color:#fff;padding:18px 24px;border-radius:8px 8px 0 0;font-size:18px;font-weight:bold">Ducha Segura&reg;</div>'
    . '<div style="border:1px solid #e3e8ec;border-top:0;border-radius:0 0 8px 8px;padding:24px">'
    . '<h2 style="margin:0 0 12px;font-size:18px">' . htmlspecialchars($title) . '</h2>'
    . $bodyHtml
    . '</div></div>';
}
