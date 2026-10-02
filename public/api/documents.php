<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
apiRequireAdmin();

$dataDirectory = __DIR__ . '/data';
$storageDirectory = $dataDirectory . '/documents';
$metadataFile = $dataDirectory . '/.documents.json';
if (!is_dir($storageDirectory) && !mkdir($storageDirectory, 0775, true) && !is_dir($storageDirectory)) apiRespond(500, ['error' => 'Stockage des documents indisponible.']);
if (!file_exists($metadataFile) && file_put_contents($metadataFile, "[]\n", LOCK_EX) === false) apiRespond(500, ['error' => 'Registre des documents indisponible.']);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$documents = readDocuments($metadataFile);
if ($method === 'GET' && isset($_GET['download'])) {
    $id = validDocumentId($_GET['download']);
    foreach ($documents as $document) {
        if (($document['id'] ?? '') !== $id) continue;
        $file = $storageDirectory . '/' . basename((string) ($document['storedName'] ?? ''));
        if (!is_file($file)) apiRespond(404, ['error' => 'Fichier introuvable.']);
        header('Content-Type: ' . ($document['mimeType'] ?? 'application/octet-stream'));
        header('Content-Length: ' . filesize($file));
        header('Content-Disposition: attachment; filename*=UTF-8\'\'' . rawurlencode((string) ($document['originalName'] ?? 'document')));
        header('X-Content-Type-Options: nosniff');
        header('Cache-Control: private, no-store');
        readfile($file);
        exit;
    }
    apiRespond(404, ['error' => 'Document introuvable.']);
}
if ($method === 'GET') apiRespond(200, ['documents' => publicDocuments($documents)]);
if ($method !== 'POST') { header('Allow: GET, POST'); apiRespond(405, ['error' => 'Méthode non autorisée.']); }
apiRequireCsrf();

if (str_starts_with((string) ($_SERVER['CONTENT_TYPE'] ?? ''), 'multipart/form-data')) {
    if (($_POST['action'] ?? '') !== 'upload' || !isset($_FILES['document'])) apiRespond(422, ['error' => 'Fichier manquant.']);
    $upload = $_FILES['document'];
    if (!is_array($upload) || ($upload['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) apiRespond(422, ['error' => uploadError((int) ($upload['error'] ?? UPLOAD_ERR_NO_FILE))]);
    $size = (int) ($upload['size'] ?? 0);
    if ($size < 1 || $size > 8_000_000) apiRespond(422, ['error' => 'Le document doit peser moins de 8 Mo.']);
    $originalName = apiClean(basename((string) ($upload['name'] ?? 'document')), 180);
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $allowed = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'doc', 'docx', 'xls', 'xlsx'];
    if (!in_array($extension, $allowed, true)) apiRespond(422, ['error' => 'Format non autorisé. Formats acceptés : PDF, image, Word et Excel.']);
    $id = bin2hex(random_bytes(10));
    $storedName = $id . '.' . $extension;
    if (!move_uploaded_file((string) $upload['tmp_name'], $storageDirectory . '/' . $storedName)) apiRespond(500, ['error' => 'Enregistrement du document impossible.']);
    $mimeType = function_exists('mime_content_type') ? (string) mime_content_type($storageDirectory . '/' . $storedName) : 'application/octet-stream';
    $document = ['id' => $id, 'title' => apiClean($_POST['title'] ?? '', 120) ?: pathinfo($originalName, PATHINFO_FILENAME), 'originalName' => $originalName, 'storedName' => $storedName, 'mimeType' => $mimeType, 'size' => $size, 'uploadedAt' => gmdate('c')];
    array_unshift($documents, $document);
    apiBackupFile($metadataFile, 'documents');
    writeDocuments($metadataFile, $documents);
    apiRespond(201, ['document' => publicDocument($document)]);
}

$input = apiJsonInput(4096);
if (($input['action'] ?? '') !== 'delete') apiRespond(422, ['error' => 'Action invalide.']);
$id = validDocumentId($input['id'] ?? '');
$remaining = [];
$deleted = null;
foreach ($documents as $document) {
    if (($document['id'] ?? '') === $id) $deleted = $document;
    else $remaining[] = $document;
}
if ($deleted === null) apiRespond(404, ['error' => 'Document introuvable.']);
apiBackupFile($metadataFile, 'documents');
writeDocuments($metadataFile, $remaining);
$file = $storageDirectory . '/' . basename((string) ($deleted['storedName'] ?? ''));
if (is_file($file)) @unlink($file);
apiRespond(200, ['deleted' => true, 'id' => $id]);

function readDocuments(string $file): array { $decoded = json_decode(file_get_contents($file) ?: '[]', true); return is_array($decoded) ? $decoded : []; }
function writeDocuments(string $file, array $value): void { if (file_put_contents($file, json_encode(array_values($value), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n", LOCK_EX) === false) apiRespond(500, ['error' => 'Écriture du registre impossible.']); }
function publicDocuments(array $documents): array { return array_map('publicDocument', $documents); }
function publicDocument(array $document): array { unset($document['storedName']); return $document; }
function validDocumentId(mixed $value): string { $id = apiClean($value, 40); if (preg_match('/^[a-f0-9]{20}$/', $id) !== 1) apiRespond(422, ['error' => 'Identifiant de document invalide.']); return $id; }
function uploadError(int $error): string { return match ($error) { UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'Le fichier dépasse la taille autorisée par le serveur.', UPLOAD_ERR_PARTIAL => 'Le transfert du fichier est incomplet.', default => 'Le fichier n’a pas pu être envoyé.' }; }
