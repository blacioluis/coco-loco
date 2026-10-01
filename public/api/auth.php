<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
apiStartSession();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'GET') {
    $authenticated = apiAdminAuthenticated();
    apiRespond(200, [
        'authenticated' => $authenticated,
        'csrfToken' => $authenticated ? ($_SESSION['csrf_token'] ?? '') : '',
    ]);
}
if ($method !== 'POST') {
    header('Allow: GET, POST');
    apiRespond(405, ['error' => 'Méthode non autorisée.']);
}

$input = apiJsonInput(4096);
$action = apiClean($input['action'] ?? 'login', 20);
if ($action === 'logout') {
    apiRequireCsrf();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'] ?? '', $params['secure'], $params['httponly']);
    }
    session_destroy();
    apiRespond(200, ['authenticated' => false]);
}

$username = apiClean($input['username'] ?? '', 80);
$password = apiClean($input['password'] ?? '', 200);
$attemptsFile = __DIR__ . '/data/.login-attempts.json';
$clientKey = hash('sha256', (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
$now = time();
$attempts = readAttempts($attemptsFile);
$recent = array_values(array_filter($attempts[$clientKey] ?? [], static fn(mixed $value): bool => is_int($value) && $value > $now - 900));
if (count($recent) >= 5) apiRespond(429, ['error' => 'Trop de tentatives. Réessayez dans 15 minutes.']);

$valid = hash_equals(ADMIN_USERNAME, $username) && password_verify($password, ADMIN_PASSWORD_HASH);
if (!$valid) {
    $recent[] = $now;
    $attempts[$clientKey] = $recent;
    writeAttempts($attemptsFile, $attempts);
    usleep(350000);
    apiRespond(401, ['error' => 'Identifiants incorrects.']);
}

unset($attempts[$clientKey]);
writeAttempts($attemptsFile, $attempts);
session_regenerate_id(true);
$_SESSION['is_admin'] = true;
$_SESSION['csrf_token'] = bin2hex(random_bytes(32));
$_SESSION['authenticated_at'] = $now;
apiRespond(200, ['authenticated' => true, 'csrfToken' => $_SESSION['csrf_token']]);

function readAttempts(string $file): array {
    if (!file_exists($file)) return [];
    $decoded = json_decode(file_get_contents($file) ?: '{}', true);
    return is_array($decoded) ? $decoded : [];
}

function writeAttempts(string $file, array $attempts): void {
    if (!is_dir(dirname($file))) mkdir(dirname($file), 0775, true);
    file_put_contents($file, json_encode($attempts, JSON_UNESCAPED_UNICODE) . "\n", LOCK_EX);
}
