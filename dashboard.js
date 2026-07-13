/* ============================================================
   Ipon.ph — Dashboard JavaScript
   ============================================================ */

const API = './api';

// ── Auth guard ──────────────────────────────────────────────
const token = localStorage.getItem('ipon_token');
const user  = JSON.parse(localStorage.getItem('ipon_user') || 'null');
if (!token || !user) { window.location.replace('login.html'); }

// Set header
document.getElementById('headerAvatar').textContent = user.name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
document.getElementById('headerName').textContent   = user.name;

// Fade page in
requestAnimationFrame(() => document.body.classList.add('ready'));

// Theme Handling
function initTheme() {
  const saved = localStorage.getItem('ipon_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === 'light') {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  } else {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  }
  updateThemeToggle();
}

function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  document.documentElement.classList.remove('dark', 'light');
  document.documentElement.classList.add(isDark ? 'light' : 'dark');
  localStorage.setItem('ipon_theme', isDark ? 'light' : 'dark');
  updateThemeToggle();
}

function updateThemeToggle() {
  const isDark = document.documentElement.classList.contains('dark');
  const btn = document.getElementById('themeToggleBtn');
  if (btn) btn.textContent = isDark ? '◐' : '☀';
}

initTheme();

// ── Dropdown ────────────────────────────────────────────────
function toggleDropdown() {
  document.getElementById('userDropdown').classList.toggle('open');
}

function closeDropdown() {
  document.getElementById('userDropdown').classList.remove('open');
}

document.addEventListener('click', e => {
  const dropdown = document.getElementById('userDropdown');
  if (dropdown && !dropdown.contains(e.target)) closeDropdown();
});

// ── Bank data ───────────────────────────────────────────────
const BANK_COLORS = {
  // Universal & Commercial
  Amanah:'#006837', AUB:'#003b7a', ANZ:'#004165', BangkokBank:'#003399', BOA:'#012169',
  BankOfChina:'#b21e27', BankCom:'#00468c', BPI:'#d42027', BDO:'#1e6db5', BDOPrivate:'#1e6db5',
  Cathay:'#007a33', ChangHwa:'#005aab', ChinaBank:'#cc0000', CIMB:'#e30613', Citibank:'#003ea4',
  CTBC:'#0081c6', Deutsche:'#0018a8', DBP:'#0072bc', EastWest:'#f26522', FirstComm:'#005a9c',
  HuaNan:'#e60012', ICBC:'#c7000b', IBK:'#004da0', ING:'#ff6200', JPMorgan:'#2c2e2f',
  Hana:'#008485', LandBank:'#2d7d46', Maybank:'#ffc72c', MegaBank:'#8c001a', Metrobank:'#003087',
  Mizuho:'#000066', MUFG:'#be0019', PBCOM:'#ef3123', PNB:'#003a8c', Philtrust:'#004d99',
  VeteransBank:'#b22222', RCBC:'#00539b', SecurityBank:'#e31837', Shinhan:'#00438b', StanChart:'#0072aa',
  SMBC:'#00633b', HSBC:'#db0011', UnionBank:'#e8732a', UOB:'#003b7a',
  // Digital
  GoTyme:'#00d2ff', MariBank:'#6c3ec1', Maya:'#50b16b', OFBank:'#0066cc', Tonik:'#7b61ff',
  UnionDigital:'#e8732a', UNO:'#5c2d91',
  // Thrift
  AllBank:'#00458b', BankOfMakati:'#d1121d', BanKo:'#d42027', CBS:'#cc0000', CitySavings:'#006da6',
  Citystate:'#fba31c', Equicom:'#005596', FCB:'#005aa9', Malayan:'#003666', PBB:'#003a8c',
  PSBank:'#0066b3', Producers:'#013162', Sterling:'#f26522', WealthBank:'#004c97',
  // E-Wallets & Remittance
  GCash:'#007dff', GrabPay:'#00b14f', ShopeePay:'#ee4d2d', Coins:'#1d2127',
  Palawan:'#e8232a', Cebuana:'#ffc220', Wise:'#00b1ff'
};
const BANK_DOMAINS = {
  // Universal & Commercial
  Amanah:'al-amanahbank.com.ph', AUB:'aub.com.ph', ANZ:'anz.com', BangkokBank:'bangkokbank.com', BOA:'bankofamerica.com',
  BankOfChina:'bankofchina.com.ph', BankCom:'bankcom.com.ph', BPI:'bpi.com.ph', BDO:'bdo.com.ph', BDOPrivate:'bdoprivatebank.com.ph',
  Cathay:'cathaybk.com.ph', ChangHwa:'chb.com.tw', ChinaBank:'chinabank.ph', CIMB:'cimbbank.com.ph', Citibank:'citi.com',
  CTBC:'ctbcbank.com.ph', Deutsche:'db.com', DBP:'dbp.ph', EastWest:'eastwestbanker.com', FirstComm:'firstbank.com.tw',
  HuaNan:'hncb.com.tw', ICBC:'icbc.com.ph', IBK:'ibk.co.kr', ING:'ing.com.ph', JPMorgan:'jpmorgan.com',
  Hana:'kebhana.com', LandBank:'landbank.com', Maybank:'maybank.com.ph', MegaBank:'megabank.com.tw', Metrobank:'metrobank.com.ph',
  Mizuho:'mizuhobank.com', MUFG:'mufg.jp', PBCOM:'pbcom.com.ph', PNB:'pnb.com.ph', Philtrust:'philtrustbank.com',
  VeteransBank:'veteransbank.com.ph', RCBC:'rcbc.com', SecurityBank:'securitybank.com', Shinhan:'shinhan.com.ph', StanChart:'sc.com',
  SMBC:'smbc.co.jp', HSBC:'hsbc.com.ph', UnionBank:'unionbankph.com', UOB:'uob.com.ph',
  // Digital
  GoTyme:'gotyme.com.ph', MariBank:'maribank.ph', Maya:'maya.ph', OFBank:'ofbank.com.ph', Tonik:'tonikbank.com',
  UnionDigital:'uniondigitalbank.io', UNO:'uno.bank',
  // Thrift
  AllBank:'allbank.com.ph', BankOfMakati:'bankofmakati.com.ph', BanKo:'banko.com.ph', CBS:'cbs.com.ph', CitySavings:'citysavings.com.ph',
  Citystate:'citystatesavings.com', Equicom:'equicomsavings.com.ph', FCB:'fcbph.com', Malayan:'malayanbank.com', PBB:'pbb.com.ph',
  PSBank:'psbank.com.ph', Producers:'producersbank.com.ph', Sterling:'sterlingbankasia.com', WealthBank:'wealthbank.com.ph',
  // E-Wallets & Remittance
  GCash:'gcash.com', GrabPay:'grab.com', ShopeePay:'shopee.ph', Coins:'coins.ph',
  Palawan:'palawanpawnshop.com', Cebuana:'cebuanalhuillier.com', Wise:'wise.com'
};

const LOGOS_DIR = 'assets/logos';

const BANKS = [
  { abbr:'Amanah', name:'Al-Amanah Islamic Investment Bank', group:'Universal & Commercial Banks' },
  { abbr:'AUB', name:'Asia United Bank (AUB)', group:'Universal & Commercial Banks' },
  { abbr:'ANZ', name:'ANZ Banking Group', group:'Universal & Commercial Banks' },
  { abbr:'BangkokBank', name:'Bangkok Bank', group:'Universal & Commercial Banks' },
  { abbr:'BOA', name:'Bank of America', group:'Universal & Commercial Banks' },
  { abbr:'BankOfChina', name:'Bank of China', group:'Universal & Commercial Banks' },
  { abbr:'BankCom', name:'Bank of Commerce (BankCom)', group:'Universal & Commercial Banks' },
  { abbr:'BPI', name:'Bank of the Philippine Islands (BPI)', group:'Universal & Commercial Banks' },
  { abbr:'BDO', name:'BDO Unibank', group:'Universal & Commercial Banks' },
  { abbr:'BDOPrivate', name:'BDO Private Bank', group:'Universal & Commercial Banks' },
  { abbr:'Cathay', name:'Cathay United Bank', group:'Universal & Commercial Banks' },
  { abbr:'ChangHwa', name:'Chang Hwa Commercial Bank', group:'Universal & Commercial Banks' },
  { abbr:'ChinaBank', name:'China Banking Corporation (Chinabank)', group:'Universal & Commercial Banks' },
  { abbr:'CIMB', name:'CIMB Bank Philippines', group:'Universal & Commercial Banks' },
  { abbr:'Citibank', name:'Citibank', group:'Universal & Commercial Banks' },
  { abbr:'CTBC', name:'CTBC Bank', group:'Universal & Commercial Banks' },
  { abbr:'Deutsche', name:'Deutsche Bank', group:'Universal & Commercial Banks' },
  { abbr:'DBP', name:'Development Bank of the Philippines (DBP)', group:'Universal & Commercial Banks' },
  { abbr:'EastWest', name:'EastWest Bank', group:'Universal & Commercial Banks' },
  { abbr:'FirstComm', name:'First Commercial Bank', group:'Universal & Commercial Banks' },
  { abbr:'HuaNan', name:'Hua Nan Commercial Bank', group:'Universal & Commercial Banks' },
  { abbr:'ICBC', name:'ICBC', group:'Universal & Commercial Banks' },
  { abbr:'IBK', name:'Industrial Bank of Korea', group:'Universal & Commercial Banks' },
  { abbr:'ING', name:'ING Bank', group:'Universal & Commercial Banks' },
  { abbr:'JPMorgan', name:'J.P. Morgan Chase', group:'Universal & Commercial Banks' },
  { abbr:'Hana', name:'KEB Hana Bank', group:'Universal & Commercial Banks' },
  { abbr:'LandBank', name:'Land Bank of the Philippines (Landbank)', group:'Universal & Commercial Banks' },
  { abbr:'Maybank', name:'Maybank Philippines', group:'Universal & Commercial Banks' },
  { abbr:'MegaBank', name:'Mega International Commercial Bank', group:'Universal & Commercial Banks' },
  { abbr:'Metrobank', name:'Metrobank', group:'Universal & Commercial Banks' },
  { abbr:'Mizuho', name:'Mizuho Bank', group:'Universal & Commercial Banks' },
  { abbr:'MUFG', name:'MUFG Bank', group:'Universal & Commercial Banks' },
  { abbr:'PBCOM', name:'PBCOM', group:'Universal & Commercial Banks' },
  { abbr:'PNB', name:'Philippine National Bank (PNB)', group:'Universal & Commercial Banks' },
  { abbr:'Philtrust', name:'Philtrust Bank', group:'Universal & Commercial Banks' },
  { abbr:'VeteransBank', name:'Philippine Veterans Bank', group:'Universal & Commercial Banks' },
  { abbr:'RCBC', name:'RCBC', group:'Universal & Commercial Banks' },
  { abbr:'SecurityBank', name:'Security Bank', group:'Universal & Commercial Banks' },
  { abbr:'Shinhan', name:'Shinhan Bank', group:'Universal & Commercial Banks' },
  { abbr:'StanChart', name:'Standard Chartered Bank', group:'Universal & Commercial Banks' },
  { abbr:'SMBC', name:'Sumitomo Mitsui Banking Corp', group:'Universal & Commercial Banks' },
  { abbr:'HSBC', name:'HSBC', group:'Universal & Commercial Banks' },
  { abbr:'UnionBank', name:'UnionBank', group:'Universal & Commercial Banks' },
  { abbr:'UOB', name:'UOB', group:'Universal & Commercial Banks' },
  { abbr:'GoTyme', name:'GoTyme Bank', group:'Digital Banks' },
  { abbr:'MariBank', name:'MariBank (SeaBank)', group:'Digital Banks' },
  { abbr:'Maya', name:'Maya Bank', group:'Digital Banks' },
  { abbr:'OFBank', name:'Overseas Filipino Bank', group:'Digital Banks' },
  { abbr:'Tonik', name:'Tonik Digital Bank', group:'Digital Banks' },
  { abbr:'UnionDigital', name:'UnionDigital Bank', group:'Digital Banks' },
  { abbr:'UNO', name:'UNO Digital Bank', group:'Digital Banks' },
  { abbr:'AllBank', name:'AllBank (A Thrift Bank)', group:'Major Thrift Banks' },
  { abbr:'BankOfMakati', name:'Bank of Makati', group:'Major Thrift Banks' },
  { abbr:'BanKo', name:'BPI Direct BanKo', group:'Major Thrift Banks' },
  { abbr:'CBS', name:'China Bank Savings', group:'Major Thrift Banks' },
  { abbr:'CitySavings', name:'City Savings Bank', group:'Major Thrift Banks' },
  { abbr:'Citystate', name:'Citystate Savings Bank', group:'Major Thrift Banks' },
  { abbr:'Equicom', name:'Equicom Savings Bank', group:'Major Thrift Banks' },
  { abbr:'FCB', name:'First Consolidated Bank', group:'Major Thrift Banks' },
  { abbr:'Malayan', name:'Malayan Savings Bank', group:'Major Thrift Banks' },
  { abbr:'PBB', name:'Philippine Business Bank', group:'Major Thrift Banks' },
  { abbr:'PSBank', name:'Philippine Savings Bank', group:'Major Thrift Banks' },
  { abbr:'Producers', name:'Producers Savings Bank', group:'Major Thrift Banks' },
  { abbr:'Sterling', name:'Sterling Bank of Asia', group:'Major Thrift Banks' },
  { abbr:'WealthBank', name:'Wealth Development Bank', group:'Major Thrift Banks' },
  { abbr:'GCash', name:'GCash', group:'E-Wallets & Remittance' },
  { abbr:'MayaWallet', name:'Maya (E-Wallet)', group:'E-Wallets & Remittance' },
  { abbr:'GrabPay', name:'GrabPay', group:'E-Wallets & Remittance' },
  { abbr:'ShopeePay', name:'ShopeePay', group:'E-Wallets & Remittance' },
  { abbr:'Coins', name:'Coins.ph', group:'E-Wallets & Remittance' },
  { abbr:'Palawan', name:'PalawanPay / Express', group:'E-Wallets & Remittance' },
  { abbr:'Cebuana', name:'Cebuana Lhuillier', group:'E-Wallets & Remittance' },
  { abbr:'Wise', name:'Wise', group:'E-Wallets & Remittance' },
];

function getBankIconHtml(abbr, color) {
  const initials = abbr.slice(0, 3);
  return `<img src="${LOGOS_DIR}/${abbr}.png" alt="${abbr}" 
           style="width:28px;height:28px;object-fit:contain;border-radius:4px;" 
           onerror="this.src='${LOGOS_DIR}/${abbr}_favicon.png';this.onerror=function(){this.style.display='none';this.nextElementSibling.style.display='flex'}">
         <span style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-family:'Geist Mono',monospace;font-size:11px;font-weight:600;color:${color}">${initials}</span>`;
}

function getBankLogoHtml(abbr, size) {
  const s = size || 24;
  const initials = abbr.slice(0, 3);
  return `<img src="${LOGOS_DIR}/${abbr}.png" alt="${abbr}" 
           style="width:${s}px;height:${s}px;object-fit:contain;border-radius:4px;flex-shrink:0;" 
           onerror="this.src='${LOGOS_DIR}/${abbr}_favicon.png';this.onerror=function(){this.style.display='none';this.nextElementSibling.style.display='flex'}">
         <span style="display:none;width:${s}px;height:${s}px;align-items:center;justify-content:center;font-family:'Geist Mono',monospace;font-size:10px;font-weight:600;color:var(--ink-tertiary);background:var(--bg);border-radius:4px;flex-shrink:0;">${initials}</span>`;
}

// ── Bank Dropdown ──────────────────────────────────────────
let selectedBankValue = '';

function initBankDropdown() {
  const trigger = document.getElementById('bankDropdownTrigger');
  const panel = document.getElementById('bankDropdownPanel');
  const list = document.getElementById('bankList');
  const search = document.getElementById('bankSearch');
  const hidden = document.getElementById('bankSelect');

  function renderBanks(filter) {
    const q = (filter || '').toLowerCase();
    const groups = {};
    BANKS.forEach(b => {
      if (q && !b.name.toLowerCase().includes(q) && !b.abbr.toLowerCase().includes(q)) return;
      if (!groups[b.group]) groups[b.group] = [];
      groups[b.group].push(b);
    });
    let html = '';
    for (const [group, banks] of Object.entries(groups)) {
      html += `<div class="bank-dropdown-group">${group}</div>`;
      banks.forEach(b => {
        const sel = selectedBankValue === `${b.abbr}|${b.name}` ? ' selected' : '';
        html += `<div class="bank-dropdown-item${sel}" data-value="${b.abbr}|${b.name}">
          ${getBankLogoHtml(b.abbr, 24)}
          <span class="bank-dropdown-item-name">${b.name}</span>
        </div>`;
      });
    }
    if (!html) html = '<div class="bank-dropdown-empty">no results</div>';
    list.innerHTML = html;
  }

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = panel.classList.contains('open');
    if (isOpen) {
      closeBankDropdown();
    } else {
      panel.classList.add('open');
      search.value = '';
      renderBanks('');
      search.focus();
    }
  });

  search.addEventListener('input', () => renderBanks(search.value));

  list.addEventListener('click', e => {
    const item = e.target.closest('.bank-dropdown-item');
    if (!item) return;
    selectBank(item.dataset.value);
  });

  document.addEventListener('click', e => {
    if (!panel.contains(e.target) && !trigger.contains(e.target)) {
      closeBankDropdown();
    }
  });

  search.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeBankDropdown();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const first = list.querySelector('.bank-dropdown-item');
      if (first) first.focus();
    }
  });

  list.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeBankDropdown(); trigger.focus(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); e.target.nextElementSibling?.focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); e.target.previousElementSibling?.focus(); }
    if (e.key === 'Enter') { e.preventDefault(); selectBank(e.target.dataset.value); }
  });

  function selectBank(value) {
    selectedBankValue = value;
    hidden.value = value;
    const [abbr, name] = value.split('|');
    trigger.innerHTML = `<span class="bank-dropdown-selected">${getBankLogoHtml(abbr, 20)}<span class="bank-dropdown-selected-name">${name}</span></span>`;
    closeBankDropdown();
  }

  function closeBankDropdown() {
    panel.classList.remove('open');
    search.value = '';
  }

  window._closeBankDropdown = closeBankDropdown;
}

function setBankDropdownValue(value) {
  selectedBankValue = value || '';
  const hidden = document.getElementById('bankSelect');
  const trigger = document.getElementById('bankDropdownTrigger');
  if (hidden) hidden.value = value || '';
  if (!value) {
    trigger.innerHTML = '<span class="bank-dropdown-placeholder">Select Bank / E-wallet...</span>';
  } else {
    const [abbr, name] = value.split('|');
    trigger.innerHTML = `<span class="bank-dropdown-selected">${getBankLogoHtml(abbr, 20)}<span class="bank-dropdown-selected-name">${name}</span></span>`;
  }
}

// ── API helpers ─────────────────────────────────────────────
const authFetch = (url, opts = {}) =>
  fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) } });

// ── OTP Helpers ─────────────────────────────────────────────
function getOtpValue(groupId) {
  const inputs = document.getElementById(groupId).querySelectorAll('.otp-input');
  return Array.from(inputs).map(inp => inp.value).join('');
}

function clearOtpGroup(groupId) {
  const inputs = document.getElementById(groupId).querySelectorAll('.otp-input');
  inputs.forEach(inp => { inp.value = ''; inp.classList.remove('filled', 'error'); });
}

function initOtpGroup(groupId) {
  const group = document.getElementById(groupId);
  if (!group) return;
  const inputs = group.querySelectorAll('.otp-input');

  inputs.forEach((input, i) => {
    input.addEventListener('input', e => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
      if (e.target.value) {
        e.target.classList.add('filled');
        if (i < inputs.length - 1) inputs[i + 1].focus();
      } else {
        e.target.classList.remove('filled');
      }
      checkOtpMatch();
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !e.target.value && i > 0) {
        inputs[i - 1].focus();
        inputs[i - 1].value = '';
        inputs[i - 1].classList.remove('filled');
      }
    });
    
    input.addEventListener('paste', e => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '').slice(0, 4);
      pasted.split('').forEach((digit, j) => {
        if (inputs[j]) {
          inputs[j].value = digit;
          inputs[j].classList.add('filled');
        }
      });
      inputs[Math.min(pasted.length, 3)].focus();
    });
    
    input.addEventListener('focus', () => input.select());
  });
}

function checkOtpMatch() {
  const hint = document.getElementById('otpMatchHint');
  if (!hint) return;
  const newPw = getOtpValue('newOtp');
  const confirm = getOtpValue('confirmOtp');
  if (confirm.length === 4 && newPw.length === 4) {
    if (newPw === confirm) {
      hint.textContent = 'Passcodes match';
      hint.className = 'otp-hint match';
    } else {
      hint.textContent = 'Passcodes do not match';
      hint.className = 'otp-hint mismatch';
    }
  } else {
    hint.textContent = '';
    hint.className = 'otp-hint';
  }
}

// ── Logout ──────────────────────────────────────────────────
async function doLogout() {
  await authFetch(`${API}/auth.php?action=logout`, { method: 'POST' }).catch(() => {});
  localStorage.removeItem('ipon_token');
  localStorage.removeItem('ipon_user');
  document.body.classList.add('exit');
  setTimeout(() => { window.location.href = 'login.html'; }, 300);
}

// ── Render ──────────────────────────────────────────────────
let accounts = [];
let editId   = null;
let isLoading = true;

const fmt = n => '\u20B1' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function renderSkeletons() {
  const grid = document.getElementById('banksGrid');
  const skeletonCard = `
    <div class="skeleton-card">
      <div class="skeleton-card-top">
        <div class="skeleton skeleton-icon"></div>
        <div class="skeleton-lines">
          <div class="skeleton skeleton-line w60"></div>
          <div class="skeleton skeleton-line w40"></div>
        </div>
      </div>
      <div class="skeleton skeleton-label"></div>
      <div class="skeleton skeleton-amount"></div>
      <div class="skeleton skeleton-bar"></div>
    </div>`;
  grid.innerHTML = skeletonCard.repeat(3);
}

function renderAll() {
  const grid    = document.getElementById('banksGrid');
  const total   = accounts.reduce((s, a) => s + a.balance, 0);
  const active  = accounts.filter(a => a.balance > 0);
  const topBank = accounts.reduce((b, a) => (!b || a.balance > b.balance) ? a : b, null);
  const avg     = accounts.length ? total / accounts.length : 0;
  const highest = accounts.reduce((mx, a) => Math.max(mx, a.balance), 0);
  const withGoal = accounts.filter(a => a.goal != null);
  const metGoal  = withGoal.filter(a => a.balance >= a.goal);

  document.getElementById('totalAmount').textContent  = fmt(total);
  document.getElementById('bankCount').textContent    = accounts.length;
  document.getElementById('activeCount').textContent  = active.length;
  document.getElementById('topBank').textContent      = topBank ? topBank.bank_abbr : '\u2014';
  document.getElementById('highestAmt').textContent   = fmt(highest);
  document.getElementById('summaryCount').textContent = accounts.length;
  document.getElementById('avgBalance').textContent   = fmt(avg);
  document.getElementById('goalsMet').textContent     = withGoal.length ? `${metGoal.length} / ${withGoal.length}` : '\u2014';

  if (!accounts.length) {
    grid.innerHTML = `<div class="empty-card"><div class="empty-icon">🏦</div><p>No accounts yet. Add your first bank account!</p></div>`;
    return;
  }

  grid.innerHTML = accounts.map((acc, i) => {
    const bal      = acc.balance;
    const pct      = total > 0 ? (bal / total * 100) : 0;
    const color    = BANK_COLORS[acc.bank_abbr] || '#e8b84b';
    const iconHtml = getBankIconHtml(acc.bank_abbr, color);

    let goalHtml = '';
    if (acc.goal != null) {
      const goalPct = Math.min(bal / acc.goal * 100, 100);
      const met     = bal >= acc.goal;
      const barColor = met ? 'var(--green)' : `linear-gradient(90deg,${color},${color}88)`;
      goalHtml = `
        <div class="goal-section">
          <div class="goal-header">
            <span class="goal-label-text">🎯 Savings Goal</span>
            <span class="goal-badge ${met ? 'met' : 'prog'}">${met ? '✓ Reached!' : goalPct.toFixed(0) + '%'}</span>
          </div>
          <div class="goal-bar-bg"><div class="goal-bar" style="width:${goalPct}%;background:${barColor}"></div></div>
          <div class="goal-amounts">
            <span>${fmt(bal)}</span>
            <span>Target: <strong>${fmt(acc.goal)}</strong></span>
          </div>
        </div>`;
    }

    return `
    <div class="bank-card border-glow-card ${bal > 0 ? 'has-balance' : ''}" style="animation-delay:${i * 0.05}s">
      <div class="balance-indicator"></div>
      <div class="bank-card-top">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="bank-icon" style="background:${color}22">${iconHtml}</div>
          <div>
            <div class="bank-name">${acc.label || acc.bank_name}</div>
            <div class="bank-abbr">${acc.bank_abbr}${acc.label ? ' · ' + acc.bank_name : ''}</div>
          </div>
        </div>
        <div class="bank-actions">
          <button class="btn-icon" onclick="editAccount(${acc.id})" title="Edit">✎</button>
          <button class="btn-icon delete" onclick="deleteAccount(${acc.id})" title="Delete">✕</button>
        </div>
      </div>
      <div class="bank-balance-label">Current Balance</div>
      <div class="bank-balance ${bal > 0 ? 'has-value' : 'zero'}">${fmt(bal)}</div>
      ${goalHtml}
    </div>`;
  }).join('');
}

// ── Utilities ─────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)     return 'just now';
  if (diff < 3600)   return Math.floor(diff/60) + 'm ago';
  if (diff < 86400)  return Math.floor(diff/3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff/86400) + 'd ago';
  return new Date(dateStr).toLocaleDateString('en-PH', {month:'short',day:'numeric',year:'numeric'});
}

// ── XLSX Export ──────────────────────────────────────────────
function exportXLSX() {
  authFetch(`${API}/accounts.php`)
    .then(r => r.json())
    .then(data => {
      const list = data.accounts || [];
      if (!list.length) { showToast('No accounts to export.'); return; }
      const exportData = list.map(a => ({
        'Bank': a.bank_abbr,
        'Full Name': a.bank_name,
        'Label': a.label || '',
        'Balance (PHP)': parseFloat(a.balance),
        'Goal (PHP)': a.goal !== null ? parseFloat(a.goal) : '',
        'Last Updated': a.updated_at || new Date().toISOString()
      }));
      try {
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Savings');
        const filename = `ipon-savings-${new Date().toISOString().slice(0,10)}.xlsx`;
        XLSX.writeFile(wb, filename);
      } catch (e) {
        showToast('Export failed.');
      }
    })
    .catch(() => showToast('Export failed.'));
}

// ── Profile / Settings Modal ────────────────────────────────
function openProfileModal() {
  document.getElementById('profileName').value  = user.name;
  document.getElementById('profileError').classList.remove('show');
  document.getElementById('profileSuccess').style.display = 'none';
  document.getElementById('pwError').classList.remove('show');
  document.getElementById('pwSuccess').style.display = 'none';
  clearOtpGroup('currentOtp');
  clearOtpGroup('newOtp');
  clearOtpGroup('confirmOtp');
  const hint = document.getElementById('otpMatchHint');
  if (hint) { hint.textContent = ''; hint.className = 'otp-hint'; }
  document.getElementById('profileModal').classList.remove('hidden');
  document.body.classList.add('modal-open');
}
function closeProfileModal() { 
  document.getElementById('profileModal').classList.add('hidden');
  document.body.classList.remove('modal-open');
}

async function saveProfile() {
  const name = document.getElementById('profileName').value.trim();
  if (!name) { showProfileErr('Name is required.'); return; }
  const btn = document.getElementById('saveProfileBtn');
  btn.disabled = true;
  try {
    const res  = await authFetch(`${API}/user.php`, { method:'PUT', body: JSON.stringify({ name }) });
    const data = await res.json();
    if (!res.ok) { showProfileErr(data.error || 'Update failed.'); return; }
    user.name = name;
    localStorage.setItem('ipon_user', JSON.stringify(user));
    document.getElementById('headerAvatar').textContent = name.trim().split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase() || '?';
    document.getElementById('headerName').textContent   = name;
    const s = document.getElementById('profileSuccess');
    s.textContent = 'Profile updated!'; s.style.display = 'block';
    document.getElementById('profileError').classList.remove('show');
  } catch { showProfileErr('Network error.'); }
  finally   { btn.disabled = false; }
}

async function changePassword() {
  const current = getOtpValue('currentOtp');
  const newPw   = getOtpValue('newOtp');
  const confirm = getOtpValue('confirmOtp');
  if (current.length !== 4 || newPw.length !== 4 || confirm.length !== 4) { showPwErr('Please fill in all passcode fields.'); return; }
  if (!/^\d{4}$/.test(newPw)) { showPwErr('New passcode must be exactly 4 digits.'); return; }
  if (newPw !== confirm) { showPwErr('New passcodes do not match.'); return; }
  const btn = document.getElementById('changePwBtn');
  btn.disabled = true;
  try {
    const res  = await authFetch(`${API}/auth.php?action=change-password`, {
      method: 'POST', body: JSON.stringify({ current_passcode: current, new_passcode: newPw })
    });
    const data = await res.json();
    if (!res.ok) { showPwErr(data.error || 'Failed to change passcode.'); return; }
    const s = document.getElementById('pwSuccess');
    s.textContent = 'Passcode changed!'; s.style.display = 'block';
    document.getElementById('pwError').classList.remove('show');
    clearOtpGroup('currentOtp');
    clearOtpGroup('newOtp');
    clearOtpGroup('confirmOtp');
    const hint = document.getElementById('otpMatchHint');
    if (hint) { hint.textContent = ''; hint.className = 'otp-hint'; }
  } catch { showPwErr('Network error.'); }
  finally   { btn.disabled = false; }
}

function showProfileErr(msg) {
  const el = document.getElementById('profileError');
  el.textContent = msg; el.classList.add('show');
  document.getElementById('profileSuccess').style.display = 'none';
}
function showPwErr(msg) {
  const el = document.getElementById('pwError');
  el.textContent = msg; el.classList.add('show');
  document.getElementById('pwSuccess').style.display = 'none';
}

async function loadAccounts() {
  isLoading = true;
  renderSkeletons();
  try {
    const res  = await authFetch(`${API}/accounts.php`);
    const data = await res.json();
    if (!res.ok) { showToast('Failed to load accounts.'); return; }
    accounts = data.accounts;
  } catch (e) {
    showToast('Network error loading accounts.');
  } finally {
    isLoading = false;
    renderAll();
  }
}

// ── Modal ───────────────────────────────────────────────────
function openModal(isEdit = false) {
  if (!isEdit) {
    editId = null;
    document.getElementById('modalTitle').textContent = 'Add Account';
    setBankDropdownValue('');
    document.getElementById('accountLabel').value     = '';
    document.getElementById('balanceInput').value     = '';
    document.getElementById('goalInput').value        = '';
  }
  document.getElementById('modalOverlay').classList.remove('hidden');
  document.body.classList.add('modal-open');
}
function closeModal() { 
  document.getElementById('modalOverlay').classList.add('hidden');
  document.body.classList.remove('modal-open');
  if (window._closeBankDropdown) window._closeBankDropdown();
}
function clearGoal() { document.getElementById('goalInput').value = ''; }

function editAccount(id) {
  const acc = accounts.find(a => a.id === id);
  if (!acc) return;
  editId = id;
  document.getElementById('modalTitle').textContent   = 'Edit Account';
  setBankDropdownValue(`${acc.bank_abbr}|${acc.bank_name}`);
  document.getElementById('accountLabel').value       = acc.label || '';
  document.getElementById('balanceInput').value       = acc.balance;
  document.getElementById('goalInput').value          = acc.goal != null ? acc.goal : '';
  openModal(true);
}

async function deleteAccount(id) {
  const acc = accounts.find(a => a.id === id);
  const accountName = acc ? (acc.label || acc.bank_name) : 'this account';

  const result = await Swal.fire({
    title: 'Remove Account?',
    html: `Are you sure you want to remove <strong>${accountName}</strong>? This action cannot be undone.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, Remove',
    cancelButtonText: 'Cancel',
    reverseButtons: true,
    background: 'var(--gray-50)',
    color: 'var(--ink)',
    iconColor: 'var(--gray-500)',
    customClass: {
      popup:         'swal-ipon-popup',
      title:         'swal-ipon-title',
      htmlContainer: 'swal-ipon-html',
      confirmButton: 'swal-ipon-confirm',
      cancelButton:  'swal-ipon-cancel',
    },
    buttonsStyling: false,
  });

  if (!result.isConfirmed) return;

  try {
    const res = await authFetch(`${API}/accounts.php?id=${id}`, { method: 'DELETE' });
    if (!res.ok) { showToast('Failed to delete.'); return; }
    accounts = accounts.filter(a => a.id !== id);
    renderAll();
    showToast('Account removed');
  } catch (e) {
    showToast('Network error.');
  }
}

async function saveAccount() {
  const sel     = document.getElementById('bankSelect').value;
  const label   = document.getElementById('accountLabel').value.trim();
  const balance = parseFloat(document.getElementById('balanceInput').value) || 0;
  const goalRaw = document.getElementById('goalInput').value.trim();
  const goal    = goalRaw !== '' ? parseFloat(goalRaw) : null;
  if (!sel) { alert('Please select a bank.'); return; }
  if (goal !== null && goal <= 0) { alert('Goal must be a positive amount.'); return; }

  const [bank_abbr, bank_name] = sel.split('|');
  const payload = { bank_abbr, bank_name, label, balance, goal };

  const btn = document.getElementById('saveBtn');
  btn.disabled = true;

  try {
    let res, data;
    if (editId !== null) {
      res  = await authFetch(`${API}/accounts.php?id=${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
      data = await res.json();
      if (!res.ok) { showToast(data.error || 'Update failed.'); return; }
      const idx = accounts.findIndex(a => a.id === editId);
      if (idx !== -1) accounts[idx] = { ...accounts[idx], ...payload };
      showToast('Account updated ✓');
    } else {
      res  = await authFetch(`${API}/accounts.php`, { method: 'POST', body: JSON.stringify(payload) });
      data = await res.json();
      if (!res.ok) { showToast(data.error || 'Save failed.'); return; }
      accounts.push(data.account);
      showToast('Account added ✓');
    }
    closeModal();
    renderAll();
  } catch (e) {
    showToast('Network error.');
  } finally {
    btn.disabled = false;
  }
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2600);
}

document.getElementById('modalOverlay').addEventListener('click', function(e) { if (e.target === this) closeModal(); });
document.getElementById('profileModal').addEventListener('click', function(e) { if (e.target === this) closeProfileModal(); });

initOtpGroup('currentOtp');
initOtpGroup('newOtp');
initOtpGroup('confirmOtp');

initBankDropdown();

loadAccounts();
