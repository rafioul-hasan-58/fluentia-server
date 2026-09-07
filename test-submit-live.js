const fs = require('fs');

async function testSubmit() {
  const payload = JSON.parse(fs.readFileSync('sample-submit-payload.json', 'utf8'));
  console.log('Sending payload:', JSON.stringify(payload, null, 2));

  const res = await fetch('http://localhost:5000/api/v1/level-test-questions/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  console.log('STATUS:', res.status);
  console.log('RESPONSE:', JSON.stringify(json, null, 2));
}

testSubmit().catch(console.error);
