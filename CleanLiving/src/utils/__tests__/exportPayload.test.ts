import { buildExportV2Object, isExportV2Payload } from '../exportPayload';

describe('exportPayload', () => {
  it('buildExportV2Object has version 2', () => {
    const o = buildExportV2Object([], [], 99);
    expect(o.version).toBe(2);
    expect(o.exportedAt).toBe(99);
    expect(o.scans).toEqual([]);
    expect(o.exploreSavedPickIds).toEqual([]);
  });

  it('isExportV2Payload validates shape', () => {
    expect(isExportV2Payload(null)).toBe(false);
    expect(isExportV2Payload({})).toBe(false);
    expect(
      isExportV2Payload({
        version: 2,
        exportedAt: 1,
        scans: [],
        exploreSavedPickIds: [],
      })
    ).toBe(true);
  });
});
