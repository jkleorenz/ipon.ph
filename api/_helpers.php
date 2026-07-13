<?php
// ============================================================
//  Ipon.ph — Shared API Helpers
// ============================================================

require_once __DIR__ . '/../config/database.php';

// ── Global error handling ─────────────────────────────────
set_exception_handler(function ($e) {
    error_log('Unhandled exception: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    if (!headers_sent()) header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    echo json_encode(['error' => 'An internal server error occurred.']);
    exit;
});
set_error_handler(function ($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) return;
    throw new ErrorException($message, 0, $severity, $file, $line);
});

// ── Security headers ───────────────────────────────────────
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net cdn.sheetjs.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com cdn.jsdelivr.net; font-src fonts.gstatic.com; img-src 'self' data:; connect-src 'self'");

// ── CORS & JSON headers ───────────────────────────────────
header('Content-Type: application/json; charset=utf-8');

// CORS: validate origin against APP_URL or allow localhost in dev
$_origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$_is_localhost = $_origin && preg_match('#^https?://(127\.0\.0\.1|localhost)(:\d+)?$#', $_origin);
$_is_configured = APP_URL && $_origin === APP_URL;

if ($_is_localhost || $_is_configured) {
    header('Access-Control-Allow-Origin: ' . $_origin);
    header('Access-Control-Allow-Credentials: true');
} else {
    header('Access-Control-Allow-Origin: ' . (APP_URL ?: ''));
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Response helpers ──────────────────────────────────────
function json_ok(array $data = [], int $code = 200): void {
    http_response_code($code);
    echo json_encode($data);
    exit;
}
function json_err(string $message, int $code = 400): void {
    http_response_code($code);
    echo json_encode(['error' => $message]);
    exit;
}
function body(): array {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

// ── Client IP ─────────────────────────────────────────────
function client_ip(): string {
    foreach (['HTTP_CF_CONNECTING_IP','HTTP_X_FORWARDED_FOR','REMOTE_ADDR'] as $key) {
        if (!empty($_SERVER[$key])) {
            return trim(explode(',', $_SERVER[$key])[0]);
        }
    }
    return '0.0.0.0';
}

// ── Rate limiting ─────────────────────────────────────────
/**
 * Returns true if this username+IP is over the limit.
 * Automatically records the attempt.
 */
function is_rate_limited(string $username): bool {
    $pdo    = db();
    $ip     = client_ip();
    $window = date('Y-m-d H:i:s', time() - RATE_LIMIT_WINDOW);

    // Count recent attempts for this username OR this IP
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) FROM login_attempts
          WHERE (username = ? OR ip_address = ?)
            AND attempted_at > ?'
    );
    $stmt->execute([$username, $ip, $window]);
    $count = (int) $stmt->fetchColumn();

    // Record attempt
    $pdo->prepare(
        'INSERT INTO login_attempts (username, ip_address) VALUES (?, ?)'
    )->execute([$username, $ip]);

    return $count >= RATE_LIMIT_ATTEMPTS;
}

// ── Session / Auth ────────────────────────────────────────
function bearer_token(): ?string {
    $header = '';
    if (!empty($_SERVER['HTTP_AUTHORIZATION']))          $header = $_SERVER['HTTP_AUTHORIZATION'];
    elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) $header = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    elseif (function_exists('apache_request_headers')) {
        $h = apache_request_headers();
        $header = $h['Authorization'] ?? '';
    }
    if (preg_match('/^Bearer\s+(.+)$/i', trim($header), $m)) return $m[1];
    return null;
}

function require_auth(): array {
    $token = bearer_token();
    if (!$token) json_err('Unauthorized — missing token.', 401);

    $stmt = db()->prepare(
        'SELECT u.id, u.name, u.username
           FROM sessions s
           JOIN users u ON u.id = s.user_id
          WHERE s.token = ? AND s.expires_at > NOW()'
    );
    $stmt->execute([$token]);
    $user = $stmt->fetch();
    if (!$user) json_err('Unauthorized — invalid or expired session.', 401);

    return $user;
}

function create_session(int $user_id): string {
    $token      = bin2hex(random_bytes(32));
    $expires_at = date('Y-m-d H:i:s', time() + SESSION_TTL);
    db()->prepare(
        'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)'
    )->execute([$user_id, $token, $expires_at]);
    return $token;
}

// ── CSRF Protection ─────────────────────────────────────────
// For Bearer-token APIs, CSRF is mitigated by CORS preflight.
// This adds an additional Origin/Referer validation layer.
function require_csrf(): void {
    $origin   = $_SERVER['HTTP_ORIGIN'] ?? '';
    $referer  = $_SERVER['HTTP_REFERER'] ?? '';
    $host     = $_SERVER['HTTP_HOST'] ?? '';

    // Allow requests with no Origin (same-origin) or valid origin
    if ($origin) {
        $valid = false;
        if (preg_match('#^https?://(127\.0\.0\.1|localhost)(:\d+)?$#', $origin)) {
            $valid = true;
        } elseif (APP_URL && str_starts_with($origin, APP_URL)) {
            $valid = true;
        }
        if (!$valid) json_err('CSRF validation failed: invalid origin.', 403);
    } elseif ($referer) {
        $refererHost = parse_url($referer, PHP_URL_HOST) ?? '';
        if ($refererHost !== $host) {
            json_err('CSRF validation failed: referer mismatch.', 403);
        }
    }
}
