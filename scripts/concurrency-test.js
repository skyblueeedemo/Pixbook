// Concurrency test using Node.js http module (zero deps)
const http = require('http');
const date = '2026-06-20';
const count = 10;
let done = 0;
const results = [];

function sendRequest(i) {
  const body = JSON.stringify({
    scheduleDate: date,
    customerName: `用户${i}`,
    customerPhone: `1380000000${i}`,
    photoCount: 1,
    requirements: `这是一条并发压力测试的预约请求编号第${i}号`,
    expectedVersion: 0,
    idempotencyKey: `conc-${date}-${i}-${Date.now()}`,
  });

  const start = Date.now();
  const req = http.request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/order/submit',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    },
    (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const parsed = JSON.parse(data);
        const ok = parsed.code === 0;
        results.push({ i, ok, code: parsed.code, message: parsed.message, orderId: parsed.data?.orderId, ms: Date.now() - start });
        done++;
        if (done === count) printResults();
      });
    }
  );
  req.on('error', (e) => {
    results.push({ i, ok: false, code: -1, message: e.message });
    done++;
    if (done === count) printResults();
  });
  req.write(body);
  req.end();
}

function printResults() {
  results.sort((a, b) => a.i - b.i);
  const ok = results.filter((r) => r.ok);
  const fail = results.filter((r) => !r.ok);

  console.log(`\n📊 Concurrency: ${count} requests → date=${date}`);
  console.log(`   ✅ Success: ${ok.length}`);
  console.log(`   ❌ Failed:  ${fail.length}`);
  console.log(`   🎯 OVERSOLD: ${ok.length <= 5 ? 'PASS ✅' : 'FAIL — OVERSOLD! ❌'}`);
  console.log('');

  results.forEach((r) => {
    const tag = r.ok ? '✅' : '❌';
    console.log(`   ${tag} #${r.i} [${r.code}] ${r.orderId ?? r.message} (${r.ms}ms)`);
  });

  // Check calendar
  http.get(`http://localhost:3000/api/schedule/calendar?startDate=${date}&days=1`, (res) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => {
      const cal = JSON.parse(data);
      const slot = cal.data?.[0];
      console.log('');
      console.log(`   📅 Calendar: ${slot.availableSlots} left, version ${slot.version}`);
      console.log(`   🎯 Slots: ${5 - ok.length === slot.availableSlots ? 'MATCH ✅' : 'MISMATCH ❌'}`);
    });
  });
}

// Fire all requests concurrently
for (let i = 0; i < count; i++) sendRequest(i);
