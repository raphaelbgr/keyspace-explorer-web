const http = require('http');

const testData = {
  pageNumber: "2573157538607026564968244111304175730063056983979442319613448069811514699874",
  keysPerPage: 45
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/generate-page',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('Last page test successful!');
      console.log('Page number:', response.pageNumber);
      console.log('Keys generated:', response.keys.length);
      console.log('Last private key:', response.keys[response.keys.length - 1]?.privateKey);
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end(); 