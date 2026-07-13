<?php
// ============================================================
//  Ipon.ph — Auth API
//  POST ?action=signup          — create account
//  POST ?action=login           — login (returns session token)
//  POST ?action=logout          — invalidate session
//  POST ?action=change-password — change passcode (auth required)
// ============================================================

require_once __DIR__ . '/_helpers.php';

$action = $_GET['action'] ?? '';

$valid_actions = ['signup', 'login', 'logout', 'change-password', 'forgot-password', 'reset-password'];
if (!in_array($action, $valid_actions)) {
    json_err("Invalid action.", 400);
}

// CSRF protection for state-changing actions
if (in_array($action, ['signup', 'change-password', 'forgot-password', 'reset-password'])) {
    require_csrf();
}

// ── SIGNUP ───────────────────────────────────────────────────
if ($action === 'signup') {
    $data     = body();
    $name     = trim($data['name']     ?? '');
    $username = trim($data['username'] ?? '');
    $passcode = trim($data['passcode'] ?? '');

    if (!$name || !$username || !$passcode) {
        json_err('Name, username, and passcode are required.');
    }
    if (mb_strlen($name) > 120) {
        json_err('Name must be 120 characters or fewer.');
    }
    if (mb_strlen($username) < 3) {
        json_err('Username must be at least 3 characters.');
    }
    if (mb_strlen($username) > 30) {
        json_err('Username must be 30 characters or fewer.');
    }
    if (!preg_match('/^\d{4}$/', $passcode)) {
        json_err('Passcode must be exactly 4 digits.');
    }
    if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
        json_err('Username may only contain letters, numbers, and underscores.');
    }

    $pdo  = db();
    $stmt = $pdo->prepare('SELECT id FROM users WHERE username = ?');
    $stmt->execute([$username]);
    if ($stmt->fetch()) json_err('Username already taken.', 409);

    $hash = password_hash($passcode, PASSWORD_BCRYPT);
    $pdo->prepare(
        'INSERT INTO users (name, username, password) VALUES (?, ?, ?)'
    )->execute([$name, $username, $hash]);

    $user_id = (int) $pdo->lastInsertId();
    $token   = create_session($user_id);

    json_ok([
        'token' => $token,
        'user'  => ['id' => $user_id, 'name' => $name, 'username' => $username],
    ], 201);
}

// ── LOGIN ────────────────────────────────────────────────────
if ($action === 'login') {
    $data     = body();
    $username = trim($data['username'] ?? '');
    $passcode =      $data['passcode'] ?? '';

    if (!$username || !$passcode) json_err('Username and passcode are required.');

    if (is_rate_limited($username)) {
        json_err('Too many login attempts. Please wait 5 minutes and try again.', 429);
    }

    $stmt = db()->prepare(
        'SELECT id, name, username, password FROM users WHERE username = ?'
    );
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($passcode, $user['password'])) {
        json_err('Incorrect username or passcode.', 401);
    }

    $token = create_session((int) $user['id']);

    json_ok([
        'token' => $token,
        'user'  => [
            'id'       => (int) $user['id'],
            'name'     => $user['name'],
            'username' => $user['username'],
        ],
    ]);
}

// ── LOGOUT ───────────────────────────────────────────────────
if ($action === 'logout') {
    $token = bearer_token();
    if ($token) {
        db()->prepare('DELETE FROM sessions WHERE token = ?')->execute([$token]);
    }
    json_ok(['message' => 'Logged out.']);
}

// ── CHANGE PASSCODE (auth required) ─────────────────────────
if ($action === 'change-password') {
    $user = require_auth();
    $data = body();
    $current  = $data['current_passcode'] ?? '';
    $new_pass = $data['new_passcode']     ?? '';

    if (!$current || !$new_pass) json_err('Current and new passcode are required.');
    if (!preg_match('/^\d{4}$/', $new_pass)) json_err('New passcode must be exactly 4 digits.');

    $pdo  = db();
    $stmt = $pdo->prepare('SELECT password FROM users WHERE id = ?');
    $stmt->execute([$user['id']]);
    $row = $stmt->fetch();

    if (!$row || !password_verify($current, $row['password'])) {
        json_err('Current passcode is incorrect.', 401);
    }

    $pdo->prepare('UPDATE users SET password = ? WHERE id = ?')
        ->execute([password_hash($new_pass, PASSWORD_BCRYPT), $user['id']]);

    // Invalidate all sessions for this user (force re-login on other devices)
    $pdo->prepare('DELETE FROM sessions WHERE user_id = ?')->execute([$user['id']]);

    // Create a new session for the current device
    $new_token = create_session($user['id']);

    json_ok(['message' => 'Passcode changed successfully.', 'token' => $new_token]);
}

// ── FORGOT PASSCODE ────────────────────────────────────────
if ($action === 'forgot-password') {
    $data     = body();
    $username = trim($data['username'] ?? '');

    if (!$username) json_err('Username is required.');

    $pdo  = db();
    $stmt = $pdo->prepare('SELECT id, username FROM users WHERE username = ?');
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    // Always return success to prevent user enumeration
    if (!$user) {
        json_ok(['message' => 'If an account exists, a reset link has been generated.']);
    }

    // Invalidate any existing reset tokens for this user
    $pdo->prepare('UPDATE password_resets SET used = 1 WHERE user_id = ? AND used = 0')
        ->execute([$user['id']]);

    // Create new reset token
    $token      = bin2hex(random_bytes(32));
    $expires_at = date('Y-m-d H:i:s', time() + 3600); // 1 hour expiry

    $pdo->prepare(
        'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)'
    )->execute([$user['id'], $token, $expires_at]);

    // In production, send email with reset link containing the token.
    // The reset URL would be: https://yourdomain.com/public/reset.html?token=TOKEN
    json_ok([
        'message' => 'If an account exists, a reset link has been generated.',
    ]);
}

// ── RESET PASSCODE ─────────────────────────────────────────
if ($action === 'reset-password') {
    $data     = body();
    $token    = trim($data['token'] ?? '');
    $passcode = $data['passcode'] ?? '';

    if (!$token || !$passcode) json_err('Token and passcode are required.');
    if (!preg_match('/^\d{4}$/', $passcode)) json_err('Passcode must be exactly 4 digits.');

    $pdo  = db();
    $stmt = $pdo->prepare(
        'SELECT id, user_id FROM password_resets WHERE token = ? AND used = 0 AND expires_at > NOW()'
    );
    $stmt->execute([$token]);
    $reset = $stmt->fetch();

    if (!$reset) json_err('Invalid or expired reset token.', 400);

    // Update passcode
    $hash = password_hash($passcode, PASSWORD_BCRYPT);
    $pdo->prepare('UPDATE users SET password = ? WHERE id = ?')
        ->execute([$hash, $reset['user_id']]);

    // Mark token as used
    $pdo->prepare('UPDATE password_resets SET used = 1 WHERE id = ?')
        ->execute([$reset['id']]);

    // Invalidate all sessions for this user (force re-login)
    $pdo->prepare('DELETE FROM sessions WHERE user_id = ?')
        ->execute([$reset['user_id']]);

    json_ok(['message' => 'Passcode reset successfully. Please sign in with your new passcode.']);
}
