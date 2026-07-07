import JSZip from 'jszip';
import { TemplateParser } from './engine/TemplateParser';

const PAGE_WIDTH_DXA = 11906;
const PAGE_HEIGHT_DXA = 16838;
const PAGE_MARGIN_DXA = 1440;
const BODY_WIDTH_DXA = PAGE_WIDTH_DXA - (PAGE_MARGIN_DXA * 2);

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function normalizeTextRun(text = '') {
  return String(text).replace(/\s+/g, ' ').trim();
}

function pointsToDxa(points, pageWidth) {
  return Math.round((points / pageWidth) * PAGE_WIDTH_DXA);
}

function fontSizeToHalfPoints(fontSize = 12) {
  return Math.max(16, Math.min(44, Math.round(fontSize * 2)));
}

function getLineText(items) {
  return items.map(item => normalizeTextRun(item.text)).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function groupTextRunsIntoLines(runs = [], pageWidth = 595.28) {
  const lineMap = new Map();

  runs
    .filter(run => {
      const text = normalizeTextRun(run.text);
      return text && !text.includes('{{QUESTION_PAPER}}');
    })
    .forEach(run => {
      const yBucket = `${run.page}:${Math.round(run.y / 3) * 3}`;
      const line = lineMap.get(yBucket) || { page: run.page, y: run.y, items: [] };
      line.items.push(run);
      line.y = Math.max(line.y, run.y);
      lineMap.set(yBucket, line);
    });

  return Array.from(lineMap.values())
    .map(line => {
      const items = line.items.sort((a, b) => a.x - b.x);
      const text = getLineText(items);
      const x = Math.min(...items.map(item => item.x));
      const right = Math.max(...items.map(item => item.x + (item.width || 0)));
      const fontSize = Math.max(...items.map(item => item.fontSize || item.height || 12));
      const centerX = (x + right) / 2;
      const isCentered = Math.abs(centerX - (pageWidth / 2)) < pageWidth * 0.08;

      return {
        page: line.page,
        y: line.y,
        x,
        right,
        text,
        items,
        fontSize,
        isCentered
      };
    })
    .filter(line => line.text)
    .sort((a, b) => a.page - b.page || b.y - a.y);
}

function inferTextStyle(line) {
  const text = line.text;
  const lower = text.toLowerCase();
  const blueLabels = ['mid term', 'instructions', 'question paper'];
  const isBlue = blueLabels.some(label => lower.includes(label));
  const isTitle = line.isCentered && line.fontSize >= 14;
  const isSignature = lower.includes('signature');
  const isLabel = /^(class|time|subject|max marks|instructions|question paper)\b/i.test(text);

  return {
    bold: isTitle || isSignature || isLabel || isBlue,
    color: isBlue ? '4F81BD' : null,
    size: fontSizeToHalfPoints(line.fontSize + (isTitle ? 2 : 0))
  };
}

function buildRunsXml(line) {
  if (line.items.length <= 1) {
    return runXml(line.text, inferTextStyle(line));
  }

  const runs = [];
  const style = inferTextStyle(line);
  let previousRight = null;

  line.items.forEach(item => {
    const text = normalizeTextRun(item.text);
    if (!text) return;

    if (previousRight !== null) {
      const gap = item.x - previousRight;
      runs.push(gap > 28 ? '<w:r><w:tab/></w:r>' : runXml(' ', style));
    }

    runs.push(runXml(text, style));
    previousRight = item.x + (item.width || 0);
  });

  return runs.join('');
}

function runXml(text, style) {
  return `
      <w:r>
        <w:rPr>
          ${style.bold ? '<w:b/>' : ''}
          ${style.color ? `<w:color w:val="${style.color}"/>` : ''}
          <w:sz w:val="${style.size}"/>
        </w:rPr>
        <w:t xml:space="preserve">${escapeXml(text)}</w:t>
      </w:r>`;
}

function paragraphXml(line, previousLine, pageWidth, pageHeight) {
  const style = inferTextStyle(line);
  const paragraphX = pointsToDxa(line.x, pageWidth);
  const leftIndent = Math.max(0, paragraphX - PAGE_MARGIN_DXA);
  const lineGapPoints = previousLine
    ? Math.max(0, previousLine.y - line.y - Math.max(previousLine.fontSize, line.fontSize))
    : Math.max(0, pageHeight - line.y - line.fontSize);
  const spacingBefore = Math.max(0, Math.round(lineGapPoints * 20));
  const tabs = line.items.length > 1
    ? line.items.slice(1).map(item => {
      const position = Math.max(0, pointsToDxa(item.x, pageWidth) - PAGE_MARGIN_DXA);
      return `<w:tab w:val="left" w:pos="${Math.min(BODY_WIDTH_DXA, position)}"/>`;
    }).join('')
    : '';

  return `
    <w:p>
      <w:pPr>
        ${line.isCentered ? '<w:jc w:val="center"/>' : `<w:ind w:left="${Math.min(BODY_WIDTH_DXA, leftIndent)}"/>`}
        <w:spacing w:before="${spacingBefore}" w:after="40" w:line="240" w:lineRule="auto"/>
        ${tabs ? `<w:tabs>${tabs}</w:tabs>` : ''}
      </w:pPr>
      ${buildRunsXml({ ...line, fontSize: style.size / 2 })}
    </w:p>`;
}

function placeholderXml(line, previousLine, pageWidth) {
  const placeholderX = pointsToDxa(line?.x || PAGE_MARGIN_DXA / 20, pageWidth);
  const leftIndent = Math.max(0, placeholderX - PAGE_MARGIN_DXA);
  const spacingBefore = previousLine && line
    ? Math.max(0, Math.round((previousLine.y - line.y - Math.max(previousLine.fontSize, line.fontSize || 12)) * 20))
    : 160;

  return `
    <w:p>
      <w:pPr>
        <w:ind w:left="${Math.min(BODY_WIDTH_DXA, leftIndent)}"/>
        <w:spacing w:before="${spacingBefore}" w:after="0" w:line="240" w:lineRule="auto"/>
      </w:pPr>
      <w:r><w:rPr><w:sz w:val="24"/></w:rPr><w:t>{{QUESTION_PAPER}}</w:t></w:r>
    </w:p>`;
}

function buildDocumentXml(parsed) {
  const pageWidth = parsed.placeholderDetails?.pageWidth || 595.28;
  const pageHeight = parsed.placeholderDetails?.pageHeight || 841.89;
  const headerLines = groupTextRunsIntoLines(parsed.headerTextRuns, pageWidth);
  const footerLines = groupTextRunsIntoLines(parsed.footerTextRuns, pageWidth);
  const placeholderLine = parsed.placeholderDetails
    ? {
      page: parsed.placeholderDetails.pageIndex,
      x: parsed.placeholderDetails.x,
      y: parsed.placeholderDetails.y,
      right: parsed.placeholderDetails.x + 120,
      text: '{{QUESTION_PAPER}}',
      items: [],
      fontSize: 12,
      isCentered: false
    }
    : null;

  const bodyBeforePlaceholder = headerLines
    .map((line, index) => paragraphXml(line, headerLines[index - 1], pageWidth, pageHeight))
    .join('');

  const footerXml = footerLines
    .map((line, index) => paragraphXml(line, footerLines[index - 1] || placeholderLine, pageWidth, pageHeight))
    .join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyBeforePlaceholder}
    ${placeholderXml(placeholderLine, headerLines[headerLines.length - 1], pageWidth)}
    ${footerXml}
    <w:sectPr>
      <w:pgSz w:w="${PAGE_WIDTH_DXA}" w:h="${PAGE_HEIGHT_DXA}" w:code="9"/>
      <w:pgMar w:top="${PAGE_MARGIN_DXA}" w:bottom="${PAGE_MARGIN_DXA}" w:left="${PAGE_MARGIN_DXA}" w:right="${PAGE_MARGIN_DXA}" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

export class PdfTemplateAdapter {
  static async toDocxTemplate(pdfArrayBuffer) {
    const parsed = await TemplateParser.parsePdf(pdfArrayBuffer);

    if (!parsed.placeholderFound) {
      throw new Error('Invalid PDF template: Missing {{QUESTION_PAPER}} placeholder.');
    }

    const zip = new JSZip();

    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

    zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

    zip.file('word/document.xml', buildDocumentXml(parsed));

    return zip.generateAsync({ type: 'arraybuffer' });
  }
}

export default PdfTemplateAdapter;
