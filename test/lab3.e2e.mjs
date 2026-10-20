import assert from 'node:assert/strict';
import test from 'node:test';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { createHash, createHmac } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import pg from 'pg';

async function deleteMinioObject(name) {
  const endpoint = process.env.MINIO_ENDPOINT ?? 'http://localhost:9000';
  const bucket = process.env.MINIO_BUCKET ?? 'asteroids-lab';
  const target = new URL(`/${bucket}/${name}`, endpoint);
  const date = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const stamp = date.slice(0, 8);
  const digest = (data) => createHash('sha256').update(data).digest('hex');
  const hmac = (key, value) => createHmac('sha256', key).update(value).digest();
  const payload = digest('');
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const headers = `host:${target.host}\nx-amz-content-sha256:${payload}\nx-amz-date:${date}`;
  const request = ['DELETE', target.pathname, '', headers, '', signedHeaders, payload].join('\n');
  const scope = `${stamp}/us-east-1/s3/aws4_request`;
  const key = hmac(hmac(hmac(hmac('AWS4' + (process.env.MINIO_ROOT_PASSWORD ?? 'minioadmin'), stamp), 'us-east-1'), 's3'), 'aws4_request');
  const signature = createHmac('sha256', key).update(['AWS4-HMAC-SHA256', date, scope, digest(request)].join('\n')).digest('hex');
  const authorization = `AWS4-HMAC-SHA256 Credential=${process.env.MINIO_ROOT_USER ?? 'minioadmin'}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  const response = await fetch(target, { method: 'DELETE', headers: { authorization, 'x-amz-date': date, 'x-amz-content-sha256': payload } });
  assert.ok(response.ok, `MinIO cleanup: ${response.status}`);
}

test('LR3: ten methods, fixed observer, auth stubs and real MinIO files', { timeout: 90000 }, async (t) => {
  const database = `asteroids_lr3_test_${process.pid}`;
  const connection = { host: process.env.POSTGRES_HOST ?? 'localhost', port: Number(process.env.POSTGRES_PORT ?? 5455),
    user: process.env.POSTGRES_USER ?? 'asteroids', password: process.env.POSTGRES_PASSWORD ?? 'asteroids' };
  const admin = new pg.Client({ ...connection, database: process.env.POSTGRES_DB ?? 'asteroids_lab2' });
  const objects = [];
  let child, db, created = false, logs = '';
  try {
    await admin.connect();
    await admin.query(`CREATE DATABASE "${database}"`); created = true;
    const finder = createServer().listen(0, '127.0.0.1'); await once(finder, 'listening');
    const port = finder.address().port; await new Promise((resolve) => finder.close(resolve));
    child = spawn(process.execPath, ['dist/main-lab3.js'], { env: { ...process.env,
      POSTGRES_DB: database, PORT: String(port), DB_SYNCHRONIZE: 'true', SEED_DATA: 'true',
      // The LR3 entry point must not connect to Redis even if it is unavailable.
      REDIS_URL: 'redis://127.0.0.1:1', DEMO_PASSWORD: ''
    }, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', (data) => { logs += data; }); child.stderr.on('data', (data) => { logs += data; });
    const base = `http://127.0.0.1:${port}`;
    let ready = false;
    for (let attempt = 0; attempt < 150; attempt++) {
      if (child.exitCode !== null) throw new Error(logs);
      try { ready = (await fetch(base + '/api/dates')).ok; } catch {}
      if (ready) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.ok(ready, logs);
    db = new pg.Client({ ...connection, database }); await db.connect();
    const call = async (method, path, body) => {
      const response = await fetch(base + path, { method,
        headers: body !== undefined && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {},
        body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body) });
      const text = await response.text();
      let json; try { json = JSON.parse(text); } catch {}
      return { status: response.status, json, text, cookie: response.headers.get('set-cookie') };
    };
    let draftId, feedId;
    const publish = { shortDescription: 'Тест публикации ЛР3', approachMonth: 10, approachDay: 18, minimumDistanceAu: 0.023 };

    await t.test('Exactly 3 GET + 5 POST + 1 PUT + 1 DELETE; LR3 collection uses no cookie or real login', async () => {
      const spec = (await call('GET', '/swagger-json')).json;
      const methods = Object.values(spec.paths).flatMap((path) => Object.keys(path).filter((method) => ['get','post','put','delete'].includes(method)));
      assert.equal(methods.length, 10);
      assert.equal(methods.filter((m) => m === 'get').length, 3);
      assert.equal(methods.filter((m) => m === 'post').length, 5);
      assert.equal(methods.filter((m) => m === 'put').length, 1);
      assert.equal(methods.filter((m) => m === 'delete').length, 1);
      assert.ok(!spec.components.securitySchemes?.session);
      for (const path of Object.values(spec.paths)) for (const method of Object.values(path)) assert.ok(!method.security?.length);
      const collection = JSON.parse(await readFile('postman/LR3_Asteroid_Dates.postman_collection.json', 'utf8'));
      assert.equal(collection.item.length, 10);
      assert.equal(collection.variable.find((v) => v.key === 'baseUrl').value, 'http://localhost:3003');
      assert.ok(!collection.variable.some((v) => ['sessionCookie','password'].includes(v.key)));
      assert.deepEqual(collection.item.map((item) => item.request.method), ['GET','GET','GET','POST','PUT','DELETE','POST','POST','POST','POST']);
      assert.ok(!collection.item.some((item) => item.request.header.some((header) => header.key === 'Cookie')));
    });
    await t.test('Published list/filter, isCreator; feed isLiked and one own draft without id', async () => {
      const all = (await call('GET', '/api/dates')).json.data;
      assert.ok(all.length > 0);
      for (const date of all) { assert.equal(date.status, 'published'); assert.equal(date.isCreator, date.creatorId === 1 ? 1 : 0); }
      const filtered = (await call('GET', '/api/dates?maxMonth=5')).json.data;
      assert.ok(filtered.length < all.length); assert.ok(filtered.every((d) => d.approachMonth <= 5));
      const feed = (await call('GET', '/api/dates/feed')).json.data[0]; feedId = feed.id;
      assert.equal(feed.status, 'published'); assert.ok([0,1].includes(feed.isLiked));
      const draft = (await call('GET', '/api/dates/draft')).json.data;
      assert.equal(draft.creatorId, 1); assert.equal(draft.status, 'draft');
    });
    await t.test('Image and video bytes are uploaded to MinIO; DB stores generated Latin filenames', async () => {
      const image = await readFile('public/assets/default-date.png'); const video = await readFile('public/assets/default-date.mp4');
      const form = new FormData(); form.set('designation', '2026 LR3 TEST');
      form.set('image', new Blob([image], { type: 'image/png' }), 'астероид.png');
      form.set('video', new Blob([video], { type: 'video/mp4' }), 'астероид.mp4');
      const response = await call('POST', '/api/dates', form);
      assert.equal(response.status, 201, response.text); draftId = response.json.data.id;
      assert.equal(response.json.data.isCreator, 1);
      const row = (await db.query('SELECT creator_id,image_url,video_url FROM asteroid_dates WHERE id=$1', [draftId])).rows[0];
      objects.push(row.image_url, row.video_url);
      assert.equal(row.creator_id, 1);
      for (const name of objects) assert.match(name, /^date-(image|video)-[a-zA-Z0-9.-]+$/);
      assert.ok(!row.image_url.includes('/')); assert.ok(!row.video_url.includes('/'));
      const savedImage = await fetch(response.json.data.imageUrl); const savedVideo = await fetch(response.json.data.videoUrl);
      assert.equal(savedImage.status, 200); assert.equal(savedVideo.status, 200);
      assert.deepEqual(Buffer.from(await savedImage.arrayBuffer()), image);
      assert.deepEqual(Buffer.from(await savedVideo.arrayBuffer()), video);
      const second = await call('POST', '/api/dates', { designation: '2026 LR3 updated' });
      assert.equal(second.json.data.id, draftId);
      assert.equal((await db.query("SELECT count(*) FROM asteroid_dates WHERE creator_id=1 AND status='draft'")).rows[0].count, '1');
      assert.equal((await call('POST', '/api/dates', { designation: 'URL instead of file', imageUrl: 'https://example.com/image.png' })).status, 400);
    });
    await t.test('PUT publishes and DELETE only soft-deletes current observer records', async () => {
      assert.equal((await call('DELETE', `/api/dates/${feedId}`)).status, 404);
      const response = await call('PUT', '/api/dates/publish', publish);
      assert.equal(response.status, 200, response.text); assert.equal(response.json.data.status, 'published'); assert.ok(response.json.data.formedAt);
      const list = (await call('GET', '/api/dates')).json.data;
      assert.equal(list.find((d) => d.id === draftId).isCreator, 1);
      assert.equal((await call('GET', '/api/dates/draft')).json.data, null);
      assert.equal((await call('DELETE', `/api/dates/${draftId}`)).status, 200);
      assert.equal((await db.query('SELECT status FROM asteroid_dates WHERE id=$1', [draftId])).rows[0].status, 'deleted');
      assert.ok(!(await call('GET', '/api/dates')).json.data.some((d) => d.id === draftId));
      const next = (await call('GET', `/api/dates/feed?id=${draftId}&next=true`)).json.data[0];
      assert.equal(next.status, 'published'); assert.notEqual(next.id, draftId);
    });
    await t.test('One POST like supports 0/1, reflects fixed user in feed and avoids duplicate likes', async () => {
      const path = `/api/dates/${feedId}/like`;
      assert.equal((await call('POST', path, { like: 0 })).json.data.date.isLiked, 0);
      assert.equal((await call('POST', path, { like: 1 })).json.data.date.isLiked, 1);
      const count = (await call('POST', path, { like: 1 })).json.data.date.likesCount;
      assert.equal((await call('POST', path, { like: 1 })).json.data.date.likesCount, count);
      assert.equal((await call('GET', `/api/dates/feed?id=${feedId}`)).json.data[0].isLiked, 1);
      assert.equal((await call('POST', path, { like: 0 })).json.data.date.isLiked, 0);
    });
    await t.test('Registration persists, auth/logout are stubs and never create sessions or change the singleton', async () => {
      const registered = await call('POST', '/api/users/register', { fullName: 'Новый ЛР3', email: 'new-lr3@example.com' });
      assert.equal(registered.status, 201, registered.text);
      assert.equal((await db.query('SELECT password_hash FROM observers WHERE id=$1', [registered.json.data.id])).rows[0].password_hash, null);
      const auth = await call('POST', '/api/users/auth', { email: 'new-lr3@example.com' });
      assert.equal(auth.status, 200); assert.equal(auth.json.data.stub, true); assert.equal(auth.json.data.observer.id, 1); assert.equal(auth.cookie, null);
      const logout = await call('POST', '/api/users/logout');
      assert.equal(logout.status, 200); assert.equal(logout.json.data.stub, true); assert.equal(logout.json.data.authenticated, 0); assert.equal(logout.cookie, null);
      const draft = await call('POST', '/api/dates', { designation: 'Still the fixed current observer' });
      assert.equal(draft.status, 201); assert.equal(draft.json.data.creatorId, 1);
    });
  } finally {
    if (child && child.exitCode === null) { child.kill('SIGTERM'); await once(child, 'exit'); }
    if (db) await db.end();
    for (const name of objects) await deleteMinioObject(name);
    if (created) await admin.query(`DROP DATABASE "${database}" WITH (FORCE)`);
    await admin.end();
  }
});
