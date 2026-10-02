<?php
declare(strict_types=1);

const ADMIN_USERNAME = 'forestois';
const ADMIN_PASSWORD_HASH = '$2y$12$/AKv4oo83gjC2uizWi04/ObLwktKPih0Gr7Cy7vAGAkCYMN1ayT/e';
const MAIL_FROM_EMAIL = 'noreply@coco-loco.be';
const MAIL_FROM_NAME = 'Forestois SC 1';
const MAIL_REPLY_TO = 'patj.scf@gmail.com';

function apiDatabase(): ?PDO {
    static $connectionResolved = false;
    static $connection = null;
    if ($connectionResolved) return $connection;
    $connectionResolved = true;
    $configFile = __DIR__ . '/data/database.private.php';
    $config = is_file($configFile) ? require $configFile : [];
    if (!is_array($config)) $config = [];
    $host = (string) ($config['host'] ?? getenv('FORESTOIS_DB_HOST') ?: '');
    $database = (string) ($config['database'] ?? getenv('FORESTOIS_DB_NAME') ?: '');
    $username = (string) ($config['username'] ?? getenv('FORESTOIS_DB_USER') ?: '');
    $password = (string) ($config['password'] ?? getenv('FORESTOIS_DB_PASSWORD') ?: '');
    if ($host === '' || $database === '' || $username === '') return null;
    try {
        $connection = new PDO(
            "mysql:host={$host};dbname={$database};charset=utf8mb4",
            $username,
            $password,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false]
        );
        return $connection;
    } catch (Throwable) {
        return null;
    }
}

function apiEnsurePlayerPhotosTable(PDO $database): void {
    $database->exec('CREATE TABLE IF NOT EXISTS player_photos (
        member_id VARCHAR(80) NOT NULL PRIMARY KEY,
        mime_type VARCHAR(40) NOT NULL,
        image_data MEDIUMBLOB NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
}

function apiStartSession(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    $secure = ($_SERVER['HTTPS'] ?? '') === 'on' || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
    session_name('forestois_admin');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();
}

function apiRequireAdmin(): void {
    apiStartSession();
    if (!apiAdminAuthenticated()) apiRespond(401, ['error' => 'Session administrateur requise.']);
}

function apiAdminAuthenticated(): bool {
    apiStartSession();
    $authenticatedAt = (int) ($_SESSION['authenticated_at'] ?? 0);
    if (($_SESSION['is_admin'] ?? false) !== true || $authenticatedAt < time() - 28_800) {
        unset($_SESSION['is_admin'], $_SESSION['csrf_token'], $_SESSION['authenticated_at']);
        return false;
    }
    return true;
}

function apiRequireCsrf(): void {
    apiStartSession();
    $provided = (string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    $expected = (string) ($_SESSION['csrf_token'] ?? '');
    if ($provided === '' || $expected === '' || !hash_equals($expected, $provided)) {
        apiRespond(403, ['error' => 'Jeton de sécurité invalide.']);
    }
}

function apiJsonInput(int $maxBytes = 2_000_000): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || strlen($raw) > $maxBytes) apiRespond(400, ['error' => 'Requête invalide ou trop volumineuse.']);
    $input = json_decode($raw ?: '{}', true);
    if (!is_array($input)) apiRespond(400, ['error' => 'JSON invalide.']);
    return $input;
}

function apiClean(mixed $value, int $maxLength): string {
    $text = trim(is_string($value) ? $value : '');
    return function_exists('mb_substr') ? mb_substr($text, 0, $maxLength) : substr($text, 0, $maxLength);
}

function apiBackupFile(string $source, string $label): void {
    if (!is_file($source)) return;
    $directory = __DIR__ . '/data/backups';
    if (!is_dir($directory) && !mkdir($directory, 0775, true) && !is_dir($directory)) return;
    $safeLabel = preg_replace('/[^a-z0-9-]/', '', strtolower($label)) ?: 'data';
    @copy($source, $directory . '/' . $safeLabel . '-' . gmdate('Ymd-His') . '-' . bin2hex(random_bytes(2)) . '.json');
    $backups = glob($directory . '/' . $safeLabel . '-*.json') ?: [];
    rsort($backups, SORT_STRING);
    foreach (array_slice($backups, 20) as $oldBackup) @unlink($oldBackup);
}

function apiRespond(int $status, array $payload): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}
