// 【一時的なデバッグエンドポイント】原因究明が終わり次第このファイルは削除します。
// ?key=debug-2026-may を必須にして第三者からの覗き見を防止。
// APIトークンそのものは絶対に返さない（長さだけ）。

exports.handler = async (event) => {
    const key = (event.queryStringParameters || {}).key;
    if (key !== 'debug-2026-may') {
        return {
            statusCode: 403,
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({ error: 'forbidden' }),
        };
    }

    const rawSub = process.env.KINTONE_SUBDOMAIN || '';
    const subNorm = rawSub.trim()
        .replace(/^https?:\/\//, '')
        .replace(/\/.*$/, '')
        .replace(/\.cybozu\.com$/i, '');
    const contactAppId = (process.env.KINTONE_CONTACT_APP_ID || '').trim();
    const contactToken = (process.env.KINTONE_CONTACT_API_TOKEN || '').trim();
    const downloadAppId = (process.env.KINTONE_DOWNLOAD_APP_ID || '').trim();
    const downloadToken = (process.env.KINTONE_DOWNLOAD_API_TOKEN || '').trim();

    const fetchFields = async (label, appId, token) => {
        if (!subNorm || !appId || !token) {
            return { label, status: 'skipped', reason: 'env missing' };
        }
        try {
            const url = `https://${subNorm}.cybozu.com/k/v1/app/form/fields.json?app=${encodeURIComponent(appId)}`;
            const r = await fetch(url, { headers: { 'X-Cybozu-API-Token': token } });
            const body = await r.text();
            let parsed;
            try { parsed = JSON.parse(body); } catch (_) { parsed = body; }
            return { label, http_status: r.status, body: parsed };
        } catch (e) {
            return { label, error: String(e) };
        }
    };

    // テストPOSTもやって、502の本当のエラー内容を取得
    const tryPostRecord = async (label, appId, token, record) => {
        if (!subNorm || !appId || !token) {
            return { label, status: 'skipped', reason: 'env missing' };
        }
        try {
            const url = `https://${subNorm}.cybozu.com/k/v1/record.json`;
            const r = await fetch(url, {
                method: 'POST',
                headers: { 'X-Cybozu-API-Token': token, 'Content-Type': 'application/json' },
                body: JSON.stringify({ app: appId, record }),
            });
            const body = await r.text();
            let parsed;
            try { parsed = JSON.parse(body); } catch (_) { parsed = body; }
            return { label, http_status: r.status, body: parsed };
        } catch (e) {
            return { label, error: String(e) };
        }
    };

    const contactFields = await fetchFields('contact form fields', contactAppId, contactToken);
    const downloadFields = await fetchFields('download form fields', downloadAppId, downloadToken);
    const contactPostTry = await tryPostRecord('contact test record', contactAppId, contactToken, {
        name: { value: 'デバッグテスト' },
        company: { value: 'デバッグ株式会社' },
        email: { value: 'debug@example.com' },
        service: { value: 'その他' },
        message: { value: 'debug-kintone.js による疎通確認テスト' },
    });
    const downloadPostTry = await tryPostRecord('download test record', downloadAppId, downloadToken, {
        name: { value: 'デバッグテスト' },
        company: { value: 'デバッグ株式会社' },
        email: { value: 'debug@example.com' },
        catalog: { value: 'kintone導入支援サービス カタログ' },
    });

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
            env_summary: {
                KINTONE_SUBDOMAIN_raw: rawSub,
                KINTONE_SUBDOMAIN_normalized: subNorm,
                KINTONE_CONTACT_APP_ID: contactAppId,
                KINTONE_CONTACT_API_TOKEN_length: contactToken.length,
                KINTONE_DOWNLOAD_APP_ID: downloadAppId,
                KINTONE_DOWNLOAD_API_TOKEN_length: downloadToken.length,
            },
            kintone_form_fields_check: {
                contact: contactFields,
                download: downloadFields,
            },
            kintone_record_post_try: {
                contact: contactPostTry,
                download: downloadPostTry,
            },
        }, null, 2),
    };
};
