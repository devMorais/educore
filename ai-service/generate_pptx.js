/**
 * EduCore — Gerador de Apresentações Padrão Ouro
 * Powered by PptxGenJS
 */

const pptxgen = require("pptxgenjs");
const fs = require("fs");
const path = require("path");

// Recebe os dados via argumento
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Uso: node generate_pptx.js <dados.json> <saida.pptx>");
  process.exit(1);
}

const inputFile = args[0];
const outputFile = args[1];

const data = JSON.parse(fs.readFileSync(inputFile, "utf-8"));

// ─── PALETA DE CORES EDUCORE ─────────────────────────────────────────────────
const C = {
  navy:    "0D1B2A",   // fundo escuro principal
  ocean:   "065A82",   // azul oceano — cor dominante
  teal:    "1C7293",   // teal suave
  mint:    "00B4D8",   // acento vibrante
  ice:     "CAF0F8",   // texto claro / destaques
  white:   "FFFFFF",
  offWhite:"F4F9FF",
  slate:   "2D4356",   // cards e fundos secundários
  muted:   "8EAEC4",   // texto secundário
  accent:  "FFB703",   // amarelo âmbar — callouts e números
};

// ─── TIPOGRAFIA ───────────────────────────────────────────────────────────────
const FONT_TITLE  = "Calibri";
const FONT_BODY   = "Calibri";

// ─── LAYOUT ───────────────────────────────────────────────────────────────────
const W = 10;     // largura do slide em polegadas
const H = 5.625;  // altura do slide em polegadas

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function makeShadow() {
  return { type: "outer", blur: 10, offset: 3, angle: 135, color: "000000", opacity: 0.18 };
}

function addFooter(slide, slideNum, total) {
  // Linha divisória sutil
  slide.addShape("rect", {
    x: 0.4, y: 5.3, w: W - 0.8, h: 0.02,
    fill: { color: C.teal, transparency: 40 },
    line: { color: C.teal, transparency: 40 },
  });
  // Logo / marca
  slide.addText("EduCore AI", {
    x: 0.4, y: 5.33, w: 2, h: 0.2,
    fontSize: 8, color: C.muted, fontFace: FONT_BODY, bold: true,
  });
  // Número de página
  slide.addText(`${slideNum} / ${total}`, {
    x: W - 1.2, y: 5.33, w: 0.8, h: 0.2,
    fontSize: 8, color: C.muted, fontFace: FONT_BODY, align: "right",
  });
}

// ─── SLIDE DE CAPA ────────────────────────────────────────────────────────────

function addCoverSlide(pres, title, totalSlides) {
  const slide = pres.addSlide();
  slide.background = { color: C.navy };

  // Forma decorativa — bloco teal à esquerda
  slide.addShape("rect", {
    x: 0, y: 0, w: 0.35, h: H,
    fill: { color: C.mint }, line: { color: C.mint },
  });

  // Bloco de destaque atrás do título
  slide.addShape("rect", {
    x: 0.5, y: 1.5, w: W - 1, h: 2.3,
    fill: { color: C.slate }, line: { color: C.slate },
    shadow: makeShadow(),
  });

  // Linha de acento laranja/amarelo
  slide.addShape("rect", {
    x: 0.5, y: 1.5, w: 0.07, h: 2.3,
    fill: { color: C.accent }, line: { color: C.accent },
  });

  // Título principal
  slide.addText(title, {
    x: 0.7, y: 1.65, w: W - 1.2, h: 1.6,
    fontSize: 34, bold: true, color: C.white,
    fontFace: FONT_TITLE, valign: "middle",
    margin: 0,
  });

  // Subtítulo
  slide.addText("Gerado automaticamente pelo EduCore · IA Educacional", {
    x: 0.7, y: 3.45, w: W - 1.4, h: 0.35,
    fontSize: 12, color: C.mint, fontFace: FONT_BODY, italic: true, margin: 0,
  });

  // Badge inferior
  slide.addShape("rect", {
    x: 0.5, y: 4.8, w: 2.2, h: 0.38,
    fill: { color: C.ocean }, line: { color: C.ocean },
    rectRadius: 0.06,
  });
  slide.addText(`${totalSlides} slides`, {
    x: 0.5, y: 4.8, w: 2.2, h: 0.38,
    fontSize: 10, color: C.white, fontFace: FONT_BODY,
    bold: true, align: "center", valign: "middle", margin: 0,
  });
}

// ─── SLIDE DE CONTEÚDO PADRÃO ─────────────────────────────────────────────────

function addContentSlide(pres, slideData, idx, total) {
  const slide = pres.addSlide();
  slide.background = { color: C.offWhite };

  // Header escuro
  slide.addShape("rect", {
    x: 0, y: 0, w: W, h: 1.1,
    fill: { color: C.ocean }, line: { color: C.ocean },
  });

  // Número do slide no header
  slide.addText(String(idx).padStart(2, "0"), {
    x: 0.25, y: 0.08, w: 0.7, h: 0.95,
    fontSize: 28, bold: true, color: C.mint,
    fontFace: FONT_TITLE, valign: "middle", align: "center", margin: 0,
  });

  // Divisor vertical
  slide.addShape("rect", {
    x: 0.98, y: 0.18, w: 0.03, h: 0.75,
    fill: { color: C.ice, transparency: 40 }, line: { color: C.ice, transparency: 40 },
  });

  // Título do slide
  slide.addText(slideData.title || "", {
    x: 1.1, y: 0.1, w: W - 1.4, h: 0.9,
    fontSize: 22, bold: true, color: C.white,
    fontFace: FONT_TITLE, valign: "middle", margin: 0,
  });

  // Conteúdo — bullets visuais
  const items = slideData.content || [];

  if (items.length <= 4) {
    // Layout em cards lado a lado se poucos itens
    addCardLayout(slide, items);
  } else {
    // Layout em lista rica para muitos itens
    addListLayout(slide, items);
  }

  // Notas do apresentador
  if (slideData.notes) {
    slide.addNotes(slideData.notes);
  }

  addFooter(slide, idx, total);
}

// ─── LAYOUT EM CARDS ──────────────────────────────────────────────────────────

function addCardLayout(slide, items) {
  const count = items.length;
  const cardW = count <= 2 ? 4.2 : count === 3 ? 2.8 : 2.1;
  const startX = (W - cardW * count - 0.2 * (count - 1)) / 2;

  items.forEach((item, i) => {
    const x = startX + i * (cardW + 0.2);

    // Card branco com sombra
    slide.addShape("rect", {
      x, y: 1.3, w: cardW, h: 3.7,
      fill: { color: C.white }, line: { color: "E2EAF0", width: 1 },
      shadow: makeShadow(),
    });

    // Acento superior colorido
    slide.addShape("rect", {
      x, y: 1.3, w: cardW, h: 0.08,
      fill: { color: C.mint }, line: { color: C.mint },
    });

    // Número do item em destaque
    slide.addShape("rect", {
      x: x + 0.15, y: 1.5, w: 0.42, h: 0.42,
      fill: { color: C.ocean }, line: { color: C.ocean },
    });
    slide.addText(String(i + 1), {
      x: x + 0.15, y: 1.5, w: 0.42, h: 0.42,
      fontSize: 14, bold: true, color: C.white,
      fontFace: FONT_TITLE, align: "center", valign: "middle", margin: 0,
    });

    // Texto do item
    slide.addText(item, {
      x: x + 0.15, y: 2.05, w: cardW - 0.3, h: 2.8,
      fontSize: 13, color: C.navy, fontFace: FONT_BODY,
      valign: "top", wrap: true, margin: 0,
    });
  });
}

// ─── LAYOUT EM LISTA RICA ─────────────────────────────────────────────────────

function addListLayout(slide, items) {
  const maxItems = Math.min(items.length, 7);
  const itemH = 3.5 / maxItems;

  items.slice(0, maxItems).forEach((item, i) => {
    const y = 1.3 + i * itemH;

    // Linha zebra alternada
    if (i % 2 === 0) {
      slide.addShape("rect", {
        x: 0.4, y, w: W - 0.8, h: itemH,
        fill: { color: "EBF4FF", transparency: 20 }, line: { color: "EBF4FF", transparency: 20 },
      });
    }

    // Bullet colorido
    slide.addShape("rect", {
      x: 0.4, y: y + itemH * 0.3, w: 0.06, h: itemH * 0.4,
      fill: { color: C.mint }, line: { color: C.mint },
    });

    // Texto
    slide.addText(item, {
      x: 0.65, y, w: W - 1.1, h: itemH,
      fontSize: 14, color: C.navy, fontFace: FONT_BODY,
      valign: "middle", wrap: true, margin: 0,
    });
  });
}

// ─── SLIDE DE ENCERRAMENTO ────────────────────────────────────────────────────

function addEndSlide(pres, title) {
  const slide = pres.addSlide();
  slide.background = { color: C.navy };

  slide.addShape("rect", {
    x: 0, y: 0, w: 0.35, h: H,
    fill: { color: C.accent }, line: { color: C.accent },
  });

  slide.addShape("rect", {
    x: 0.5, y: 1.8, w: W - 1, h: 2,
    fill: { color: C.slate }, line: { color: C.slate },
    shadow: makeShadow(),
  });

  slide.addShape("rect", {
    x: 0.5, y: 1.8, w: 0.07, h: 2,
    fill: { color: C.mint }, line: { color: C.mint },
  });

  slide.addText("Obrigado!", {
    x: 0.7, y: 1.9, w: W - 1.2, h: 0.8,
    fontSize: 36, bold: true, color: C.white, fontFace: FONT_TITLE, margin: 0,
  });

  slide.addText(`${title} · Gerado pelo EduCore`, {
    x: 0.7, y: 2.8, w: W - 1.2, h: 0.4,
    fontSize: 13, color: C.ice, fontFace: FONT_BODY, italic: true, margin: 0,
  });

  slide.addText("educore.com.br", {
    x: 0.7, y: 3.4, w: 3, h: 0.3,
    fontSize: 11, color: C.mint, fontFace: FONT_BODY, bold: true, margin: 0,
  });
}

// ─── GERAÇÃO PRINCIPAL ────────────────────────────────────────────────────────

async function generate() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "EduCore AI";
  pres.title = data.title || "Apresentação EduCore";

  const slides = data.slides || [];
  const total = slides.length + 1; // +1 para o slide final

  // Capa
  addCoverSlide(pres, data.title || "Apresentação", total);

  // Conteúdo
  slides.forEach((slideData, idx) => {
    addContentSlide(pres, slideData, idx + 1, total);
  });

  // Encerramento
  addEndSlide(pres, data.title || "Apresentação");

  await pres.writeFile({ fileName: outputFile });
  console.log(`✅ Apresentação gerada: ${outputFile}`);
}

generate().catch((err) => {
  console.error("Erro:", err.message);
  process.exit(1);
});
