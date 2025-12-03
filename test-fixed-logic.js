const https = require('https');

const itemId = 'T4_LEATHER';
const city = 'Martlock';
const url = `https://europe.albion-online-data.com/api/v2/stats/history/${itemId}?locations=${encodeURIComponent(city)}&time-scale=24`;

console.log(`Testing fixed logic: ${url}\n`);

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        if (res.statusCode === 200) {
            try {
                const responseData = JSON.parse(data);
                console.log(`Response has ${responseData.length} top-level elements`);

                // NEW LOGIC: Access the nested data array
                const historyData = responseData[0]?.data || [];
                console.log(`History data has ${historyData.length} data points`);

                if (historyData.length > 0) {
                    console.log('\nFirst data point:');
                    console.log(JSON.stringify(historyData[0], null, 2));

                    // Calculate volume
                    const totalVolume = historyData.reduce((sum, d) => sum + (d.item_count || 0), 0);
                    console.log(`\n✅ Total Volume: ${totalVolume}`);
                }
            } catch (e) {
                console.error('Error:', e.message);
            }
        }
    });
}).on('error', err => console.error('Error:', err.message));
