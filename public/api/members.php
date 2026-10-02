<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$dataDirectory = __DIR__ . '/data';
$dataFile = $dataDirectory . '/.members.json';
$seedFile = dirname(__DIR__) . '/data/members.json';
$uploadsDirectory = __DIR__ . '/uploads/players';

if (!is_dir($dataDirectory) && !mkdir($dataDirectory, 0775, true) && !is_dir($dataDirectory)) apiRespond(500, ['error' => 'Dossier de données indisponible.']);
if (!file_exists($dataFile)) {
    $seed = file_exists($seedFile) ? file_get_contents($seedFile) : "[]\n";
    if ($seed === false || file_put_contents($dataFile, $seed, LOCK_EX) === false) apiRespond(500, ['error' => 'Création du registre impossible.']);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'GET') {
    $members = readMembers($dataFile);
    if (!apiAdminAuthenticated()) $members = array_map('publicMember', $members);
    apiRespond(200, ['club' => 'Forestois SC 1', 'members' => $members]);
}
if ($method !== 'POST') { header('Allow: GET, POST'); apiRespond(405, ['error' => 'Méthode non autorisée.']); }

apiRequireAdmin();
apiRequireCsrf();
$input = apiJsonInput(2_000_000);
$action = apiClean($input['action'] ?? '', 20);
if ($action === 'delete') {
    $memberId = validId($input['memberId'] ?? '');
    $members = readMembers($dataFile);
    $remaining = array_values(array_filter($members, static fn(array $member): bool => ($member['id'] ?? '') !== $memberId));
    if (count($remaining) === count($members)) apiRespond(404, ['error' => 'Membre introuvable.']);
    apiBackupFile($dataFile, 'members');
    writeMembers($dataFile, $remaining);
    deletePlayerPhotos($uploadsDirectory, $memberId);
    apiRespond(200, ['deleted' => true, 'memberId' => $memberId]);
}
if ($action !== 'upsert' || !is_array($input['member'] ?? null)) apiRespond(422, ['error' => 'Action ou membre invalide.']);

$incoming = $input['member'];
$memberId = validId($incoming['id'] ?? '');
$members = readMembers($dataFile);
$member = sanitizeMember($incoming);
$photo = $incoming['photoDataUrl'] ?? null;
if (is_string($photo) && str_starts_with($photo, 'data:image/')) $member['photoDataUrl'] = storePlayerPhoto($photo, $uploadsDirectory, $memberId);
elseif (is_string($photo) && isSafePhotoUrl($photo)) $member['photoDataUrl'] = $photo;
else { deletePlayerPhotos($uploadsDirectory, $memberId); unset($member['photoDataUrl']); }

$found = false;
foreach ($members as $index => $item) {
    if (($item['id'] ?? '') !== $memberId) continue;
    $members[$index] = $member;
    $found = true;
    break;
}
if (!$found) $members[] = $member;
apiBackupFile($dataFile, 'members');
writeMembers($dataFile, $members);
apiRespond($found ? 200 : 201, ['member' => $member]);

function readMembers(string $file): array {
    $decoded = json_decode(file_get_contents($file) ?: '[]', true);
    return is_array($decoded) ? array_values(array_filter($decoded, static fn(mixed $value): bool => is_array($value))) : [];
}

function publicMember(array $member): array {
    if (($member['id'] ?? '') !== 'patrick-janssens') unset($member['email'], $member['phone']);
    return $member;
}

function writeMembers(string $file, array $members): void {
    $handle = fopen($file, 'c+');
    if ($handle === false || !flock($handle, LOCK_EX)) apiRespond(500, ['error' => 'Registre indisponible.']);
    rewind($handle); ftruncate($handle, 0);
    $written = fwrite($handle, json_encode(array_values($members), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n");
    fflush($handle); flock($handle, LOCK_UN); fclose($handle);
    if ($written === false) apiRespond(500, ['error' => 'Écriture impossible.']);
}

function sanitizeMember(array $input): array {
    $roles = ['Coach', 'Responsable d’équipe', 'Assistant', 'Gardien', 'Défenseur', 'Milieu', 'Attaquant', 'Joueur'];
    $name = apiClean($input['name'] ?? '', 120);
    $role = apiClean($input['role'] ?? '', 40);
    if ($name === '' || !in_array($role, $roles, true)) apiRespond(422, ['error' => 'Nom ou rôle invalide.']);
    $positions = [];
    if (is_array($input['positions'] ?? null)) foreach (array_slice($input['positions'], 0, 6) as $position) {
        $clean = apiClean($position, 40);
        if ($clean !== '' && !in_array($clean, $positions, true)) $positions[] = $clean;
    }
    $member = ['id' => validId($input['id'] ?? ''), 'name' => $name, 'role' => $role, 'active' => ($input['active'] ?? true) !== false, 'positions' => $positions];
    $number = filter_var($input['number'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 99]]);
    if ($number !== false) $member['number'] = $number;
    foreach (['bio' => 800, 'phone' => 40, 'sourceUrl' => 500] as $field => $max) {
        $value = apiClean($input[$field] ?? '', $max);
        if ($value !== '') $member[$field] = $value;
    }
    $email = apiClean($input['email'] ?? '', 160);
    if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL) === false) apiRespond(422, ['error' => 'Adresse e-mail invalide.']);
    if ($email !== '') $member['email'] = $email;
    if (($input['sourceRole'] ?? '') === 'Joueur-coach') $member['sourceRole'] = 'Joueur-coach';
    elseif (($input['sourceRole'] ?? '') === 'Joueur') $member['sourceRole'] = 'Joueur';
    if (($input['isCoach'] ?? false) === true) $member['isCoach'] = true;
    return $member;
}

function validId(mixed $value): string {
    $id = apiClean($value, 80);
    if (!preg_match('/^[a-z0-9-]+$/', $id)) apiRespond(422, ['error' => 'Identifiant membre invalide.']);
    return $id;
}

function storePlayerPhoto(string $dataUrl, string $directory, string $memberId): string {
    if (!preg_match('#^data:image/(webp|jpeg|png);base64,([A-Za-z0-9+/=]+)$#', $dataUrl, $matches)) apiRespond(422, ['error' => 'Format de photo invalide.']);
    $binary = base64_decode($matches[2], true);
    if ($binary === false || strlen($binary) < 32 || strlen($binary) > 1_500_000) apiRespond(422, ['error' => 'Photo invalide ou trop volumineuse.']);
    $database = apiDatabase();
    if ($database !== null) {
        try {
            apiEnsurePlayerPhotosTable($database);
            $mimeType = $matches[1] === 'jpeg' ? 'image/jpeg' : 'image/' . $matches[1];
            $statement = $database->prepare('INSERT INTO player_photos (member_id, mime_type, image_data) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE mime_type = VALUES(mime_type), image_data = VALUES(image_data), updated_at = CURRENT_TIMESTAMP');
            $statement->bindValue(1, $memberId);
            $statement->bindValue(2, $mimeType);
            $statement->bindValue(3, $binary, PDO::PARAM_LOB);
            $statement->execute();
            deletePlayerPhotoFiles($directory, $memberId);
            return 'api/player-photo.php?id=' . rawurlencode($memberId) . '&v=' . time();
        } catch (Throwable) { /* Repli sur un fichier serveur persistant si MySQL est temporairement indisponible. */ }
    }
    if (!is_dir($directory) && !mkdir($directory, 0775, true) && !is_dir($directory)) apiRespond(500, ['error' => 'Stockage photo indisponible.']);
    deletePlayerPhotoFiles($directory, $memberId);
    $extension = $matches[1] === 'jpeg' ? 'jpg' : $matches[1];
    $filename = $memberId . '.' . $extension;
    if (file_put_contents($directory . '/' . $filename, $binary, LOCK_EX) === false) apiRespond(500, ['error' => 'Enregistrement de la photo impossible.']);
    return 'api/uploads/players/' . $filename . '?v=' . time();
}

function deletePlayerPhotos(string $directory, string $memberId): void {
    $database = apiDatabase();
    if ($database !== null) {
        try {
            apiEnsurePlayerPhotosTable($database);
            $statement = $database->prepare('DELETE FROM player_photos WHERE member_id = ?');
            $statement->execute([$memberId]);
        } catch (Throwable) { /* La suppression des fichiers reste tentée. */ }
    }
    deletePlayerPhotoFiles($directory, $memberId);
}

function deletePlayerPhotoFiles(string $directory, string $memberId): void {
    foreach (['webp', 'jpg', 'png'] as $extension) { $file = $directory . '/' . $memberId . '.' . $extension; if (is_file($file)) @unlink($file); }
}

function isSafePhotoUrl(string $url): bool {
    return preg_match('#^(?:api/uploads/players|assets)/[a-zA-Z0-9._/-]+(?:\?v=\d+)?$#', $url) === 1
        || preg_match('#^api/player-photo\.php\?id=[a-z0-9-]+&v=\d+$#', $url) === 1;
}
