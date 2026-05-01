import { friendlyScanError } from '../friendlyScanError';

describe('friendlyScanError', () => {
  it('maps network errors', () => {
    expect(friendlyScanError('TypeError: Network request failed')).toContain('connection');
  });

  it('maps timeouts', () => {
    expect(friendlyScanError('timeout')).toContain('too long');
  });

  it('maps auth errors', () => {
    expect(friendlyScanError('401 Unauthorized')).toContain('authorized');
  });

  it('truncates long unknown messages', () => {
    const long = 'x'.repeat(200);
    expect(friendlyScanError(long).length).toBeLessThanOrEqual(160);
  });
});
