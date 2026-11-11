// Trotro Tycoon player reports. The website posts reports here and reads the public list back.
// Reports live in a Google Sheet. Change the Status column (New, Looking into it, Fixed) and write a
// Reply, and the website shows both. Email addresses stay private: they are never sent back out.

const HEAD = ["When", "ID", "Kind", "Title", "Details", "Version", "PC", "Email (private)", "Status", "Reply"];

function setup() {
  const ss = book_();
  Logger.log("Reports sheet: " + ss.getUrl());
}

function book_() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty("SHEET_ID");
  if (id) {
    try { return SpreadsheetApp.openById(id); } catch (e) {}
  }
  const ss = SpreadsheetApp.create("Trotro Tycoon - player reports");
  const sh = ss.getSheets()[0];
  sh.setName("Reports");
  sh.appendRow(HEAD);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, HEAD.length).setFontWeight("bold");
  const rule = SpreadsheetApp.newDataValidation().requireValueInList(["New", "Looking into it", "Fixed", "Not a bug", "Hidden"], true).build();
  sh.getRange("I2:I").setDataValidation(rule);
  props.setProperty("SHEET_ID", ss.getId());
  return ss;
}

function clip_(v, n) {
  return String(v == null ? "" : v).replace(/[\u0000-\u0008\u000b-\u001f]/g, "").trim().slice(0, n);
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const p = (e && e.parameter) || {};
  // A hidden field people never see; bots fill it in.
  if (p.website) return json_({ ok: true });
  const title = clip_(p.title, 120);
  const details = clip_(p.details, 3000);
  if (title.length < 3 || details.length < 5) return json_({ ok: false, error: "Please fill in what happened." });
  const lock = LockService.getScriptLock();
  lock.waitLock(8000);
  try {
    const sh = book_().getSheetByName("Reports");
    // One report a minute from the same browser is plenty.
    const cache = CacheService.getScriptCache();
    const who = clip_(p.client, 40);
    if (who && cache.get("r_" + who)) return json_({ ok: false, error: "Thanks! Please wait a minute before sending another." });
    const id = "R" + String(sh.getLastRow()).padStart(4, "0");
    sh.appendRow([new Date(), id, clip_(p.kind, 30) || "Bug", title, details, clip_(p.version, 30), clip_(p.pc, 200), clip_(p.contact, 120), "New", ""]);
    if (who) cache.put("r_" + who, "1", 60);
    return json_({ ok: true, id: id });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  const sh = book_().getSheetByName("Reports");
  const rows = sh.getDataRange().getValues().slice(1);
  const out = [];
  for (let i = rows.length - 1; i >= 0 && out.length < 150; i--) {
    const r = rows[i];
    if (String(r[8]) === "Hidden") continue;
    out.push({ when: r[0], id: r[1], kind: r[2], title: r[3], details: r[4], version: r[5], status: r[8] || "New", reply: r[9] || "" });
  }
  return json_({ reports: out });
}
