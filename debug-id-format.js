const https = require('https');

const city = 'Martlock';
// Test both formats
const itemIds = ['T4_LEATHER_LEVEL1@1', 'T4_LEATHER@1'];

itemIds.forEach(itemId => {
    const url = `https://europe.albion-online-data.com/api/v2/stats/history/${itemId}?locations=${city}&time-scale=24`;
    console.log(`Fetching: ${url}`);

    https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            if (res.statusCode === 200) {
                try {
                    const json = JSON.parse(data);
                    console.log(`${itemId}: Found ${json.length} records.`);
                    if (json.length > 0) {
                        console.log(`${itemId} sample:`, JSON.stringify(json[0]).substring(0, 100) + '...');
                    }
                } catch (e) {
                    console.log(`${itemId}: Error parsing JSON`);
                }
            } else {
                console.log(`${itemId}: HTTP ${res.statusCode}`);
            }
        });
    }).on('error', err => console.log(`${itemId}: Error ${err.message}`));
});
