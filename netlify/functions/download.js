// 興栄コンサルタント 資料ダウンロードフォーム → kintone REST API ブリッジ
// 環境変数（Netlify管理画面 → Site settings → Environment variables）:
//   KINTONE_SUBDOMAIN           ... 例: "koei-con"（koei-con.cybozu.com の場合）
//   KINTONE_DOWNLOAD_APP_ID     ... 資料DLリード用kintoneアプリのID（数字）
//   KINTONE_DOWNLOAD_API_TOKEN  ... レコード追加権限ONで発行したAPIトークン
//
// kintoneアプリ側のフィールドコード（必ず合わせる）:
//   name / company / department / email / phone / catalog
//   メタ情報: source_ip / user_agent

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return json(405, { error: 'Method Not Allowed' });
    }

    let payload;
    try {
        payload = JSON.parse(event.body || '{}');
    } catch (e) {
        return json(400, { error: 'Invalid JSON' });
    }

    if (payload['bot-field']) {
        return json(200, { ok: true });
    }

    const required = ['name', 'company', 'email'];
    for (const key of required) {
        const v = payload[key];
        if (typeof v !== 'string' || v.trim() === '') {
            return json(400, { error: `必須項目が未入力です（${key}）` });
        }
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
        return json(400, { error: 'メールアドレスの形式が正しくありません' });
    }

    const limits = {
        name: 100, company: 200, department: 200,
        email: 200, phone: 50, catalog: 200,
    };
    for (const [k, max] of Object.entries(limits)) {
        if (typeof payload[k] === 'string' && payload[k].length > max) {
            return json(400, { error: `入力文字数が上限を超えています（${k}）` });
        }
    }

    // サブドメインは "koei-con" でも "koei-con.cybozu.com" でも "https://koei-con.cybozu.com/" でもOK
    const subdomain = (process.env.KINTONE_SUBDOMAIN || '')
        .trim()
        .replace(/^https?:\/\//, '')
        .replace(/\/.*$/, '')
        .replace(/\.cybozu\.com$/i, '');
    const appId = (process.env.KINTONE_DOWNLOAD_APP_ID || '').trim();
    const token = (process.env.KINTONE_DOWNLOAD_API_TOKEN || '').trim();
    if (!subdomain || !appId || !token) {
        console.error('Kintone環境変数が未設定です（download）');
        return json(500, { error: 'サーバー設定エラー' });
    }

    const sourceIp = (event.headers['x-nf-client-connection-ip']
        || event.headers['x-forwarded-for']
        || '').split(',')[0].trim();
    const userAgent = event.headers['user-agent'] || '';

    const record = {
        name: { value: payload.name.trim() },
        company: { value: payload.company.trim() },
        department: { value: (payload.department || '').trim() },
        email: { value: payload.email.trim() },
        phone: { value: (payload.phone || '').trim() },
        catalog: { value: (payload.catalog || 'kintone導入支援サービス カタログ').trim() },
        source_ip: { value: sourceIp },
        user_agent: { value: userAgent },
    };

    const url = `https://${subdomain}.cybozu.com/k/v1/record.json`;
    let res;
    try {
        res = await fetch(url, {
            method: 'POST',
            headers: {
                'X-Cybozu-API-Token': token,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ app: appId, record }),
        });
    } catch (err) {
        console.error('kintone通信例外（download）:', err);
        return json(502, { error: '送信処理に失敗しました' });
    }

    if (!res.ok) {
        const errText = await res.text();
        console.error('kintone APIエラー（download）:', res.status, errText);
        return json(502, { error: '送信処理に失敗しました' });
    }

    return json(200, { ok: true });
};

function json(statusCode, body) {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(body),
    };
}
