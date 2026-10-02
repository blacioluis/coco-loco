<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$dataDirectory = __DIR__ . '/data';
$dataFile = $dataDirectory . '/.events.json';
if (!is_dir($dataDirectory) && !mkdir($dataDirectory, 0775, true) && !is_dir($dataDirectory)) apiRespond(500, ['error' => 'Dossier de données indisponible.']);
if (!file_exists($dataFile) && file_put_contents($dataFile, "[]\n", LOCK_EX) === false) apiRespond(500, ['error' => 'Création de l’agenda impossible.']);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'GET') apiRespond(200, ['events' => readEvents($dataFile)]);
if ($method !== 'POST') { header('Allow: GET, POST'); apiRespond(405, ['error' => 'Méthode non autorisée.']); }
apiRequireAdmin();
apiRequireCsrf();
$input = apiJsonInput();
$action = apiClean($input['action'] ?? '', 20);
$events = readEvents($dataFile);

if ($action === 'delete') {
    $id = eventId($input['id'] ?? '');
    $remaining = array_values(array_filter($events, static fn(array $event): bool => ($event['id'] ?? '') !== $id));
    if (count($remaining) === count($events)) apiRespond(404, ['error' => 'Événement introuvable.']);
    apiBackupFile($dataFile, 'events');
    writeEvents($dataFile, $remaining);
    apiRespond(200, ['deleted' => true]);
}
if ($action !== 'create' || !is_array($input['event'] ?? null)) apiRespond(422, ['error' => 'Événement invalide.']);
$incoming = $input['event'];
$types = ['Entraînement', 'Match amical', 'Réunion', 'Activité club'];
$type = apiClean($incoming['type'] ?? '', 40);
$date = apiClean($incoming['date'] ?? '', 10);
$time = apiClean($incoming['time'] ?? '', 5);
$title = apiClean($incoming['title'] ?? '', 140);
$location = apiClean($incoming['location'] ?? '', 220);
if ($title === '' || $location === '' || !in_array($type, $types, true) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) || !preg_match('/^\d{2}:\d{2}$/', $time)) apiRespond(422, ['error' => 'Informations de l’événement invalides.']);
$event = ['id' => bin2hex(random_bytes(12)), 'title' => $title, 'type' => $type, 'date' => $date, 'time' => $time, 'location' => $location];
$description = apiClean($incoming['description'] ?? '', 1000);
if ($description !== '') $event['description'] = $description;
$events[] = $event;
usort($events, static fn(array $a, array $b): int => strcmp(($a['date'] ?? '') . 'T' . ($a['time'] ?? ''), ($b['date'] ?? '') . 'T' . ($b['time'] ?? '')));
apiBackupFile($dataFile, 'events');
writeEvents($dataFile, $events);
apiRespond(201, ['event' => $event]);

function readEvents(string $file): array {
    $decoded = json_decode(file_get_contents($file) ?: '[]', true);
    return is_array($decoded) ? array_values(array_filter($decoded, static fn(mixed $event): bool => is_array($event))) : [];
}
function writeEvents(string $file, array $events): void {
    $handle = fopen($file, 'c+');
    if ($handle === false || !flock($handle, LOCK_EX)) apiRespond(500, ['error' => 'Agenda indisponible.']);
    rewind($handle); ftruncate($handle, 0);
    $written = fwrite($handle, json_encode(array_values($events), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n");
    fflush($handle); flock($handle, LOCK_UN); fclose($handle);
    if ($written === false) apiRespond(500, ['error' => 'Écriture impossible.']);
}
function eventId(mixed $value): string {
    $id = apiClean($value, 80);
    if (!preg_match('/^[a-z0-9-]+$/', $id)) apiRespond(422, ['error' => 'Identifiant invalide.']);
    return $id;
}
