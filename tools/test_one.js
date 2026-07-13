const https = require('https');
const fs = require('fs');

const domain = 'al-amanahbank.com.ph';
const url = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  const file = fs.createWriteStream('test_favicon.png');
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Done!');
  });
});
