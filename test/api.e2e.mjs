import assert from 'node:assert/strict';
import test from 'node:test';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { unlink, readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import pg from 'pg';
import { createClient } from 'redis';

// Uses real PostgreSQL and Redis, creates a disposable DB, never clears application data.
test('LR4: authentication, Redis sessions, public reads and creator access', { timeout: 90000 }, async (t) => {
  const database = `asteroids_lab4_test_${process.pid}`;
  const connection = {
    host: process.env.POSTGRES_HOST ?? 'localhost', port: Number(process.env.POSTGRES_PORT ?? 5455),
    user: process.env.POSTGRES_USER ?? 'asteroids', password: process.env.POSTGRES_PASSWORD ?? 'asteroids'
  };
  const admin = new pg.Client({ ...connection, database: process.env.POSTGRES_DB ?? 'asteroids_lab2' });
  const redis = createClient({ url: process.env.REDIS_URL ?? 'redis://localhost:6379' });
  const sessionKeys = new Set();
  const uploadedFiles = new Set();
  let server, db, created = false, logs = '';
  const sessionKey = (cookie) => 'asteroids:sess:' + decodeURIComponent(cookie.split('=').slice(1).join('='))
    .replace(/^s:/, '').split('.')[0];
  try {
    await admin.connect();
    await admin.query(`CREATE DATABASE "${database}"`);
    created = true;
    await redis.connect();
    const portFinder = createServer();
    portFinder.listen(0, '127.0.0.1');
    await once(portFinder, 'listening');
    const port = portFinder.address().port;
    await new Promise((resolve) => portFinder.close(resolve));
    server = spawn(process.execPath, ['dist/main.js'], { env: {
      ...process.env, PORT: String(port), HOST: '127.0.0.1', POSTGRES_DB: database,
      NODE_ENV: 'test', DATE_MEDIA_STORAGE: 'local', SEED_DATA: 'false', DB_SYNCHRONIZE: 'true', SESSION_TTL_SECONDS: '60',
      SESSION_SECRET: 'asteroids-e2e-only-session-secret-at-least-32-characters'
    }, stdio: ['ignore', 'pipe', 'pipe'] });
    server.stdout.on('data', (chunk) => { logs += chunk; });
    server.stderr.on('data', (chunk) => { logs += chunk; });
    const base = `http://127.0.0.1:${port}`;
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (server.exitCode !== null) throw new Error(logs);
      try { ready = (await fetch(base + '/api/dates')).ok; } catch {}
      if (ready) break;
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    assert.ok(ready, logs);
    db = new pg.Client({ ...connection, database });
    await db.connect();
    const call = async (method, url, body, cookie) => {
      const headers = {};
      if (cookie) headers.Cookie = cookie;
      if (body !== undefined && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
      const response = await fetch(base + url, { method, headers, body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body) });
      const text = await response.text();
      let json; try { json = JSON.parse(text); } catch {}
      return { status: response.status, json, text, cookie: response.headers.get('set-cookie')?.split(';')[0], headers: response.headers };
    };
    const login = async (email, password = 'AsteroidLab4!') => {
      const response = await call('POST', '/api/users/auth', { email, password });
      assert.equal(response.status, 200, response.text);
      assert.ok(response.cookie);
      sessionKeys.add(sessionKey(response.cookie));
      return response;
    };
    const publication = { shortDescription: 'Близкое прохождение астероида', approachMonth: 10, approachDay: 18, minimumDistanceAu: 0.01234 };
    let alice, bob, authA, authB, draft, published;

    await t.test('Guest can read API with absent or invalid credentials; all private API and HTML routes return 401', async () => {
      for (const cookie of [undefined, 'asteroids.sid=invalid']) {
        assert.equal((await call('GET', '/api/dates?maxMonth=7', undefined, cookie)).status, 200);
        assert.equal((await call('PUT', '/api/dates/publish', publication, cookie)).status, 401);
      }
      for (const [method, url, body] of [
        ['GET', '/api/dates/draft'], ['POST', '/api/dates', {}],
        ['DELETE', '/api/dates/1'], ['POST', '/api/dates/1/like', { like: 1 }],
        ['POST', '/api/users/logout'], ['POST', '/dates/add', {}], ['GET', '/dates/add'],
        ['POST', '/dates/publish', {}], ['POST', '/dates/1/delete', {}]
      ]) assert.equal((await call(method, url, body)).status, 401, url);
      assert.equal((await call('GET', '/dates')).status, 200);
      assert.equal((await call('GET', '/api/dates?maxMonth=1&maxMonth=2')).status, 400);
    });
    await t.test('Registration validates fields, normalizes email, hashes passwords and rejects duplicates', async () => {
      assert.equal((await call('POST', '/api/users/register', { fullName: 'Alice', email: 'alice@example.com' })).status, 400);
      assert.equal((await call('POST', '/api/users/register', { fullName: '', email: 'bad', password: 'short' })).status, 400);
      alice = await call('POST', '/api/users/register', { fullName: 'Alice', email: ' ALICE@example.com ', password: 'AsteroidLab4!' });
      bob = await call('POST', '/api/users/register', { fullName: 'Bob', email: 'bob@example.com', password: 'AsteroidLab4!' });
      assert.equal(alice.status, 201, alice.text); assert.equal(bob.status, 201, bob.text);
      assert.equal(alice.json.data.email, 'alice@example.com');
      assert.ok(!alice.text.includes('password'));
      const row = (await db.query('SELECT password_hash FROM observers WHERE id=$1', [alice.json.data.id])).rows[0];
      assert.match(row.password_hash, /^scrypt\$/);
      assert.equal((await call('POST', '/api/users/register', { fullName: 'Alice', email: 'alice@example.com', password: 'AsteroidLab4!' })).status, 409);
      assert.equal((await call('POST', '/api/users/auth', { email: 'alice@example.com', password: 'WrongPassword!' })).status, 401);
      assert.equal((await call('POST', '/api/users/auth', { email: 'missing@example.com', password: 'WrongPassword!' })).status, 401);
    });
    await t.test('Login stores user in Redis, sets signed HttpOnly cookie, and isolates simultaneous users', async () => {
      authA = await login('alice@example.com'); authB = await login('bob@example.com');
      assert.match(authA.headers.get('set-cookie'), /HttpOnly/);
      assert.match(authA.headers.get('set-cookie'), /SameSite=Lax/);
      const key = sessionKey(authA.cookie);
      assert.equal(JSON.parse(await redis.get(key)).observer.id, alice.json.data.id);
      assert.ok(await redis.ttl(key) > 0);
      const sessions = await redis.eval(await readFile('scripts/redis-sessions.lua', 'utf8'), { keys: [], arguments: [] });
      assert.ok(sessions.map((value) => JSON.parse(value)).some((session) => session.key === key && session.email === 'alice@example.com' && session.ttl > 0));
      assert.ok(!(await redis.get(key)).includes('password'));
      assert.equal(authA.json.data.observer.id, alice.json.data.id);
      assert.equal(authB.json.data.observer.id, bob.json.data.id);
      assert.notEqual(authA.cookie, authB.cookie);
      const [draftA, draftB] = await Promise.all([call('GET', '/api/dates/draft', undefined, authA.cookie), call('GET', '/api/dates/draft', undefined, authB.cookie)]);
      assert.equal(draftA.status, 200); assert.equal(draftB.status, 200);
      assert.equal(draftA.json.data, null); assert.equal(draftB.json.data, null);
    });
    await t.test('Multipart upload creates one own draft with automatic creator; other users cannot access it', async () => {
      const form = new FormData(); form.set('designation', '2026 LAB4');
      form.set('image', new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6nWQAAAAASUVORK5CYII=', 'base64')], { type: 'image/png' }), 'asteroid.png');
      form.set('video', new Blob([Buffer.from('00000018667479706d703432000000006d70343269736f6d', 'hex')], { type: 'video/mp4' }), 'asteroid.mp4');
      const response = await call('POST', '/api/dates', form, authA.cookie);
      assert.equal(response.status, 201, response.text); draft = response.json.data;
      uploadedFiles.add(join('public/uploads/dates', basename(draft.imageUrl)));
      uploadedFiles.add(join('public/uploads/dates', basename(draft.videoUrl)));
      assert.equal(draft.creatorId, alice.json.data.id); assert.equal(draft.status, 'draft'); assert.equal(draft.isCreator, 1);
      assert.ok((await fetch(base + draft.imageUrl)).ok); assert.ok((await fetch(base + draft.videoUrl)).ok);
      assert.equal((await call('GET', '/api/dates/draft', undefined, authB.cookie)).json.data, null);
      assert.equal((await call('PUT', '/api/dates/publish', publication, authB.cookie)).status, 404);
      assert.equal((await call('DELETE', `/api/dates/${draft.id}`, undefined, authB.cookie)).status, 404);
      assert.equal((await call('POST', '/api/dates', { designation: 'Forged', creatorId: bob.json.data.id }, authA.cookie)).status, 400);
      const updated = await call('POST', '/api/dates', { designation: '2026 LAB4 updated' }, authA.cookie);
      assert.equal(updated.json.data.id, draft.id); assert.equal(updated.json.data.imageUrl, draft.imageUrl);
      assert.equal((await call('GET', '/api/dates')).json.data.length, 0);
    });
    await t.test('Publication validates calendar date and updates fields, status and timestamp', async () => {
      assert.equal((await call('PUT', '/api/dates/publish', { ...publication, approachMonth: 2, approachDay: 31 }, authA.cookie)).status, 400);
      const response = await call('PUT', '/api/dates/publish', publication, authA.cookie);
      assert.equal(response.status, 200, response.text); published = response.json.data;
      assert.equal(published.id, draft.id); assert.equal(published.status, 'published'); assert.ok(published.formedAt);
      for (const [key, value] of Object.entries(publication)) assert.equal(published[key], value);
      assert.equal((await call('GET', '/api/dates/draft', undefined, authA.cookie)).json.data, null);
      assert.equal((await call('GET', '/api/dates?maxMonth=7')).json.data.length, 0);
      const guest = (await call('GET', '/api/dates', undefined, 'asteroids.sid=invalid')).json.data[0];
      assert.equal(guest.isCreator, 0); assert.equal(guest.isLiked, 0);
      assert.equal((await call('GET', '/api/dates', undefined, authA.cookie)).json.data[0].isCreator, 1);
      assert.equal((await call('GET', '/api/dates/feed')).json.data[0].id, draft.id);
      assert.equal((await call('GET', `/api/dates/feed?id=${draft.id}&next=true`)).json.data[0].id, draft.id);
    });
    await t.test('Likes are per user and concurrent repeated likes do not create duplicates', async () => {
      const url = `/api/dates/${draft.id}/like`;
      const results = await Promise.all(Array.from({ length: 4 }, () => call('POST', url, { like: 1 }, authB.cookie)));
      for (const result of results) assert.equal(result.status, 200, result.text);
      assert.equal((await call('GET', '/api/dates', undefined, authB.cookie)).json.data[0].isLiked, 1);
      assert.equal((await call('GET', '/api/dates', undefined, authA.cookie)).json.data[0].isLiked, 0);
      assert.equal((await call('POST', url, { like: 0 }, authB.cookie)).json.data.date.likesCount, 0);
    });
    await t.test('OpenAPI documents cookie security, bodies, responses and public reads', async () => {
      const spec = (await call('GET', '/swagger-json')).json;
      const methods = ['get', 'post', 'put', 'delete'];
      const operations = Object.values(spec.paths).flatMap((path) => Object.keys(path).filter((method) => methods.includes(method)));
      const counts = (values) => values.reduce((totals, method) => { totals[method] = (totals[method] ?? 0) + 1; return totals; }, {});
      assert.equal(operations.length, 10);
      assert.deepEqual(counts(operations), { get: 3, post: 5, put: 1, delete: 1 });
      for (const lab of [3, 4]) {
        const collection = JSON.parse(await readFile(`postman/LR${lab}_Asteroid_Dates.postman_collection.json`, 'utf8'));
        assert.equal(collection.item.length, 10);
        assert.deepEqual(counts(collection.item.map((item) => item.request.method.toLowerCase())), counts(operations));
        const routes = collection.item.map((item) => {
          const url = typeof item.request.url === 'string' ? item.request.url : item.request.url.raw;
          return item.request.method + ' ' + url.split('?')[0];
        });
        assert.equal(new Set(routes).size, 10, `Duplicate methods in LR${lab} collection`);
      }
      assert.ok(!spec.paths['/api/users/me']);
      assert.equal((await call('GET', '/api/users/me')).status, 404);
      assert.equal(spec.components.securitySchemes.session.in, 'cookie');
      assert.equal(spec.components.securitySchemes.session.name, 'asteroids.sid');
      assert.ok(!spec.paths['/api/dates'].get.security?.length);
      assert.deepEqual(spec.paths['/api/dates/publish'].put.security, [{ session: [] }]);
      assert.ok(spec.paths['/api/dates'].post.requestBody.content['multipart/form-data']);
      assert.ok(spec.components.schemas.AuthUserDto.required.includes('password'));
      assert.equal(spec.components.schemas.AsteroidDateDto.properties.shortDescription.type, 'string');
      assert.ok(!Object.keys(spec.paths).some((url) => url.startsWith('/dates')));
      assert.equal((await call('GET', '/swagger')).status, 200);
    });
    await t.test('Soft delete checks ownership and hides deleted records from public reads', async () => {
      assert.equal((await call('DELETE', `/api/dates/${draft.id}`, undefined, authB.cookie)).status, 404);
      assert.equal((await call('DELETE', `/api/dates/${draft.id}`, undefined, authA.cookie)).status, 200);
      assert.equal((await call('GET', '/api/dates')).json.data.length, 0);
      assert.equal((await db.query('SELECT status FROM asteroid_dates WHERE id=$1', [draft.id])).rows[0].status, 'deleted');
    });
    await t.test('Login rotates session; logout removes Redis entry and invalidates copied cookie', async () => {
      const rotated = await call('POST', '/api/users/auth', { email: 'alice@example.com', password: 'AsteroidLab4!' }, authA.cookie);
      assert.equal(rotated.status, 200); sessionKeys.add(sessionKey(rotated.cookie));
      assert.notEqual(rotated.cookie, authA.cookie); assert.equal(await redis.get(sessionKey(authA.cookie)), null);
      assert.equal((await call('GET', '/api/dates/draft', undefined, authA.cookie)).status, 401);
      assert.equal((await call('POST', '/api/users/logout', undefined, rotated.cookie)).status, 200);
      assert.equal(await redis.get(sessionKey(rotated.cookie)), null);
      assert.equal((await call('PUT', '/api/dates/publish', publication, rotated.cookie)).status, 401);
      assert.equal((await call('GET', '/api/dates', undefined, rotated.cookie)).status, 200);
    });
    await t.test('Expired Redis session cannot authorize a request', async () => {
      await redis.pExpire(sessionKey(authB.cookie), 1);
      await new Promise((resolve) => setTimeout(resolve, 20));
      assert.equal((await call('GET', '/api/dates/draft', undefined, authB.cookie)).status, 401);
    });
  } finally {
    if (server && server.exitCode === null) { server.kill('SIGTERM'); await once(server, 'exit'); }
    if (db) await db.end();
    for (const filename of uploadedFiles) await unlink(filename);
    if (redis.isOpen) { for (const key of sessionKeys) await redis.del(key); await redis.quit(); }
    if (created) await admin.query(`DROP DATABASE "${database}" WITH (FORCE)`);
    await admin.end();
  }
});
