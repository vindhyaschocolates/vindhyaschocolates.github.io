/**
 * Vindhya's Homemade Chocolates — saves website orders and leads into this Google Sheet.
 * Setup steps are in SHEETS-SETUP.md.
 */
var NOTIFY_EMAIL = ''; // optional: your email to get an alert for each new order/lead

var TABS = {
  order: { name: 'Orders', head: ['Time (IST)', 'Name', 'Phone', 'Area / City', 'Items', 'Qty', 'Est. total', 'Note', 'Status'] },
  lead:  { name: 'Interested', head: ['Time (IST)', 'Name', 'Phone', 'Interested in', 'Status'] }
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
      sh.appendRow(cfg.head);
      sh.getRange(1, 1, 1, cfg.head.length).setFontWeight('bold').setBackground('#3b1a12').setFontColor('#ffffff');
      sh.setFrozenRows(1);
    }
    var t = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd MMM yyyy, hh:mm a');
    var row = p.type === 'order'
      ? [t, c(p.name), c(p.phone), c(p.area), c(p.items), c(p.qty), c(p.total), c(p.note), 'New']
      : [t, c(p.name), c(p.phone), c(p.interest), 'New'];
    sh.appendRow(row);
    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(NOTIFY_EMAIL, 'New ' + (p.type === 'order' ? 'order' : 'lead') + ' — Vindhya\'s Chocolates', row.join('\n'));
    }
  } finally { lock.releaseLock(); }
  return out('ok');
}

function doGet() { return out('Vindhya\'s sheet endpoint is running'); }

// stop spreadsheet formula injection and cap length
function c(v) {
  v = String(v || '').substring(0, 500);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}
function out(s) { return ContentService.createTextOutput(s); }
