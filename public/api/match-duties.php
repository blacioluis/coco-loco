<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$dataDirectory = __DIR__ . '/data';
$dutiesFile = $dataDirectory . '/.match-duties.json';
$drawsFile = $dataDirectory . '/.duty-draws.json';
$dutiesSeedFile = dirname(__DIR__) . '/data/match-duties.json';
$legacyFile = dirname(__DIR__) . '/data/duty-legacy-history.json';
$membersFile = $dataDirectory . '/.members.json';
$membersSeedFile = dirname(__DIR__) . '/data/members.json';

if (!is_dir($dataDirectory) && !mkdir($dataDirectory, 0775, true) && !is_dir($dataDirectory)) apiRespond(500, ['error' => 'Dossier de données indisponible.']);
initializeJsonFile($dutiesFile, $dutiesSeedFile, []);
initializeJsonFile($drawsFile, null, []);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'GET') apiRespond(200, ['duties' => readJsonArray($dutiesFile), 'draws' => array_slice(array_reverse(readJsonArray($drawsFile)), 0, 50)]);
if ($method !== 'POST') { header('Allow: GET, POST'); apiRespond(405, ['error' => 'Méthode non autorisée.']); }

apiRequireAdmin();
apiRequireCsrf();
$input = apiJsonInput();
$action = apiClean($input['action'] ?? '', 20);
if (!in_array($action, ['upsert', 'draw'], true)) apiRespond(422, ['error' => 'Action invalide.']);
$round = filter_var($input['round'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 60]]);
$fixtureDate = apiClean($input['fixtureDate'] ?? '', 10);
if ($round === false || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fixtureDate)) apiRespond(422, ['error' => 'Match invalide.']);

$membersSource = file_exists($membersFile) ? $membersFile : $membersSeedFile;
$members = readJsonArray($membersSource);
$activeMembers = [];
foreach ($members as $member) if (($member['active'] ?? true) !== false && isset($member['id'], $member['name'])) $activeMembers[(string) $member['id']] = $member;
$duties = readJsonArray($dutiesFile);
$draws = readJsonArray($drawsFile);
$performedAt = gmdate('c');

if ($action === 'draw') {
    $eligibleIds = [];
    if (is_array($input['eligibleMemberIds'] ?? null)) foreach (array_slice($input['eligibleMemberIds'], 0, 60) as $value) {
        $id = dutyMemberId($value);
        if (isset($activeMembers[$id]) && !in_array($id, $eligibleIds, true)) $eligibleIds[] = $id;
    }
    if (count($eligibleIds) < 2) apiRespond(422, ['error' => 'Sélectionnez au moins deux joueurs convoqués.']);
    sort($eligibleIds, SORT_STRING);
    $legacy = readJsonObject($legacyFile);
    $seed = bin2hex(random_bytes(32));
    $completedDuties = array_values(array_filter($duties, static fn(array $duty): bool => ($duty['round'] ?? null) !== $round || ($duty['fixtureDate'] ?? '') !== $fixtureDate));
    $kitsPool = fairPool($eligibleIds, taskStats($completedDuties, $legacy, 'kits'));
    $kitsMemberId = verifiableWinner($kitsPool, $seed, 'kits');
    $drinksEligible = array_values(array_filter($eligibleIds, static fn(string $id): bool => $id !== $kitsMemberId));
    $drinksPool = fairPool($drinksEligible, taskStats($completedDuties, $legacy, 'drinks'));
    $drinksMemberId = verifiableWinner($drinksPool, $seed, 'drinks');
    $drawId = strtoupper(bin2hex(random_bytes(4)));
    $candidateNames = array_map(static fn(string $id): array => ['memberId' => $id, 'memberName' => (string) $activeMembers[$id]['name']], $eligibleIds);
    $proofPayload = implode('|', [$drawId, (string) $round, $fixtureDate, implode(',', $eligibleIds), $kitsMemberId, $drinksMemberId, $seed]);
    $proof = ['type' => 'draw', 'drawId' => $drawId, 'performedAt' => $performedAt, 'algorithm' => 'fair-count-oldest-then-hmac-sha256-v1', 'seed' => $seed, 'hash' => hash('sha256', $proofPayload), 'eligibleMembers' => $candidateNames, 'kitsPool' => $kitsPool, 'drinksPool' => $drinksPool];
    $record = dutyRecord($round, $fixtureDate, $activeMembers[$kitsMemberId], $activeMembers[$drinksMemberId], $performedAt, $proof);
    $draws[] = ['round' => $round, 'fixtureDate' => $fixtureDate, 'kitsMemberId' => $kitsMemberId, 'kitsMemberName' => $record['kitsMemberName'], 'drinksMemberId' => $drinksMemberId, 'drinksMemberName' => $record['drinksMemberName'], 'proof' => $proof];
} else {
    $kitsMemberId = dutyMemberId($input['kitsMemberId'] ?? '');
    $drinksMemberId = dutyMemberId($input['drinksMemberId'] ?? '');
    if ($kitsMemberId === $drinksMemberId) apiRespond(422, ['error' => 'Choisissez deux joueurs différents.']);
    if (!isset($activeMembers[$kitsMemberId], $activeMembers[$drinksMemberId])) apiRespond(422, ['error' => 'Un joueur choisi est introuvable ou inactif.']);
    $manualId = 'MAN-' . strtoupper(bin2hex(random_bytes(4)));
    $proof = ['type' => 'manual', 'drawId' => $manualId, 'performedAt' => $performedAt, 'algorithm' => 'assignation-manuelle'];
    $record = dutyRecord($round, $fixtureDate, $activeMembers[$kitsMemberId], $activeMembers[$drinksMemberId], $performedAt, $proof);
    $draws[] = ['round' => $round, 'fixtureDate' => $fixtureDate, 'kitsMemberId' => $kitsMemberId, 'kitsMemberName' => $record['kitsMemberName'], 'drinksMemberId' => $drinksMemberId, 'drinksMemberName' => $record['drinksMemberName'], 'proof' => $proof];
}

$replaced = false;
foreach ($duties as $index => $duty) {
    if (($duty['round'] ?? null) !== $round || ($duty['fixtureDate'] ?? '') !== $fixtureDate) continue;
    $duties[$index] = $record; $replaced = true; break;
}
if (!$replaced) $duties[] = $record;
usort($duties, static fn(array $a, array $b): int => strcmp((string) ($a['fixtureDate'] ?? ''), (string) ($b['fixtureDate'] ?? '')));
apiBackupFile($dutiesFile, 'match-duties');
apiBackupFile($drawsFile, 'duty-draws');
writeJsonArray($dutiesFile, $duties);
writeJsonArray($drawsFile, $draws);
$attempts = count(array_filter($draws, static fn(array $draw): bool => ($draw['round'] ?? null) === $round && ($draw['fixtureDate'] ?? '') === $fixtureDate));
apiRespond($replaced ? 200 : 201, ['duty' => $record, 'draw' => end($draws), 'attemptsForFixture' => $attempts]);

function dutyRecord(int $round, string $fixtureDate, array $kitsMember, array $drinksMember, string $updatedAt, array $proof): array {
    return ['round' => $round, 'fixtureDate' => $fixtureDate, 'kitsMemberId' => $kitsMember['id'], 'kitsMemberName' => $kitsMember['name'], 'drinksMemberId' => $drinksMember['id'], 'drinksMemberName' => $drinksMember['name'], 'updatedAt' => $updatedAt, 'proof' => $proof];
}

function taskStats(array $duties, array $legacy, string $task): array {
    $stats = [];
    foreach (($legacy[$task] ?? []) as $item) {
        if (!is_array($item) || !isset($item['memberId'])) continue;
        $id = (string) $item['memberId'];
        $stats[$id] = ['count' => ($stats[$id]['count'] ?? 0) + 1, 'last' => '0000-00-00'];
    }
    $idField = $task === 'kits' ? 'kitsMemberId' : 'drinksMemberId';
    foreach ($duties as $duty) {
        $id = (string) ($duty[$idField] ?? '');
        if ($id === '') continue;
        $stats[$id] = ['count' => ($stats[$id]['count'] ?? 0) + 1, 'last' => max((string) ($stats[$id]['last'] ?? '0000-00-00'), (string) ($duty['fixtureDate'] ?? '0000-00-00'))];
    }
    return $stats;
}

function fairPool(array $eligibleIds, array $stats): array {
    $minimum = min(array_map(static fn(string $id): int => (int) ($stats[$id]['count'] ?? 0), $eligibleIds));
    $pool = array_values(array_filter($eligibleIds, static fn(string $id): bool => (int) ($stats[$id]['count'] ?? 0) === $minimum));
    $oldest = min(array_map(static fn(string $id): string => (string) ($stats[$id]['last'] ?? '0000-00-00'), $pool));
    return array_values(array_filter($pool, static fn(string $id): bool => (string) ($stats[$id]['last'] ?? '0000-00-00') === $oldest));
}

function verifiableWinner(array $pool, string $seed, string $task): string {
    $ranked = [];
    foreach ($pool as $id) $ranked[$id] = hash_hmac('sha256', $task . '|' . $id, $seed);
    asort($ranked, SORT_STRING);
    return (string) array_key_first($ranked);
}

function initializeJsonFile(string $target, ?string $seed, array $fallback): void {
    if (file_exists($target)) return;
    $contents = $seed !== null && file_exists($seed) ? file_get_contents($seed) : json_encode($fallback, JSON_PRETTY_PRINT) . "\n";
    if ($contents === false || file_put_contents($target, $contents, LOCK_EX) === false) apiRespond(500, ['error' => 'Création du registre impossible.']);
}
function readJsonArray(string $file): array {
    $decoded = json_decode(file_get_contents($file) ?: '[]', true);
    return is_array($decoded) ? array_values(array_filter($decoded, static fn(mixed $value): bool => is_array($value))) : [];
}
function readJsonObject(string $file): array {
    $decoded = json_decode(file_get_contents($file) ?: '{}', true);
    return is_array($decoded) ? $decoded : [];
}
function writeJsonArray(string $file, array $records): void {
    $handle = fopen($file, 'c+');
    if ($handle === false || !flock($handle, LOCK_EX)) apiRespond(500, ['error' => 'Registre indisponible.']);
    rewind($handle); ftruncate($handle, 0);
    $written = fwrite($handle, json_encode(array_values($records), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n");
    fflush($handle); flock($handle, LOCK_UN); fclose($handle);
    if ($written === false) apiRespond(500, ['error' => 'Écriture impossible.']);
}
function dutyMemberId(mixed $value): string {
    $id = apiClean($value, 80);
    if (!preg_match('/^[a-z0-9-]+$/', $id)) apiRespond(422, ['error' => 'Joueur invalide.']);
    return $id;
}
