// Admin broadcast endpoint has been removed.
// Push notifications are now exclusively sent by the automated cron worker.
export async function onRequestPost() {
  return new Response(JSON.stringify({ error: 'Gone' }), {
    status: 410,
    headers: { 'Content-Type': 'application/json' },
  });
}
