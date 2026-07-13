const fs = require('fs');
const path = require('path');
const https = require('https');

const LOGO_DIR = path.join(__dirname, '..', 'public', 'assets', 'logos');

if (!fs.existsSync(LOGO_DIR)) {
  fs.mkdirSync(LOGO_DIR, { recursive: true });
}

// Optimized list based on user feedback and research
const BANK_DOMAINS = {
  Amanah: 'al-amanahbank.ph',
  BangkokBank: 'bangkokbank.com',
  BankCom: 'bankcom.com.ph',
  BDOPrivate: 'bdo.com.ph',
  Cathay: 'cathaybk.com.tw',
  ChangHwa: 'chb.com.tw',
  DBP: 'dbp.ph',
  FirstComm: 'firstbank.com.tw',
  HuaNan: 'hncb.com.tw',
  ICBC: 'icbc.com.ph',
  IBK: 'ibk.co.kr',
  Mizuho: 'mizuhogroup.com',
  MUFG: 'mufg.jp',
  PBCOM: 'pbcom.com.ph',
  VeteransBank: 'veteransbank.com.ph',
  Shinhan: 'shinhan.com',
  SMBC: 'smbc.co.jp',
  UNO: 'uno.bank',
  AllBank: 'allbank.com.ph',
  WealthBank: 'wealthbank.com.ph',
  Sterling: 'sterlingbankasia.com',
  Producers: 'producersbank.com.ph',
  PSBank: 'psbank.com.ph',
  Malayan: 'malayanbank.com',
  FCB: 'fcbph.com',
  Equicom: 'equicomsavings.com.ph',
  Citystate: 'citystatesavings.com',
  CitySavings: 'citysavings.com.ph',
  // Keep the rest of the list...
  ANZ: 'anz.com', AUB: 'aub.com.ph', BankOfChina: 'bankofchina.com.ph', BDO: 'bdo.com.ph',
  BPI: 'bpi.com.ph', CIMB: 'cimbbank.com.ph', Citibank: 'citi.com', CTBC: 'ctbcbank.com.ph',
  Deutsche: 'db.com', EastWest: 'eastwestbanker.com', GCash: 'gcash.com', GrabPay: 'grab.com',
  HSBC: 'hsbc.com.ph', ING: 'ing.com.ph', JPMorgan: 'jpmorgan.com', Hana: 'kebhana.com',
  LandBank: 'landbank.com', Maybank: 'maybank.com.ph', Metrobank: 'metrobank.com.ph',
  PNB: 'pnb.com.ph', Philtrust: 'philtrustbank.com', RCBC: 'rcbc.com', SecurityBank: 'securitybank.com',
  StanChart: 'sc.com', UOB: 'uob.com.ph', UnionBank: 'unionbankph.com', 
  GoTyme: 'gotyme.com.ph', MariBank: 'maribank.ph', Maya: 'maya.ph', OFBank: 'ofbank.com.ph',
  Tonik: 'tonikbank.com', UnionDigital: 'uniondigitalbank.io', CBS: 'cbs.com.ph',
  CitySavings: 'citysavings.com.ph', ShopeePay: 'shopee.ph', Coins: 'coins.ph',
  Palawan: 'palawanpawnshop.com', Cebuana: 'cebuanalhuillier.com', Wise: 'wise.com'
};

function download(url, filename) {
  return new Promise((resolve) => {
    const request = https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
      timeout: 10000
    }, (res) => {
      if (res.statusCode === 200) {
        const file = fs.createWriteStream(path.join(LOGO_DIR, filename));
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(true); });
        file.on('error', () => { fs.unlink(path.join(LOGO_DIR, filename), () => {}); resolve(false); });
      } else if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redir = res.headers.location.startsWith('http') ? res.headers.location : new URL(res.headers.location, url).href;
        download(redir, filename).then(resolve);
      } else {
        resolve(false);
      }
    });
    request.on('error', () => resolve(false));
    request.on('timeout', () => { request.destroy(); resolve(false); });
  });
}

async function run() {
  console.log('Fetching missing or problematic logos...');
  const banks = Object.entries(BANK_DOMAINS);
  let total = 0;

  for (const [abbr, domain] of banks) {
    process.stdout.write(`Processing ${abbr} (${domain})... `);
    
    // Tier 1: Clearbit
    let success = await download(`https://logo.clearbit.com/${domain}?size=128`, `${abbr}.png`);
    
    // Tier 2: Icon Horse (Very robust fallback for logos)
    if (!success) {
      success = await download(`https://icon.horse/icon/${domain}`, `${abbr}.png`);
    }

    // Tier 3: Google Favicon (Guaranteed fallback for local assets)
    // We always download the favicon as a separate _favicon.png file for the offline logic
    await download(`https://www.google.com/s2/favicons?domain=${domain}&sz=64`, `${abbr}_favicon.png`);

    console.log(success ? '✓ Logo' : '• Favicon only');
    total++;
  }
  
  console.log(`\nProcessed ${total} banks.`);
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
