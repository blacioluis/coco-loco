<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
apiRequireAdmin();

$dataDirectory = __DIR__ . '/data';
$membersFile = $dataDirectory . '/.members.json';
$historyFile = $dataDirectory . '/.mail-history.json';
if (!is_dir($dataDirectory) && !mkdir($dataDirectory, 0775, true) && !is_dir($dataDirectory)) apiRespond(500, ['error' => 'Dossier de données indisponible.']);
if (!file_exists($historyFile)) file_put_contents($historyFile, "[]\n", LOCK_EX);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'GET') apiRespond(200, ['history' => readArray($historyFile)]);
if ($method !== 'POST') { header('Allow: GET, POST'); apiRespond(405, ['error' => 'Méthode non autorisée.']); }
apiRequireCsrf();
if (!function_exists('mail')) apiRespond(503, ['error' => 'La fonction e-mail PHP n’est pas activée sur cet hébergement.']);

$input = apiJsonInput(32_000);
$subject = apiClean($input['subject'] ?? '', 140);
$message = apiClean($input['message'] ?? '', 5000);
$requestedIds = is_array($input['memberIds'] ?? null) ? array_slice(array_values(array_unique($input['memberIds'])), 0, 50) : [];
if ($subject === '' || $message === '' || count($requestedIds) === 0) apiRespond(422, ['error' => 'Destinataire, objet ou message manquant.']);
foreach ($requestedIds as $id) if (!is_string($id) || preg_match('/^[a-z0-9-]+$/', $id) !== 1) apiRespond(422, ['error' => 'Destinataire invalide.']);
if (!file_exists($membersFile)) apiRespond(409, ['error' => 'Le registre central de l’effectif doit être initialisé avant un envoi.']);
$history = readArray($historyFile);
$oneHourAgo = time() - 3600;
$recentBatches = array_filter($history, static fn(mixed $item): bool => is_array($item) && strtotime((string) ($item['createdAt'] ?? '')) > $oneHourAgo);
if (count($recentBatches) >= 10) apiRespond(429, ['error' => 'Limite de sécurité atteinte : maximum 10 envois groupés par heure.']);

$members = readArray($membersFile);
$recipients = [];
foreach ($members as $member) {
    if (!is_array($member) || ($member['active'] ?? true) === false || !in_array($member['id'] ?? '', $requestedIds, true)) continue;
    $email = filter_var($member['email'] ?? '', FILTER_VALIDATE_EMAIL);
    if ($email === false) continue;
    $recipients[] = ['name' => apiClean($member['name'] ?? '', 120), 'email' => $email];
}
if (count($recipients) === 0) apiRespond(422, ['error' => 'Aucun joueur sélectionné ne possède une adresse e-mail valide.']);

$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'From: ' . MAIL_FROM_NAME . ' <' . MAIL_FROM_EMAIL . '>',
    'Reply-To: ' . MAIL_REPLY_TO,
    'X-Mailer: Forestois-SC/1.0',
];
$sentNames = [];
$failedNames = [];
foreach ($recipients as $recipient) {
    $safeName = htmlspecialchars($recipient['name'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeMessage = nl2br(htmlspecialchars($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'));
    $html = '<!doctype html><html lang="fr"><body style="margin:0;background:#f3f5f1;font-family:Arial,sans-serif;color:#18231b"><div style="max-width:620px;margin:24px auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #dfe5dc"><div style="padding:22px 28px;background:#172119;color:#fff"><strong style="color:#c5e86e;letter-spacing:.08em">FORESTOIS SC 1</strong></div><div style="padding:28px"><p>Bonjour / Hola ' . $safeName . ',</p><div style="line-height:1.65">' . $safeMessage . '</div><p style="margin-top:28px;color:#687269;font-size:12px">Forestois SC 1</p></div></div></body></html>';
    $sent = @mail($recipient['email'], $encodedSubject, $html, implode("\r\n", $headers));
    if ($sent) $sentNames[] = $recipient['name'];
    else $failedNames[] = $recipient['name'];
}

$entry = [
    'id' => bin2hex(random_bytes(8)),
    'subject' => $subject,
    'createdAt' => gmdate('c'),
    'recipients' => array_values(array_merge($sentNames, $failedNames)),
    'sent' => count($sentNames),
    'failed' => count($failedNames),
];
array_unshift($history, $entry);
$history = array_slice($history, 0, 100);
apiBackupFile($historyFile, 'mail-history');
writeJsonArray($historyFile, $history);
apiRespond(count($sentNames) > 0 ? 200 : 502, ['sent' => count($sentNames), 'failed' => count($failedNames), 'historyItem' => $entry, 'error' => count($sentNames) ? null : 'Le serveur mail a refusé tous les envois.']);

function readArray(string $file): array {
    $decoded = json_decode(file_get_contents($file) ?: '[]', true);
    return is_array($decoded) ? $decoded : [];
}

function writeJsonArray(string $file, array $value): void {
    if (file_put_contents($file, json_encode($value, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n", LOCK_EX) === false) apiRespond(500, ['error' => 'Historique d’envoi indisponible.']);
}
