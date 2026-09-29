<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Cette commande est réservée au terminal du serveur.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$memberId = trim((string) ($argv[1] ?? ''));
if ($memberId === '' || preg_match('/^[a-z0-9-]+$/', $memberId) !== 1) {
    fwrite(STDERR, "Usage : php remove-acceptance.php identifiant-joueur\n");
    exit(1);
}

$dataFile = __DIR__ . '/data/.acceptances.json';
$handle = fopen($dataFile, 'c+');
if ($handle === false || !flock($handle, LOCK_EX)) {
    fwrite(STDERR, "Registre des accords indisponible.\n");
    exit(1);
}

$contents = stream_get_contents($handle);
$acceptances = json_decode($contents ?: '[]', true);
if (!is_array($acceptances)) $acceptances = [];

$remaining = array_values(array_filter(
    $acceptances,
    static fn(mixed $acceptance): bool => !is_array($acceptance) || ($acceptance['memberId'] ?? '') !== $memberId,
));
$removed = count($acceptances) - count($remaining);

rewind($handle);
ftruncate($handle, 0);
$written = fwrite($handle, json_encode($remaining, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n");
fflush($handle);
flock($handle, LOCK_UN);
fclose($handle);

if ($written === false) {
    fwrite(STDERR, "Impossible d’écrire le registre.\n");
    exit(1);
}

fwrite(STDOUT, $removed > 0
    ? "Accord supprimé pour {$memberId}.\n"
    : "Aucun accord trouvé pour {$memberId}.\n");
