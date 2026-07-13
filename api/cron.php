<?php
// ============================================================
//  Ipon.ph — Cron Cleanup Endpoint
//  Schedule via cron: 0 3 * * * curl -s https://yourdomain.com/api/cron.php?key=YOUR_SECRET
//  This cleans up expired sessions and old login attempts.
// ============================================================

require_once __DIR__ . '/../config/database.php';

$cron_key = $_GET['key'] ?? '';

// Validate cron key from environment variable
$cron_secret = getenv('CRON_SECRET');
if (!$cron_secret || $cron_key !== $cron_secret) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

header('Content-Type: application/json; charset=utf-8');
$pdo = db();
$report = [];

// ── Clean expired sessions ──────────────────────────────────
$stmt = $pdo->prepare('DELETE FROM sessions WHERE expires_at < NOW()');
$stmt->execute();
$report['sessions_cleaned'] = $stmt->rowCount();

// ── Clean old login attempts (older than 24 hours) ──────────
$old = date('Y-m-d H:i:s', time() - 86400);
$stmt = $pdo->prepare('DELETE FROM login_attempts WHERE attempted_at < ?');
$stmt->execute([$old]);
$report['login_attempts_cleaned'] = $stmt->rowCount();

// ── Optimize tables (occasional) ────────────────────────────
if (rand(1, 7) === 1) { // Once a week on average
    $allowed_tables = ['sessions', 'login_attempts', 'balance_history'];
    foreach ($allowed_tables as $table) {
        $pdo->exec("OPTIMIZE TABLE `$table`");
    }
    $report['optimized'] = true;
}

echo json_encode(['status' => 'ok', 'report' => $report]);
