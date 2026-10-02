<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$memberId = apiClean($_GET['id'] ?? '', 80);
if (!preg_match('/^[a-z0-9-]+$/', $memberId)) {
    http_response_code(404);
    exit;
}
$database = apiDatabase();
if ($database === null) {
    http_response_code(404);
    exit;
}
try {
    apiEnsurePlayerPhotosTable($database);
    $statement = $database->prepare('SELECT mime_type, image_data, UNIX_TIMESTAMP(updated_at) AS version FROM player_photos WHERE member_id = ?');
    $statement->execute([$memberId]);
    $photo = $statement->fetch();
    if (!$photo) { http_response_code(404); exit; }
    $etag = '"' . hash('sha256', $memberId . ':' . (string) $photo['version']) . '"';
    if (($_SERVER['HTTP_IF_NONE_MATCH'] ?? '') === $etag) { http_response_code(304); exit; }
    header('Content-Type: ' . $photo['mime_type']);
    header('Content-Length: ' . strlen($photo['image_data']));
    header('Cache-Control: public, max-age=31536000, immutable');
    header('ETag: ' . $etag);
    header('X-Content-Type-Options: nosniff');
    echo $photo['image_data'];
} catch (Throwable) {
    http_response_code(404);
}
