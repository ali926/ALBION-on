const https = require('https');

// Test the exact item ID format being used
const itemId = 'T4_LEATHER'; // No enchantment
const city = 'Martlock';
const url = `https://europe.albion-online-data.com/api/v2/stats/history/${itemId}?locations=${encodeURIComponent(city)}&time-scale=24`;

console.log(`Testing: ${url}\n`);

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
            try {
                const json = JSON.parse(data);
                console.log(`\nReceived ${json.length} data points`);

                if (json.length > 0) {
                    console.log('\nFirst data point:');
                    console.log(JSON.stringify(json[0], null, 2));

                    // Calculate volume like our function does
                    const totalVolume = json.reduce((sum, d) => sum + (d.item_count || 0), 0);
                    console.log(`\nTotal Volume: ${totalVolume}`);
                } else {
                    console.log('\nNo data returned!');
                }
            } catch (e) {
                console.error('Parse error:', e.message);
            }
        } else {
            console.log('Failed!');
        }
    });
}).on('error', err => console.error('Request error:', err.message));
