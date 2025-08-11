/**
 * Minimal health check
 */
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, time: new Date().toISOString() }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Accepts:
 *  - JSON body (Content-Type: application/json):
 *      {
 *        "fileName": "intake_ABC123_2025-08-11T02-45-00Z.html", // or .pdf
 *        "fileData": "<BASE64_STRING>", // preferred (PDF or HTML)
 *        "rawHtml": "<!doctype html>...", // alternative if not sending base64
 *        "mimeType": "application/pdf" | "text/html", // optional, inferred if missing
 *        "rootFolderId": "YOUR_DRIVE_FOLDER_ID", // optional; defaults to My Drive
 *        "convertToPdf": true // optional; only used when rawHtml is provided
 *      }
 *  - OR form-encoded body with the same field names.
 */
function doPost(e) {
  try {
    if (!e || !e.postData) throw new Error('Empty POST body.');

    // -------- Parse body (JSON or form-urlencoded) --------
    const ct = (e.postData.type || '').toLowerCase();
    let body = {};
    if (ct.indexOf('application/json') !== -1) {
      body = JSON.parse(e.postData.contents || '{}');
    } else if (ct.indexOf('application/x-www-form-urlencoded') !== -1) {
      body = {};
      const params = e.parameters || {};
      Object.keys(params).forEach(k => (body[k] = params[k][0]));
    } else {
      // Fallback: try JSON; otherwise treat as raw HTML
      try { body = JSON.parse(e.postData.contents || '{}'); }
      catch { body = { rawHtml: e.postData.contents || '' }; }
    }

    // -------- Validate inputs --------
    const now = new Date();
    const tz = Session.getScriptTimeZone() || 'UTC';
    const yyyy = Utilities.formatDate(now, tz, 'yyyy');
    const mm   = Utilities.formatDate(now, tz, 'MM');

    const fileName = sanitizeFileName_(body.fileName) ||
      `intake_${Utilities.formatDate(now, tz, "yyyy-MM-dd'T'HH-mm-ss'Z'")}${body.convertToPdf ? '.pdf' : (body.rawHtml ? '.html' : '')}`;

    // Resolve root folder (optional)
    const root = body.rootFolderId ? DriveApp.getFolderById(body.rootFolderId) : DriveApp.getRootFolder();

    // Ensure year/month folders
    const yearFolder  = getOrCreateFolder_(root, yyyy);
    const monthFolder = getOrCreateFolder_(yearFolder, mm);

    // -------- Build file blob --------
    let mimeType = (body.mimeType || '').trim();
    let blob;

    if (body.fileData) {
      // base64 → bytes → blob
      const bytes = Utilities.base64Decode(body.fileData);
      // Infer mime if not provided (default to PDF if filename ends with .pdf)
      if (!mimeType) {
        mimeType = fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'text/html';
      }
      blob = Utilities.newBlob(bytes, mimeType, fileName);
    } else if (body.rawHtml) {
      if (body.convertToPdf === true || String(fileName).toLowerCase().endsWith('.pdf')) {
        // HTML → PDF conversion
        const htmlBlob = Utilities.newBlob(body.rawHtml, 'text/html', fileName.replace(/\.pdf$/i, '') || 'document');
        blob = htmlBlob.getAs('application/pdf');
        blob.setName(fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`);
      } else {
        // Save as pure HTML
        blob = Utilities.newBlob(body.rawHtml, 'text/html', fileName.toLowerCase().endsWith('.html') ? fileName : `${fileName}.html`);
      }
    } else {
      throw new Error('Provide either "fileData" (base64) or "rawHtml".');
    }

    // -------- Create file in Drive --------
    const file = monthFolder.createFile(blob);

    // -------- Respond JSON --------
    const res = {
      success: true,
      fileId: file.getId(),
      fileUrl: file.getUrl(),
      folderPath: `${yyyy}/${mm}`,
      name: file.getName(),
      mimeType: blob.getContentType(),
    };

    return ContentService
      .createTextOutput(JSON.stringify(res))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    const res = { success: false, error: String(err) };
    return ContentService
      .createTextOutput(JSON.stringify(res))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* ==================== helpers ==================== */

function getOrCreateFolder_(parent, name) {
  const it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function sanitizeFileName_(name) {
  if (!name) return '';
  // Remove characters disallowed by Drive/Windows/macOS, plus # and % which Drive dislikes in URLs
  return String(name).replace(/[\\/:*?"<>|#%]+/g, '_').trim();
}
