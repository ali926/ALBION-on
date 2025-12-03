const https = require('https');

const itemId = 'T4_LEATHER';
const city = 'Fort Sterling'; // Has a space!

// 1. Without encoding (Simulating the bug)
const urlBad = `https://europe.albion-online-data.com/api/v2/stats/history/${itemId}?locations=${city}&time-scale=24`;

// 2. With encoding (The fix)
const urlGood = `https://europe.albion-online-data.com/api/v2/stats/history/${itemId}?locations=${encodeURIComponent(city)}&time-scale=24`;

function testUrl(url, label) {
    console.log(`Testing ${label}: ${url}`);
    https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            if (res.statusCode === 200) {
                try {
                    const json = JSON.parse(data);
                    console.log(`[${label}] Success! Found ${json.length} records.`);
                } catch (e) {
                    console.log(`[${label}] Failed to parse JSON.`);
                }
            } else {
                console.log(`[${label}] Failed with Status ${res.statusCode}`);
            }
        });
    }).on('error', err => console.log(`[${label}] Error: ${err.message}`));
}

testUrl(urlBad, 'Unencoded (Bug)');
setTimeout(() => testUrl(urlGood, 'Encoded (Fix)'), 1000);
