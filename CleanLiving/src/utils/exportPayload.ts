import type { ScanResult } from '../types';

export type ExportScanSlice = {
  id: string;
  createdAt: number;
  purityScore: number;
  productGuess: string;
  isFavorite: boolean;
  result: ScanResult;
};

export type ExportV2 = {
  version: 2;
  exportedAt: number;
  scans: ExportScanSlice[];
  exploreSavedPickIds: string[];
};

export function buildExportV2Object(
  scans: ExportScanSlice[],
  exploreSavedPickIds: string[],
  exportedAt: number
): ExportV2 {
  return { version: 2, exportedAt, scans, exploreSavedPickIds };
}

export function isExportV2Payload(x: unknown): x is ExportV2 {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return (
    o.version === 2 &&
    typeof o.exportedAt === 'number' &&
    Array.isArray(o.scans) &&
    Array.isArray(o.exploreSavedPickIds)
  );
}
