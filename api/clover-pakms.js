const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

export default async function handler(req, res) {
  const CLOVER_API_TOKEN = process.env.CLOVER_API_TOKEN;
  const MERCHANT_ID = process.env.CLOVER_MERCHANT_ID;
  const CLOVER_BASE = process.env.CLOVER_BASE_URL || 'https://scl-sandbox.dev.clover.com';

  if (!CLOVER_API_TOKEN || !MERCHANT_ID) {
    return res.status(500).json({ error: 'Payment processor not configured.' });
  }

  try {
    const response = await fetch(`${CLOVER_BASE}/pakms/apikey`, {
      headers: {
        'Authorization': `Bearer ${CLOVER_API_TOKEN}`,
        'X-Clover-Merchant-Id': MERCHANT_ID,
      },
    });

    let data = {};
    try { data = await response.json(); } catch { /* non-json */ }

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch public key.' });
    }

    return res.status(200).json({ apiAccessKey: data.apiAccessKey });
  } catch (err) {
    console.error('PAKMS error:', err && err.message);
    return res.status(500).json({ error: 'Could not retrieve payment key.' });
  }
}
