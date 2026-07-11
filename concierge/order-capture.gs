/**
 * CelebrateBanner — Concierge Fulfillment V1: Order Capture
 * ---------------------------------------------------------
 * A single Google Apps Script Web App that captures every order BEFORE the
 * customer is sent to Stripe, so no paid order is ever lost.
 *
 * For each order it:
 *   • creates one folder per order in your Google Drive
 *   • saves every uploaded photo (full resolution) into that folder
 *   • appends a row to a Google Sheet order log
 *   • emails you immediately with the order number, customer info, and links
 *
 * It does NOT render, print, or deliver anything — you fulfill the first
 * 10–20 orders by hand using the captured photos + details.
 *
 * ── DEPLOY (once, ~5 min) ────────────────────────────────────────────────
 *   1. Go to https://script.new  (signed in as the Google account that should
 *      OWN the photos + sheet — e.g. info@celebratebanner.com).
 *   2. Delete the sample code, paste THIS whole file.
 *   3. Set NOTIFY_EMAIL below to where you want order alerts.
 *   4. (Optional) change CAPTURE_TOKEN and paste the same value into
 *      graduation-signature.html (ORDER_CAPTURE_TOKEN).
 *   5. Click Deploy ▸ New deployment ▸ type "Web app".
 *        Execute as:  Me
 *        Who has access:  Anyone
 *      Deploy, authorize when prompted, copy the "/exec" Web app URL.
 *   6. Paste that URL into graduation-signature.html (ORDER_CAPTURE_URL).
 *   7. Open the /exec URL in a browser — you should see "…order capture is live".
 * ─────────────────────────────────────────────────────────────────────────
 */

// ── CONFIG — edit these ────────────────────────────────────────────────────
const NOTIFY_EMAIL   = 'info@celebratebanner.com'; // where order alerts are sent
const CAPTURE_TOKEN  = 'cb-concierge-v1';          // must match the page's ORDER_CAPTURE_TOKEN
const ROOT_FOLDER_NAME = 'CelebrateBanner Orders';
const SHEET_NAME       = 'CelebrateBanner Orders Log';

// ── Safety limits (mirror the client in graduation-signature.html) ──────────
const ALLOWED_MIME   = /^image\/(jpe?g|png|webp|heic|heif|gif)$/i;
const MAX_PHOTO_BYTES = 25 * 1024 * 1024;   // 25 MB per photo (decoded)
const MIN_PHOTOS = 5, MAX_PHOTOS = 9;       // 1 hero + 4–8 memories
const ORDER_RE = /^CB-\d{8}-[PD][A-Z0-9]{4}$/;

const SHEET_HEADERS = [
  'Timestamp','Order #','Product','Price',
  'Customer Name','Email','Phone',
  'Ship Address','City','State','ZIP',
  'Graduate Name','Class Year','School','Message',
  'Photos','Drive Folder','Captured At (server)','Status'
];

// ── Health check ───────────────────────────────────────────────────────────
function doGet() {
  return json_({ status: 'ok', service: 'CelebrateBanner order capture is live' });
}

// ── Main entry ─────────────────────────────────────────────────────────────
function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.token !== CAPTURE_TOKEN) return json_({ status: 'error', error: 'unauthorized' });

    if (body.kind === 'photo')  return json_(savePhoto_(body));
    if (body.kind === 'order')  return json_(saveOrder_(body));
    return json_({ status: 'error', error: 'unknown kind' });
  } catch (err) {
    return json_({ status: 'error', error: String(err) });
  }
}

// ── Save one photo into the order's folder ─────────────────────────────────
function savePhoto_(body) {
  if (!ORDER_RE.test(body.orderNumber || '')) return { status: 'error', error: 'bad order number' };
  if (!body.data)                            return { status: 'error', error: 'empty upload' };
  var mime = String(body.mime || '').toLowerCase();
  if (!ALLOWED_MIME.test(mime))              return { status: 'error', error: 'unsupported file type' };
  var bytes = Utilities.base64Decode(body.data);
  if (!bytes || bytes.length === 0)          return { status: 'error', error: 'empty upload' };
  if (bytes.length > MAX_PHOTO_BYTES)        return { status: 'error', error: 'file too large' };

  var folder = getOrderFolder_(body.orderNumber, body.graduateName);
  var idx = (typeof body.index === 'number') ? (body.index + 1) : 0;
  var prefix = body.isHero ? '00-HERO' : ('mem-' + pad2_(idx));
  var name = prefix + '-' + safeName_(body.filename || ('photo-' + idx + '.jpg'));
  // idempotent: on a retry, don't create a duplicate file with the same name
  var existing = folder.getFilesByName(name);
  if (!existing.hasNext()) folder.createFile(Utilities.newBlob(bytes, mime, name));
  return { status: 'ok', orderNumber: body.orderNumber };
}

// ── Save the order metadata: Sheet row + email ─────────────────────────────
function saveOrder_(body) {
  if (!ORDER_RE.test(body.orderNumber || '')) return { status: 'error', error: 'bad order number' };
  var isPrint = /-P[A-Z0-9]{4}$/.test(body.orderNumber);
  var isDigital = /-D[A-Z0-9]{4}$/.test(body.orderNumber);
  if (!isPrint && !isDigital) return { status: 'error', error: 'unknown product type' };

  var c = body.customer || {}, p = body.personalization || {};
  // sanitize all free text server-side (defense in depth)
  var name = clean_(c.name, 120), email = clean_(c.email, 160);
  if (!name)                 return { status: 'error', error: 'missing name' };
  if (!isEmail_(email))      return { status: 'error', error: 'invalid email' };
  var addr = clean_(c.address,200), city = clean_(c.city,80), st = clean_(c.state,40), zip = clean_(c.zip,20);
  if (isPrint && (!addr || !city || !st || !zip)) return { status: 'error', error: 'missing shipping address' };

  var count = Number(body.photoCount) || 0;
  if (count < MIN_PHOTOS || count > MAX_PHOTOS) return { status: 'error', error: 'photo count out of range' };

  var sheet = getSheet_();
  // idempotency: if this order number is already logged, don't duplicate or re-email
  var existing = findOrderRow_(sheet, body.orderNumber);
  if (existing > 0) {
    var ss0 = sheet.getParent();
    return { status: 'ok', idempotent: true, orderNumber: body.orderNumber,
             rowUrl: ss0.getUrl() + '#gid=' + sheet.getSheetId() + '&range=A' + existing };
  }

  var folder = getOrderFolder_(body.orderNumber, p.graduateName);
  var folderUrl = folder.getUrl();
  var person = { graduateName: clean_(p.graduateName,120), classYear: clean_(p.classYear,20),
                 school: clean_(p.school,120), message: clean_(p.message,300) };
  var cust = { name: name, email: email, phone: clean_(c.phone,40), address: addr, city: city, state: st, zip: zip };

  var row = [
    clean_(body.timestamp, 40) || new Date().toISOString(),
    body.orderNumber, clean_(body.product,80), clean_(body.price,16),
    cust.name, cust.email, cust.phone,
    cust.address, cust.city, cust.state, cust.zip,
    person.graduateName, person.classYear, person.school, person.message,
    count, folderUrl, new Date().toISOString(), 'CAPTURED'
  ];
  sheet.appendRow(row);
  var rowNum = sheet.getLastRow();
  var ss = sheet.getParent();
  var rowUrl = ss.getUrl() + '#gid=' + sheet.getSheetId() + '&range=A' + rowNum;

  sendNotify_({ orderNumber: body.orderNumber, product: clean_(body.product,80), price: clean_(body.price,16),
                timestamp: row[0], photoCount: count }, cust, person, folderUrl, rowUrl);
  return { status: 'ok', orderNumber: body.orderNumber, folderUrl: folderUrl, rowUrl: rowUrl };
}

// find an existing order row by order number (column B); 0 if not present
function findOrderRow_(sheet, orderNumber) {
  var last = sheet.getLastRow();
  if (last < 2) return 0;
  var col = sheet.getRange(2, 2, last - 1, 1).getValues();
  for (var i = 0; i < col.length; i++) if (String(col[i][0]) === orderNumber) return i + 2;
  return 0;
}

// ── Email alert ────────────────────────────────────────────────────────────
function sendNotify_(body, c, p, folderUrl, rowUrl) {
  var isPrint = /print/i.test(body.product || '');
  var lines = [
    'NEW ORDER — fulfill by hand.',
    '',
    'Order #: ' + body.orderNumber,
    'Product: ' + (body.product || '') + '  (' + (body.price || '') + ')',
    'Placed:  ' + (body.timestamp || new Date().toISOString()),
    '',
    '— Customer —',
    'Name:  ' + (c.name || ''),
    'Email: ' + (c.email || ''),
    'Phone: ' + (c.phone || '(none)'),
  ];
  if (isPrint) {
    lines.push('Ship:  ' + [c.address, c.city, (c.state || '') + ' ' + (c.zip || '')].filter(String).join(', '));
  }
  lines.push(
    '',
    '— Personalization —',
    'Graduate: ' + (p.graduateName || ''),
    'Class of: ' + (p.classYear || ''),
    'School:   ' + (p.school || ''),
    'Message:  ' + (p.message || '(none)'),
    '',
    'Photos (' + (body.photoCount || 0) + '): ' + folderUrl,
    'Sheet row: ' + rowUrl,
    '',
    'NOTE: The customer is being sent to Stripe now. Confirm payment in the',
    'Stripe dashboard (client_reference_id contains this order #), then make',
    'and deliver the banner manually.'
  );
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: 'New order ' + body.orderNumber + ' — ' + (body.product || 'CelebrateBanner'),
    body: lines.join('\n')
  });
}

// ── Drive / Sheet helpers (auto-provisioned, IDs cached) ───────────────────
function getRoot_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('ROOT_FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var it = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
  var folder = it.hasNext() ? it.next() : DriveApp.createFolder(ROOT_FOLDER_NAME);
  props.setProperty('ROOT_FOLDER_ID', folder.getId());
  return folder;
}

function getOrderFolder_(orderNumber, graduateName) {
  var root = getRoot_();
  var label = orderNumber + (graduateName ? ' — ' + safeName_(graduateName) : '');
  var it = root.getFoldersByName(label);
  return it.hasNext() ? it.next() : root.createFolder(label);
}

function getSheet_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SHEET_ID');
  if (id) { try { return SpreadsheetApp.openById(id).getSheets()[0]; } catch (e) {} }
  var ss = SpreadsheetApp.create(SHEET_NAME);
  var sheet = ss.getSheets()[0];
  sheet.appendRow(SHEET_HEADERS);
  sheet.setFrozenRows(1);
  // move the new spreadsheet into the orders folder for tidiness
  try { DriveApp.getFileById(ss.getId()).moveTo(getRoot_()); } catch (e) {}
  props.setProperty('SHEET_ID', ss.getId());
  return sheet;
}

// ── small utils ────────────────────────────────────────────────────────────
// PRIVACY: getRoot_/getOrderFolder_/getSheet_ create items owned solely by the
// script owner (the business account). We NEVER call setSharing/addViewer, so
// every order folder, photo, and the Sheet stay private to that account.
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function safeName_(s) { return clean_(s, 80).replace(/[\\/:*?"<>|]+/g, '_') || 'photo.jpg'; }
function clean_(s, max) {
  return String(s == null ? '' : s).replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max || 300);
}
function isEmail_(s) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s || '')); }
function pad2_(n) { return (n < 10 ? '0' : '') + n; }
