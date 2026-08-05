const SHEET_NAME = 'Orders';
const TOKEN = 'CHANGE_ME';                 // must match ORDER_TOKEN in .env
const HEADERS = ['Timestamp','Order ID','Name','Phone','Wilaya','Commune',
                 'Color','Quantity','Delivery Type','Shipping Price','Total','Status'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);                      // serialize concurrent orders
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.token !== TOKEN) return json({ ok: false, error: 'unauthorized' });
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    // Idempotency: same Order ID never creates a second row.
    const ids = sheet.getRange(2, 2, Math.max(sheet.getLastRow() - 1, 1), 1).getValues().flat();
    if (ids.indexOf(body.orderId) !== -1) {
      return json({ ok: true, duplicate: true, orderId: body.orderId });
    }
    sheet.appendRow([
      body.timestamp, body.orderId, body.name, "'" + body.phone,  // leading quote keeps 0
      body.wilaya, body.commune, body.color, body.quantity,
      body.deliveryType, body.shippingPrice, body.total, body.status || 'New'
    ]);
    return json({ ok: true, orderId: body.orderId });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
