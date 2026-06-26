const https = require('https');

const options = {
    headers: {
        'User-Agent': 'dondlingergc-weather-app (contact@dondlingergc.com)'
    }
};

const suiteId = '75886409466';

https.get(`https://api.github.com/repos/yavru421/dondlingergc.github.io/check-suites/${suiteId}`, options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            console.log(data);
        } catch (e) {
            console.error(e);
        }
    });
});
