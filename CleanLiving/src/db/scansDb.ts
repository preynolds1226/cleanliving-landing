import * as SQLite from 'expo-sqlite';
import type { ScanResult } from '../types';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function newId(): string {
  return `scan_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('cleanliving.db');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS scans (
          id TEXT PRIMARY KEY NOT NULL,
          created_at INTEGER NOT NULL,
          purity_score INTEGER NOT NULL,
          product_guess TEXT NOT NULL,
          payload TEXT NOT NULL
        );
      `);
      return db;
    })();
  }
  return dbPromise;
}

export type ScanRow = {
  id: string;
  createdAt: number;
  purityScore: number;
  productGuess: string;
  result: ScanResult;
};

export async function insertScan(result: ScanResult): Promise<string> {
  const db = await getDb();
  const id = newId();
  const createdAt = Date.now();
  await db.runAsync(
    `INSERT INTO scans (id, created_at, purity_score, product_guess, payload) VALUES (?, ?, ?, ?, ?)`,
    [id, createdAt, result.purityScore, result.productGuess, JSON.stringify(result)]
  );
  return id;
}

export async function getScanById(id: string): Promise<ScanRow | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{
    id: string;
    created_at: number;
    purity_score: number;
    product_guess: string;
    payload: string;
  }>(`SELECT * FROM scans WHERE id = ?`, [id]);
  if (!row) return null;
  return {
    id: row.id,
    createdAt: row.created_at,
    purityScore: row.purity_score,
    productGuess: row.product_guess,
    result: JSON.parse(row.payload) as ScanResult,
  };
}

export async function listScansDescending(): Promise<ScanRow[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string;
    created_at: number;
    purity_score: number;
    product_guess: string;
    payload: string;
  }>(`SELECT * FROM scans ORDER BY created_at DESC`);
  return rows.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    purityScore: row.purity_score,
    productGuess: row.product_guess,
    result: JSON.parse(row.payload) as ScanResult,
  }));
}

/** Average purity of all saved scans; null if empty */
export async function getHouseScoreAverage(): Promise<number | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ avg: number | null }>(
    `SELECT AVG(purity_score) as avg FROM scans`
  );
  if (row?.avg == null || !Number.isFinite(row.avg)) return null;
  return Math.round(row.avg);
}
