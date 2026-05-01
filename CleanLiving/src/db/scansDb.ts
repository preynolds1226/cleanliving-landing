import * as SQLite from 'expo-sqlite';
import type { ScanResult } from '../types';

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

function mapRow(row: RowRaw): ScanRow {
  return {
    id: row.id,
    createdAt: row.created_at,
    purityScore: row.purity_score,
    productGuess: row.product_guess,
    result: JSON.parse(row.payload) as ScanResult,
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
  return mapRow(row);
}

export async function listScansDescending(): Promise<ScanRow[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<RowRaw>(`SELECT * FROM scans ORDER BY created_at DESC`);
  return rows.map(mapRow);
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

export type ActivityStats = {
  totalScans: number;
  weekCount: number;
  streakDays: number;
};

function startOfLocalWeek(d: Date): number {
  const x = new Date(d);
  const day = x.getDay();
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

/** Consecutive local days with scans, anchored on the most recent scan day */
function streakFromRecentDay(sortedDesc: string[]): number {
  if (sortedDesc.length === 0) return 0;
  let streak = 1;
  let prev = new Date(sortedDesc[0] + 'T12:00:00').getTime();
  for (let i = 1; i < sortedDesc.length; i++) {
    const t = new Date(sortedDesc[i] + 'T12:00:00').getTime();
    const dayDiff = (prev - t) / 86400000;
    if (dayDiff === 1) {
      streak += 1;
      prev = t;
    } else {
      break;
    }
  }
  return streak;
}

function localDayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function getActivityStats(): Promise<ActivityStats> {
  const rows = await listScansDescending();
  const totalScans = rows.length;
  const weekStart = startOfLocalWeek(new Date());
  const weekCount = rows.filter((r) => r.createdAt >= weekStart).length;
  const sortedDesc = [...new Set(rows.map((r) => localDayKey(r.createdAt)))].sort().reverse();
  const streakDays = streakFromRecentDay(sortedDesc);

  return { totalScans, weekCount, streakDays };
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
  return JSON.stringify(
    {
      version: 2,
      exportedAt: Date.now(),
      scans,
      exploreSavedPickIds,
    },
    null,
    2
  );
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
