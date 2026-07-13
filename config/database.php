<?php
// ============================================================
//  Ipon.ph — Database Configuration
//  For production: set env vars or create a .env file (see .env.example)
//  For local dev: edit the fallback values below to match your setup
// ============================================================

// Load .env file if present (simple parser, no composer needed)
$_env_file = __DIR__ . '/../.env';
if (file_exists($_env_file)) {
    foreach (file($_env_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        if (strpos($line, '=') === false) continue;
        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value, " \t\n\r\0\x0B\"'");
        if (!getenv($key)) putenv("$key=$value");
    }
}

define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'iponph_db');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_CHARSET', 'utf8mb4');

// Session lifetime: 7 days
define('SESSION_TTL', 60 * 60 * 24 * 7);

// Rate limiting: max failed login attempts per window
define('RATE_LIMIT_ATTEMPTS', 5);
define('RATE_LIMIT_WINDOW', 300); // 5 minutes in seconds

// App URL — used for CORS (no trailing slash)
define('APP_URL', getenv('APP_URL') ?: 'https://iponph.freedev.app');

// ============================================================
//  Singleton PDO connection
// ============================================================
function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            DB_HOST,
            DB_PORT,
            DB_NAME,
            DB_CHARSET
        );
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            error_log('DB connection failed: ' . $e->getMessage());
            if (!headers_sent()) {
                header('Content-Type: application/json; charset=utf-8');
            }
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed.', 'detail' => $e->getMessage()]);
            exit;
        }
    }
    return $pdo;
}
