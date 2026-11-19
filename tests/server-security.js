'use strict';
// Integration checks for the patched server. Uses only Node built-ins.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');

(async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cyborg-sec-'));
  fs.mkdirSync(path.join(root, 'data'), { recursive: true });
  fs.mkdirSync(path.join(root, 'public'), { recursive: true });
  fs.copyFileSync(path.join(__dirname, '..', 'server.js'), path.join(root, 'server.js'));
  fs.writeFileSync(path.join(root, 'data', 'settings.json'), JSON.stringify({ password: 'test-ceo-password' }));
  const port = await new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => { const p = srv.address().port; srv.close(() => resolve(p)); });
    srv.on('error', reject);
  });
  const child = spawn(process.execPath, ['server.js'], {
    cwd: root,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let logs = '';
  child.stdout.on('data', x => logs += x.toString());
  child.stderr.on('data', x => logs += x.toString());
  const base = `http://127.0.0.1:${port}`;
  const req = async (url, opts = {}) => {
    const r = await fetch(base + url, opts);
    let j = {};
    try { j = await r.json(); } catch {}
    return { status: r.status, json: j, headers: r.headers };
  };
  const waitReady = async () => {
    for (let i = 0; i < 80; i++) {
      if (child.exitCode !== null) throw new Error('server exited early: ' + logs);
      try { const r = await fetch(base + '/api/state'); if (r.ok) return; } catch {}
      await new Promise(r => setTimeout(r, 100));
    }
    throw new Error('server did not start: ' + logs);
  };
  const post = (url, body, pass) => req(url, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify(pass ? { ...body, pass } : body)
  });
  try {
    await waitReady();
    const state = await req('/api/state');
    assert.equal(state.status, 200, 'public state loads');
    assert.equal(Object.hasOwn(state.json, 'orders'), false, 'orders are not exposed in public state');

    const noAuth = await post('/api/ceo/orders', {});
    assert.equal(noAuth.status, 403, 'CEO orders endpoint requires password');
    const settingsSave = await post('/api/settings', { provider: 'auto', model: 'test-model' }, 'test-ceo-password');
    assert.equal(settingsSave.status, 200, 'CEO can save AI settings');
    const settingsDisk = JSON.parse(fs.readFileSync(path.join(root, 'data', 'settings.json'), 'utf8'));
    assert.equal(settingsDisk.password, 'test-ceo-password', 'saving AI settings preserves CEO password');
    const unlockAfterSave = await post('/api/unlock', { pass: 'test-ceo-password' });
    assert.equal(unlockAfterSave.json.ok, true, 'CEO password remains valid after settings save');

    const forged = await post('/api/orders', { items: [{ id: 'gr1', name: 'Fake name', price: 0.01, qty: 1 }] });
    assert.equal(forged.status, 201, 'valid catalog item can create pending order');
    assert.equal(forged.json.order.items[0].name, 'Bigas 5kg', 'server chooses canonical item name');
    assert.equal(forged.json.order.items[0].price, 299, 'server ignores client-supplied price');
    assert.equal(forged.json.order.total, 299, 'server computes total');
    assert.equal(forged.json.order.status, 'pending', 'new order is not marked paid');
    assert.equal(forged.json.order.paymentStatus, 'unverified', 'payment is unverified by default');
    const duplicateOrder = await post('/api/orders', { requestId: 'retry-key-001', items: [{ id: 'gr1', price: 1, qty: 1 }] });
    const duplicateOrderAgain = await post('/api/orders', { requestId: 'retry-key-001', items: [{ id: 'gr1', price: 1, qty: 1 }] });
    assert.equal(duplicateOrderAgain.json.duplicate, true, 'repeated request IDs are idempotent');
    assert.equal(duplicateOrderAgain.json.order.code, duplicateOrder.json.order.code, 'retry returns the original order');

    const invalid = await post('/api/orders', { items: [{ id: 'not-a-product', price: 0, qty: 1 }] });
    assert.equal(invalid.status, 400, 'unknown product IDs are rejected');
    const publicOrders = await req('/api/orders');
    assert.equal(publicOrders.status, 405, 'public order listing is disabled');

    const list = await post('/api/ceo/orders', {}, 'test-ceo-password');
    assert.equal(list.status, 200, 'CEO can list orders');
    assert.equal(list.json.orders.length, 2, 'CEO sees pending orders');

    const missingRef = await post('/api/ceo/orders', { action: 'verify-payment', code: forged.json.order.code }, 'test-ceo-password');
    assert.equal(missingRef.status, 400, 'manual verification requires a receipt reference');
    const verified = await post('/api/ceo/orders', { action: 'verify-payment', code: forged.json.order.code, paymentRef: 'TEST-RECEIPT-001' }, 'test-ceo-password');
    assert.equal(verified.status, 200, 'CEO can manually verify payment');
    assert.equal(verified.json.order.paymentStatus, 'verified', 'payment becomes verified only after CEO action');
    const duplicate = await post('/api/ceo/orders', { action: 'verify-payment', code: forged.json.order.code, paymentRef: 'TEST-RECEIPT-001' }, 'test-ceo-password');
    assert.equal(duplicate.json.alreadyVerified, true, 'verification is idempotent');

    const health = await req('/api/health');
    assert.equal(health.status, 200, 'public health endpoint is available');
    assert.equal(health.json.version, 'Phase D v8 — Layout Upgrade & Operations Foundation', 'health exposes build version');
    const opsNoAuth = await post('/api/ceo/ops', { action: 'status' });
    assert.equal(opsNoAuth.status, 403, 'operations dashboard requires CEO password');
    const ops = await post('/api/ceo/ops', { action: 'status' }, 'test-ceo-password');
    assert.equal(ops.status, 200, 'CEO can view operations status');
    assert.ok(Array.isArray(ops.json.backups), 'operations status lists backups');
    const backup = await post('/api/ceo/ops', { action: 'backup' }, 'test-ceo-password');
    assert.equal(backup.status, 201, 'CEO can create a data backup');
    assert.ok(backup.json.backup.name.startsWith('backup-'), 'backup has a generated name');
    assert.ok(fs.existsSync(path.join(root, 'data', 'backups', backup.json.backup.name, 'state.json')), 'backup contains state snapshot');
    const audit = await post('/api/ceo/ops', { action: 'audit', limit: 20 }, 'test-ceo-password');
    assert.equal(audit.status, 200, 'CEO can read audit events');
    assert.ok(audit.json.events.some(x => String(x.action).includes('data backup')), 'backup action is written to audit log');

    const demo = await req('/api/bazaar/demo', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Same Guest' }) });
    assert.equal(demo.status, 200, 'demo visitor can be created when FB is not configured');
    const cookie = demo.headers.get('set-cookie').split(';')[0];
    const fakeOrderTask = await req('/api/bazaar/task', { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ type: 'order', key: 'fake' }) });
    assert.equal(fakeOrderTask.status, 400, 'generic task API cannot grant order task');

    const stateFile = path.join(root, 'data', 'state.json');
    const saved = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    assert.ok(saved.bazaarSecret && saved.bazaarSecret.length >= 32, 'random cookie secret is persisted');
    assert.notEqual(saved.bazaarSecret, 'cyborg-bz-stable-v1', 'known legacy cookie secret is rotated');
    console.log('PASS: server security integration checks');
  } finally {
    child.kill('SIGTERM');
    await new Promise(resolve => child.once('exit', resolve));
    fs.rmSync(root, { recursive: true, force: true });
  }
})().catch(err => { console.error(err); process.exitCode = 1; });
