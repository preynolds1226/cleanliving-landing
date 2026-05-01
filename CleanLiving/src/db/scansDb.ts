import * as SQLite from 'expo-sqlite';
import type { ScanResult } from '../types';
import { computeActivityStats, type ActivityStats } from '../utils/activityStatsPure';
import { buildExportV2Object } from '../utils/exportPayload';

export type { ActivityStats };

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function newId(): string {
  return `scan_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

type RowRaw = {
  id: string;
  created_at: number;
  purity_score: number;
  product_guess: string;
  payload: string;
  is_favorite?: number;
};

function tryMapRow(row: RowRaw): ScanRow | null {
  let result: ScanResult;
  try {
    result = JSON.parse(row.payload) as ScanResult;
  } catch {
    return null;
  }
  return {
    id: row.id,
    createdAt: row.created_at,
    purityScore: row.purity_score,
    productGuess: row.product_guess,
    result,
    isFavorite: row.is_favorite === 1,
  };
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const info = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(scans)`);
  const hasFavorite = info.some((c) => c.name === 'is_favorite');
  if (!hasFavorite) {
    await db.execAsync(`ALTER TABLE scans ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0`);
  }
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS explore_saved (
      pick_id TEXT PRIMARY KEY NOT NULL,
      saved_at INTEGER NOT NULL
    );
  `);
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
      await migrate(db);
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
  isFavorite: boolean;
};

export async function insertScan(result: ScanResult): Promise<string> {
  const db = await getDb();
  const id = newId();
  const createdAt = Date.now();
  await db.runAsync(
    `INSERT INTO scans (id, created_at, purity_score, product_guess, payload, is_favorite) VALUES (?, ?, ?, ?, ?, 0)`,
    [id, createdAt, result.purityScore, result.productGuess, JSON.stringify(result)]
  );
  return id;
}

export async function getScanById(id: string): Promise<ScanRow | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<RowRaw>(`SELECT * FROM scans WHERE id = ?`, [id]);
  if (!row) return null;
  return tryMapRow(row);
}

export async function listScansDescending(): Promise<ScanRow[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<RowRaw>(`SELECT * FROM scans ORDER BY created_at DESC`);
  return rows.map(tryMapRow).filter((r): r is ScanRow => r != null);
}

export async function deleteScan(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM scans WHERE id = ?`, [id]);
}

export async function clearAllScans(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`DELETE FROM scans`);
}

export async function setScanFavorite(id: string, isFavorite: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE scans SET is_favorite = ? WHERE id = ?`, [isFavorite ? 1 : 0, id]);
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

export async function getActivityStats(): Promise<ActivityStats> {
  const rows = await listScansDescending();
  return computeActivityStats(rows);
}

/** Saved Explore picks (affiliate idea shelf), newest first */
export async function getExploreSavedPickIds(): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ pick_id: string }>(
    `SELECT pick_id FROM explore_saved ORDER BY saved_at DESC`
  );
  return rows.map((r) => r.pick_id);
}

export async function exportAllScansJson(): Promise<string> {
  const rows = await listScansDescending();
  const exploreSavedPickIds = await getExploreSavedPickIds();
  const scans = rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    purityScore: r.purityScore,
    productGuess: r.productGuess,
    isFavorite: r.isFavorite,
    result: r.result,
  }));
  return JSON.stringify(buildExportV2Object(scans, exploreSavedPickIds, Date.now()), null, 2);
}

export async function clearAllExploreSaved(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`DELETE FROM explore_saved`);
}

export async function saveExplorePick(pickId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`INSERT OR REPLACE INTO explore_saved (pick_id, saved_at) VALUES (?, ?)`, [
    pickId,
    Date.now(),
  ]);
}

export async function removeExplorePick(pickId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM explore_saved WHERE pick_id = ?`, [pickId]);
}
