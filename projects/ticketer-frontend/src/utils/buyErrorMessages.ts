/** Map transaction/API errors to user-friendly messages for Book Now / Buy flows. */
export function getFriendlyBuyError(
  err: unknown
): { message: string; alreadyOwned?: boolean } {
  const raw = err instanceof Error ? err.message : String(err)
  const lower = raw.toLowerCase()
  if (lower.includes('already opted in') || lower.includes('already opted-in')) {
    return {
      message: 'You may already have a ticket for this event. Check My Tickets.',
      alreadyOwned: true,
    }
  }
  // Balance too low: "balance X below min Y", "insufficient", "overspend", "MicroAlgos Raw:0"
  if (
    (lower.includes('balance') && lower.includes('below min')) ||
    lower.includes('insufficient') ||
    lower.includes('underflow') ||
    lower.includes('overspend') ||
    /microalgos.*raw:\s*0/i.test(raw)
  ) {
    return {
      message:
        'Not enough ALGO in your wallet. Add a bit more (e.g. 0.5–1 ALGO) for the ticket and fees, then try again.',
    }
  }
  if (lower.includes('rejected') || lower.includes('user denied')) {
    return { message: "Transaction was cancelled. Try again when you're ready." }
  }
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('failed to fetch')) {
    return { message: 'Network error. Check your connection and try again.' }
  }
  if (lower.includes('not found') || lower.includes('404')) {
    return { message: 'Event or ticket service unavailable. Please try again later.' }
  }
  return { message: 'Purchase failed. Please try again or check My Tickets.' }
}
