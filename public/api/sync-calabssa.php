<?php
declare(strict_types=1);

// Tâche serveur uniquement. Le cron peut lancer ce fichier toutes les heures le
// dimanche : le contrôle ci-dessous n'exécute la synchronisation qu'à 20 h,
// heure de Bruxelles, y compris lors des changements heure d'été / heure d'hiver.
if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Cette tâche doit être exécutée par le cron du serveur.'], JSON_UNESCAPED_UNICODE);
    exit;
}

date_default_timezone_set('Europe/Brussels');
$arguments = $argv ?? [];
$force = in_array('--force', $arguments, true);
$now = new DateTimeImmutable('now', new DateTimeZone('Europe/Brussels'));

if (!$force && ($now->format('N') !== '7' || $now->format('G') !== '20')) {
    fwrite(STDOUT, "Synchronisation ignorée : exécution prévue le dimanche entre 20 h et 21 h (Europe/Brussels).\n");
    exit(0);
}

$dataDirectory = dirname(__DIR__) . '/data';
$outputFile = $dataDirectory . '/calabssa.json';
$lockDirectory = __DIR__ . '/data';
$lockFile = $lockDirectory . '/.calabssa-sync.lock';

if (!is_dir($dataDirectory) && !mkdir($dataDirectory, 0775, true) && !is_dir($dataDirectory)) {
    fail('Impossible de créer le dossier public/data.');
}
if (!is_dir($lockDirectory) && !mkdir($lockDirectory, 0775, true) && !is_dir($lockDirectory)) {
    fail('Impossible de créer le dossier de verrouillage.');
}

$lock = fopen($lockFile, 'c');
if ($lock === false || !flock($lock, LOCK_EX | LOCK_NB)) {
    fail('Une synchronisation CalABSSA est déjà en cours.');
}

try {
    $sourceUrl = 'https://www.calabssa.be/c/152_1_forestois_sc/';
    $html = download($sourceUrl);
    $payload = decodeNextPayload($html);
    $events = extractArray($payload, '"icalEvents":');
    $rawStandings = extractArray($payload, '"standings":');

    if (count($events) < 26) fail('Calendrier incomplet reçu (' . count($events) . ' rencontres).');
    if (count($rawStandings) < 2) fail('Classement incomplet reçu (' . count($rawStandings) . ' équipes).');

    $fixtures = array_map('toFixture', $events);
    usort($fixtures, static fn(array $left, array $right): int => $left['round'] <=> $right['round']);
    $standings = array_map('toStanding', $rawStandings);
    $document = [
        'updatedAt' => $now->format('Y-m-d'),
        'fixtures' => $fixtures,
        'standings' => $standings,
    ];

    $temporaryFile = $outputFile . '.tmp';
    $json = json_encode($document, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false || file_put_contents($temporaryFile, $json . "\n", LOCK_EX) === false || !rename($temporaryFile, $outputFile)) {
        @unlink($temporaryFile);
        fail('Impossible d’écrire le calendrier synchronisé.');
    }

    fwrite(STDOUT, sprintf(
        "CalABSSA synchronisé : %d rencontres, %d équipes (%s).\n",
        count($fixtures),
        count($standings),
        $document['updatedAt'],
    ));
} catch (Throwable $error) {
    fail($error->getMessage());
} finally {
    flock($lock, LOCK_UN);
    fclose($lock);
}

function download(string $url): string {
    if (function_exists('curl_init')) {
        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_USERAGENT => 'Forestois-SC-calendar-sync/1.0',
            CURLOPT_HTTPHEADER => ['Accept: text/html,application/xhtml+xml'],
        ]);
        $body = curl_exec($curl);
        $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        $error = curl_error($curl);
        curl_close($curl);
        if (is_string($body) && $status >= 200 && $status < 300) return $body;
        throw new RuntimeException('Téléchargement CalABSSA impossible (HTTP ' . $status . ($error ? ', ' . $error : '') . ').');
    }

    $context = stream_context_create(['http' => [
        'timeout' => 30,
        'header' => "User-Agent: Forestois-SC-calendar-sync/1.0\r\nAccept: text/html,application/xhtml+xml\r\n",
    ]]);
    $body = @file_get_contents($url, false, $context);
    if (!is_string($body)) throw new RuntimeException('Téléchargement CalABSSA impossible.');
    return $body;
}

function decodeNextPayload(string $html): string {
    preg_match_all('/self\\.__next_f\\.push\\(\\[1,("(?:[^"\\\\]|\\\\.)*")\\]\\)/s', $html, $matches);
    if (empty($matches[1])) throw new RuntimeException('Données structurées CalABSSA introuvables.');
    $payload = '';
    foreach ($matches[1] as $encoded) {
        $decoded = json_decode($encoded, true);
        if (is_string($decoded)) $payload .= $decoded;
    }
    return $payload;
}

function extractArray(string $payload, string $marker): array {
    $markerPosition = strpos($payload, $marker);
    if ($markerPosition === false) throw new RuntimeException('Bloc ' . $marker . ' introuvable.');
    $start = strpos($payload, '[', $markerPosition + strlen($marker));
    if ($start === false) throw new RuntimeException('Tableau ' . $marker . ' introuvable.');
    $depth = 0;
    $quoted = false;
    $escaped = false;
    $length = strlen($payload);
    for ($index = $start; $index < $length; $index++) {
        $character = $payload[$index];
        if ($quoted) {
            if ($escaped) $escaped = false;
            elseif ($character === '\\') $escaped = true;
            elseif ($character === '"') $quoted = false;
        } elseif ($character === '"') $quoted = true;
        elseif ($character === '[') $depth++;
        elseif ($character === ']' && --$depth === 0) {
            $decoded = json_decode(substr($payload, $start, $index - $start + 1), true);
            if (!is_array($decoded)) throw new RuntimeException('JSON ' . $marker . ' invalide.');
            return $decoded;
        }
    }
    throw new RuntimeException('Bloc ' . $marker . ' tronqué.');
}

function toFixture(array $event): array {
    $location = array_values(array_filter(array_map('trim', explode(',', (string) ($event['location'] ?? '')))));
    $firstLocation = $location[0] ?? '';
    $hasVenueName = $firstLocation !== '' && preg_match('/^(rue|avenue|av\\.|boulevard|chaussée)/iu', $firstLocation) !== 1;
    $venue = $hasVenueName ? (string) array_shift($location) : 'Nom du terrain à confirmer';
    $description = (string) ($event['description'] ?? '');
    preg_match('/Code terrain:\s*([^\r\n]+)/u', $description, $codeMatch);
    $kickoff = (new DateTimeImmutable((string) ($event['dtstart'] ?? 'now')))->setTimezone(new DateTimeZone('Europe/Brussels'));
    $fixture = [
        'round' => (int) ($event['dayNumber'] ?? 0),
        'date' => $kickoff->format('Y-m-d'),
        'time' => $kickoff->format('H:i'),
        'opponent' => (bool) ($event['isHome'] ?? false) ? (string) ($event['awayName'] ?? '') : (string) ($event['homeName'] ?? ''),
        'home' => (bool) ($event['isHome'] ?? false),
        'venue' => $venue,
        'address' => implode(', ', $location),
        'venueCode' => trim($codeMatch[1] ?? 'À confirmer'),
        'status' => ($event['status'] ?? '') === 'played' ? 'played' : 'scheduled',
    ];
    if (($event['homeScore'] ?? null) !== null) $fixture['homeScore'] = (int) $event['homeScore'];
    if (($event['awayScore'] ?? null) !== null) $fixture['awayScore'] = (int) $event['awayScore'];
    return $fixture;
}

function toStanding(array $row): array {
    return [
        'teamId' => (string) ($row['teamId'] ?? ''),
        'name' => (string) ($row['name'] ?? ''),
        'played' => (int) ($row['played'] ?? 0),
        'wins' => (int) ($row['wins'] ?? 0),
        'draws' => (int) ($row['draws'] ?? 0),
        'losses' => (int) ($row['losses'] ?? 0),
        'goalsFor' => (int) ($row['goalsFor'] ?? 0),
        'goalsAgainst' => (int) ($row['goalsAgainst'] ?? 0),
        'goalDifference' => (int) ($row['goalDifference'] ?? 0),
        'points' => (int) ($row['points'] ?? 0),
    ];
}

function fail(string $message): void {
    fwrite(STDERR, '[CalABSSA] ' . $message . "\n");
    exit(1);
}
