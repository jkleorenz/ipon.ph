<?php
// ============================================================
//  Ipon.ph — Accounts API (auth required)
//  GET    /api/accounts.php          → list accounts
//  POST   /api/accounts.php          → create account
//  PUT    /api/accounts.php?id=N     → update account
//  DELETE /api/accounts.php?id=N     → delete account
//  GET    /api/accounts.php?export=csv → download CSV
// ============================================================

require_once __DIR__ . '/_helpers.php';

$user   = require_auth();
$method = $_SERVER['REQUEST_METHOD'];
$pdo    = db();

// CSRF check for state-changing methods
if (in_array($method, ['POST', 'PUT', 'DELETE'])) {
    require_csrf();
}

// ── EXPORT CSV ───────────────────────────────────────────────
if ($method === 'GET' && isset($_GET['export']) && $_GET['export'] === 'csv') {
    $stmt = $pdo->prepare(
        'SELECT bank_abbr, bank_name, label, balance, goal, updated_at
           FROM accounts
          WHERE user_id = ?
          ORDER BY created_at ASC'
    );
    $stmt->execute([$user['id']]);
    $rows = $stmt->fetchAll();

    $filename = 'ipon-savings-' . date('Y-m-d') . '.csv';
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: no-cache');

    $out = fopen('php://output', 'w');
    fprintf($out, chr(0xEF) . chr(0xBB) . chr(0xBF)); // UTF-8 BOM for Excel
    fputcsv($out, ['Bank', 'Full Name', 'Label', 'Balance (PHP)', 'Goal (PHP)', 'Last Updated']);
    foreach ($rows as $r) {
        fputcsv($out, [
            $r['bank_abbr'],
            $r['bank_name'],
            $r['label'],
            number_format((float)$r['balance'], 2, '.', ''),
            $r['goal'] !== null ? number_format((float)$r['goal'], 2, '.', '') : '',
            $r['updated_at'],
        ]);
    }
    fclose($out);
    exit;
}

// ── GET — list ───────────────────────────────────────────────
if ($method === 'GET') {
    $stmt = $pdo->prepare(
        'SELECT id, bank_abbr, bank_name, label,
                CAST(balance AS CHAR) AS balance,
                CAST(goal    AS CHAR) AS goal,
                created_at, updated_at
           FROM accounts
          WHERE user_id = ?
          ORDER BY created_at ASC'
    );
    $stmt->execute([$user['id']]);
    $rows = $stmt->fetchAll();

    foreach ($rows as &$r) {
        $r['id']      = (int) $r['id'];
        $r['balance'] = $r['balance'] + 0; // Preserve string precision
        $r['goal']    = ($r['goal'] !== null) ? $r['goal'] + 0 : null;
    }
    unset($r);

    json_ok(['accounts' => $rows]);
}

// ── POST — create ────────────────────────────────────────────
if ($method === 'POST') {
    $data      = body();
    $bank_abbr = trim($data['bank_abbr'] ?? '');
    $bank_name = trim($data['bank_name'] ?? '');
    $label     = trim($data['label']     ?? '');
    $balance   = (float) ($data['balance'] ?? 0);
    $goal      = isset($data['goal']) && $data['goal'] !== '' && $data['goal'] !== null
                 ? (float) $data['goal'] : null;

    if (!$bank_abbr || !$bank_name) json_err('bank_abbr and bank_name are required.');
    if ($balance < 0)   json_err('Balance cannot be negative.');
    if ($goal !== null && $goal <= 0) json_err('Goal must be a positive amount.');

    $pdo->prepare(
        'INSERT INTO accounts (user_id, bank_abbr, bank_name, label, balance, goal)
         VALUES (?, ?, ?, ?, ?, ?)'
    )->execute([$user['id'], $bank_abbr, $bank_name, $label, $balance, $goal]);

    $id = (int) $pdo->lastInsertId();

    // Record initial balance in history
    if ($balance > 0) {
        $pdo->prepare(
            'INSERT INTO balance_history (account_id, user_id, old_balance, new_balance)
             VALUES (?, ?, 0, ?)'
        )->execute([$id, $user['id'], $balance]);
    }

    json_ok(['account' => compact('id', 'bank_abbr', 'bank_name', 'label', 'balance', 'goal')], 201);
}

// ── PUT — update ─────────────────────────────────────────────
if ($method === 'PUT') {
    $id = (int) ($_GET['id'] ?? 0);
    if (!$id) json_err('Account id is required.');

    // Fetch current for ownership check + history
    $stmt = $pdo->prepare('SELECT id, balance FROM accounts WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $user['id']]);
    $current = $stmt->fetch();
    if (!$current) json_err('Account not found.', 404);

    $data      = body();
    $bank_abbr = trim($data['bank_abbr'] ?? '');
    $bank_name = trim($data['bank_name'] ?? '');
    $label     = trim($data['label']     ?? '');
    $balance   = (float) ($data['balance'] ?? 0);
    $goal      = isset($data['goal']) && $data['goal'] !== '' && $data['goal'] !== null
                 ? (float) $data['goal'] : null;

    if (!$bank_abbr || !$bank_name) json_err('bank_abbr and bank_name are required.');
    if ($balance < 0)   json_err('Balance cannot be negative.');
    if ($goal !== null && $goal <= 0) json_err('Goal must be a positive amount.');

    $pdo->prepare(
        'UPDATE accounts SET bank_abbr=?, bank_name=?, label=?, balance=?, goal=?
          WHERE id=? AND user_id=?'
    )->execute([$bank_abbr, $bank_name, $label, $balance, $goal, $id, $user['id']]);

    // Record balance change in history (only if balance changed)
    $old_balance = (float) $current['balance'];
    if ($old_balance !== $balance) {
        $pdo->prepare(
            'INSERT INTO balance_history (account_id, user_id, old_balance, new_balance)
             VALUES (?, ?, ?, ?)'
        )->execute([$id, $user['id'], $old_balance, $balance]);
    }

    json_ok(['message' => 'Account updated.']);
}

// ── DELETE — remove ──────────────────────────────────────────
if ($method === 'DELETE') {
    $id = (int) ($_GET['id'] ?? 0);
    if (!$id) json_err('Account id is required.');

    $stmt = $pdo->prepare('DELETE FROM accounts WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $user['id']]);
    if ($stmt->rowCount() === 0) json_err('Account not found.', 404);

    json_ok(['message' => 'Account deleted.']);
}

json_err('Method not allowed.', 405);
