/** Map raw analysis errors to short, user-facing copy (unit-tested). */
export function friendlyScanError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('network') || m.includes('fetch') || m.includes('failed to fetch'))
    return 'We couldn\u2019t reach the analysis service. Check your connection and try again.';
  if (m.includes('timeout') || m.includes('timed out'))
    return 'The analysis took too long. Try again in a moment.';
  if (m.includes('aborted') || m.includes('abort'))
    return 'The analysis was cancelled. Tap the shutter to try again.';
  if (m.includes('401') || m.includes('403') || m.includes('unauthorized'))
    return 'Analysis isn\u2019t authorized. Ask the person who set up the app to check API keys or the proxy.';
  if (m.includes('500') || m.includes('502') || m.includes('503'))
    return 'The analysis service had a temporary problem. Try again shortly.';
  if (m.includes('could not read image') || m.includes('capture failed'))
    return 'The camera didn\u2019t return a usable photo. Try again with steadier lighting.';
  return message.length > 160 ? `${message.slice(0, 157)}\u2026` : message;
}
