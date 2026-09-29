<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$dataDirectory = __DIR__ . '/data';
$dataFile = $dataDirectory . '/.acceptances.json';

if (!is_dir($dataDirectory) && !mkdir($dataDirectory, 0775, true) && !is_dir($dataDirectory)) {
    respond(500, ['error' => 'Impossible de créer le dossier de données.']);
}
if (!file_exists($dataFile) && file_put_contents($dataFile, "[]\n", LOCK_EX) === false) {
    respond(500, ['error' => 'Impossible de créer le registre.']);
}

if ($method === 'GET') {
    respond(200, ['club' => 'Forestois SC 1', 'acceptances' => readAcceptances($dataFile)]);
}

if ($method !== 'POST') {
    header('Allow: GET, POST');
    respond(405, ['error' => 'Méthode non autorisée.']);
}

$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) > 4096) respond(400, ['error' => 'Requête invalide.']);
$input = json_decode($raw, true);
if (!is_array($input)) respond(400, ['error' => 'JSON invalide.']);

$memberId = clean($input['memberId'] ?? '', 80);
$memberName = clean($input['memberName'] ?? '', 120);
$version = clean($input['regulationVersion'] ?? '', 30);
if ($memberId === '' || $memberName === '' || $version === '') respond(422, ['error' => 'Joueur ou version manquant.']);
if (!preg_match('/^[a-z0-9-]+$/', $memberId)) respond(422, ['error' => 'Identifiant joueur invalide.']);

$handle = fopen($dataFile, 'c+');
if ($handle === false || !flock($handle, LOCK_EX)) respond(500, ['error' => 'Registre indisponible.']);
$contents = stream_get_contents($handle);
$acceptances = json_decode($contents ?: '[]', true);
if (!is_array($acceptances)) $acceptances = [];

foreach ($acceptances as $acceptance) {
    if (($acceptance['memberId'] ?? '') === $memberId && ($acceptance['regulationVersion'] ?? '') === $version) {
        flock($handle, LOCK_UN);
        fclose($handle);
        respond(200, ['created' => false, 'acceptance' => $acceptance]);
    }
}

$acceptance = [
    'memberId' => $memberId,
    'memberName' => $memberName,
    'acceptedAt' => gmdate('c'),
    'regulationVersion' => $version,
];
$acceptances[] = $acceptance;
rewind($handle);
ftruncate($handle, 0);
$written = fwrite($handle, json_encode($acceptances, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n");
fflush($handle);
flock($handle, LOCK_UN);
fclose($handle);
if ($written === false) respond(500, ['error' => 'Écriture impossible.']);
respond(201, ['created' => true, 'acceptance' => $acceptance]);

function readAcceptances(string $file): array {
    $contents = file_get_contents($file);
    $decoded = json_decode($contents ?: '[]', true);
    return is_array($decoded) ? $decoded : [];
}

function clean(mixed $value, int $maxLength): string {
    $text = trim(is_string($value) ? $value : '');
    return function_exists('mb_substr') ? mb_substr($text, 0, $maxLength) : substr($text, 0, $maxLength);
}

function respond(int $status, array $payload): never {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}
