/**
 * EduCore GOLD Presentation Generator
 * Generates professional educational PPTX with 10 distinct layouts.
 * Usage: node generate_pptx.js <input.json> <output.pptx>
 */

const PptxGenJS = require('pptxgenjs');
const fs = require('fs');

// ─────────────────────────────────────────── Design System
const DS = {
  navy:    '0D1B2A',
  ocean:   '065A82',
  teal:    '1C7293',
  mint:    '00B4D8',
  ice:     'CAF0F8',
  white:   'FFFFFF',
  slate:   '2D4356',
  light:   'F0F4F8',
  blue:    '1A73E8',
  green:   '1E8449',
  orange:  'E67E22',
  purple:  '6C3483',
  fontTitle: 'Calibri Light',
  fontBody:  'Calibri',
  W: 10,
  H: 5.625,
};

const ACCENT_MAP = {
  blue:   DS.blue,
  green:  DS.green,
  orange: DS.orange,
  purple: DS.purple,
};
function accent(slide) {
  return ACCENT_MAP[slide.accent_color] || DS.mint;
}

// ─────────────────────────────────────────── Footer
function addFooter(s, n, total, docTitle) {
  s.addShape('line', {
    x: 0.4, y: 5.3, w: 9.2, h: 0,
    line: { color: DS.slate, width: 0.5, transparency: 60 },
  });
  s.addText('EduCore AI', {
    x: 0.4, y: 5.35, w: 2, h: 0.2,
    fontSize: 7, color: DS.slate, fontFace: DS.fontBody, italic: true,
  });
  const t = (docTitle || '').length > 50 ? docTitle.slice(0, 47) + '...' : (docTitle || '');
  s.addText(t, {
    x: 2.5, y: 5.35, w: 5, h: 0.2,
    fontSize: 7, color: DS.slate, fontFace: DS.fontBody, align: 'center',
  });
  s.addText(`${n} / ${total}`, {
    x: 8.8, y: 5.35, w: 0.8, h: 0.2,
    fontSize: 7, color: DS.slate, fontFace: DS.fontBody, align: 'right',
  });
}

// ─────────────────────────────────────────── Layouts

function renderCover(pptx, slide, n, total, docTitle) {
  const s = pptx.addSlide();
  s.background = { color: DS.navy };
  s.addShape('rtTriangle', { x: 6, y: 0, w: 4, h: 3, fill: { color: DS.ocean, transparency: 30 }, line: { width: 0 } });
  s.addShape('rect',       { x: 0, y: 1.8, w: 0.12, h: 2.1, fill: { color: DS.mint }, line: { width: 0 } });
  s.addText(slide.title || docTitle, {
    x: 0.5, y: 1.7, w: 8.5, h: 1.6,
    fontSize: 36, bold: true, color: DS.white, fontFace: DS.fontTitle, wrap: true, valign: 'middle',
  });
  if (slide.content?.[0]) {
    s.addText(slide.content[0], {
      x: 0.5, y: 3.4, w: 7.5, h: 0.6,
      fontSize: 16, color: DS.ice, fontFace: DS.fontBody, italic: true,
    });
  }
  s.addShape('roundRect', { x: 8.4, y: 4.6, w: 1.2, h: 0.4, fill: { color: DS.mint }, line: { width: 0 }, rectRadius: 0.1 });
  s.addText(`${total} slides`, {
    x: 8.4, y: 4.6, w: 1.2, h: 0.4,
    fontSize: 9, bold: true, color: DS.navy, fontFace: DS.fontBody, align: 'center', valign: 'middle',
  });
  addFooter(s, n, total, docTitle);
}

function renderObjectives(pptx, slide, n, total, docTitle) {
  const s = pptx.addSlide();
  s.background = { color: DS.white };
  s.addShape('rect', { x: 0, y: 0, w: DS.W, h: 1.1, fill: { color: DS.ocean }, line: { width: 0 } });
  s.addText('Objetivos de Aprendizagem', {
    x: 0.5, y: 0, w: 9, h: 1.1,
    fontSize: 24, bold: true, color: DS.white, fontFace: DS.fontTitle, valign: 'middle',
  });
  const colors = [DS.blue, DS.green, DS.orange, DS.purple, DS.teal];
  (slide.content || []).slice(0, 6).forEach((item, i) => {
    const y = 1.3 + i * 0.62;
    s.addShape('ellipse', { x: 0.3, y: y + 0.05, w: 0.38, h: 0.38, fill: { color: colors[i % colors.length] }, line: { width: 0 } });
    s.addText(String(i + 1), { x: 0.3, y: y + 0.05, w: 0.38, h: 0.38, fontSize: 11, bold: true, color: DS.white, fontFace: DS.fontBody, align: 'center', valign: 'middle' });
    s.addText(item, { x: 0.85, y, w: 8.8, h: 0.48, fontSize: 13, color: DS.slate, fontFace: DS.fontBody, valign: 'middle', wrap: true });
  });
  addFooter(s, n, total, docTitle);
}

function renderContentBullets(pptx, slide, n, total, docTitle) {
  const s = pptx.addSlide();
  s.background = { color: DS.white };
  const ac = accent(slide);
  s.addShape('rect', { x: 0, y: 0, w: DS.W, h: 1.0, fill: { color: DS.navy }, line: { width: 0 } });
  s.addShape('rect', { x: 0, y: 0, w: DS.W, h: 0.06, fill: { color: ac }, line: { width: 0 } });
  s.addText(slide.title, { x: 0.4, y: 0.06, w: 9.2, h: 0.94, fontSize: 22, bold: true, color: DS.white, fontFace: DS.fontTitle, valign: 'middle' });
  (slide.content || []).slice(0, 6).forEach((item, i) => {
    const y = 1.15 + i * 0.66;
    s.addShape('ellipse', { x: 0.35, y: y + 0.16, w: 0.12, h: 0.12, fill: { color: ac }, line: { width: 0 } });
    s.addText(item, { x: 0.6, y, w: 9.0, h: 0.56, fontSize: 14, color: DS.slate, fontFace: DS.fontBody, valign: 'middle', wrap: true });
  });
  addFooter(s, n, total, docTitle);
}

function renderTwoColumn(pptx, slide, n, total, docTitle) {
  const s = pptx.addSlide();
  s.background = { color: DS.white };
  const ac = accent(slide);
  s.addShape('rect', { x: 0, y: 0, w: DS.W, h: 1.0, fill: { color: DS.ocean }, line: { width: 0 } });
  s.addText(slide.title, { x: 0.4, y: 0, w: 9.2, h: 1.0, fontSize: 22, bold: true, color: DS.white, fontFace: DS.fontTitle, valign: 'middle' });
  s.addShape('rect', { x: 4.9, y: 1.1, w: 0.05, h: 4.0, fill: { color: ac, transparency: 40 }, line: { width: 0 } });
  const items = slide.content || [];
  const left  = items.filter((_, i) => i % 2 === 0).slice(0, 4);
  const right = items.filter((_, i) => i % 2 !== 0).slice(0, 4);
  s.addText('Aspecto A', { x: 0.3, y: 1.1, w: 4.4, h: 0.4, fontSize: 13, bold: true, color: ac, fontFace: DS.fontTitle });
  left.forEach((item, i) => s.addText(`• ${item}`, { x: 0.3, y: 1.6 + i * 0.7, w: 4.4, h: 0.6, fontSize: 13, color: DS.slate, fontFace: DS.fontBody, wrap: true }));
  s.addText('Aspecto B', { x: 5.2, y: 1.1, w: 4.4, h: 0.4, fontSize: 13, bold: true, color: ac, fontFace: DS.fontTitle });
  right.forEach((item, i) => s.addText(`• ${item}`, { x: 5.2, y: 1.6 + i * 0.7, w: 4.4, h: 0.6, fontSize: 13, color: DS.slate, fontFace: DS.fontBody, wrap: true }));
  addFooter(s, n, total, docTitle);
}

function renderQuoteHighlight(pptx, slide, n, total, docTitle) {
  const s = pptx.addSlide();
  s.background = { color: DS.light };
  const ac = accent(slide);
  s.addShape('rect', { x: 0, y: 0, w: 0.3, h: DS.H, fill: { color: ac }, line: { width: 0 } });
  s.addText('"', { x: 0.6, y: 0.3, w: 1.5, h: 1.5, fontSize: 120, color: ac, fontFace: DS.fontTitle, transparency: 70 });
  const quoteText = slide.content?.[0] || slide.title;
  s.addText(quoteText, { x: 0.6, y: 1.2, w: 9.0, h: 2.4, fontSize: 20, color: DS.navy, fontFace: DS.fontTitle, italic: true, wrap: true, valign: 'middle' });
  if (slide.content?.[1]) {
    s.addText(`— ${slide.content[1]}`, { x: 0.6, y: 3.8, w: 9.0, h: 0.5, fontSize: 13, color: DS.teal, fontFace: DS.fontBody, italic: true });
  }
  s.addText(slide.title, { x: 0.6, y: 0.15, w: 9.0, h: 0.4, fontSize: 11, color: DS.ocean, fontFace: DS.fontBody, bold: true });
  addFooter(s, n, total, docTitle);
}

function renderStatsNumbers(pptx, slide, n, total, docTitle) {
  const s = pptx.addSlide();
  s.background = { color: DS.white };
  const ac = accent(slide);
  s.addShape('rect', { x: 0, y: 0, w: DS.W, h: 0.9, fill: { color: DS.navy }, line: { width: 0 } });
  s.addText(slide.title, { x: 0.4, y: 0, w: 9.2, h: 0.9, fontSize: 21, bold: true, color: DS.white, fontFace: DS.fontTitle, valign: 'middle' });
  const items = (slide.content || []).slice(0, 4);
  const cardW = (DS.W - 0.6) / Math.max(items.length, 1);
  const bgColors = [DS.ocean, DS.teal, ac, DS.mint];
  items.forEach((item, i) => {
    const x = 0.3 + i * (cardW + 0.05);
    s.addShape('roundRect', { x, y: 1.1, w: cardW - 0.05, h: 3.8, fill: { color: bgColors[i % bgColors.length] }, line: { width: 0 }, rectRadius: 0.1 });
    const parts = item.split(/[:—–-]/);
    const stat  = parts[0]?.trim() || item;
    const label = parts.slice(1).join(' ').trim() || '';
    s.addText(stat, { x, y: 1.8, w: cardW - 0.05, h: 1.4, fontSize: stat.length < 8 ? 36 : 22, bold: true, color: DS.white, fontFace: DS.fontTitle, align: 'center', valign: 'middle', wrap: true });
    s.addText(label || stat, { x, y: 3.3, w: cardW - 0.05, h: 1.2, fontSize: 12, color: DS.white, fontFace: DS.fontBody, align: 'center', valign: 'top', wrap: true });
  });
  addFooter(s, n, total, docTitle);
}

function renderTimeline(pptx, slide, n, total, docTitle) {
  const s = pptx.addSlide();
  s.background = { color: DS.white };
  const ac = accent(slide);
  s.addShape('rect', { x: 0, y: 0, w: DS.W, h: 0.9, fill: { color: DS.teal }, line: { width: 0 } });
  s.addText(slide.title, { x: 0.4, y: 0, w: 9.2, h: 0.9, fontSize: 21, bold: true, color: DS.white, fontFace: DS.fontTitle, valign: 'middle' });
  const items = (slide.content || []).slice(0, 5);
  const stepW = (DS.W - 0.6) / Math.max(items.length, 1);
  s.addShape('rect', { x: 0.3, y: 2.6, w: DS.W - 0.6, h: 0.08, fill: { color: DS.slate, transparency: 60 }, line: { width: 0 } });
  items.forEach((item, i) => {
    const cx = 0.3 + stepW * i + stepW / 2;
    const isEven = i % 2 === 0;
    s.addShape('ellipse', { x: cx - 0.22, y: 2.42, w: 0.44, h: 0.44, fill: { color: ac }, line: { color: DS.white, width: 2 } });
    s.addText(String(i + 1), { x: cx - 0.22, y: 2.42, w: 0.44, h: 0.44, fontSize: 10, bold: true, color: DS.white, fontFace: DS.fontBody, align: 'center', valign: 'middle' });
    s.addShape('rect', { x: cx - 0.01, y: isEven ? 1.5 : 2.86, w: 0.02, h: 0.92, fill: { color: DS.slate, transparency: 60 }, line: { width: 0 } });
    s.addText(item, { x: cx - stepW / 2 + 0.05, y: isEven ? 1.0 : 3.1, w: stepW - 0.1, h: 1.4, fontSize: 11, color: DS.slate, fontFace: DS.fontBody, wrap: true, align: 'center', valign: isEven ? 'bottom' : 'top' });
  });
  addFooter(s, n, total, docTitle);
}

function renderSectionDivider(pptx, slide, n, total, docTitle) {
  const s = pptx.addSlide();
  const ac = accent(slide);
  s.background = { color: ac };
  s.addShape('rect', { x: 0, y: 3.5, w: DS.W, h: 2.125, fill: { color: DS.white, transparency: 92 }, line: { width: 0 } });
  s.addText('SEÇÃO', { x: 0.5, y: 1.0, w: 9, h: 0.6, fontSize: 14, bold: true, color: DS.white, fontFace: DS.fontBody, align: 'center', transparency: 70 });
  s.addText(slide.title, { x: 0.5, y: 1.7, w: 9, h: 2.0, fontSize: 38, bold: true, color: DS.white, fontFace: DS.fontTitle, align: 'center', valign: 'middle', wrap: true });
  if (slide.content?.[0]) {
    s.addText(slide.content[0], { x: 1.5, y: 3.8, w: 7, h: 0.6, fontSize: 14, color: DS.white, fontFace: DS.fontBody, align: 'center', italic: true });
  }
  addFooter(s, n, total, docTitle);
}

function renderSummary(pptx, slide, n, total, docTitle) {
  const s = pptx.addSlide();
  s.background = { color: DS.white };
  const ac = accent(slide);
  s.addShape('rect', { x: 0, y: 0, w: DS.W, h: 1.0, fill: { color: DS.navy }, line: { width: 0 } });
  s.addText(slide.title, { x: 0.4, y: 0, w: 9.2, h: 1.0, fontSize: 22, bold: true, color: DS.white, fontFace: DS.fontTitle, valign: 'middle' });
  const items = (slide.content || []).slice(0, 6);
  const cols = items.length <= 3 ? 1 : 2;
  const colW = cols === 1 ? 9.4 : 4.5;
  items.forEach((item, i) => {
    const col = cols === 1 ? 0 : Math.floor(i / Math.ceil(items.length / 2));
    const row = cols === 1 ? i : i % Math.ceil(items.length / 2);
    const x = 0.3 + col * (colW + 0.4);
    const y = 1.15 + row * 0.8;
    s.addShape('roundRect', { x, y, w: colW, h: 0.7, fill: { color: DS.light }, line: { color: ac, width: 1 }, rectRadius: 0.06 });
    s.addText(`✓  ${item}`, { x: x + 0.15, y, w: colW - 0.2, h: 0.7, fontSize: 12, color: DS.slate, fontFace: DS.fontBody, valign: 'middle', wrap: true });
  });
  addFooter(s, n, total, docTitle);
}

function renderAssessment(pptx, slide, n, total, docTitle) {
  const s = pptx.addSlide();
  s.background = { color: DS.white };
  const ac = accent(slide);
  s.addShape('rect', { x: 0, y: 0, w: DS.W, h: 1.0, fill: { color: DS.purple }, line: { width: 0 } });
  s.addText(slide.title, { x: 0.4, y: 0, w: 9.2, h: 1.0, fontSize: 22, bold: true, color: DS.white, fontFace: DS.fontTitle, valign: 'middle' });
  (slide.content || []).slice(0, 3).forEach((q, i) => {
    const y = 1.15 + i * 1.35;
    s.addShape('roundRect', { x: 0.3, y, w: 9.4, h: 1.2, fill: { color: DS.light }, line: { color: ac, width: 1 }, rectRadius: 0.08 });
    s.addShape('ellipse', { x: 0.35, y: y + 0.38, w: 0.44, h: 0.44, fill: { color: ac }, line: { width: 0 } });
    s.addText(String(i + 1), { x: 0.35, y: y + 0.38, w: 0.44, h: 0.44, fontSize: 12, bold: true, color: DS.white, fontFace: DS.fontBody, align: 'center', valign: 'middle' });
    s.addText(q, { x: 0.95, y: y + 0.1, w: 8.5, h: 1.0, fontSize: 13, color: DS.slate, fontFace: DS.fontBody, valign: 'middle', wrap: true });
  });
  addFooter(s, n, total, docTitle);
}

function renderClosing(pptx, slide, n, total, docTitle) {
  const s = pptx.addSlide();
  s.background = { color: DS.navy };
  s.addShape('rtTriangle', { x: 0, y: 2.6, w: 4, h: 3, fill: { color: DS.ocean, transparency: 40 }, line: { width: 0 } });
  s.addText(slide.title || 'Obrigado!', { x: 0.5, y: 1.2, w: 9, h: 1.8, fontSize: 44, bold: true, color: DS.white, fontFace: DS.fontTitle, align: 'center', valign: 'middle' });
  s.addShape('rect', { x: 3, y: 3.1, w: 4, h: 0.06, fill: { color: DS.mint }, line: { width: 0 } });
  if (slide.content?.[0]) {
    s.addText(slide.content[0], { x: 0.5, y: 3.3, w: 9, h: 0.8, fontSize: 15, color: DS.ice, fontFace: DS.fontBody, align: 'center', italic: true, wrap: true });
  }
  s.addText('EduCore AI', { x: 0.5, y: 4.5, w: 9, h: 0.4, fontSize: 10, color: DS.mint, fontFace: DS.fontBody, align: 'center', bold: true });
  addFooter(s, n, total, docTitle);
}

// ─────────────────────────────────────────── Layout Router
function renderSlide(pptx, slide, n, total, docTitle) {
  const layout = (slide.layout || 'content_bullets').toLowerCase();
  switch (layout) {
    case 'cover':           return renderCover(pptx, slide, n, total, docTitle);
    case 'objectives':      return renderObjectives(pptx, slide, n, total, docTitle);
    case 'two_column':      return renderTwoColumn(pptx, slide, n, total, docTitle);
    case 'quote_highlight': return renderQuoteHighlight(pptx, slide, n, total, docTitle);
    case 'stats_numbers':   return renderStatsNumbers(pptx, slide, n, total, docTitle);
    case 'timeline':        return renderTimeline(pptx, slide, n, total, docTitle);
    case 'section_divider': return renderSectionDivider(pptx, slide, n, total, docTitle);
    case 'summary':         return renderSummary(pptx, slide, n, total, docTitle);
    case 'assessment':      return renderAssessment(pptx, slide, n, total, docTitle);
    case 'closing':         return renderClosing(pptx, slide, n, total, docTitle);
    default:                return renderContentBullets(pptx, slide, n, total, docTitle);
  }
}

// ─────────────────────────────────────────── Main
async function generatePresentation(inputPath, outputPath) {
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'EduCore AI';
  pptx.title  = data.title;

  const slides = data.slides || [];
  slides.forEach((slide, i) => renderSlide(pptx, slide, i + 1, slides.length, data.title));

  await pptx.writeFile({ fileName: outputPath });
  console.log(`✅ Apresentação GOLD gerada: ${outputPath} (${slides.length} slides)`);
}

const [,, inputFile, outputFile] = process.argv;
if (!inputFile || !outputFile) {
  console.error('Uso: node generate_pptx.js <input.json> <output.pptx>');
  process.exit(1);
}

generatePresentation(inputFile, outputFile).catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
