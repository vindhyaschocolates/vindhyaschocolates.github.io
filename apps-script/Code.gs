/**
 * Vindhya's Homemade Chocolates — saves website orders and leads into this Google Sheet.
 * Setup steps are in SHEETS-SETUP.md.
 * Columns are matched by header name, so you can re-order or add columns in the Sheet safely.
 */
var NOTIFY_EMAIL = ''; // optional: put your email here to get an alert for each new order/lead

var TABS = {
  order: { name: 'Orders', cols: [
    ['Time (IST)', 'time'], ['Name', 'name'], ['Phone', 'phone'], ['Area / City', 'area'],
    ['Delivery address', 'address'], ['Items', 'items'], ['Qty', 'qty'], ['Est. total', 'total'],
    ['Note', 'note'], ['Status', 'status'] ] },
  lead: { name: 'Interested', cols: [
    ['Time (IST)', 'time'], ['Name', 'name'], ['Phone', 'phone'], ['Interested in', 'interest'], ['Status', 'status'] ] }
};

function doPost(e) {
  var p = (e && e.parameter) || {};
  var cfg = TABS[p.type];
  if (!cfg) return out('ignored');
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(cfg.name) || ss.insertSheet(cfg.name);
    if (sh.getLastRow() === 0) {
      var head = cfg.cols.map(function (x) { return x[0]; });
      sh.appendRow(head);
      sh.getRange(1, 1, 1, head.length).setFontWeight('bold').setBackground('#3b1a12').setFontColor('#ffffff');
      sh.setFrozenRows(1);
    }
    var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    // add any missing columns at the end
    cfg.cols.forEach(function (x) {
      if (headers.indexOf(x[0]) < 0) { sh.getRange(1, headers.length + 1).setValue(x[0]).setFontWeight('bold').setBackground('#3b1a12').setFontColor('#ffffff'); headers.push(x[0]); }
    });
    p.time = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd MMM yyyy, hh:mm a');
    p.status = 'New';
    var byHeader = {};
    cfg.cols.forEach(function (x) { byHeader[x[0]] = p[x[1]]; });
    var row = headers.map(function (h) { return byHeader.hasOwnProperty(h) ? c(byHeader[h]) : ''; });
    sh.appendRow(row);
    if (NOTIFY_EMAIL) MailApp.sendEmail(NOTIFY_EMAIL, 'New ' + p.type + " — Vindhya's Chocolates", headers.map(function (h, i) { return h + ': ' + row[i]; }).join('\n'));
  } finally { lock.releaseLock(); }
  return out('ok');
}

function doGet() { return out("Vindhya's sheet endpoint is running"); }

// stop spreadsheet formula injection and cap length
function c(v) {
  v = String(v || '').substring(0, 800);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}
function out(s) { return ContentService.createTextOutput(s); }
