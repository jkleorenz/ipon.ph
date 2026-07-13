<?php
// ============================================================
//  Ipon.ph — User API (auth required)
//  GET /api/user.php             → get current user profile
//  PUT /api/user.php             → update name
//  GET /api/user.php?history=1  → balance change history
// ============================================================

require_once __DIR__ . '/_helpers.php';

$user   = require_auth();
$method = $_SERVER['REQUEST_METHOD'];
$pdo    = db();

// CSRF check for state-changing methods
if (in_array($method, ['POST', 'PUT', 'DELETE'])) {
    require_csrf();
}

// ── GET ───────────────────────────────────────────────────────
if ($method === 'GET') {

    if (isset($_GET['history'])) {
        $days  = min((int) ($_GET['days'] ?? 60), 365);
        $since = date('Y-m-d H:i:s', strtotime("-{$days} days"));

        $stmt = $pdo->prepare(
            'SELECT bh.id, bh.account_id, a.bank_abbr, a.bank_name, a.label,
                    CAST(bh.old_balance AS CHAR) AS old_balance,
                    CAST(bh.new_balance AS CHAR) AS new_balance,
                    bh.changed_at
               FROM balance_history bh
               JOIN accounts a ON a.id = bh.account_id
              WHERE bh.user_id = ? AND bh.changed_at >= ?
              ORDER BY bh.changed_at DESC
              LIMIT 200'
        );
        $stmt->execute([$user['id'], $since]);
        $rows = $stmt->fetchAll();

        foreach ($rows as &$r) {
            $r['id']          = (int) $r['id'];
            $r['account_id']  = (int) $r['account_id'];
            $r['old_balance'] = (float) $r['old_balance'];
            $r['new_balance'] = (float) $r['new_balance'];
            $r['change']      = round($r['new_balance'] - $r['old_balance'], 2);
        }
        unset($r);

        json_ok(['history' => $rows]);
    }

    json_ok(['user' => $user]);
}

// ── PUT — update name ─────────────────────────────────────────
if ($method === 'PUT') {
    $data = body();
    $name = trim($data['name'] ?? '');

    if (!$name) json_err('Name is required.');

    $pdo->prepare('UPDATE users SET name = ? WHERE id = ?')
        ->execute([$name, $user['id']]);

    json_ok(['message' => 'Profile updated.', 'name' => $name]);
}

json_err('Method not allowed.', 405);
