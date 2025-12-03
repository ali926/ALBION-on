const https = require('https');

const itemId = 'T4_LEATHER';
const city = 'Martlock';
const url = `https://europe.albion-online-data.com/api/v2/stats/history/${itemId}?locations=${city}&time-scale=24`;

console.log(`Fetching: ${url}`);

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            if (res.statusCode !== 200) {
                console.error(`Status Code: ${res.statusCode}`);
                return;
            }
            const json = JSON.parse(data);
            console.log(`Total items: ${json.length}`);
            if (json.length > 0) {
                console.log('First item structure:', JSON.stringify(json[0], null, 2));
            } else {
                console.log('Empty array received');
            }
        } catch (e) {
            console.error('Error parsing JSON:', e.message);
        }
    });

}).on('error', (err) => {
    console.error('Error:', err.message);
});
