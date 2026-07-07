const SHEET_ID = "1eDq93iuSBJ6fn_wY9iV3KDUAik7oHdZYDOSMsb94UrQ";
const SHEET_TAB = "근무일지 2026";

function base64url(bytes) {
  let str;
  if (typeof bytes === "string") {
    str = btoa(bytes);
  } else {
    str = btoa(String.fromCharCode(...new Uint8Array(bytes)));
  }
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function getAccessToken(serviceAccount) {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;

  const pem = serviceAccount.private_key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binaryDer = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned)
  );

  const jwt = `${unsigned}.${base64url(signature)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=${encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer")}&assertion=${jwt}`,
  });

  if (!res.ok) {
    throw new Error("구글 인증 실패: " + (await res.text()));
  }
  const data = await res.json();
  return data.access_token;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const date = (body.date || "").trim();
    const dow = (body.dow || "").trim();
    const tasks = (body.tasks || "").trim();
    const leave = (body.leave || "").trim();

    if (!date || !tasks) {
      return new Response(JSON.stringify({ error: "날짜와 업무 내용은 필수입니다." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const serviceAccount = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_KEY);
    const accessToken = await getAccessToken(serviceAccount);

    const range = encodeURIComponent(`${SHEET_TAB}!B:I`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

    const values = [[date, dow, "", tasks, "", "", "", leave]];

    const sheetRes = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values }),
    });

    if (!sheetRes.ok) {
      const errText = await sheetRes.text();
      return new Response(JSON.stringify({ error: "구글시트 저장 실패", detail: errText }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
