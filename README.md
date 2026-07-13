# Ipon.ph — Deployment Guide

## File Structure

```
ipon.ph/
├── schema.sql          ← Run once to create the database & tables
├── index.php           ← Redirects root → public/login.html
├── config/
│   └── database.php    ← Set your DB credentials and APP_URL here
├── api/
│   ├── .htaccess       ← Passes Authorization header through Apache
│   ├── _helpers.php    ← Auth, rate limiting, response helpers
│   ├── auth.php        ← signup / login / logout / change-password / forgot-password
│   ├── accounts.php    ← CRUD + CSV export + balance history logging
│   ├── user.php        ← Profile update + balance history feed
│   └── cron.php        ← Cleanup expired sessions and login attempts
├── public/
│   ├── assets/
│   │   └── logos/      ← Locally cached bank logos (avoids CORS issues)
│   ├── login.html      ← Sign in / create account
│   ├── dashboard.html  ← Savings dashboard (main app)
│   ├── dashboard.css   ← Dashboard styles (extracted)
│   └── dashboard.js    ← Dashboard logic (extracted)
├── tools/
│   └── download_logos.js ← Script to refresh/backup bank logos locally
└── README.md
```

---

## Requirements

- PHP 7.4+ (8.x recommended)
- MySQL 5.7+ or MariaDB 10.3+
- Apache or Nginx web server

---

## Step-by-Step Deployment

### 1. Create the database

**Via MySQL CLI:**
```bash
mysql -u root -p < schema.sql
```

**Via phpMyAdmin:**
Paste the contents of `schema.sql` and run it. It creates the `iponph_db`
database and all tables automatically.

### 2. Configure `config/database.php`

Open the file and update these three values:

```php
define('DB_USER', 'your_db_user');        // ← change
define('DB_PASS', 'your_db_password');    // ← change
define('APP_URL', 'https://yourdomain.com'); // ← change (no trailing slash)
```

### 3. Upload files to your server

Upload the entire project folder to your web root, e.g.:
```
/var/www/html/ipon/
```

### 4. Protect config/ from public access

Create a root `.htaccess` (one is already included):
```apache
Options -Indexes
RewriteEngine On
RewriteRule ^$ public/login.html [L,R=302]
RewriteRule ^config/ - [F,L]
```

**Nginx:**
```nginx
location /ipon/config/ { deny all; }
location /ipon/        { index public/login.html; }
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth.php?action=signup` | — | Create account |
| POST | `/api/auth.php?action=login` | — | Login, returns token |
| POST | `/api/auth.php?action=logout` | ✓ | Invalidate session |
| POST | `/api/auth.php?action=change-password` | ✓ | Change password |
| POST | `/api/auth.php?action=forgot-password` | — | Request password reset |
| POST | `/api/auth.php?action=reset-password` | — | Reset password with token |
| GET  | `/api/accounts.php` | ✓ | List accounts |
| POST | `/api/accounts.php` | ✓ | Create account |
| PUT  | `/api/accounts.php?id=N` | ✓ | Update account |
| DELETE | `/api/accounts.php?id=N` | ✓ | Delete account |
| GET  | `/api/accounts.php?export=csv` | ✓ | Download CSV |
| GET  | `/api/user.php` | ✓ | Get profile |
| PUT  | `/api/user.php` | ✓ | Update display name |
| GET  | `/api/user.php?history=1` | ✓ | Balance change history |
| GET  | `/api/cron.php?key=SECRET` | ✓ | Cleanup expired sessions/attempts |

`✓` endpoints require `Authorization: Bearer <token>` header.

---

## Security

- Passwords hashed with bcrypt
- Session tokens are 256-bit random hex strings, expire in 7 days
- Rate limiting: 5 failed logins per 5 minutes per username or IP
- CSRF protection via Origin/Referer validation on state-changing requests
- `config/` blocked from public HTTP access
- CORS locked to `APP_URL` (rejects requests if unconfigured)
- All balance changes logged in `balance_history` for auditing
- Password reset tokens expire in 1 hour
- Automated cleanup via `/api/cron.php` (schedule via cron job)
- Cache-Control headers for static assets (images: 1 month, CSS/JS: 1 week)
- Use HTTPS in production
