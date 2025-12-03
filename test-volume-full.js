const https = require('https');

const itemId = 'T4_LEATHER';
const city = 'Martlock';
const url = `https://europe.albion-online-data.com/api/v2/stats/history/${itemId}?locations=${encodeURIComponent(city)}&time-scale=24`;

console.log(`Testing: ${url}\n`);

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        if (res.statusCode === 200) {
            try {
                const json = JSON.parse(data);
                console.log('Full JSON Response:');
                console.log(JSON.stringify(json, null, 2));
            } catch (e) {
                console.error('Parse error:', e.message);
                console.log('Raw data:', data);
            }
        }
    });
}).on('error', err => console.error('Error:', err.message));
