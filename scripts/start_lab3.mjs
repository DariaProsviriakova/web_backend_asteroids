import pg from 'pg';
import { spawn } from 'node:child_process';

const database = process.env.POSTGRES_LAB3_DB ?? 'asteroids_lab3';
if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(database)) throw new Error('Invalid POSTGRES_LAB3_DB');
const admin = new pg.Client({
  host: process.env.POSTGRES_HOST ?? 'localhost', port: Number(process.env.POSTGRES_PORT ?? 5455),
  user: process.env.POSTGRES_USER ?? 'asteroids', password: process.env.POSTGRES_PASSWORD ?? 'asteroids',
  database: process.env.POSTGRES_DB ?? 'asteroids_lab2'
});
try {
  await admin.connect();
  const existing = await admin.query('SELECT 1 FROM pg_database WHERE datname=$1', [database]);
  if (!existing.rowCount) await admin.query(`CREATE DATABASE "${database}"`);
} finally { await admin.end(); }
const server = spawn(process.execPath, ['dist/main-lab3.js'], {
  stdio: 'inherit', env: { ...process.env, POSTGRES_DB: database, PORT: process.env.LAB3_PORT ?? '3003' }
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.kill(signal));
server.on('exit', (code) => { process.exitCode = code ?? 0; });
