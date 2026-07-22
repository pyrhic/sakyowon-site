const DOC_ID = "1nqfrfCVw9HB0y7qi7eTOsIf3Ulg83ARAdsYboiFgY1w";
const TAB_TITLE = "수필";

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
    scope: "https://www.googleapis.com/auth/documents.readonly",
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
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${base64url(signature)}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=${encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer")}&assertion=${jwt}`,
  });
  if (!res.ok) throw new Error("구글 인증 실패: " + (await res.text()));
  return (await res.json()).access_token;
}

function paragraphText(paragraph) {
  return (paragraph.elements || [])
    .map((el) => el.textRun?.content || "")
    .join("");
}

function hasHorizontalRule(paragraph) {
  return (paragraph.elements || []).some((el) => !!el.horizontalRule);
}

function parseEssays(bodyContent) {
  const essays = [];
  const discarded = [];
  let current = null; // { title, paragraphs: [] }

  for (const item of bodyContent) {
    if (!item.paragraph) continue;
    const p = item.paragraph;
    const isTitle = p.paragraphStyle?.namedStyleType === "TITLE";
    const text = paragraphText(p);

    if (isTitle) {
      if (current) discarded.push(current.title); // 이전 글이 가로선 없이 끝났으면 버림
      current = { title: text.trim(), paragraphs: [] };
      continue;
    }

    if (!current) continue; // 첫 제목 이전 내용은 무시

    if (hasHorizontalRule(p)) {
      essays.push(current);
      current = null;
      continue;
    }

    if (text.trim()) current.paragraphs.push(text.trim());
  }

  if (current) discarded.push(current.title); // 마지막 글이 안 닫혔으면 버림

  return { essays, discarded };
}

export async function onRequestGet(context) {
  const { env } = context;
  try {
    const serviceAccount = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_KEY);
    const accessToken = await getAccessToken(serviceAccount);

    const res = await fetch(
      `https://docs.googleapis.com/v1/documents/${DOC_ID}?includeTabsContent=true`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) {
      return new Response(JSON.stringify({ error: "문서 조회 실패", detail: await res.text() }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    const doc = await res.json();

    const allTabTitles = [];
    function collectTabs(tabs, depth) {
      for (const t of tabs || []) {
        allTabTitles.push({ title: t.tabProperties?.title, depth });
        if (t.childTabs) collectTabs(t.childTabs, depth + 1);
      }
    }
    collectTabs(doc.tabs, 0);

    function findTab(tabs) {
      for (const t of tabs || []) {
        if (t.tabProperties?.title === TAB_TITLE) return t;
        if (t.childTabs) {
          const found = findTab(t.childTabs);
          if (found) return found;
        }
      }
      return null;
    }

    const tab = findTab(doc.tabs);
    if (!tab) {
      return new Response(JSON.stringify({ error: `"${TAB_TITLE}" 탭을 못 찾음`, allTabTitles }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const bodyContent = tab.documentTab?.body?.content || [];
    const { essays, discarded } = parseEssays(bodyContent);

    return new Response(
      JSON.stringify(
        {
          allTabTitles,
          foundEssays: essays.map((e) => ({
            title: e.title,
            paragraphCount: e.paragraphs.length,
            preview: e.paragraphs.join(" ").slice(0, 80),
          })),
          discardedTitles: discarded,
        },
        null,
        2
      ),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
