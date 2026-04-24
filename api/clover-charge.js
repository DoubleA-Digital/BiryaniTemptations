const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const CLOVER_API_TOKEN = process.env.CLOVER_API_TOKEN;
  const MERCHANT_ID = process.env.CLOVER_MERCHANT_ID;
  const CLOVER_BASE = process.env.CLOVER_BASE_URL || 'https://scl-sandbox.dev.clover.com';

  if (!CLOVER_API_TOKEN || !MERCHANT_ID) {
    return res.status(500).json({ error: 'Payment processor not configured.' });
  }

  const { token, amount, currency = 'USD', description } = req.body;

  if (typeof token !== 'string' || token.length < 10 || token.length > 200) {
    return res.status(400).json({ error: 'Invalid payment token.' });
  }
  const amt = Math.round(Number(amount));
  if (!Number.isFinite(amt) || amt <= 0 || amt > 1000000) {
    return res.status(400).json({ error: 'Invalid amount.' });
  }
  const cur = typeof currency === 'string' ? currency.toUpperCase().slice(0, 3) : 'USD';
  if (!/^[A-Z]{3}$/.test(cur)) {
    return res.status(400).json({ error: 'Invalid currency.' });
  }
  const safeDesc = typeof description === 'string'
    ? description.replace(/[\x00-\x1F\x7F]/g, '').slice(0, 200)
    : 'Biryani Temptations Order';

  try {
    const response = await fetch(`${CLOVER_BASE}/v1/charges`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOVER_API_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Clover-Merchant-Id': MERCHANT_ID,
      },
      body: JSON.stringify({
        amount: amt,
        currency: cur.toLowerCase(),
        source: token,
        description: safeDesc,
        capture: true,
      }),
    });

    let data = {};
    try { data = await response.json(); } catch { /* non-json response */ }

    if (!response.ok) {
      return res.status(response.status).json({
        error: (data && (data.message || data.error)) || 'Payment failed.',
      });
    }

    return res.status(200).json({
      success: true,
      chargeId: data.id,
      status: data.status,
    });
  } catch (err) {
    console.error('Clover charge error:', err && err.message);
    return res.status(500).json({ error: 'Payment server error.' });
  }
}
