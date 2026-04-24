const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

function jsonResponse(statusCode, payload) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(payload) };
}

exports.handler = async () => {
  const CLOVER_API_TOKEN = process.env.CLOVER_API_TOKEN;
  const MERCHANT_ID = process.env.CLOVER_MERCHANT_ID;
  const CLOVER_BASE = process.env.CLOVER_BASE_URL || 'https://scl-sandbox.dev.clover.com';

  if (!CLOVER_API_TOKEN || !MERCHANT_ID) {
    return jsonResponse(500, { error: 'Payment processor not configured.' });
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
      return jsonResponse(response.status, { error: 'Failed to fetch public key.' });
    }

    return jsonResponse(200, { apiAccessKey: data.apiAccessKey });
  } catch (err) {
    console.error('PAKMS error:', err && err.message);
    return jsonResponse(500, { error: 'Could not retrieve payment key.' });
  }
};
