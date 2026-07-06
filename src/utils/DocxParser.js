/**
 * DocxParser Utility
 * Parses the structural components of a PizZip Word document instance.
 */
export const DocxParser = {
  /**
   * Reads a file from the zip archive as text.
   */
  readText(zip, path) {
    const file = zip.file(path);
    return file ? file.asText() : null;
  },

  /**
   * Parses an XML string into a DOM Document.
   */
  parseXml(xmlText) {
    if (!xmlText) return null;
    const parser = new DOMParser();
    return parser.parseFromString(xmlText, "text/xml");
  },

  /**
   * Finds all header files in the zip.
   */
  getHeaders(zip) {
    return Object.keys(zip.files).filter(name => name.startsWith("word/header"));
  },

  /**
   * Finds all footer files in the zip.
   */
  getFooters(zip) {
    return Object.keys(zip.files).filter(name => name.startsWith("word/footer"));
  },

  /**
   * Scans for media/images inside the word/media directory.
   */
  getMediaFiles(zip) {
    return Object.keys(zip.files).filter(name => name.startsWith("word/media/"));
  },

  /**
   * Detects if page margins <w:pgMar> are present in document XML.
   */
  hasPageMargins(xmlDoc) {
    if (!xmlDoc) return false;
    const pgMar = xmlDoc.getElementsByTagNameNS ? xmlDoc.getElementsByTagNameNS("*", "pgMar") : xmlDoc.getElementsByTagName("w:pgMar");
    return pgMar.length > 0;
  },

  /**
   * Scans document for unsupported text boxes (e.g. w:txbxContent, v:textbox).
   */
  hasUnsupportedTextBox(xmlDoc) {
    if (!xmlDoc) return false;
    const txbx = xmlDoc.getElementsByTagNameNS ? xmlDoc.getElementsByTagNameNS("*", "txbxContent") : xmlDoc.getElementsByTagName("w:txbxContent");
    const vTxbx = xmlDoc.getElementsByTagNameNS ? xmlDoc.getElementsByTagNameNS("*", "textbox") : xmlDoc.getElementsByTagName("v:textbox");
    return txbx.length > 0 || vTxbx.length > 0;
  }
};
