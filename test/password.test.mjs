import assert from 'node:assert/strict';
import test from 'node:test';
import { hashPassword, verifyPassword } from '../dist/auth/password.js';

test('Password hashes use unique salts and verify only the correct password', async () => {
  const first = await hashPassword('AsteroidLab4!');
  const second = await hashPassword('AsteroidLab4!');
  assert.notEqual(first, second);
  assert.ok(!first.includes('AsteroidLab4!'));
  assert.equal(await verifyPassword('AsteroidLab4!', first), true);
  assert.equal(await verifyPassword('WrongPassword!', first), false);
  for (const invalid of [null, '', 'plaintext', 'scrypt$invalid$invalid']) {
    assert.equal(await verifyPassword('AsteroidLab4!', invalid), false);
  }
});
