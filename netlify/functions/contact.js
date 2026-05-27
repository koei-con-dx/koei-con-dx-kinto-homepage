// 興栄コンサルタント 問い合わせフォーム → kintone REST API ブリッジ
// 環境変数（Netlify管理画面 → Site settings → Environment variables）:
//   KINTONE_SUBDOMAIN          ... 例: "koei-con"（koei-con.cybozu.com の場合）
//   KINTONE_CONTACT_APP_ID     ... 問い合わせ用kintoneアプリのID（数字）
//   KINTONE_CONTACT_API_TOKEN  ... レコード追加権限ONで発行したAPIトークン
//
// kintoneアプリ側のフィールドコード（フィールド設定で必ず合わせる）:
//   name / company / department / email / phone / service / message
//   メタ情報: source_ip / user_agent / received_at（任意・あれば自動セット）

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

    // honeypot: bot-fieldに値が入っていたら静かに成功を返してbotを欺く
    if (payload['bot-field']) {
        return json(200, { ok: true });
    }

    // 必須項目
    const required = ['name', 'company', 'email', 'service', 'message'];
    for (const key of required) {
        const v = payload[key];
        if (typeof v !== 'string' || v.trim() === '') {
            return json(400, { error: `必須項目が未入力です（${key}）` });
        }
    }

    // メール形式の簡易検証
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
        return json(400, { error: 'メールアドレスの形式が正しくありません' });
    }

    // 文字数上限（DoS的な巨大POSTを防ぐ）
    const limits = {
        name: 100, company: 200, department: 200,
        email: 200, phone: 50, service: 100, message: 5000,
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
    const appId = (process.env.KINTONE_CONTACT_APP_ID || '').trim();
    const token = (process.env.KINTONE_CONTACT_API_TOKEN || '').trim();
    if (!subdomain || !appId || !token) {
        console.error('Kintone環境変数が未設定です');
        return json(500, { error: 'サーバー設定エラー（管理者へお問い合わせください）' });
    }

    // 種別selectのvalue→表示ラベル変換（kintoneドロップダウンのオプション名と合わせる）
    const serviceLabels = {
        private: '民間企業様向けサービスについて',
        public: '自治体様向けサービスについて',
        case: '導入事例について',
        seminar: 'セミナー・勉強会について',
        download: '資料ダウンロードについて',
        other: 'その他',
    };
    const serviceLabel = serviceLabels[payload.service] || payload.service;

    // メタ情報（運用調査用）
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
        service: { value: serviceLabel },
        message: { value: payload.message.trim() },
        // 以下はkintone側に同名フィールドが無くてもエラーにならないよう、kintone側に作成されていれば自動的に格納される
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
        console.error('kintone通信例外:', err);
        return json(502, { error: '送信処理に失敗しました。時間をおいて再度お試しください。' });
    }

    if (!res.ok) {
        const errText = await res.text();
        console.error('kintone APIエラー:', res.status, errText);
        // フィールド未定義などのkintone構造エラーをサーバ側のみログ。ユーザーには汎用メッセージ
        return json(502, { error: '送信処理に失敗しました。時間をおいて再度お試しください。' });
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
