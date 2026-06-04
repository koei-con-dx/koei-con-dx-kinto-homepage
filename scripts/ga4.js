/*
 * Google tag (gtag.js) ブートストラップ
 * GA4 と Google広告（コンバージョン計測）の両方に対応
 *
 * 使い方:
 *   1. 下のIDを設定する（未使用なら空文字 '' のまま）
 *      - GA4_MEASUREMENT_ID: G-XXXXXXXXXX
 *      - GOOGLE_ADS_ID: AW-XXXXXXXXX
 *   2. 各HTMLの <head> に <script src="/scripts/ga4.js"></script> を1行追加（追加済み）
 *
 * 仕込まれているイベント（GA4のみ）:
 *   - 自動: page_view
 *   - 手動: form_submit_contact / form_submit_download
 *
 * GA4のキーイベント化 → Google広告でCVインポート、の流れで運用想定。
 */
(function () {
  var GA4_MEASUREMENT_ID = '';                   // 例: 'G-XXXXXXXXXX'
  var GOOGLE_ADS_ID = 'AW-18213351414';          // Google広告アカウント 983-790-7211

  var ga4Active = GA4_MEASUREMENT_ID.indexOf('G-') === 0;
  var adsActive = GOOGLE_ADS_ID.indexOf('AW-') === 0;

  if (!ga4Active && !adsActive) {
    console.info('[gtag] GA4/Google広告ともに未設定のため計測を行いません。');
    return;
  }

  var bootstrapId = ga4Active ? GA4_MEASUREMENT_ID : GOOGLE_ADS_ID;

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + bootstrapId;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('js', new Date());

  if (ga4Active) {
    gtag('config', GA4_MEASUREMENT_ID, {
      anonymize_ip: true,
      send_page_view: true
    });
  }
  if (adsActive) {
    gtag('config', GOOGLE_ADS_ID);
  }
})();
