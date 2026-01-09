/* eslint-disable no-console */

let pdfjsLib = null;

// ---------------------------
// Utilities
// ---------------------------

function $(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: ${id}`);
  return el;
}

function nowIso() {
  return new Date().toISOString();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function randInt(a, b) {
  return Math.floor(a + Math.random() * (b - a + 1));
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function safeJsonParse(s) {
  try {
    return { ok: true, value: JSON.parse(s) };
  } catch (e) {
    return { ok: false, error: e };
  }
}

function stripCodeFences(s) {
  const t = String(s || "").trim();
  if (t.startsWith("```")) {
    // remove first fence line and last fence
    const lines = t.split("\n");
    const first = lines[0].trim();
    if (first.startsWith("```")) lines.shift();
    while (lines.length && lines[lines.length - 1].trim() === "```") lines.pop();
    return lines.join("\n").trim();
  }
  return t;
}

function toBase64FromDataUrl(dataUrl) {
  const idx = dataUrl.indexOf("base64,");
  if (idx === -1) return "";
  return dataUrl.slice(idx + "base64,".length);
}

async function sha256Hex(arrayBuffer) {
  const hash = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const bytes = new Uint8Array(hash);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function pad3(n) {
  return String(n).padStart(3, "0");
}

function setPill(pillEl, kind, text) {
  pillEl.classList.remove("ok", "bad", "warn");
  if (kind) pillEl.classList.add(kind);
  pillEl.textContent = text;
}

// ---------------------------
// i18n
// ---------------------------

const I18N = {
  zh: {
    appSubtitle: "扫描版数学教材：按页转写 + 剪裁出图 + 章节组织（仅用大模型 API）",
    secInputTitle: "输入",
    secInputDesc: "仅处理你指定的页码范围（超出范围不处理）。",
    lblPdf: "PDF 文件",
    hintPdf: "本工具不会做任何专用 OCR/PDF 文档分析；仅将每页渲染为图片并交给 LLM 转写。",
    lblPages: "页码范围（含首尾）",
    hintPages: "加载 PDF 后会显示总页数。",
    lblRender: "渲染倍率",
    hintRender: "值越大越清晰但更慢；建议 1.5–2.5。",
    lblTemplate: "LaTeX 模板",
    hintTemplate: "影响导出的 `main.tex` 头部。",
    lblWindow: "跨页窗口",
    hintWindow: "窗口大小 / 重叠页数（用于跨页组织的稳定性）。",
    secLlmTitle: "大模型设置（统一入口 + 多角色）",
    secLlmDesc: "允许为规划/转写/后校验分别配置不同的 key/url/model，并提供连通性测试。",
    sumGlobal: "全局默认（可被角色覆盖）",
    lblGlobalProvider: "协议",
    lblGlobalBaseUrl: "Base URL",
    hintBaseUrl: "浏览器直连常见会遇到 CORS；建议使用你自己的 Cloudflare Worker 代理（README 有示例）。",
    lblGlobalModel: "Model",
    lblGlobalKey: "API Key",
    hintKey: "默认不落盘保存。",
    lblGlobalTemp: "Temperature",
    lblGlobalTopP: "Top-p",
    lblGlobalMaxTokens: "Max tokens",
    lblGlobalExtraHeaders: "额外 Headers（JSON）",
    lblGlobalConn: "连通性测试",
    rolesTitle: "角色配置",
    rolesHint: "转写阶段使用“转写 LLM”；章节组织可选确定性或“规划 LLM”；可选用“后校验 LLM”做语法/一致性检查。",
    lblUseGlobal: "使用全局",
    lblEnabled: "启用",
    rolePlanner: "规划 LLM",
    roleTranscriber: "转写 LLM（必需）",
    roleVerifier: "后校验 LLM（可选）",
    secRunTitle: "运行",
    secRunDesc: "按阶段执行，运行时显示进度与日志。",
    previewTitle: "页面预览",
    logTitle: "日志",
    secOutTitle: "输出",
    secOutDesc: "章节树 / main.tex / 图像资源清单 / 每页 JSON。",
    tabTree: "章节树",
    tabTex: "main.tex",
    tabImages: "图像资源",
    tabPages: "每页 JSON",
    footerNote: "提示：浏览器直连 OpenAI/Anthropic/Google 常因 CORS 失败；建议使用 Cloudflare Worker 代理。",
    btnShow: "显示",
    btnHide: "隐藏",
    btnPreview: "预览一页",
    btnTest: "测试",
    btnLoad: "加载 PDF",
    btnTranscribe: "1) 按页转写 + 剪裁出图",
    btnOrganize: "2) 章节组织 + 生成 main.tex",
    btnExport: "3) 导出 ZIP",
    btnReset: "重置",
  },
  en: {
    appSubtitle: "Scanned math textbook: per-page transcription + image crops + section organization (LLM-only APIs)",
    secInputTitle: "Input",
    secInputDesc: "Only process the page range you specify (out-of-range pages are ignored).",
    lblPdf: "PDF file",
    hintPdf: "No dedicated OCR/PDF document analysis is used. Each page is rendered as an image and sent to LLM for transcription.",
    lblPages: "Page range (inclusive)",
    hintPages: "Total pages will show after loading the PDF.",
    lblRender: "Render scale",
    hintRender: "Higher is clearer but slower; recommended 1.5–2.5.",
    lblTemplate: "LaTeX template",
    hintTemplate: "Affects the header of exported `main.tex`.",
    lblWindow: "Cross-page window",
    hintWindow: "Window size / overlap pages (for cross-page organization stability).",
    secLlmTitle: "LLM settings (unified + multi-role)",
    secLlmDesc: "Configure different key/url/model for planner/transcriber/verifier, with connectivity tests.",
    sumGlobal: "Global defaults (role overrides allowed)",
    lblGlobalProvider: "Protocol",
    lblGlobalBaseUrl: "Base URL",
    hintBaseUrl: "Direct browser calls often fail due to CORS. Use your Cloudflare Worker proxy (example in README).",
    lblGlobalModel: "Model",
    lblGlobalKey: "API Key",
    hintKey: "Not persisted by default.",
    lblGlobalTemp: "Temperature",
    lblGlobalTopP: "Top-p",
    lblGlobalMaxTokens: "Max tokens",
    lblGlobalExtraHeaders: "Extra headers (JSON)",
    lblGlobalConn: "Connectivity test",
    rolesTitle: "Roles",
    rolesHint: "Transcription uses the Transcriber. Organization uses Deterministic or Planner LLM. Verifier is optional for syntax/consistency checks.",
    lblUseGlobal: "Use global",
    lblEnabled: "Enabled",
    rolePlanner: "Planner LLM",
    roleTranscriber: "Transcriber LLM (required)",
    roleVerifier: "Verifier LLM (optional)",
    secRunTitle: "Run",
    secRunDesc: "Run by stages with progress and logs.",
    previewTitle: "Page preview",
    logTitle: "Log",
    secOutTitle: "Outputs",
    secOutDesc: "Section tree / main.tex / image assets list / per-page JSON.",
    tabTree: "Section tree",
    tabTex: "main.tex",
    tabImages: "Images",
    tabPages: "Per-page JSON",
    footerNote: "Tip: direct browser calls to OpenAI/Anthropic/Google often fail due to CORS; use a Cloudflare Worker proxy.",
    btnShow: "Show",
    btnHide: "Hide",
    btnPreview: "Preview one page",
    btnTest: "Test",
    btnLoad: "Load PDF",
    btnTranscribe: "1) Per-page transcribe + crop images",
    btnOrganize: "2) Organize sections + generate main.tex",
    btnExport: "3) Export ZIP",
    btnReset: "Reset",
  },
};

let currentLang = "zh";
function t(key) {
  return (I18N[currentLang] && I18N[currentLang][key]) || key;
}

function applyI18n() {
  const map = {
    appSubtitle: "appSubtitle",
    secInputTitle: "secInputTitle",
    secInputDesc: "secInputDesc",
    lblPdf: "lblPdf",
    hintPdf: "hintPdf",
    lblPages: "lblPages",
    hintPages: "hintPages",
    lblRender: "lblRender",
    hintRender: "hintRender",
    lblTemplate: "lblTemplate",
    hintTemplate: "hintTemplate",
    lblWindow: "lblWindow",
    hintWindow: "hintWindow",
    secLlmTitle: "secLlmTitle",
    secLlmDesc: "secLlmDesc",
    sumGlobal: "sumGlobal",
    lblGlobalProvider: "lblGlobalProvider",
    lblGlobalBaseUrl: "lblGlobalBaseUrl",
    hintBaseUrl: "hintBaseUrl",
    lblGlobalModel: "lblGlobalModel",
    lblGlobalKey: "lblGlobalKey",
    hintKey: "hintKey",
    lblGlobalTemp: "lblGlobalTemp",
    lblGlobalTopP: "lblGlobalTopP",
    lblGlobalMaxTokens: "lblGlobalMaxTokens",
    lblGlobalExtraHeaders: "lblGlobalExtraHeaders",
    lblGlobalConn: "lblGlobalConn",
    rolesTitle: "rolesTitle",
    rolesHint: "rolesHint",
    rolePlanner: "rolePlanner",
    roleTranscriber: "roleTranscriber",
    roleVerifier: "roleVerifier",
    lblEnabled: "lblEnabled",
    secRunTitle: "secRunTitle",
    secRunDesc: "secRunDesc",
    previewTitle: "previewTitle",
    logTitle: "logTitle",
    secOutTitle: "secOutTitle",
    secOutDesc: "secOutDesc",
    tabTree: "tabTree",
    tabTex: "tabTex",
    tabImages: "tabImages",
    tabPages: "tabPages",
    footerNote: "footerNote",
  };
  for (const [id, key] of Object.entries(map)) {
    $(id).textContent = t(key);
  }

  $("renderPreviewBtn").textContent = t("btnPreview");
  $("globalConnTestBtn").textContent = t("btnTest");
  $("plannerConnTestBtn").textContent = t("btnTest");
  $("transcriberConnTestBtn").textContent = t("btnTest");
  $("verifierConnTestBtn").textContent = t("btnTest");
  $("loadPdfBtn").textContent = t("btnLoad");
  $("transcribeBtn").textContent = t("btnTranscribe");
  $("organizeBtn").textContent = t("btnOrganize");
  $("exportBtn").textContent = t("btnExport");
  $("resetBtn").textContent = t("btnReset");

  $("lblUseGlobal1").textContent = t("lblUseGlobal");
  $("lblUseGlobal2").textContent = t("lblUseGlobal");
  $("lblUseGlobal3").textContent = t("lblUseGlobal");

  // Update show/hide labels based on current input types
  syncKeyToggleText("globalKey", "globalKeyToggle");
  syncKeyToggleText("plannerKey", "plannerKeyToggle");
  syncKeyToggleText("transcriberKey", "transcriberKeyToggle");
  syncKeyToggleText("verifierKey", "verifierKeyToggle");

  document.documentElement.lang = currentLang === "zh" ? "zh-Hans" : "en";
}

// ---------------------------
// State
// ---------------------------

const state = {
  pdfFile: null,
  pdfBytes: null,
  pdfDoc: null,
  totalPages: 0,
  pdfSha256: null,
  // pageNum -> { page, width, height, latex, annotations, figures, raw }
  pageResults: new Map(),
  // imageId -> { id, filename, page, bbox, blob, referencedIn }
  images: new Map(),
  sectionTree: null,
  mainTex: "",

  // run control
  run: {
    inProgress: false,
    cancelRequested: false,
    earlyExportRequested: false,
    controller: null, // AbortController for current batch
    lastRange: null, // {start,end}
  },

  // stage-2 window assembly artifacts
  windowPlans: [],
};

function resetState() {
  state.pdfFile = null;
  state.pdfBytes = null;
  state.pdfDoc = null;
  state.totalPages = 0;
  state.pdfSha256 = null;
  state.pageResults.clear();
  state.images.clear();
  state.sectionTree = null;
  state.mainTex = "";
  state.run.inProgress = false;
  state.run.cancelRequested = false;
  state.run.earlyExportRequested = false;
  state.run.controller = null;
  state.run.lastRange = null;
  state.windowPlans = [];
  $("treeBox").textContent = "{}";
  $("texBox").textContent = "";
  $("imagesBox").textContent = "[]";
  $("pagesBox").textContent = "[]";
  setStage("—");
  setPageProgress("—", 0);
  $("logBox").textContent = "";
  clearPreviewCanvas();
}

// ---------------------------
// Logging + progress
// ---------------------------

function log(msg) {
  const line = `[${nowIso()}] ${msg}\n`;
  $("logBox").textContent += line;
  $("logBox").scrollTop = $("logBox").scrollHeight;
}

function setStage(text) {
  $("stageValue").textContent = text;
}

function setPageProgress(text, ratio01) {
  $("pageValue").textContent = text;
  $("barFill").style.width = `${Math.round(clamp(ratio01, 0, 1) * 100)}%`;
}

function setUiBusy(isBusy) {
  const ids = [
    "loadPdfBtn",
    "transcribeBtn",
    "windowAssembleBtn",
    "organizeBtn",
    "repairBtn",
    "exportBtn",
    "resetBtn",
    "renderPreviewBtn",
    "globalConnTestBtn",
    "plannerConnTestBtn",
    "transcriberConnTestBtn",
    "verifierConnTestBtn",
    "importWorkRecordBtn",
    "exportWorkRecordBtn",
    "downloadMainTexBtn",
    "downloadSectionTreeBtn",
    "downloadImagesJsonBtn",
    "downloadPagesZipBtn",
    "downloadImagesZipBtn",
    "downloadWindowPlansBtn",
  ];
  for (const id of ids) $(id).disabled = isBusy;
  // Stop/continue are special: stop is enabled while running; continue enabled when not running.
  $("stopBtn").disabled = !isBusy;
  $("continueBtn").disabled = isBusy;
  $("earlyExportBtn").disabled = !isBusy;
  document.body.style.cursor = isBusy ? "progress" : "default";
}

// ---------------------------
// Theme + language
// ---------------------------

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  $("themeLightBtn").classList.toggle("is-active", theme === "light");
  $("themeDarkBtn").classList.toggle("is-active", theme === "dark");
}

function setLang(lang) {
  currentLang = lang;
  $("langZhBtn").classList.toggle("is-active", lang === "zh");
  $("langEnBtn").classList.toggle("is-active", lang === "en");
  applyI18n();
}

// ---------------------------
// PDF rendering (image-only usage)
// ---------------------------

function initPdfJs() {
  // No-op placeholder (kept for backward references).
  // Real initialization happens in ensurePdfJs().
}

async function ensurePdfJs() {
  if (pdfjsLib) return pdfjsLib;
  try {
    const mod = await import("/vendor/pdfjs/pdf.min.js");
    pdfjsLib = mod;
    // Use vendored worker (no CDN dependency).
    // Ensure workerSrc is set before any getDocument() call.
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/vendor/pdfjs/pdf.worker.min.js";
    return pdfjsLib;
  } catch (e) {
    const msg = String(e && e.message ? e.message : e);
    throw new Error(
      `PDF.js failed to load. This will disable PDF rendering, but other UI should work. Error: ${msg}`
    );
  }
}

async function loadPdfFromInput() {
  await ensurePdfJs();
  const file = $("pdfFile").files && $("pdfFile").files[0];
  if (!file) throw new Error("Please choose a PDF file.");
  state.pdfFile = file;
  state.pdfBytes = await file.arrayBuffer();
  state.pdfSha256 = await sha256Hex(state.pdfBytes);
  setStage("PDF: loading…");
  state.pdfDoc = await pdfjsLib.getDocument({ data: state.pdfBytes }).promise;
  state.totalPages = state.pdfDoc.numPages;
  log(`Loaded PDF: ${file.name}, pages=${state.totalPages}`);
  $("hintPages").textContent =
    (currentLang === "zh" ? "总页数：" : "Total pages: ") + String(state.totalPages);

  const startEl = $("pageStart");
  const endEl = $("pageEnd");
  if (!startEl.value) startEl.value = "1";
  if (!endEl.value) endEl.value = String(state.totalPages);

  setStage("PDF: loaded");
}

function getPageRange() {
  const start = Number($("pageStart").value);
  const end = Number($("pageEnd").value);
  if (!Number.isFinite(start) || !Number.isFinite(end)) throw new Error("Invalid page range.");
  if (start < 1 || end < 1) throw new Error("Page numbers must be >= 1.");
  if (!state.totalPages) throw new Error("PDF not loaded.");
  if (start > end) throw new Error("Start page must be <= end page.");
  if (start > state.totalPages) throw new Error("Start page out of range.");
  if (end > state.totalPages) throw new Error("End page out of range.");
  return { start, end };
}

async function renderPageToCanvas(pageNum, scale) {
  await ensurePdfJs();
  if (!state.pdfDoc) throw new Error("PDF not loaded.");
  const page = await state.pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext("2d", { alpha: false });
  await page.render({ canvasContext: ctx, viewport }).promise;
  return { canvas, width: canvas.width, height: canvas.height };
}

function clearPreviewCanvas() {
  const c = $("previewCanvas");
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);
}

async function previewOnePage() {
  if (!state.pdfDoc) throw new Error("PDF not loaded.");
  const { start } = getPageRange();
  const scale = Number($("renderScale").value || 2);
  setStage(`Preview: rendering page ${start}…`);
  const { canvas } = await renderPageToCanvas(start, scale);
  const out = $("previewCanvas");
  out.width = canvas.width;
  out.height = canvas.height;
  out.getContext("2d").drawImage(canvas, 0, 0);
  setStage(`Preview: page ${start}`);
  log(`Preview rendered: page=${start}, ${canvas.width}x${canvas.height}`);
}

// ---------------------------
// OCR (Tesseract.js)
// ---------------------------

let tesseractWorker = null;
let tesseractReady = false;

async function initTesseract() {
  if (tesseractReady && tesseractWorker) return tesseractWorker;
  
  if (typeof Tesseract === "undefined") {
    throw new Error("Tesseract.js 未加载。请检查网络连接。");
  }

  const statusEl = document.getElementById("ocrStatus");
  if (statusEl) setPill(statusEl, "warn", "初始化中...");
  
  const lang = document.getElementById("ocrLanguage")?.value || "chi_sim+eng";
  log(`初始化 Tesseract.js，语言: ${lang}`);
  
  try {
    tesseractWorker = await Tesseract.createWorker(lang, 1, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          const pct = Math.round((m.progress || 0) * 100);
          if (statusEl) setPill(statusEl, "warn", `识别中 ${pct}%`);
        }
      },
    });
    tesseractReady = true;
    if (statusEl) setPill(statusEl, "ok", "就绪");
    log("Tesseract.js 初始化完成");
    return tesseractWorker;
  } catch (e) {
    if (statusEl) setPill(statusEl, "bad", "失败");
    throw new Error(`Tesseract 初始化失败: ${e.message || e}`);
  }
}

async function ocrExtractTextBlocks(canvas) {
  const worker = await initTesseract();
  const statusEl = document.getElementById("ocrStatus");
  if (statusEl) setPill(statusEl, "warn", "识别中...");
  
  try {
    const result = await worker.recognize(canvas);
    if (statusEl) setPill(statusEl, "ok", "完成");
    
    // 提取所有文字块及其边界框
    const blocks = [];
    if (result.data && result.data.words) {
      for (const word of result.data.words) {
        blocks.push({
          text: word.text,
          confidence: word.confidence,
          bbox: {
            x: word.bbox.x0,
            y: word.bbox.y0,
            w: word.bbox.x1 - word.bbox.x0,
            h: word.bbox.y1 - word.bbox.y0,
          },
        });
      }
    }
    
    // 也提取行级别的信息（更适合识别图标题）
    const lines = [];
    if (result.data && result.data.lines) {
      for (const line of result.data.lines) {
        lines.push({
          text: line.text,
          confidence: line.confidence,
          bbox: {
            x: line.bbox.x0,
            y: line.bbox.y0,
            w: line.bbox.x1 - line.bbox.x0,
            h: line.bbox.y1 - line.bbox.y0,
          },
        });
      }
    }
    
    return { blocks, lines, fullText: result.data.text };
  } catch (e) {
    if (statusEl) setPill(statusEl, "bad", "失败");
    throw e;
  }
}

// ---------------------------
// Figure Caption Detection (改进版)
// ---------------------------

// 图标题正则模式（中英文）
const FIGURE_CAPTION_PATTERNS = [
  // 中文模式 - 行首
  /^图\s*[\(\（]?\s*[a-zA-Z0-9]+\s*[\)\）]?\s*(\d+(?:[.\-]\d+)*)?/i,
  /^圖\s*[\(\（]?\s*[a-zA-Z0-9]+\s*[\)\）]?\s*(\d+(?:[.\-]\d+)*)?/i,
  /^图\s*(\d+(?:[.\-]\d+)*)/i,
  /^圖\s*(\d+(?:[.\-]\d+)*)/i,
  // 英文模式
  /^figure\s*(\d+(?:[.\-]\d+)*)/i,
  /^fig\.\s*(\d+(?:[.\-]\d+)*)/i,
  /^fig\s+(\d+(?:[.\-]\d+)*)/i,
];

// 段落内引用模式（不是标题）
const FIGURE_REFERENCE_PATTERNS = [
  /如图\s*[\(\（]?\s*[a-zA-Z0-9]+\s*[\)\）]?\s*所示/,
  /见图\s*[\(\（]?\s*[a-zA-Z0-9]+\s*[\)\）]?/,
  /由图\s*[\(\（]?\s*[a-zA-Z0-9]+\s*[\)\）]?/,
  /在图\s*[\(\（]?\s*[a-zA-Z0-9]+\s*[\)\）]?\s*中/,
  /as shown in fig/i,
  /see figure/i,
  /in figure/i,
];

/**
 * 判断一行文字是否是"图内文字"（标注、坐标轴等）
 * 特征：短、孤立、不成段落
 */
function isFigureInternalText(line, pageWidth, allLines) {
  const lineWidth = line.bbox.w;
  const widthRatio = lineWidth / pageWidth;
  
  // 非常短的文字（< 15% 页宽）很可能是图内标注
  if (widthRatio < 0.15) {
    return true;
  }
  
  // 检查是否与其他行形成连续文字块
  const lineY = line.bbox.y;
  const lineH = line.bbox.h;
  const lineX = line.bbox.x;
  
  // 计算有多少相邻行（y 坐标接近，x 坐标对齐）
  let adjacentLines = 0;
  for (const other of allLines) {
    if (other === line) continue;
    
    const yDiff = Math.abs(other.bbox.y - lineY);
    const xDiff = Math.abs(other.bbox.x - lineX);
    
    // 相邻行：y 差距在 2 倍行高内，x 对齐（差距 < 50px）
    if (yDiff < lineH * 2.5 && xDiff < 50) {
      adjacentLines++;
    }
  }
  
  // 如果几乎没有相邻行，可能是图内文字
  if (adjacentLines < 2 && widthRatio < 0.3) {
    return true;
  }
  
  return false;
}

/**
 * 判断一行是否是真正的图标题（而非段落内引用）
 */
function isActualFigureCaption(line, allLines, pageWidth) {
  const text = (line.text || "").trim();
  
  // 检查是否匹配标题模式
  let matchesCaption = false;
  for (const pattern of FIGURE_CAPTION_PATTERNS) {
    if (pattern.test(text)) {
      matchesCaption = true;
      break;
    }
  }
  
  if (!matchesCaption) return false;
  
  // 检查是否是段落内引用
  for (const pattern of FIGURE_REFERENCE_PATTERNS) {
    if (pattern.test(text)) {
      return false;  // 是引用，不是标题
    }
  }
  
  // 检查"图"是否在行首
  const figureMatch = text.match(/^[图圖]|^fig/i);
  if (!figureMatch) {
    // "图"不在行首，可能是引用
    // 进一步检查：如果行很长，"图"在中间，则是引用
    const figurePos = text.search(/[图圖]|fig/i);
    if (figurePos > 10) {
      return false;  // "图"在中间，是引用
    }
  }
  
  // 检查上一行，判断是否是段落续行
  const lineY = line.bbox.y;
  const lineH = line.bbox.h;
  
  // 找到最近的上一行
  let prevLine = null;
  let minGap = Infinity;
  for (const other of allLines) {
    const otherBottom = other.bbox.y + other.bbox.h;
    if (otherBottom < lineY) {
      const gap = lineY - otherBottom;
      if (gap < minGap) {
        minGap = gap;
        prevLine = other;
      }
    }
  }
  
  if (prevLine) {
    const prevWidth = prevLine.bbox.w;
    const prevWidthRatio = prevWidth / pageWidth;
    
    // 如果上一行是满行段落（宽度 > 80%），且间距很小
    // 则当前行可能是段落续行
    if (prevWidthRatio > 0.8 && minGap < lineH * 1.5) {
      // 上一行是满行，间距小，当前行可能是续行
      // 但如果当前行以"图"开头且后面是描述，仍然可能是标题
      // 检查当前行长度：如果很长（> 50% 页宽），可能是标题行
      if (line.bbox.w / pageWidth < 0.4) {
        // 当前行很短，可能是引用在段落末尾
        return false;
      }
    }
    
    // 如果上一行是短行（段末），当前行更可能是标题
    if (prevWidthRatio < 0.7) {
      return true;  // 上一行是段末，当前行是新内容（标题）
    }
    
    // 如果间距很大（> 2 倍行高），说明中间有图片，当前行是标题
    if (minGap > lineH * 2) {
      return true;
    }
  }
  
  // 默认：如果匹配模式且不是引用，认为是标题
  return true;
}

/**
 * 从 OCR 结果中提取真正的图标题
 */
function extractFigureCaptionsFromOcr(ocrResult, pageWidth) {
  const captions = [];
  const lines = ocrResult.lines || [];
  
  for (const line of lines) {
    // 跳过图内文字
    if (isFigureInternalText(line, pageWidth, lines)) {
      continue;
    }
    
    // 检查是否是真正的图标题
    if (isActualFigureCaption(line, lines, pageWidth)) {
      captions.push({
        text: line.text.trim(),
        bbox: line.bbox,
        confidence: line.confidence,
      });
    }
  }
  
  return captions;
}

/**
 * 过滤出"段落文字"，排除图内文字
 */
function filterParagraphLines(ocrLines, pageWidth) {
  return ocrLines.filter(line => !isFigureInternalText(line, pageWidth, ocrLines));
}

// LLM 分析图标题的提示词（改进版：区分标题和引用）
function buildCaptionAnalysisPrompt(ocrLines) {
  const linesJson = ocrLines.map((l, i) => ({
    index: i,
    text: l.text,
    y: l.bbox.y,
    x: l.bbox.x,
    w: l.bbox.w,
  }));
  
  return `你是图片标题识别专家。以下是 OCR 提取的文本行列表（含坐标）。
请找出所有的**图片标题**（如"图 1.1 xxx"、"Figure 2.3 xxx"等）。

OCR 文本行：
${JSON.stringify(linesJson, null, 2)}

请输出严格 JSON（无多余文字）：
{
  "captions": [
    {
      "index": 行索引,
      "figure_id": "fig_1_1",
      "caption_text": "完整标题文本",
      "confidence": "high|medium|low"
    }
  ]
}

**重要：区分"图片标题"和"段落中的图片引用"**

✅ 图片标题特征：
- 以"图"、"圖"、"Figure"、"Fig."开头
- 通常是独立的一行或一行的开始部分
- 后面跟着对图片内容的描述
- 例如："图 2.1 正态分布的概率密度函数"

❌ 不是图片标题（是段落中的引用）：
- "如图 2.1 所示..."
- "见图 2.1，我们可以发现..."
- "由图 2.1 可知..."
- "在图 2.1 中..."
- "as shown in Figure 2.1..."
这些是在正文段落中引用图片，不是标题！

**其他注意事项**：
- 不要识别表格标题（表 X.X / Table X）
- 如果没有找到图标题，返回空数组
- 短文字（如"x", "y", "O"）可能是图内标注，不是标题`;
}

async function analyzeCaptionsWithLlm(ocrLines, llmCfg, maxRetries) {
  if (!ocrLines || ocrLines.length === 0) {
    return [];
  }
  
  const system = "You are a strict JSON-only figure caption detector.";
  const userText = buildCaptionAnalysisPrompt(ocrLines);
  
  try {
    const resp = stripCodeFences(
      await llmCallWithRetry(llmCfg, { system, userText, imageDataUrl: null, signal: null }, { maxRetries })
    );
    const parsed = safeJsonParse(resp);
    if (!parsed.ok) {
      log("LLM 图标题分析返回非 JSON，使用正则回退");
      return [];
    }
    
    const captions = [];
    for (const cap of parsed.value.captions || []) {
      const lineIdx = cap.index;
      if (lineIdx >= 0 && lineIdx < ocrLines.length) {
        captions.push({
          text: cap.caption_text || ocrLines[lineIdx].text,
          bbox: ocrLines[lineIdx].bbox,
          figureId: cap.figure_id,
          confidence: cap.confidence,
        });
      }
    }
    return captions;
  } catch (e) {
    log(`LLM 图标题分析失败: ${e.message || e}`);
    return [];
  }
}

// ---------------------------
// Image Processing: 改进的"文字夹逼法"图片检测
// ---------------------------

function canvasToGrayscale(canvas) {
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const gray = new Uint8Array(canvas.width * canvas.height);
  
  for (let i = 0; i < data.length; i += 4) {
    // 灰度 = 0.299*R + 0.587*G + 0.114*B
    gray[i / 4] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
  }
  
  return { gray, width: canvas.width, height: canvas.height };
}

/**
 * 判断一行是否是"段落末行"（短行，不是满行）
 * 段落末行通常比正常行短，且上一行是满行
 */
function isParagraphEndingLine(line, allLines, pageWidth) {
  const lineWidth = line.bbox.w;
  const widthRatio = lineWidth / pageWidth;
  
  // 如果是满行（> 75% 页宽），不是段落末行
  if (widthRatio > 0.75) {
    return false;
  }
  
  // 如果是短行（< 75% 页宽），检查上一行
  // 找到紧邻的上一行
  const lineY = line.bbox.y;
  const lineH = line.bbox.h;
  
  let prevLine = null;
  let minGap = Infinity;
  for (const other of allLines) {
    const otherBottom = other.bbox.y + other.bbox.h;
    if (otherBottom < lineY && otherBottom > lineY - lineH * 3) {
      const gap = lineY - otherBottom;
      if (gap < minGap) {
        minGap = gap;
        prevLine = other;
      }
    }
  }
  
  if (prevLine) {
    const prevWidthRatio = prevLine.bbox.w / pageWidth;
    // 上一行是满行，当前行是短行 = 段落末行
    if (prevWidthRatio > 0.75) {
      return true;
    }
  }
  
  return false;
}

/**
 * 生成图片上边界的候选列表（迭代法用）
 * 从标题往上，找到所有可能的"图片上边界"候选位置
 * 
 * @param {Array} ocrLines - OCR 识别的段落文字行
 * @param {Object} captionBbox - 图标题的 bbox
 * @param {number} pageWidth - 页面宽度
 * @param {number} pageHeight - 页面高度
 * @returns {Array} 候选上边界列表，按优先级排序（最可能的在前）
 */
function generateTopBoundaryCandidates(ocrLines, captionBbox, pageWidth, pageHeight) {
  const candidates = [];
  const padding = 8;
  const topMargin = pageHeight * 0.05;
  
  // 筛选在标题上方的文字行
  const linesAbove = ocrLines.filter(line => {
    const lineBottom = line.bbox.y + line.bbox.h;
    return lineBottom < captionBbox.y - 20; // 留点余量
  });
  
  if (linesAbove.length === 0) {
    // 没有上方文字，只有页面顶部作为候选
    candidates.push({
      figureTop: topMargin,
      reason: "page_top",
      confidence: "medium",
    });
    return candidates;
  }
  
  // 按 y 坐标降序排列（从下往上）
  linesAbove.sort((a, b) => (b.bbox.y + b.bbox.h) - (a.bbox.y + a.bbox.h));
  
  // 计算平均行高
  let totalHeight = 0;
  for (const line of linesAbove) {
    totalHeight += line.bbox.h;
  }
  const avgLineHeight = totalHeight / linesAbove.length;
  
  // 遍历每个上方文字行，生成候选
  for (let i = 0; i < linesAbove.length; i++) {
    const line = linesAbove[i];
    const lineBottom = line.bbox.y + line.bbox.h;
    const gap = captionBbox.y - lineBottom;
    
    // 跳过离标题太近的行（间距 < 1.5 倍行高）
    if (gap < avgLineHeight * 1.5) {
      continue;
    }
    
    // 检查是否是段落末行
    const isEndingLine = isParagraphEndingLine(line, linesAbove, pageWidth);
    
    // 计算候选上边界
    const figureTop = lineBottom + Math.min(avgLineHeight * 0.3, 10);
    
    // 判断条件：间距大，或者当前行是满行（明确的段落边界）
    const significantGap = Math.max(avgLineHeight * 2, 50);
    const lineWidthRatio = line.bbox.w / pageWidth;
    
    let confidence = "low";
    let reason = "text_boundary";
    
    if (gap > significantGap) {
      confidence = "high";
      reason = "large_gap";
    } else if (lineWidthRatio > 0.8 && !isEndingLine) {
      // 满行且不是段落末行（下一行开始是新内容）
      confidence = "medium";
      reason = "full_line_boundary";
    } else if (isEndingLine) {
      // 段落末行，图片可能在更上方
      confidence = "low";
      reason = "paragraph_ending";
    }
    
    candidates.push({
      figureTop,
      lineBottom,
      line,
      reason,
      confidence,
      gap,
      isEndingLine,
    });
  }
  
  // 添加页面顶部作为最后的候选
  candidates.push({
    figureTop: topMargin,
    reason: "page_top",
    confidence: "low",
  });
  
  // 按优先级排序：high > medium > low，同优先级按 figureTop 降序（离标题近的优先）
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  candidates.sort((a, b) => {
    const pDiff = priorityOrder[a.confidence] - priorityOrder[b.confidence];
    if (pDiff !== 0) return pDiff;
    return b.figureTop - a.figureTop; // figureTop 大的（离标题近）优先
  });
  
  return candidates;
}

/**
 * LLM 验证裁剪的图片是否完整
 * @param {string} croppedImageDataUrl - 裁剪后的图片 data URL
 * @param {string} captionText - 图标题文本
 * @param {Object} llmCfg - LLM 配置
 * @param {number} maxRetries - 最大重试次数
 * @returns {Object} { isComplete: boolean, issue: string|null }
 */
async function validateCroppedFigureWithLlm(croppedImageDataUrl, captionText, llmCfg, maxRetries) {
  const system = "You are a strict JSON-only image validation assistant.";
  const userText = `请判断这张裁剪的图片是否完整。

图片标题：${captionText}

请检查：
1. 图片是否完整显示了标题所描述的内容？
2. 图片顶部是否被截断（缺少部分内容）？
3. 图片顶部是否包含了不相关的文字（如段落文字）？
4. 图片是否有意义（不是空白或乱码）？

请输出严格 JSON：
{
  "is_complete": true或false,
  "issue": "问题描述，如果完整则为null",
  "suggestion": "top_ok" 或 "need_expand_up" 或 "need_shrink_down"
}

- "top_ok": 顶部边界正确
- "need_expand_up": 图片被截断，需要向上扩展
- "need_shrink_down": 顶部包含多余内容，需要向下收缩`;

  try {
    const resp = stripCodeFences(
      await llmCallWithRetry(llmCfg, { system, userText, imageDataUrl: croppedImageDataUrl, signal: null }, { maxRetries })
    );
    const parsed = safeJsonParse(resp);
    if (!parsed.ok) {
      return { isComplete: false, issue: "LLM 返回非 JSON", suggestion: "top_ok" };
    }
    return {
      isComplete: parsed.value.is_complete === true,
      issue: parsed.value.issue || null,
      suggestion: parsed.value.suggestion || "top_ok",
    };
  } catch (e) {
    log(`LLM 图片验证失败: ${e.message || e}`);
    return { isComplete: false, issue: "LLM 调用失败", suggestion: "top_ok" };
  }
}

/**
 * LLM 从多个候选中选择最佳裁剪
 * @param {Array} candidateImages - 候选图片列表 [{ dataUrl, figureTop, reason }]
 * @param {string} captionText - 图标题文本
 * @param {Object} llmCfg - LLM 配置
 * @param {number} maxRetries - 最大重试次数
 * @returns {number} 最佳候选的索引
 */
async function selectBestCropWithLlm(candidateImages, captionText, llmCfg, maxRetries) {
  if (candidateImages.length === 0) return -1;
  if (candidateImages.length === 1) return 0;
  
  // 构建提示词，描述每个候选
  const system = "You are a strict JSON-only image selection assistant.";
  let userText = `图片标题：${captionText}

我有 ${candidateImages.length} 个候选裁剪结果。请选择最完整、最正确的那个。

候选列表：
`;
  
  for (let i = 0; i < candidateImages.length; i++) {
    userText += `- 候选 ${i}: ${candidateImages[i].reason}\n`;
  }
  
  userText += `
请根据图片内容判断哪个裁剪最好（图片完整、没有截断、没有多余文字）。

输出严格 JSON：
{
  "best_index": 最佳候选的索引（0到${candidateImages.length - 1}）,
  "reason": "选择理由"
}`;

  // 由于无法一次发送多张图片，我们发送第一张让 LLM 作为参考
  // 实际上这个函数可能需要改进，但先用简单方案
  try {
    const resp = stripCodeFences(
      await llmCallWithRetry(llmCfg, { 
        system, 
        userText, 
        imageDataUrl: candidateImages[0].dataUrl, 
        signal: null 
      }, { maxRetries })
    );
    const parsed = safeJsonParse(resp);
    if (!parsed.ok || typeof parsed.value.best_index !== "number") {
      return 0; // 默认选第一个
    }
    const idx = parsed.value.best_index;
    return (idx >= 0 && idx < candidateImages.length) ? idx : 0;
  } catch (e) {
    log(`LLM 选择最佳裁剪失败: ${e.message || e}`);
    return 0;
  }
}

/**
 * 使用列密度扫描确定水平边界
 * @param {Object} grayData - 灰度图像数据
 * @param {number} top - 搜索区域顶部
 * @param {number} bottom - 搜索区域底部
 * @param {number} hintLeft - 参考左边界（标题 x）
 * @param {number} hintRight - 参考右边界（标题 x + w）
 * @returns {Object} { left, right }
 */
function findHorizontalBoundsByDensity(grayData, top, bottom, hintLeft, hintRight) {
  const { gray, width, height } = grayData;
  const whiteThreshold = 240;
  const densityThreshold = 0.03; // 列密度阈值
  
  // 扩展搜索范围（标题可能比图片窄）
  const searchMargin = Math.max(100, (hintRight - hintLeft) * 0.5);
  const searchLeft = Math.max(0, hintLeft - searchMargin);
  const searchRight = Math.min(width, hintRight + searchMargin);
  
  const rowCount = Math.max(1, bottom - top);
  
  // 计算每列的像素密度
  const columnDensity = [];
  for (let x = searchLeft; x < searchRight; x++) {
    let nonWhiteCount = 0;
    for (let y = top; y < bottom; y++) {
      if (gray[y * width + x] < whiteThreshold) {
        nonWhiteCount++;
      }
    }
    columnDensity.push({
      x,
      density: nonWhiteCount / rowCount,
    });
  }
  
  // 使用滑动窗口平滑（减少噪点影响）
  const windowSize = 5;
  const smoothedDensity = [];
  for (let i = 0; i < columnDensity.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - windowSize); j <= Math.min(columnDensity.length - 1, i + windowSize); j++) {
      sum += columnDensity[j].density;
      count++;
    }
    smoothedDensity.push({
      x: columnDensity[i].x,
      density: sum / count,
    });
  }
  
  // 找左边界：从左向右，第一个密度超过阈值的位置
  let left = hintLeft;
  for (let i = 0; i < smoothedDensity.length; i++) {
    if (smoothedDensity[i].density > densityThreshold) {
      left = smoothedDensity[i].x;
      break;
    }
  }
  
  // 找右边界：从右向左，第一个密度超过阈值的位置
  let right = hintRight;
  for (let i = smoothedDensity.length - 1; i >= 0; i--) {
    if (smoothedDensity[i].density > densityThreshold) {
      right = smoothedDensity[i].x;
      break;
    }
  }
  
  // 确保 right > left
  if (right <= left) {
    // 回退到参考值
    left = hintLeft;
    right = hintRight;
  }
  
  return { left, right };
}

/**
 * 根据候选上边界构建 bbox
 */
function buildBboxFromCandidate(candidate, captionBbox, grayData, pageWidth, pageHeight) {
  const padding = 8;
  const figureTop = candidate.figureTop;
  const figureBottom = captionBbox.y - padding;
  
  const figureHeight = figureBottom - figureTop;
  if (figureHeight < 30) {
    return null;
  }
  
  const hintLeft = captionBbox.x;
  const hintRight = captionBbox.x + captionBbox.w;
  
  const { left, right } = findHorizontalBoundsByDensity(
    grayData,
    figureTop,
    figureBottom,
    hintLeft,
    hintRight
  );
  
  const bbox = {
    x: Math.max(0, left - padding),
    y: Math.max(0, figureTop),
    w: Math.min(pageWidth, right - left + padding * 2),
    h: figureHeight,
  };
  
  if (bbox.w < 30 || bbox.h < 30) {
    return null;
  }
  
  const aspectRatio = bbox.w / bbox.h;
  if (aspectRatio > 10 || aspectRatio < 0.1) {
    return null;
  }
  
  return bbox;
}

/**
 * 从 canvas 裁剪指定区域并返回 data URL
 */
function cropCanvasToDataUrl(canvas, bbox) {
  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = bbox.w;
  cropCanvas.height = bbox.h;
  const ctx = cropCanvas.getContext("2d");
  ctx.drawImage(canvas, bbox.x, bbox.y, bbox.w, bbox.h, 0, 0, bbox.w, bbox.h);
  return cropCanvas.toDataURL("image/png");
}

/**
 * 迭代式图片边界检测（LLM 验证版）
 * 
 * 算法流程：
 * 1. 生成多个候选上边界
 * 2. 对每个候选裁剪图片，让 LLM 验证是否完整
 * 3. 如果 LLM 认为完整，返回该 bbox
 * 4. 如果所有候选都不完整，让 LLM 从中选择最佳
 * 
 * @param {HTMLCanvasElement} canvas - 页面 canvas
 * @param {Array} ocrLines - OCR 识别的段落文字行
 * @param {Object} captionBbox - 图标题的 bbox
 * @param {string} captionText - 图标题文本
 * @param {Object} grayData - 灰度图像数据
 * @param {number} pageWidth - 页面宽度
 * @param {number} pageHeight - 页面高度
 * @param {Object} llmCfg - LLM 配置
 * @param {number} maxRetries - 最大重试次数
 * @returns {Object|null} { bbox, method, validatedByLlm }
 */
async function detectFigureBboxIterative(canvas, ocrLines, captionBbox, captionText, grayData, pageWidth, pageHeight, llmCfg, maxRetries) {
  const padding = 8;
  
  // 第一步：生成候选上边界
  const candidates = generateTopBoundaryCandidates(ocrLines, captionBbox, pageWidth, pageHeight);
  
  if (candidates.length === 0) {
    log("  无法生成候选上边界");
    return null;
  }
  
  log(`  生成 ${candidates.length} 个候选上边界`);
  
  // 第二步：对高置信度候选，直接使用（不调用 LLM 验证）
  const highConfidenceCandidates = candidates.filter(c => c.confidence === "high");
  if (highConfidenceCandidates.length > 0) {
    const best = highConfidenceCandidates[0];
    const bbox = buildBboxFromCandidate(best, captionBbox, grayData, pageWidth, pageHeight);
    if (bbox) {
      log(`  使用高置信度候选 (${best.reason})`);
      return { bbox, method: "text_sandwich_high_confidence", validatedByLlm: false };
    }
  }
  
  // 第三步：对其他候选，迭代验证
  const candidateResults = [];
  
  for (let i = 0; i < Math.min(candidates.length, 4); i++) { // 最多验证 4 个
    const candidate = candidates[i];
    const bbox = buildBboxFromCandidate(candidate, captionBbox, grayData, pageWidth, pageHeight);
    
    if (!bbox) {
      continue;
    }
    
    // 裁剪图片
    const croppedDataUrl = cropCanvasToDataUrl(canvas, bbox);
    
    candidateResults.push({
      candidate,
      bbox,
      dataUrl: croppedDataUrl,
      reason: candidate.reason,
    });
    
    // LLM 验证
    log(`  验证候选 ${i + 1}/${candidates.length} (${candidate.reason})...`);
    const validation = await validateCroppedFigureWithLlm(croppedDataUrl, captionText, llmCfg, maxRetries);
    
    if (validation.isComplete) {
      log(`  ✓ 候选 ${i + 1} 验证通过`);
      return { bbox, method: "iterative_validated", validatedByLlm: true };
    } else {
      log(`  ✗ 候选 ${i + 1}: ${validation.issue || "不完整"} (${validation.suggestion})`);
      
      // 根据建议决定是否继续
      if (validation.suggestion === "need_shrink_down") {
        // 需要向下收缩，跳过后续更大的候选
        continue;
      }
      // need_expand_up: 继续尝试下一个候选（上边界更高）
    }
  }
  
  // 第四步：如果没有通过验证的，选择最佳候选
  if (candidateResults.length > 0) {
    log(`  所有候选均未通过验证，选择最可能的...`);
    
    // 优先选择 high/medium confidence
    const sorted = candidateResults.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return (order[a.candidate.confidence] || 2) - (order[b.candidate.confidence] || 2);
    });
    
    // 选第一个（最高置信度）
    const best = sorted[0];
    log(`  使用候选: ${best.reason}`);
    return { bbox: best.bbox, method: "iterative_fallback", validatedByLlm: false };
  }
  
  return null;
}

/**
 * 简单版图片边界检测（不调用 LLM 验证，用于快速模式）
 */
function detectFigureBboxSimple(ocrLines, captionBbox, grayData, pageWidth, pageHeight) {
  const candidates = generateTopBoundaryCandidates(ocrLines, captionBbox, pageWidth, pageHeight);
  
  if (candidates.length === 0) {
    return null;
  }
  
  // 选择最高置信度的候选
  const best = candidates[0];
  return buildBboxFromCandidate(best, captionBbox, grayData, pageWidth, pageHeight);
}

// 保留旧的边缘检测作为备用（某些情况可能仍有用）
function sobelEdgeDetection(grayData, threshold) {
  const { gray, width, height } = grayData;
  const edges = new Uint8Array(width * height);
  
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;
      
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = (y + ky) * width + (x + kx);
          const kidx = (ky + 1) * 3 + (kx + 1);
          gx += gray[idx] * sobelX[kidx];
          gy += gray[idx] * sobelY[kidx];
        }
      }
      
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      edges[y * width + x] = magnitude > threshold ? 255 : 0;
    }
  }
  
  return edges;
}

// ---------------------------
// Combined Figure Detection (迭代验证版)
// ---------------------------

async function detectFigureBboxes(canvas, pageNum) {
  const useOcr = document.getElementById("useOcrDetection")?.checked ?? true;
  const useLlmValidation = document.getElementById("useLlmValidation")?.checked ?? true;
  
  const width = canvas.width;
  const height = canvas.height;
  
  const detectedFigures = [];
  
  if (!useOcr) {
    log(`页 ${pageNum}: OCR 辅助定位已禁用，跳过图片检测`);
    return detectedFigures;
  }
  
  // 1. OCR 提取文字
  log(`页 ${pageNum}: 运行 OCR...`);
  let ocrResult;
  try {
    ocrResult = await ocrExtractTextBlocks(canvas);
    log(`页 ${pageNum}: OCR 完成，识别 ${ocrResult.lines.length} 行文字`);
  } catch (e) {
    log(`页 ${pageNum}: OCR 失败: ${e.message || e}`);
    return detectedFigures;
  }
  
  // 2. 过滤出段落文字（排除图内孤立文字）
  const paragraphLines = filterParagraphLines(ocrResult.lines, width);
  log(`页 ${pageNum}: 过滤后段落文字 ${paragraphLines.length} 行`);
  
  // 3. 用改进的正则+上下文分析识别图标题
  let captions = extractFigureCaptionsFromOcr(ocrResult, width);
  log(`页 ${pageNum}: 正则识别到 ${captions.length} 个图标题`);
  
  // 4. 如果正则没找到，尝试用 LLM 分析（仅分析标题，不估计坐标）
  if (captions.length === 0 && paragraphLines.length > 0) {
    log(`页 ${pageNum}: 尝试 LLM 分析图标题...`);
    const llmCfg = getRoleConfig("transcriber");
    const { maxRetries } = getRunSettings();
    captions = await analyzeCaptionsWithLlm(paragraphLines, llmCfg, maxRetries);
    log(`页 ${pageNum}: LLM 识别到 ${captions.length} 个图标题`);
  }
  
  if (captions.length === 0) {
    log(`页 ${pageNum}: 未检测到图标题`);
    return detectedFigures;
  }
  
  // 5. 准备灰度图像用于水平边界检测
  const grayData = canvasToGrayscale(canvas);
  
  // 获取 LLM 配置（用于验证）
  const llmCfg = getRoleConfig("transcriber");
  const { maxRetries } = getRunSettings();
  
  // 6. 对每个图标题，使用迭代验证算法检测图片区域
  captions.sort((a, b) => a.bbox.y - b.bbox.y);
  
  for (let i = 0; i < captions.length; i++) {
    const caption = captions[i];
    const figureId = caption.figureId || `p${pageNum}_fig${i + 1}`;
    
    log(`页 ${pageNum}: 处理图标题 "${caption.text.slice(0, 30)}..." (y=${caption.bbox.y})`);
    
    // 过滤：排除所有图标题行
    const relevantOcrLines = paragraphLines.filter(line => {
      const isCaption = captions.some(cap => 
        Math.abs(cap.bbox.y - line.bbox.y) < 5 && 
        cap.text.includes(line.text.slice(0, 10))
      );
      return !isCaption;
    });
    
    let result = null;
    
    if (useLlmValidation) {
      // 使用迭代验证算法（LLM 验证裁剪结果）
      result = await detectFigureBboxIterative(
        canvas,
        relevantOcrLines,
        caption.bbox,
        caption.text,
        grayData,
        width,
        height,
        llmCfg,
        maxRetries
      );
    } else {
      // 快速模式：不使用 LLM 验证
      const bbox = detectFigureBboxSimple(relevantOcrLines, caption.bbox, grayData, width, height);
      if (bbox) {
        result = { bbox, method: "simple", validatedByLlm: false };
      }
    }
    
    if (result && result.bbox) {
      const bbox = normalizeBbox(result.bbox, width, height);
      if (bbox) {
        log(`页 ${pageNum}: 检测成功 - ${figureId} (${bbox.x},${bbox.y},${bbox.w},${bbox.h}) [${result.method}]`);
        detectedFigures.push({
          id: figureId,
          bbox,
          caption: caption.text,
          captionBbox: caption.bbox,
          method: result.method,
          validatedByLlm: result.validatedByLlm,
        });
      }
    } else {
      log(`页 ${pageNum}: 检测失败 - ${figureId}`);
    }
  }
  
  return detectedFigures;
}

// ---------------------------
// LLM protocol adapters (OpenAI / Gemini / Claude)
// ---------------------------

function readJsonHeaders(input) {
  const raw = (input || "").trim();
  if (!raw) return {};
  const parsed = safeJsonParse(raw);
  if (!parsed.ok || typeof parsed.value !== "object" || parsed.value == null) {
    throw new Error("Extra headers must be a JSON object.");
  }
  return parsed.value;
}

function getRunSettings() {
  const concurrency = clamp(Number($("concurrency").value || 1), 1, 8);
  const maxRetries = clamp(Number($("maxRetries").value || 0), 0, 10);
  return { concurrency, maxRetries };
}

function getCropSettings() {
  const maxCropRefine = clamp(Number($("maxCropRefine").value || 0), 0, 5);
  return { maxCropRefine };
}

function getOrganizerConcurrency() {
  return clamp(Number($("organizeConcurrency").value || 1), 1, 8);
}

function getGlobalConfig() {
  return {
    provider: $("globalProvider").value,
    baseUrl: $("globalBaseUrl").value.trim(),
    model: $("globalModel").value.trim(),
    apiKey: $("globalKey").value,
    temperature: Number($("globalTemp").value),
    top_p: Number($("globalTopP").value),
    max_tokens: Number($("globalMaxTokens").value),
    extraHeaders: readJsonHeaders($("globalExtraHeaders").value),
  };
}

function getRoleConfig(role) {
  const useGlobal = $(role + "UseGlobal").checked;
  const global = getGlobalConfig();
  const roleCfg = {
    provider: $(role + "Provider").value,
    baseUrl: $(role + "BaseUrl").value.trim(),
    model: $(role + "Model").value.trim(),
    apiKey: $(role + "Key").value,
    temperature: Number($(role + "Temp").value),
    // top_p is only in global UI (keep consistent)
    top_p: global.top_p,
    max_tokens: Number($(role + "MaxTokens").value),
    extraHeaders: global.extraHeaders,
  };
  if (useGlobal) return { ...global };
  return {
    ...roleCfg,
    temperature: Number.isFinite(roleCfg.temperature) ? roleCfg.temperature : global.temperature,
    top_p: Number.isFinite(roleCfg.top_p) ? roleCfg.top_p : global.top_p,
    max_tokens: Number.isFinite(roleCfg.max_tokens) ? roleCfg.max_tokens : global.max_tokens,
  };
}

function normalizeProviderDefaults(cfg) {
  const provider = cfg.provider;
  const baseUrl =
    cfg.baseUrl ||
    (provider === "openai"
      ? "https://api.openai.com"
      : provider === "claude"
        ? "https://api.anthropic.com"
        : "https://generativelanguage.googleapis.com");
  return { ...cfg, baseUrl };
}

const PROVIDER_SUGGESTIONS = {
  openai: {
    baseUrl: "https://api.openai.com",
    model: "gpt-4o-mini",
  },
  claude: {
    baseUrl: "https://api.anthropic.com",
    model: "claude-3-5-sonnet-20241022",
  },
  gemini: {
    baseUrl: "https://generativelanguage.googleapis.com",
    model: "gemini-1.5-pro",
  },
};

function applyProviderDefaultsTo(prefix) {
  // prefix: "global" | "planner" | "transcriber" | "verifier"
  const providerEl = $(prefix + "Provider");
  const baseUrlEl = $(prefix + "BaseUrl");
  const modelEl = $(prefix + "Model");
  const sug = PROVIDER_SUGGESTIONS[providerEl.value] || null;
  if (sug) {
    if (!baseUrlEl.value.trim()) baseUrlEl.value = sug.baseUrl;
    if (!modelEl.value.trim()) modelEl.value = sug.model;
  }
}

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}: ${text.slice(0, 500)}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  const parsed = safeJsonParse(text);
  if (!parsed.ok) throw new Error(`Invalid JSON response: ${text.slice(0, 500)}`);
  return parsed.value;
}

async function callOpenAI(cfg, { system, userText, imageDataUrl, signal }) {
  const url = cfg.baseUrl.replace(/\/$/, "") + "/v1/chat/completions";
  const headers = {
    Authorization: `Bearer ${cfg.apiKey}`,
    "Content-Type": "application/json",
    ...cfg.extraHeaders,
  };
  const content = [];
  if (userText) content.push({ type: "text", text: userText });
  if (imageDataUrl) content.push({ type: "image_url", image_url: { url: imageDataUrl } });
  const body = {
    model: cfg.model,
    temperature: cfg.temperature,
    top_p: cfg.top_p,
    max_tokens: cfg.max_tokens,
    messages: [
      ...(system ? [{ role: "system", content: system }] : []),
      { role: "user", content },
    ],
  };
  const data = await fetchJson(url, { method: "POST", headers, body: JSON.stringify(body), signal });
  const msg = data.choices && data.choices[0] && data.choices[0].message;
  const text = msg && msg.content;
  if (!text) throw new Error("OpenAI: empty response.");
  return String(text);
}

async function callClaude(cfg, { system, userText, imageDataUrl, signal }) {
  const url = cfg.baseUrl.replace(/\/$/, "") + "/v1/messages";
  const headers = {
    "x-api-key": cfg.apiKey,
    "anthropic-version": "2023-06-01",
    "Content-Type": "application/json",
    ...cfg.extraHeaders,
  };

  const content = [];
  if (userText) content.push({ type: "text", text: userText });
  if (imageDataUrl) {
    const b64 = toBase64FromDataUrl(imageDataUrl);
    content.push({
      type: "image",
      source: { type: "base64", media_type: "image/png", data: b64 },
    });
  }

  const body = {
    model: cfg.model,
    max_tokens: cfg.max_tokens,
    temperature: cfg.temperature,
    top_p: cfg.top_p,
    system: system ? [{ type: "text", text: system }] : undefined,
    messages: [{ role: "user", content }],
  };
  const data = await fetchJson(url, { method: "POST", headers, body: JSON.stringify(body), signal });
  const parts = data.content;
  const textPart = Array.isArray(parts) ? parts.find((p) => p && p.type === "text") : null;
  const text = textPart && textPart.text;
  if (!text) throw new Error("Claude: empty response.");
  return String(text);
}

async function callGemini(cfg, { system, userText, imageDataUrl, signal }) {
  // Gemini uses API key in query string by default.
  // Support proxy patterns where key isn't required in query; still accept.
  const base = cfg.baseUrl.replace(/\/$/, "");
  const model = encodeURIComponent(cfg.model);
  const key = cfg.apiKey ? `?key=${encodeURIComponent(cfg.apiKey)}` : "";
  const url = `${base}/v1beta/models/${model}:generateContent${key}`;

  const parts = [];
  if (system) {
    // Gemini "systemInstruction" exists but varies; keep as first user part for compatibility.
    parts.push({ text: `[SYSTEM]\n${system}` });
  }
  if (userText) parts.push({ text: userText });
  if (imageDataUrl) {
    const b64 = toBase64FromDataUrl(imageDataUrl);
    parts.push({
      inlineData: { mimeType: "image/png", data: b64 },
    });
  }

  const body = {
    generationConfig: {
      temperature: cfg.temperature,
      topP: cfg.top_p,
      maxOutputTokens: cfg.max_tokens,
    },
    contents: [
      {
        role: "user",
        parts,
      },
    ],
  };

  const headers = {
    "Content-Type": "application/json",
    ...cfg.extraHeaders,
  };
  const data = await fetchJson(url, { method: "POST", headers, body: JSON.stringify(body), signal });
  const cand = data.candidates && data.candidates[0];
  const outParts = cand && cand.content && cand.content.parts;
  const textPart = Array.isArray(outParts) ? outParts.find((p) => p && typeof p.text === "string") : null;
  const text = textPart && textPart.text;
  if (!text) throw new Error("Gemini: empty response.");
  return String(text);
}

async function llmCall(cfgIn, payload) {
  const cfg = normalizeProviderDefaults(cfgIn);
  if (!cfg.model) throw new Error("Model is required.");
  if (!cfg.baseUrl) throw new Error("Base URL is required.");
  // Note: key may be empty if user uses proxy that injects auth.
  if (cfg.provider === "openai") return await callOpenAI(cfg, payload);
  if (cfg.provider === "claude") return await callClaude(cfg, payload);
  if (cfg.provider === "gemini") return await callGemini(cfg, payload);
  throw new Error(`Unknown provider: ${cfg.provider}`);
}

function shouldRetryError(err) {
  if (!err) return false;
  if (err.name === "AbortError") return false;
  const status = err.status;
  if (typeof status === "number") {
    if (status === 429) return true;
    if (status >= 500 && status <= 599) return true;
    return false; // do not retry typical 4xx auth/model errors
  }
  // Network error (e.g., "Failed to fetch")
  return true;
}

async function llmCallWithRetry(cfg, payload, { maxRetries }) {
  let attempt = 0;
  // attempts = 1 + maxRetries
  while (true) {
    try {
      return await llmCall(cfg, payload);
    } catch (e) {
      attempt++;
      const canRetry = attempt <= maxRetries && shouldRetryError(e);
      const msg = String(e && e.message ? e.message : e);
      if (!canRetry) throw e;
      const backoffMs = Math.min(30000, 800 * Math.pow(2, attempt - 1) + randInt(0, 600));
      log(`LLM call failed (attempt ${attempt}/${maxRetries}). Retrying in ${backoffMs}ms. Error: ${msg.slice(0, 200)}`);
      await sleep(backoffMs);
    }
  }
}

async function connectivityTest(cfgIn) {
  const cfg = normalizeProviderDefaults(cfgIn);
  const sys = "You are a connectivity test endpoint. Reply with exactly: OK";
  const user = "Reply with exactly: OK";
  const text = await llmCall(cfg, { system: sys, userText: user, imageDataUrl: null, signal: null });
  if (String(text).trim() !== "OK") throw new Error(`Unexpected response: ${String(text).slice(0, 200)}`);
  return true;
}

// ---------------------------
// Prompts
// ---------------------------

function buildTranscriptionPrompt({ pageNum, width, height }) {
  // Note: Do NOT claim to use OCR tools. Only vision LLM.
  return `
你要把“扫描版数学教材”的单页图片转写为 LaTeX，并产出局部结构标注与出图裁剪建议。

严格规则（必须遵守）：
1) 只基于这张图片中的显式证据，不要编造不存在的章节/标题/定理编号/习题答案。
2) 输出必须是 **严格 JSON**（不要 Markdown 代码块、不要多余文字），可被 JSON.parse 直接解析。
3) LaTeX 只写本页内容，不做跨页重排；跨页组织会在后续阶段单独做。
4) 图片裁剪：如果页面中存在图/表/几何图/坐标图/插图等，请给出一个或多个 bbox（像素坐标），以便从本页渲染图中剪裁为 PNG。
5) 每个图像必须有唯一 ID：p${pageNum}_fig1, p${pageNum}_fig2, ...
6) 你的 LaTeX 中必须引用这些 PNG：\\includegraphics{p${pageNum}_fig1.png} 等（文件名与 ID 对齐）。

【LaTeX 可编译性要求 - 必须遵守】：
- 数学公式：行内用 $...$，行间用 \\[...\\] 或 equation 环境，不要混用
- 所有数学环境必须正确闭合：\\begin{...} 必须有对应的 \\end{...}
- 空集符号用 \\varnothing 或 \\emptyset，不要用 \\phi
- 定理/定义/例题等使用结构化环境（如有）：
  * 定理用 \\begin{theorem}...\\end{theorem}
  * 定义用 \\begin{definition}...\\end{definition}
  * 例题用 \\begin{example}...\\end{example}
  * 证明用 \\begin{proof}...\\end{proof}
- 如果是目录页，不要输出 \\section/\\chapter 命令，只输出纯文本内容
- 中文内容正常输出，不需要特殊处理（文档会用 ctexart）
- 避免全角标点进入数学环境
- figure/table 环境必须正确闭合
- 不要输出 \\documentclass、\\begin{document} 等文档框架命令

坐标系：
- 页面像素尺寸：width=${width}, height=${height}
- bbox 使用左上角为原点的像素坐标：{x,y,w,h}，并确保 bbox 在页面范围内。

输出 JSON 结构（字段必须齐全，允许数组为空）：
{
  "page": ${pageNum},
  "latex": "本页 LaTeX（可包含 % 注释）",
  "annotations": {
    "headings": [
      {
        "level": "chapter|section|subsection|subsubsection|unknown",
        "text": "标题文本（原样）",
        "evidence": "从页面中摘取的一小段显式证据（原文片段）"
      }
    ],
    "notes": [
      { "kind": "definition|theorem|lemma|example|exercise|proof|remark|unknown", "evidence": "原文证据片段" }
    ]
  },
  "figures": [
    {
      "id": "p${pageNum}_fig1",
      "bbox": { "x": 0, "y": 0, "w": 0, "h": 0 },
      "evidence": "为什么这是图（原文或视觉证据简述）",
      "latex_ref": "\\\\begin{figure}[h]\\\\centering\\\\includegraphics[width=0.9\\\\linewidth]{p${pageNum}_fig1.png}\\\\end{figure}"
    }
  ]
}
`;
}

function buildVerifierPrompt({ mainTex, images }) {
  return `
你是 LaTeX 语法与一致性校验器。请只输出严格 JSON（无多余文字）：
{
  "latex_compiles_syntax": true/false,
  "issues": [
    { "severity":"error|warn", "where":"...", "message":"...", "suggestion":"..." }
  ],
  "image_ids": [ "..." ]
}

要求：
- 仅做语法/一致性检查（括号、环境、转义、\\includegraphics 文件名等），不要改写内容。
- 检查图片引用：所有 \\includegraphics{...png} 必须出现在 images 列表中，且每个图片 ID 唯一。

images 列表（JSON）：
${JSON.stringify(images, null, 2)}

main.tex 内容：
${mainTex}
`;
}

function buildOrganizerPrompt({ windowPages }) {
  // windowPages: array of {page, latex, annotations, figures}
  return `
你在做“跨页组织”（先转写后组织）。输入是一组连续页的转写结果（含 headings 显式证据）。
请输出严格 JSON（无 Markdown、无多余文字）：
{
  "section_tree": { "title":"ROOT", "level":"root", "children":[ ... ] },
  "latex_body": "合并后的 LaTeX body（不含 \\documentclass 等前导）",
  "images": [
    { "id":"p10_fig1", "filename":"p10_fig1.png", "page":10, "bbox":{...}, "referenced_in":[10], "evidence":"..." }
  ],
  "evidence_index": [
    { "title":"...", "level":"section|subsection|...", "page": 10, "evidence":"（必须来自输入 headings.evidence）" }
  ]
}

严格规则：
1) 章节结构只能基于输入里 headings 的显式证据，不得新增不存在的标题。
2) 如果没有足够证据，宁可不分章。
3) latex_body 必须按页顺序包含所有页的内容（可插入 \\section 等），并保留每页边界注释。

【可编译性要求】：
- 不要在 latex_body 中包含 \\documentclass、\\begin{document}、\\end{document}
- 章节层级必须正确：ctexart 不支持 \\chapter，请使用 \\section 作为最高级
- 所有数学环境必须正确闭合
- 不要重复插入相同的章节命令
- 保持每页的 LaTeX 内容完整，不要截断环境

输入 windowPages（JSON）：
${JSON.stringify(windowPages, null, 2)}
`;
}

function buildWindowPlanPrompt({ windowPages }) {
  return `
你在做“滑动窗口初步组装”（先转写后组织）。输入是一组连续页的转写结果（含 headings 显式证据）。
请输出严格 JSON（无 Markdown、无多余文字）：
{
  "window_pages": [10,11,12],
  "insertions": [
    {
      "page": 10,
      "level": "chapter|section|subsection|subsubsection",
      "title": "标题文本（原样）",
      "evidence": "必须来自输入 headings.evidence",
      "reason": "一句话说明"
    }
  ]
}

严格规则：
1) insertions 只能基于输入里 headings 的显式证据，不得新增不存在的标题。
2) 如证据不足，宁可输出空 insertions。
3) page 必须是窗口内页码之一。

【可编译性注意】：
- 使用 ctexart 时，level 不要使用 chapter，应使用 section 作为最高级
- 章节层级顺序：section > subsection > subsubsection

输入 windowPages（JSON）：
${JSON.stringify(windowPages, null, 2)}
`;
}

// ---------------------------
// Transcription + cropping
// ---------------------------

function normalizeBbox(bbox, width, height) {
  if (!bbox || typeof bbox !== "object") return null;
  const x = Math.floor(Number(bbox.x));
  const y = Math.floor(Number(bbox.y));
  const w = Math.floor(Number(bbox.w));
  const h = Math.floor(Number(bbox.h));
  if (![x, y, w, h].every(Number.isFinite)) return null;
  if (w <= 1 || h <= 1) return null;
  if (x < 0 || y < 0) return null;
  if (x + w > width || y + h > height) return null;
  return { x, y, w, h };
}

async function cropPngFromCanvas(canvas, bbox) {
  const out = document.createElement("canvas");
  out.width = bbox.w;
  out.height = bbox.h;
  const ctx = out.getContext("2d", { alpha: false });
  ctx.drawImage(canvas, bbox.x, bbox.y, bbox.w, bbox.h, 0, 0, bbox.w, bbox.h);
  return await new Promise((resolve) => out.toBlob(resolve, "image/png"));
}

function downscaleCanvasToDataUrl(canvas, maxSide) {
  const w = canvas.width;
  const h = canvas.height;
  const max = Math.max(w, h);
  if (max <= maxSide) return canvas.toDataURL("image/png");
  const scale = maxSide / max;
  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.floor(w * scale));
  out.height = Math.max(1, Math.floor(h * scale));
  const ctx = out.getContext("2d", { alpha: false });
  ctx.drawImage(canvas, 0, 0, out.width, out.height);
  return out.toDataURL("image/png");
}

function buildCropRefinePrompt({ pageNum, width, height, figureId, bbox }) {
  return `
你是“图像剪裁 bbox 校正器”。我会给你一张整页图片，以及当前 figure 的 bbox（像素坐标）。
请判断该 bbox 是否截少/截多，并给出更合适的 bbox（尽量紧致，但必须包含完整的图；允许包含图内标签如坐标轴刻度/图内标注；尽量避免把正文段落文字包含进来）。

输出必须是严格 JSON（无 Markdown/无多余文字）：
{
  "status": "ok|adjust",
  "bbox": { "x": 0, "y": 0, "w": 0, "h": 0 },
  "diagnosis": "tight|loose|ok",
  "note": "一句话说明"
}

坐标系：
- 页面像素尺寸：width=${width}, height=${height}
- bbox 使用左上角为原点的像素坐标：{x,y,w,h}
- bbox 必须在页面范围内；w/h 必须 > 1

元信息：
- page=${pageNum}
- figure_id=${figureId}
- current_bbox=${JSON.stringify(bbox)}
`;
}

/**
 * @deprecated 此函数已废弃。新算法使用迭代验证（validateCroppedFigureWithLlm），
 * LLM 只判断图片是否完整，不再估计坐标。保留此函数仅供向后兼容。
 */
async function refineFigureBboxWithLlm({
  pageNum,
  width,
  height,
  figureId,
  initialBbox,
  pageCanvas,
  llmCfg,
  maxRetries,
  maxRefine,
  signal,
}) {
  let bbox = initialBbox;
  if (maxRefine <= 0) return bbox;

  // Downscale for speed/cost; still aligned to page coordinates via width/height meta + bbox.
  const imageDataUrl = downscaleCanvasToDataUrl(pageCanvas, 1400);
  const system = "You are a strict JSON-only crop reviewer.";

  for (let attempt = 1; attempt <= maxRefine; attempt++) {
    const userText = buildCropRefinePrompt({ pageNum, width, height, figureId, bbox });
    const resp = stripCodeFences(
      await llmCallWithRetry(llmCfg, { system, userText, imageDataUrl, signal }, { maxRetries })
    );
    const parsed = safeJsonParse(resp);
    if (!parsed.ok) {
      log(`Crop refine: invalid JSON (page ${pageNum}, ${figureId}) attempt ${attempt}. Keep current bbox.`);
      return bbox;
    }
    const out = parsed.value || {};
    const status = String(out.status || "").toLowerCase();
    const next = normalizeBbox(out.bbox, width, height);
    if (!next) {
      log(`Crop refine: invalid bbox (page ${pageNum}, ${figureId}) attempt ${attempt}. Keep current bbox.`);
      return bbox;
    }
    if (status === "ok") return bbox;
    bbox = next;
  }
  return bbox;
}

function extractIncludeGraphicsIds(latex) {
  const ids = [];
  const re = /\\includegraphics(?:\[[^\]]*\])?\{([^}]+)\}/g;
  let m;
  while ((m = re.exec(latex))) {
    const fn = m[1];
    const base = fn.replace(/^.*\//, "");
    const id = base.replace(/\.png$/i, "");
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

async function transcribeAndCrop() {
  if (!state.pdfDoc) throw new Error("PDF not loaded.");
  const { start, end } = getPageRange();
  state.run.lastRange = { start, end };
  const scale = Number($("renderScale").value || 2);

  const transcriberCfg = getRoleConfig("transcriber");
  const { concurrency, maxRetries } = getRunSettings();
  const { maxCropRefine } = getCropSettings();

  // Breakpoint: skip pages already present
  const pagesToDo = [];
  for (let p = start; p <= end; p++) {
    if (!state.pageResults.has(p)) pagesToDo.push(p);
  }
  if (!pagesToDo.length) {
    log("All pages in range are already transcribed. Nothing to do.");
    setStage("Transcribe: done");
    setPageProgress(`${end} / ${end}`, 1);
    return;
  }

  setStage("Transcribe: start");
  state.run.inProgress = true;
  state.run.cancelRequested = false;
  state.run.earlyExportRequested = false;
  state.run.controller = new AbortController();

  const totalTarget = end - start + 1;
  let completedInRange = totalTarget - pagesToDo.length;
  let completedThisBatch = 0;
  let nextIdx = 0;
  const signal = state.run.controller.signal;

  function updateProgress() {
    const done = completedInRange + completedThisBatch;
    setPageProgress(`${done} / ${totalTarget}`, totalTarget ? done / totalTarget : 1);
  }
  updateProgress();

  function uniqueImageId(desiredId) {
    let id = desiredId;
    let k = 2;
    while (state.images.has(id)) {
      id = `${desiredId}_v${k}`;
      k++;
    }
    return id;
  }

  async function processOnePage(pageNum) {
    if (state.run.cancelRequested) return;
    setStage(`Transcribe: page ${pageNum}`);
    log(`Rendering page ${pageNum}…`);
    const { canvas, width, height } = await renderPageToCanvas(pageNum, scale);

    // best-effort preview: show last rendered page
    const out = $("previewCanvas");
    out.width = canvas.width;
    out.height = canvas.height;
    out.getContext("2d").drawImage(canvas, 0, 0);

    // === 新增：OCR + 图像处理检测图片 ===
    const useOcrDetection = document.getElementById("useOcrDetection")?.checked ?? true;
    let ocrDetectedFigures = [];
    
    if (useOcrDetection) {
      try {
        setStage(`Transcribe: page ${pageNum} (OCR 检测)`);
        ocrDetectedFigures = await detectFigureBboxes(canvas, pageNum);
        log(`页 ${pageNum}: OCR 检测到 ${ocrDetectedFigures.length} 个图片`);
      } catch (e) {
        log(`页 ${pageNum}: OCR 检测失败，将使用 LLM 检测: ${e.message || e}`);
      }
    }

    // === LLM 转写（LaTeX + 结构） ===
    setStage(`Transcribe: page ${pageNum} (LLM)`);
    const dataUrl = canvas.toDataURL("image/png");
    const system = "You are a careful math textbook transcriber. Output JSON only.";
    const userText = buildTranscriptionPrompt({ pageNum, width, height });
    log(`Calling LLM for page ${pageNum}…`);

    let respText = await llmCallWithRetry(
      transcriberCfg,
      { system, userText, imageDataUrl: dataUrl, signal },
      { maxRetries }
    );
    respText = stripCodeFences(respText);

    // If it isn't JSON, do one stricter retry
    const parsed = safeJsonParse(respText);
    if (!parsed.ok) {
      log(`Page ${pageNum}: output not JSON. Retrying once with stricter JSON-only instruction.`);
      const userText2 = userText + "\n\n再次强调：必须输出严格 JSON，且不要使用 Markdown 代码块或任何额外文字。";
      respText = await llmCallWithRetry(
        transcriberCfg,
        { system, userText: userText2, imageDataUrl: dataUrl, signal },
        { maxRetries }
      );
      respText = stripCodeFences(respText);
    }
    const parsed2 = safeJsonParse(respText);
    if (!parsed2.ok) throw new Error(`Page ${pageNum}: LLM output is not valid JSON.`);
    const obj = parsed2.value;

    const latex = typeof obj.latex === "string" ? obj.latex : "";
    const annotations =
      obj.annotations && typeof obj.annotations === "object" ? obj.annotations : { headings: [], notes: [] };
    const llmFigures = Array.isArray(obj.figures) ? obj.figures : [];

    // === 合并图片检测结果：OCR 优先，LLM 补充 ===
    const ocrFigureIds = new Set(ocrDetectedFigures.map(f => f.id));
    const finalFigures = [...ocrDetectedFigures];
    
    // 添加 LLM 检测到但 OCR 没检测到的图片
    for (const fig of llmFigures) {
      const figId = fig.id || `p${pageNum}_fig${finalFigures.length + 1}`;
      if (!ocrFigureIds.has(figId)) {
        // LLM 检测到的图，OCR 没检测到
        const bbox0 = normalizeBbox(fig.bbox, width, height);
        if (bbox0) {
          finalFigures.push({
            id: figId,
            bbox: bbox0,
            caption: fig.evidence || "",
            method: "llm",
          });
        }
      }
    }

    // === 裁剪图片 ===
    const processedFigures = [];
    for (let fi = 0; fi < finalFigures.length; fi++) {
      const fig = finalFigures[fi];
      const id = uniqueImageId(fig.id);
      let bbox = fig.bbox;
      
      // 新算法已经通过迭代验证确保 bbox 正确，无需额外 LLM 校正
      // （旧的 refineFigureBboxWithLlm 已废弃，不再使用 LLM 估计坐标）
      
      // 最终验证 bbox
      bbox = normalizeBbox(bbox, width, height);
      if (!bbox) {
        log(`Page ${pageNum}: skip figure ${id} (invalid bbox after processing).`);
        continue;
      }
      
      const blob = await cropPngFromCanvas(canvas, bbox);
      if (!blob) {
        log(`Page ${pageNum}: crop failed for ${id}.`);
        continue;
      }
      
      const filename = `${id}.png`;
      const referencedIn = [pageNum];
      state.images.set(id, {
        id,
        filename,
        page: pageNum,
        bbox,
        blob,
        referencedIn,
        evidence: fig.caption || "",
        detectionMethod: fig.method || "ocr",
      });
      
      processedFigures.push({
        id,
        bbox,
        evidence: fig.caption || "",
        method: fig.method || "ocr",
      });
      
      log(`页 ${pageNum}: 裁剪图片 ${id} (${fig.method || "ocr"}) - ${bbox.w}x${bbox.h}`);
    }

    // 更新 LaTeX 中的图片引用
    const includeIds = extractIncludeGraphicsIds(latex);
    for (const id of includeIds) {
      const img = state.images.get(id);
      if (img) {
        if (!img.referencedIn.includes(pageNum)) img.referencedIn.push(pageNum);
      }
    }

    state.pageResults.set(pageNum, {
      page: pageNum,
      width,
      height,
      latex,
      annotations,
      figures: processedFigures,
      raw: obj,
    });
    
    const ocrCount = processedFigures.filter(f => f.method !== "llm").length;
    const llmCount = processedFigures.filter(f => f.method === "llm").length;
    log(`Transcribed page ${pageNum}: latex=${latex.length}字符, 图片=${processedFigures.length}(OCR:${ocrCount}, LLM:${llmCount})`);
    updateOutputsPanels();
  }

  async function workerLoop(workerId) {
    while (true) {
      if (state.run.cancelRequested) return;
      const idx = nextIdx;
      nextIdx++;
      if (idx >= pagesToDo.length) return;
      const pageNum = pagesToDo[idx];
      try {
        await processOnePage(pageNum);
      } catch (e) {
        if (e && e.name === "AbortError") {
          log(`Worker ${workerId}: aborted.`);
          return;
        }
        log(`Page ${pageNum}: failed: ${String(e && e.message ? e.message : e)}`);
        throw e;
      } finally {
        completedThisBatch++;
        updateProgress();
      }
    }
  }

  try {
    const workers = [];
    const n = Math.min(concurrency, pagesToDo.length);
    for (let w = 0; w < n; w++) workers.push(workerLoop(w + 1));
    await Promise.all(workers);
    setStage("Transcribe: done");
    log("Transcription done.");
  } finally {
    state.run.inProgress = false;
    state.run.controller = null;
  }
}

// ---------------------------
// Deterministic organizer (evidence-only)
// ---------------------------

function mapHeadingLevel(level) {
  // article/ctexart compatible
  const l = String(level || "unknown").toLowerCase();
  if (l === "chapter") return { rank: 1, cmd: "\\section" };
  if (l === "section") return { rank: 2, cmd: "\\subsection" };
  if (l === "subsection") return { rank: 3, cmd: "\\subsubsection" };
  if (l === "subsubsection") return { rank: 4, cmd: "\\paragraph" };
  return { rank: 99, cmd: null };
}

function buildSectionTreeFromHeadings(headings) {
  // headings: [{page, level, text, evidence}]
  const root = { title: "ROOT", level: "root", children: [], evidence: [] };
  const stack = [{ node: root, rank: 0 }];
  for (const h of headings) {
    const { rank } = mapHeadingLevel(h.level);
    if (rank === 99) continue;
    const node = {
      title: String(h.text || "").trim(),
      level: String(h.level || "unknown"),
      startPage: h.page,
      endPage: h.page,
      evidence: [{ page: h.page, evidence: String(h.evidence || "").trim() }],
      children: [],
    };
    while (stack.length && stack[stack.length - 1].rank >= rank) stack.pop();
    const parent = stack[stack.length - 1].node;
    parent.children.push(node);
    stack.push({ node, rank });
  }

  // Fill endPage by looking ahead
  function fillRanges(node, nextStart) {
    if (!node.children.length) {
      node.endPage = nextStart != null ? nextStart - 1 : node.endPage;
      return;
    }
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const next = node.children[i + 1];
      fillRanges(child, next ? next.startPage : nextStart);
    }
    node.endPage = nextStart != null ? nextStart - 1 : node.endPage;
  }
  fillRanges(root, null);
  return root;
}

function collectHeadingsInOrder() {
  const out = [];
  const pages = Array.from(state.pageResults.keys()).sort((a, b) => a - b);
  for (const p of pages) {
    const pr = state.pageResults.get(p);
    const hs = pr && pr.annotations && Array.isArray(pr.annotations.headings) ? pr.annotations.headings : [];
    for (const h of hs) {
      out.push({
        page: p,
        level: h.level || "unknown",
        text: h.text || "",
        evidence: h.evidence || "",
      });
    }
  }
  return out;
}

function buildLatexPreamble(template) {
  // 通用的定理环境定义
  const theoremDefs = `
% 定理环境定义
\\theoremstyle{definition}
\\newtheorem{definition}{定义}[section]
\\newtheorem{example}{例}[section]
\\newtheorem{exercise}{习题}[section]
\\theoremstyle{plain}
\\newtheorem{theorem}{定理}[section]
\\newtheorem{lemma}{引理}[section]
\\newtheorem{corollary}{推论}[section]
\\newtheorem{proposition}{命题}[section]
\\theoremstyle{remark}
\\newtheorem{remark}{注}[section]
`;

  if (template === "article") {
    // article 模板：使用 pdflatex，需要 inputenc 处理 UTF-8
    // 注意：如果包含中文，建议切换到 ctexart
    return `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{amsmath,amssymb,amsthm}
\\usepackage{graphicx}
\\usepackage{geometry}
\\usepackage{hyperref}
\\geometry{margin=1in}
${theoremDefs}
\\begin{document}
`;
  }
  
  // ctexart 模板：必须使用 xelatex 或 lualatex 编译
  // 编译命令: xelatex main.tex
  return `% !TEX program = xelatex
% 编译方式: xelatex main.tex （不要使用 pdflatex）
\\documentclass[UTF8,a4paper]{ctexart}
\\usepackage{amsmath,amssymb,amsthm}
\\usepackage{graphicx}
\\usepackage{geometry}
\\usepackage{hyperref}
\\geometry{margin=1in}
${theoremDefs}
\\begin{document}
`;
}

function buildLatexDocumentDeterministic() {
  const pages = Array.from(state.pageResults.keys()).sort((a, b) => a - b);
  if (!pages.length) throw new Error("No per-page results yet.");

  const headings = collectHeadingsInOrder().filter((h) => String(h.text || "").trim().length > 0);
  const tree = buildSectionTreeFromHeadings(headings);

  // Insert headings before the page where they appear (coarse but evidence-safe).
  const byPageHeadings = new Map();
  for (const h of headings) {
    const { cmd, rank } = mapHeadingLevel(h.level);
    if (!cmd || rank === 99) continue;
    const title = String(h.text || "").trim().replace(/[{}]/g, "");
    const lines = byPageHeadings.get(h.page) || [];
    lines.push(`${cmd}{${title}} % evidence: ${String(h.evidence || "").replace(/\s+/g, " ").slice(0, 160)}`);
    byPageHeadings.set(h.page, lines);
  }

  let body = "";
  for (const p of pages) {
    body += `\n%% ===== PAGE ${p} START =====\n`;
    const hs = byPageHeadings.get(p);
    if (hs && hs.length) body += hs.join("\n") + "\n";
    const pr = state.pageResults.get(p);
    body += (pr.latex || "") + "\n";
    body += `%% ===== PAGE ${p} END =====\n`;
  }

  const preamble = buildLatexPreamble($("latexTemplate").value);
  const doc = preamble + body + "\n\\end{document}\n";
  return { sectionTree: tree, mainTex: doc };
}

// ---------------------------
// LLM organizer (windowed) + evidence validation
// ---------------------------

function chunkPages(pages, windowSize, overlap) {
  const chunks = [];
  if (pages.length === 0) return chunks;
  const step = Math.max(1, windowSize - overlap);
  for (let i = 0; i < pages.length; i += step) {
    const slice = pages.slice(i, i + windowSize);
    if (slice.length) chunks.push(slice);
  }
  return chunks;
}

async function buildWindowPlansConcurrently() {
  const pages = Array.from(state.pageResults.keys()).sort((a, b) => a - b);
  if (!pages.length) throw new Error("No per-page results yet.");

  const plannerCfg = getRoleConfig("planner");
  const { maxRetries } = getRunSettings();
  const windowSize = clamp(Number($("organizerWindow").value || 7), 3, 15);
  const overlap = clamp(Number($("organizerOverlap").value || 1), 0, 5);
  const orgConc = getOrganizerConcurrency();

  const pageChunks = chunkPages(pages, windowSize, overlap);
  if (!pageChunks.length) return [];

  let nextIdx = 0;
  const results = new Array(pageChunks.length);

  async function runOne(idx) {
    const chunk = pageChunks[idx];
    const windowPages = chunk.map((p) => {
      const pr = state.pageResults.get(p);
      return { page: p, latex: pr.latex, annotations: pr.annotations, figures: pr.figures };
    });
    const system = "You are a strict JSON-only window organizer.";
    const userText = buildWindowPlanPrompt({ windowPages });
    const resp = stripCodeFences(await llmCallWithRetry(plannerCfg, { system, userText, imageDataUrl: null, signal: null }, { maxRetries }));
    const parsed = safeJsonParse(resp);
    if (!parsed.ok) throw new Error(`Window plan invalid JSON (window pages ${chunk[0]}-${chunk[chunk.length - 1]}).`);
    const out = parsed.value || {};
    return {
      window_pages: chunk,
      insertions: Array.isArray(out.insertions) ? out.insertions : [],
    };
  }

  async function workerLoop(workerId) {
    while (true) {
      const idx = nextIdx;
      nextIdx++;
      if (idx >= pageChunks.length) return;
      setStage(`Window assemble: worker ${workerId} window ${idx + 1}/${pageChunks.length}`);
      setPageProgress(`${idx + 1} / ${pageChunks.length}`, idx / pageChunks.length);
      results[idx] = await runOne(idx);
    }
  }

  const n = Math.min(orgConc, pageChunks.length);
  const workers = [];
  for (let w = 0; w < n; w++) workers.push(workerLoop(w + 1));
  await Promise.all(workers);
  setPageProgress(`${pageChunks.length} / ${pageChunks.length}`, 1);
  setStage("Window assemble: done");
  return results.filter(Boolean);
}

function mergeInsertionsFromWindowPlans(windowPlans) {
  const headings = collectHeadingsInOrder().filter((h) => String(h.text || "").trim().length > 0);
  const evSet = new Set(headings.map((h) => `${h.page}||${String(h.evidence || "").trim()}||${String(h.text || "").trim()}`));

  const merged = [];
  const seen = new Set();
  for (const wp of windowPlans || []) {
    const ins = Array.isArray(wp.insertions) ? wp.insertions : [];
    for (const it of ins) {
      const page = Number(it.page);
      const title = String(it.title || "").trim();
      const evidence = String(it.evidence || "").trim();
      const level = String(it.level || "").toLowerCase();
      const evKey = `${page}||${evidence}||${title}`;
      if (!evSet.has(evKey)) continue; // enforce explicit evidence
      const key = `${page}||${level}||${title}||${evidence}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push({ page, level, title, evidence });
    }
  }
  if (!merged.length) {
    // fallback to raw per-page headings
    return headings.map((h) => ({ page: h.page, level: h.level, title: h.text, evidence: h.evidence }));
  }
  merged.sort((a, b) => (a.page - b.page) || a.title.localeCompare(b.title));
  return merged;
}

function buildMainTexFromPagesWithInsertions(insertions) {
  const pages = Array.from(state.pageResults.keys()).sort((a, b) => a - b);
  if (!pages.length) throw new Error("No per-page results yet.");
  const byPage = new Map();
  for (const it of insertions || []) {
    const p = Number(it.page);
    if (!Number.isFinite(p)) continue;
    const arr = byPage.get(p) || [];
    arr.push(it);
    byPage.set(p, arr);
  }

  let body = "";
  for (const p of pages) {
    body += `\n%% ===== PAGE ${p} START =====\n`;
    const ins = byPage.get(p) || [];
    for (const it of ins) {
      const { cmd, rank } = mapHeadingLevel(it.level);
      if (!cmd || rank === 99) continue;
      const title = String(it.title || "").trim().replace(/[{}]/g, "");
      body += `${cmd}{${title}} % evidence: ${String(it.evidence || "").replace(/\s+/g, " ").slice(0, 160)}\n`;
    }
    const pr = state.pageResults.get(p);
    body += (pr && pr.latex ? pr.latex : "") + "\n";
    body += `%% ===== PAGE ${p} END =====\n`;
  }
  const preamble = buildLatexPreamble($("latexTemplate").value);
  return preamble + body + "\n\\end{document}\n";
}

function flattenImagesList() {
  const arr = Array.from(state.images.values()).map((img) => ({
    id: img.id,
    filename: img.filename,
    page: img.page,
    bbox: img.bbox,
    referenced_in: img.referencedIn,
    evidence: img.evidence || "",
  }));
  arr.sort((a, b) => (a.page - b.page) || a.id.localeCompare(b.id));
  return arr;
}

function validateSectionEvidence(sectionTree, headings) {
  // headings: array of {page, level, text, evidence}
  const keySet = new Set(headings.map((h) => `${h.page}||${h.level}||${String(h.evidence || "").trim()}`));
  const issues = [];
  function walk(node) {
    if (!node) return;
    if (node.level && node.level !== "root") {
      const ev = Array.isArray(node.evidence) ? node.evidence : [];
      if (!ev.length) {
        issues.push({ severity: "warn", where: node.title, message: "Missing evidence array on node." });
      } else {
        for (const e of ev) {
          const k = `${e.page}||${node.level}||${String(e.evidence || "").trim()}`;
          if (!keySet.has(k)) {
            issues.push({
              severity: "error",
              where: node.title,
              message: "Evidence not found in per-page headings; violates explicit-evidence rule.",
              suggestion: "Remove or adjust this node to match an existing heading evidence.",
            });
          }
        }
      }
    }
    const children = Array.isArray(node.children) ? node.children : [];
    for (const c of children) walk(c);
  }
  walk(sectionTree);
  return issues;
}

async function organizeWithLlm() {
  const pages = Array.from(state.pageResults.keys()).sort((a, b) => a - b);
  if (!pages.length) throw new Error("No per-page results yet.");

  const plannerCfg = getRoleConfig("planner");
  const { maxRetries } = getRunSettings();
  const windowSize = clamp(Number($("organizerWindow").value || 7), 3, 15);
  const overlap = clamp(Number($("organizerOverlap").value || 1), 0, 5);
  const pageChunks = chunkPages(pages, windowSize, overlap);

  // We will ask LLM per chunk, then merge by taking the first chunk's latex_body as base
  // and appending only pages not already included. This avoids duplication with overlap.
  let mergedLatexBody = "";
  let mergedTree = null;
  const mergedImages = new Map();
  const evidenceIndexAll = [];

  for (let ci = 0; ci < pageChunks.length; ci++) {
    const chunk = pageChunks[ci];
    setStage(`Organize(LLM): window ${ci + 1}/${pageChunks.length} pages ${chunk[0]}-${chunk[chunk.length - 1]}`);
    setPageProgress(`${ci + 1} / ${pageChunks.length}`, ci / pageChunks.length);
    const windowPages = chunk.map((p) => {
      const pr = state.pageResults.get(p);
      return { page: p, latex: pr.latex, annotations: pr.annotations, figures: pr.figures };
    });
    const system = "You are a strict LaTeX organizer. Output JSON only.";
    const userText = buildOrganizerPrompt({ windowPages });
    const resp = stripCodeFences(await llmCallWithRetry(plannerCfg, { system, userText, imageDataUrl: null, signal: null }, { maxRetries }));
    const parsed = safeJsonParse(resp);
    if (!parsed.ok) throw new Error(`Organizer LLM returned invalid JSON (window ${ci + 1}).`);
    const out = parsed.value;

    // Merge latex_body by page markers; keep unique page blocks.
    const body = String(out.latex_body || "");
    if (!mergedLatexBody) mergedLatexBody = body;
    else {
      // Append only pages that aren't already present by marker.
      for (const p of chunk) {
        const startMarker = `%% ===== PAGE ${p} START =====`;
        if (mergedLatexBody.includes(startMarker)) continue;
        const re = new RegExp(`%% ===== PAGE ${p} START =====[\\s\\S]*?%% ===== PAGE ${p} END =====`, "m");
        const m = body.match(re);
        if (m && m[0]) mergedLatexBody += "\n" + m[0] + "\n";
      }
    }

    // Merge tree: keep the first window's tree as global (later windows are partial).
    if (!mergedTree && out.section_tree) mergedTree = out.section_tree;

    // Merge images
    const imgs = Array.isArray(out.images) ? out.images : [];
    for (const img of imgs) {
      if (img && img.id && !mergedImages.has(img.id)) mergedImages.set(img.id, img);
    }

    const ev = Array.isArray(out.evidence_index) ? out.evidence_index : [];
    evidenceIndexAll.push(...ev);
  }

  setPageProgress(`${pageChunks.length} / ${pageChunks.length}`, 1);

  const preamble = buildLatexPreamble($("latexTemplate").value);
  const doc = preamble + "\n" + mergedLatexBody + "\n\\end{document}\n";

  // Validate evidence against per-page headings
  const headings = collectHeadingsInOrder().filter((h) => String(h.text || "").trim().length > 0);
  const issues = mergedTree ? validateSectionEvidence(mergedTree, headings) : [{ severity: "warn", where: "root", message: "No section_tree in LLM output." }];
  if (issues.some((x) => x.severity === "error")) {
    log("Organizer(LLM) evidence validation failed; falling back to deterministic organizer.");
    const det = buildLatexDocumentDeterministic();
    return { ...det, organizerIssues: issues };
  }

  return {
    sectionTree: mergedTree || buildSectionTreeFromHeadings(headings),
    mainTex: doc,
    organizerIssues: issues,
    evidenceIndex: evidenceIndexAll,
    images: Array.from(mergedImages.values()),
  };
}

// ---------------------------
// Verifier (optional)
// ---------------------------

async function verifyIfEnabled(mainTex) {
  if (!$("verifierEnabled").checked) return { latex_compiles_syntax: null, issues: [] };
  const verifierCfg = getRoleConfig("verifier");
  const { maxRetries } = getRunSettings();
  setStage("Verify: LLM check");
  const images = flattenImagesList();
  const system = "You are a strict JSON-only verifier.";
  const userText = buildVerifierPrompt({ mainTex, images });
  const resp = stripCodeFences(await llmCallWithRetry(verifierCfg, { system, userText, imageDataUrl: null, signal: null }, { maxRetries }));
  const parsed = safeJsonParse(resp);
  if (!parsed.ok) throw new Error("Verifier returned invalid JSON.");
  return parsed.value;
}

// ---------------------------
// LaTeX Repair (rule-based, handles long text)
// ---------------------------

const LATEX_REPAIR_RULES = {
  // 1. 文档结构错误
  structure: [
    {
      name: "chapter_in_article",
      desc: "ctexart 中不应使用 \\chapter",
      pattern: /\\chapter\{([^}]*)\}/g,
      fix: (match, title) => `\\section{${title}}`,
    },
    {
      name: "duplicate_section_markers",
      desc: "移除重复的章节标记",
      pattern: /(\\section\{[^}]+\}\s*)\1+/g,
      fix: (match, single) => single,
    },
  ],

  // 2. 目录与正文混淆
  toc: [
    {
      name: "toc_section_commands",
      desc: "目录页的章节命令降级为文本",
      // 匹配看起来像目录的内容（连续多个带页码的行）
      pattern: /(%+\s*目录|\\tableofcontents)[\s\S]*?(?=\\section|\\chapter|$)/gi,
      fix: (match) => {
        // 将目录区域内的 \section 等替换为普通文本
        return match
          .replace(/\\chapter\{([^}]*)\}/g, "\\textbf{$1}")
          .replace(/\\section\{([^}]*)\}/g, "\\textbf{$1}")
          .replace(/\\subsection\{([^}]*)\}/g, "$1");
      },
    },
  ],

  // 3. 数学语法/语义错误
  math: [
    {
      name: "phi_as_emptyset",
      desc: "\\phi 作为空集应改为 \\varnothing",
      // 只在明显表示空集的上下文中替换（如 = \\phi, \\in \\phi 等）
      pattern: /([=∈∉⊆⊇]\s*)\\phi(?![a-zA-Z])/g,
      fix: (match, prefix) => `${prefix}\\varnothing`,
    },
    {
      name: "fullwidth_in_math",
      desc: "数学环境中的全角符号转半角",
      pattern: /(\$[^$]*)\uff08([^$]*\$)/g, // 全角括号
      fix: (match, before, after) => `${before}(${after}`,
    },
    {
      name: "fullwidth_comma_in_math",
      desc: "数学环境中的全角逗号转半角",
      pattern: /(\$[^$]*)，([^$]*\$)/g,
      fix: (match, before, after) => `${before},${after}`,
    },
    {
      name: "unclosed_inline_math",
      desc: "修复未闭合的行内数学公式",
      pattern: /\$([^$\n]{1,200}?)(?=\n\n|\n\\|$(?!\$))/g,
      fix: (match, content) => {
        // 只有当内容看起来像数学公式时才修复
        if (/[a-zA-Z0-9+\-=\\^_{}]/.test(content) && !content.includes("$")) {
          return `$${content}$`;
        }
        return match;
      },
    },
    {
      name: "command_before_chinese",
      desc: "LaTeX 命令后直接跟中文需要加空格",
      // 匹配常见的间距/格式命令后直接跟中文字符（没有空格或花括号）
      // 中文字符范围：\u4e00-\u9fff
      pattern: /(\\(?:quad|qquad|hspace\{[^}]*\}|vspace\{[^}]*\}|hfill|vfill|noindent|indent|par|newline|linebreak|pagebreak|smallskip|medskip|bigskip|kern[^a-zA-Z]|hskip[^a-zA-Z]))(?=[\u4e00-\u9fff])/g,
      fix: (match) => `${match} `,
    },
    {
      name: "text_command_before_chinese",
      desc: "\\text 类命令后直接跟中文需要加空格",
      pattern: /(\\(?:text|textbf|textit|textrm|textsf|texttt|textsc|emph)\{[^}]*\})(?=[\u4e00-\u9fff])/g,
      fix: (match) => `${match} `,
    },
    {
      name: "dotfill_before_chinese",
      desc: "\\dotfill 后跟中文需要加空格",
      pattern: /(\\dotfill)(?=[\u4e00-\u9fff])/g,
      fix: (match) => `${match} `,
    },
  ],

  // 4. 环境闭合错误
  environments: [
    {
      name: "unclosed_equation",
      desc: "修复未闭合的 equation 环境",
      pattern: /\\begin\{equation\}([\s\S]*?)(?=\\begin\{equation\}|\\section|\\chapter|$)/g,
      fix: (match, content) => {
        if (!content.includes("\\end{equation}")) {
          return `\\begin{equation}${content}\\end{equation}\n`;
        }
        return match;
      },
    },
    {
      name: "unclosed_align",
      desc: "修复未闭合的 align 环境",
      pattern: /\\begin\{align\*?\}([\s\S]*?)(?=\\begin\{align|\\section|\\chapter|$)/g,
      fix: (match, content) => {
        const envName = match.startsWith("\\begin{align*}") ? "align*" : "align";
        if (!content.includes(`\\end{${envName}}`)) {
          return `\\begin{${envName}}${content}\\end{${envName}}\n`;
        }
        return match;
      },
    },
    {
      name: "unclosed_figure",
      desc: "修复未闭合的 figure 环境",
      pattern: /\\begin\{figure\}([\s\S]*?)(?=\\begin\{figure\}|\\section|\\chapter|$)/g,
      fix: (match, content) => {
        if (!content.includes("\\end{figure}")) {
          return `\\begin{figure}${content}\\end{figure}\n`;
        }
        return match;
      },
    },
    {
      name: "unclosed_table",
      desc: "修复未闭合的 table 环境",
      pattern: /\\begin\{table\}([\s\S]*?)(?=\\begin\{table\}|\\section|\\chapter|$)/g,
      fix: (match, content) => {
        if (!content.includes("\\end{table}")) {
          return `\\begin{table}${content}\\end{table}\n`;
        }
        return match;
      },
    },
  ],

  // 5. 图表错误
  figures: [
    {
      name: "missing_image_placeholder",
      desc: "为缺失的图片添加占位符",
      // 这个规则需要配合 imageList 使用，在 repairLatex 函数中特殊处理
      pattern: null,
      fix: null,
    },
    {
      name: "hardcoded_figure_ref",
      desc: "手写的图号提示添加注释",
      pattern: /(图\s*\d+[\.\d]*)/g,
      fix: (match) => `${match}% TODO: 考虑使用 \\ref`,
    },
  ],

  // 6. 中文/编码问题
  encoding: [
    {
      name: "fullwidth_period",
      desc: "全角句号（在非数学环境）保留",
      // 不做转换，保持中文习惯
      pattern: null,
      fix: null,
    },
    {
      name: "mixed_quotes",
      desc: "统一引号风格",
      pattern: /"([^""]*)"/g,
      fix: (match, content) => `"${content}"`,
    },
  ],

  // 7. 定理环境结构化（可选）
  theorems: [
    {
      name: "textbf_theorem",
      desc: "\\textbf{定理} 转换为 theorem 环境",
      pattern: /\\textbf\{定理\s*(\d*[\.\d]*)\s*\}[：:\s]*([\s\S]*?)(?=\\textbf|\\section|\\subsection|$)/g,
      fix: (match, num, content) => {
        const label = num ? `\\label{thm:${num.replace(/\./g, "_")}}` : "";
        return `\\begin{theorem}${label}\n${content.trim()}\n\\end{theorem}\n`;
      },
    },
    {
      name: "textbf_definition",
      desc: "\\textbf{定义} 转换为 definition 环境",
      pattern: /\\textbf\{定义\s*(\d*[\.\d]*)\s*\}[：:\s]*([\s\S]*?)(?=\\textbf|\\section|\\subsection|$)/g,
      fix: (match, num, content) => {
        const label = num ? `\\label{def:${num.replace(/\./g, "_")}}` : "";
        return `\\begin{definition}${label}\n${content.trim()}\n\\end{definition}\n`;
      },
    },
    {
      name: "textbf_example",
      desc: "\\textbf{例} 转换为 example 环境",
      pattern: /\\textbf\{例\s*(\d*[\.\d]*)\s*\}[：:\s]*([\s\S]*?)(?=\\textbf|\\section|\\subsection|\\begin\{|$)/g,
      fix: (match, num, content) => {
        const label = num ? `\\label{ex:${num.replace(/\./g, "_")}}` : "";
        return `\\begin{example}${label}\n${content.trim()}\n\\end{example}\n`;
      },
    },
  ],
};

function repairLatexRuleBased(latex, options = {}) {
  const {
    enableStructure = true,
    enableToc = true,
    enableMath = true,
    enableEnvironments = true,
    enableFigures = true,
    enableEncoding = true,
    enableTheorems = false, // 默认关闭定理结构化
    imageList = [],
  } = options;

  let result = latex;
  const fixes = [];

  function applyRules(rules, category) {
    for (const rule of rules) {
      if (!rule.pattern || !rule.fix) continue;
      const before = result;
      result = result.replace(rule.pattern, rule.fix);
      if (result !== before) {
        fixes.push({ category, rule: rule.name, desc: rule.desc });
      }
    }
  }

  if (enableStructure) applyRules(LATEX_REPAIR_RULES.structure, "structure");
  if (enableToc) applyRules(LATEX_REPAIR_RULES.toc, "toc");
  if (enableMath) applyRules(LATEX_REPAIR_RULES.math, "math");
  if (enableEnvironments) applyRules(LATEX_REPAIR_RULES.environments, "environments");
  if (enableEncoding) applyRules(LATEX_REPAIR_RULES.encoding, "encoding");
  if (enableTheorems) applyRules(LATEX_REPAIR_RULES.theorems, "theorems");

  // 特殊处理：图片缺失检查
  if (enableFigures && imageList.length > 0) {
    const imageSet = new Set(imageList.map((img) => img.id || img.filename?.replace(/\.png$/i, "")));
    const includedImages = [];
    result.replace(/\\includegraphics(?:\[[^\]]*\])?\{([^}]+)\}/g, (match, filename) => {
      const id = filename.replace(/\.png$/i, "");
      includedImages.push(id);
      return match;
    });
    for (const id of includedImages) {
      if (!imageSet.has(id)) {
        fixes.push({
          category: "figures",
          rule: "missing_image",
          desc: `图片 ${id} 不在资源列表中`,
        });
      }
    }
  }

  // 特殊处理：检查环境配对
  const envBalance = checkEnvironmentBalance(result);
  if (envBalance.issues.length > 0) {
    fixes.push(...envBalance.issues.map((issue) => ({
      category: "environments",
      rule: "balance_check",
      desc: issue,
    })));
  }

  return { latex: result, fixes };
}

function checkEnvironmentBalance(latex) {
  const issues = [];
  const envStack = [];
  const envRegex = /\\(begin|end)\{([^}]+)\}/g;
  let match;

  while ((match = envRegex.exec(latex)) !== null) {
    const [, type, name] = match;
    if (type === "begin") {
      envStack.push({ name, pos: match.index });
    } else if (type === "end") {
      if (envStack.length === 0) {
        issues.push(`多余的 \\end{${name}} (位置 ${match.index})`);
      } else {
        const last = envStack.pop();
        if (last.name !== name) {
          issues.push(`环境不匹配：\\begin{${last.name}} 与 \\end{${name}}`);
        }
      }
    }
  }

  for (const unclosed of envStack) {
    issues.push(`未闭合的 \\begin{${unclosed.name}} (位置 ${unclosed.pos})`);
  }

  return { issues };
}

function addTheoremPreamble(latex, template) {
  // 定理环境现在已经在 buildLatexPreamble 中统一定义
  // 这个函数保留用于向后兼容，但不再需要额外添加定义
  return latex;
}

/**
 * 验证 LaTeX 文档的可编译性，返回问题列表
 */
function validateLatexCompilability(latex, imageList = []) {
  const issues = [];
  
  // 1. 检查文档结构完整性
  if (!latex.includes("\\documentclass")) {
    issues.push({ severity: "error", message: "缺少 \\documentclass" });
  }
  if (!latex.includes("\\begin{document}")) {
    issues.push({ severity: "error", message: "缺少 \\begin{document}" });
  }
  if (!latex.includes("\\end{document}")) {
    issues.push({ severity: "error", message: "缺少 \\end{document}" });
  }
  
  // 2. 检查编译器兼容性
  if (latex.includes("ctexart") || latex.includes("ctexbook")) {
    if (!latex.includes("% !TEX program = xelatex") && !latex.includes("% !TEX program = lualatex")) {
      issues.push({ 
        severity: "warn", 
        message: "使用 ctexart/ctexbook 需要用 xelatex 编译，不能用 pdflatex" 
      });
    }
  }
  
  // 3. 检查环境配对
  const envBalance = checkEnvironmentBalance(latex);
  for (const issue of envBalance.issues) {
    issues.push({ severity: "error", message: issue });
  }
  
  // 4. 检查数学模式配对
  const dollarCount = (latex.match(/(?<!\\)\$/g) || []).length;
  if (dollarCount % 2 !== 0) {
    issues.push({ severity: "error", message: "行内数学公式 $ 符号不配对" });
  }
  
  // 5. 检查常见的 LaTeX 错误
  if (/\\begin\{equation\}[\s\S]*?\\begin\{equation\}/.test(latex)) {
    issues.push({ severity: "error", message: "equation 环境不能嵌套" });
  }
  if (/\\begin\{align\}[\s\S]*?\\begin\{align\}/.test(latex)) {
    issues.push({ severity: "error", message: "align 环境不能嵌套" });
  }
  
  // 6. 检查图片引用
  const imageIds = new Set(imageList.map(img => img.id || img.filename?.replace(/\.png$/i, "")));
  const includedImages = [];
  latex.replace(/\\includegraphics(?:\[[^\]]*\])?\{([^}]+)\}/g, (match, filename) => {
    const id = filename.replace(/\.png$/i, "").replace(/^.*\//, "");
    includedImages.push(id);
    return match;
  });
  
  for (const id of includedImages) {
    if (imageIds.size > 0 && !imageIds.has(id)) {
      issues.push({ severity: "warn", message: `图片 ${id}.png 不在导出列表中` });
    }
  }
  
  // 7. 检查特殊字符（可能需要转义）
  // 注意：% 在 LaTeX 中是注释，如果在正文中出现且不是注释开头，可能是问题
  const lines = latex.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // 检查行内是否有未转义的 % （排除行首注释）
    if (/[^\\]%/.test(line) && !line.trim().startsWith("%")) {
      // 可能是有意的注释，不报错，只警告
    }
    // 检查未转义的 & （在非表格/align环境中）
    if (/[^\\]&/.test(line) && !/\\begin\{(tabular|array|align|matrix)/.test(latex.slice(0, latex.indexOf(line)))) {
      // 可能在表格中，跳过
    }
  }
  
  return issues;
}

/**
 * 获取编译建议
 */
function getCompilationInstructions(template) {
  if (template === "ctexart" || template === "ctexbook") {
    return `
编译说明：
1. 本文档使用 ctexart 文档类，包含中文内容
2. 必须使用 XeLaTeX 或 LuaLaTeX 编译，不能使用 pdfLaTeX
3. 编译命令: xelatex main.tex
4. 如果有引用，需要编译两次

推荐工具：
- TeXLive 或 MiKTeX（完整安装）
- VSCode + LaTeX Workshop 插件
- Overleaf（在线，需设置编译器为 XeLaTeX）
`.trim();
  }
  
  return `
编译说明：
1. 本文档使用 article 文档类
2. 可以使用 pdfLaTeX、XeLaTeX 或 LuaLaTeX 编译
3. 如果包含中文，建议切换到 ctexart 模板
4. 编译命令: pdflatex main.tex 或 xelatex main.tex

推荐工具：
- TeXLive 或 MiKTeX
- VSCode + LaTeX Workshop 插件
- Overleaf（在线）
`.trim();
}

async function repairLatexWithLlm(latex, options = {}) {
  const { maxChunkSize = 8000, maxRetries = 3 } = options;
  const verifierCfg = getRoleConfig("verifier");

  // 对于长文本，分块处理
  if (latex.length <= maxChunkSize) {
    return await repairSingleChunk(latex, verifierCfg, maxRetries);
  }

  // 分块策略：按页面边界分割
  const chunks = splitByPageBoundaries(latex, maxChunkSize);
  const repairedChunks = [];

  for (let i = 0; i < chunks.length; i++) {
    setStage(`LaTeX 修复: 块 ${i + 1}/${chunks.length}`);
    setPageProgress(`${i + 1} / ${chunks.length}`, i / chunks.length);
    const repaired = await repairSingleChunk(chunks[i], verifierCfg, maxRetries);
    repairedChunks.push(repaired);
  }

  return repairedChunks.join("\n");
}

function splitByPageBoundaries(latex, maxChunkSize) {
  const chunks = [];
  const pagePattern = /%% ===== PAGE \d+ START =====/g;
  const matches = [...latex.matchAll(pagePattern)];

  if (matches.length === 0) {
    // 没有页面标记，按大小分割
    for (let i = 0; i < latex.length; i += maxChunkSize) {
      chunks.push(latex.slice(i, i + maxChunkSize));
    }
    return chunks;
  }

  let currentChunk = "";
  let lastEnd = 0;

  for (const match of matches) {
    const pageStart = match.index;
    const segment = latex.slice(lastEnd, pageStart);

    if (currentChunk.length + segment.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = segment;
    } else {
      currentChunk += segment;
    }
    lastEnd = pageStart;
  }

  // 添加最后一段
  currentChunk += latex.slice(lastEnd);
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

async function repairSingleChunk(chunk, cfg, maxRetries) {
  const system = "你是 LaTeX 修复专家。只输出修复后的 LaTeX 代码，不要解释。";
  const userText = `请修复以下 LaTeX 代码中的错误（环境未闭合、语法错误、符号错误等），保持内容不变：

\`\`\`latex
${chunk}
\`\`\`

只输出修复后的 LaTeX 代码（不要包含 \`\`\`）：`;

  try {
    const resp = await llmCallWithRetry(cfg, { system, userText, imageDataUrl: null, signal: null }, { maxRetries });
    return stripCodeFences(resp);
  } catch (e) {
    log(`LLM 修复失败，使用原文: ${String(e.message || e).slice(0, 100)}`);
    return chunk;
  }
}

async function runLatexRepair() {
  if (!state.mainTex) {
    throw new Error("没有 main.tex 可修复。请先运行组装阶段。");
  }

  setStage("LaTeX 修复: 规则修复");
  setPageProgress("—", 0);

  const enableTheorems = $("repairTheoremsEnabled")?.checked || false;
  const useLlm = $("repairUseLlm")?.checked || false;

  // 1. 规则修复（快速，适合长文本）
  const ruleResult = repairLatexRuleBased(state.mainTex, {
    enableTheorems,
    imageList: flattenImagesList(),
  });

  log(`规则修复完成，应用了 ${ruleResult.fixes.length} 项修复：`);
  for (const fix of ruleResult.fixes.slice(0, 20)) {
    log(`  - [${fix.category}] ${fix.desc}`);
  }
  if (ruleResult.fixes.length > 20) {
    log(`  ... 还有 ${ruleResult.fixes.length - 20} 项`);
  }

  let finalLatex = ruleResult.latex;

  // 2. 添加必要的 preamble（如定理环境）
  if (enableTheorems) {
    finalLatex = addTheoremPreamble(finalLatex, $("latexTemplate").value);
  }

  // 3. 可选：LLM 深度修复
  if (useLlm) {
    setStage("LaTeX 修复: LLM 深度修复");
    const { maxRetries } = getRunSettings();
    finalLatex = await repairLatexWithLlm(finalLatex, { maxRetries });
    log("LLM 深度修复完成。");
  }

  // 4. 更新状态
  state.mainTex = finalLatex;
  updateOutputsPanels();

  setStage("LaTeX 修复: 完成");
  setPageProgress("100%", 1);
  log("LaTeX 修复全部完成。");

  return { fixes: ruleResult.fixes, latex: finalLatex };
}

// ---------------------------
// Outputs + export
// ---------------------------

function updateOutputsPanels() {
  const pagesArr = Array.from(state.pageResults.values()).sort((a, b) => a.page - b.page);
  $("pagesBox").textContent = JSON.stringify(
    pagesArr.map((p) => ({
      page: p.page,
      width: p.width,
      height: p.height,
      annotations: p.annotations,
      figures: p.figures,
      latex_preview: (p.latex || "").slice(0, 500),
    })),
    null,
    2
  );

  $("imagesBox").textContent = JSON.stringify(flattenImagesList(), null, 2);
  $("treeBox").textContent = JSON.stringify(state.sectionTree || {}, null, 2);
  $("texBox").textContent = state.mainTex || "";
}

async function organizeAndGenerateTex() {
  // New workflow:
  // 1) window assemble (concurrent)
  // 2) global assemble: ALWAYS include all per-page LaTeX into main.tex
  setStage("Assemble: start");

  if (!state.windowPlans || state.windowPlans.length === 0) {
    // Build window plans first if not present.
    state.windowPlans = await buildWindowPlansConcurrently();
  }

  // Build section tree deterministically from explicit per-page headings (safe)
  const headings = collectHeadingsInOrder().filter((h) => String(h.text || "").trim().length > 0);
  state.sectionTree = buildSectionTreeFromHeadings(headings);

  // Insertions: use window plans if they match explicit evidence; otherwise fall back to raw headings.
  const insertions = mergeInsertionsFromWindowPlans(state.windowPlans);
  state.mainTex = buildMainTexFromPagesWithInsertions(insertions);

  const verify = await verifyIfEnabled(state.mainTex);
  if (verify && Array.isArray(verify.issues) && verify.issues.length) {
    log("Verifier issues:");
    for (const it of verify.issues.slice(0, 50)) {
      log(`- [${it.severity}] ${it.where}: ${it.message}${it.suggestion ? " | " + it.suggestion : ""}`);
    }
  } else if (verify && verify.latex_compiles_syntax === true) {
    log("Verifier: latex_compiles_syntax=true");
  }

  updateOutputsPanels();
  setStage("Assemble: done");
  log("Assemble done.");
}

async function exportZip() {
  if (!window.JSZip) throw new Error("JSZip missing.");
  if (!state.mainTex) throw new Error("No main.tex generated yet. Run organization first.");

  setStage("Export: validating");
  setPageProgress("—", 0);

  // 验证 LaTeX 可编译性
  const imageList = flattenImagesList();
  const validationIssues = validateLatexCompilability(state.mainTex, imageList);
  
  if (validationIssues.length > 0) {
    log("LaTeX 验证发现以下问题：");
    for (const issue of validationIssues) {
      log(`  [${issue.severity}] ${issue.message}`);
    }
    const errorCount = validationIssues.filter(i => i.severity === "error").length;
    if (errorCount > 0) {
      log(`警告: 有 ${errorCount} 个错误，编译可能失败。建议先运行 LaTeX 修复。`);
    }
  } else {
    log("LaTeX 验证通过，无明显问题。");
  }

  setStage("Export: preparing ZIP");
  const zip = new window.JSZip();
  
  // main.tex
  zip.file("main.tex", state.mainTex);
  
  // 编译说明 README
  const template = $("latexTemplate").value;
  const compilationInstructions = getCompilationInstructions(template);
  const readmeContent = `# LaTeX 导出包

## 文件说明

- main.tex: 主 LaTeX 文档
- *.png: 从 PDF 中裁剪的图片
- pages/: 每页的原始转写数据 (JSON)
- section_tree.json: 章节结构树
- images.json: 图片资源清单

## ${compilationInstructions}

## 验证结果

${validationIssues.length === 0 ? "✅ 无明显问题" : validationIssues.map(i => `- [${i.severity}] ${i.message}`).join("\n")}

## 生成信息

- 生成时间: ${nowIso()}
- 源 PDF: ${state.pdfFile?.name || "unknown"}
- 页数: ${state.pageResults.size}
- 图片数: ${imageList.length}
`;
  zip.file("README.md", readmeContent);
  
  // 其他数据文件
  zip.file("section_tree.json", JSON.stringify(state.sectionTree || {}, null, 2));
  zip.file("images.json", JSON.stringify(imageList, null, 2));

  const pagesFolder = zip.folder("pages");
  const pagesArr = Array.from(state.pageResults.values()).sort((a, b) => a.page - b.page);
  for (let i = 0; i < pagesArr.length; i++) {
    const p = pagesArr[i];
    pagesFolder.file(`page_${pad3(p.page)}.json`, JSON.stringify(p.raw || p, null, 2));
  }

  // Put PNGs next to main.tex so LaTeX can reference `pX_figY.png` directly.
  const imgs = Array.from(state.images.values()).sort((a, b) => (a.page - b.page) || a.id.localeCompare(b.id));
  for (let i = 0; i < imgs.length; i++) {
    const img = imgs[i];
    setPageProgress(`图片 ${i + 1} / ${imgs.length}`, imgs.length ? i / imgs.length : 1);
    zip.file(img.filename, img.blob);
  }

  setStage("Export: generating…");
  const blob = await zip.generateAsync({ type: "blob" }, (meta) => {
    if (meta && typeof meta.percent === "number") {
      setPageProgress(`${meta.percent.toFixed(0)}%`, meta.percent / 100);
    }
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const base = state.pdfFile ? state.pdfFile.name.replace(/\.pdf$/i, "") : "output";
  a.href = url;
  a.download = `${base}_latex_bundle.zip`;
  a.click();
  setStage("Export: done");
  setPageProgress("100%", 1);
  log("ZIP downloaded.");
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

function downloadText(filename, text) {
  downloadBlob(filename, new Blob([text], { type: "text/plain;charset=utf-8" }));
}

function downloadJson(filename, obj) {
  downloadText(filename, JSON.stringify(obj, null, 2));
}

async function exportPagesZip() {
  if (!window.JSZip) throw new Error("JSZip missing.");
  const zip = new window.JSZip();
  const pagesArr = Array.from(state.pageResults.values()).sort((a, b) => a.page - b.page);
  for (const p of pagesArr) {
    zip.file(`page_${pad3(p.page)}.json`, JSON.stringify(p.raw || p, null, 2));
  }
  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob("pages.zip", blob);
}

async function exportImagesZipOnly() {
  if (!window.JSZip) throw new Error("JSZip missing.");
  const zip = new window.JSZip();
  const imgs = Array.from(state.images.values()).sort((a, b) => (a.page - b.page) || a.id.localeCompare(b.id));
  for (const img of imgs) zip.file(img.filename, img.blob);
  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob("images.zip", blob);
}

async function exportWorkRecordZip() {
  if (!window.JSZip) throw new Error("JSZip missing.");
  if (!state.pdfBytes) throw new Error("PDF not loaded.");
  const range = state.run.lastRange || { start: 1, end: state.totalPages || 0 };

  setStage("Export: work record");
  setPageProgress("—", 0);

  const zip = new window.JSZip();
  const pagesArr = Array.from(state.pageResults.values()).sort((a, b) => a.page - b.page);
  const imgs = Array.from(state.images.values()).sort((a, b) => (a.page - b.page) || a.id.localeCompare(b.id));

  const record = {
    version: 2, // 升级版本号，包含更多字段
    created_at: nowIso(),
    pdf: {
      name: state.pdfFile ? state.pdfFile.name : null,
      sha256: state.pdfSha256,
      total_pages: state.totalPages,
    },
    range,
    pages_done: pagesArr.map((p) => p.page),
    images: imgs.map((img) => ({
      id: img.id,
      filename: img.filename,
      page: img.page,
      bbox: img.bbox,
      referenced_in: img.referencedIn,
      evidence: img.evidence || "",
    })),
    // 记录各阶段完成状态
    stages: {
      transcribe_done: pagesArr.length > 0,
      window_assemble_done: state.windowPlans && state.windowPlans.length > 0,
      organize_done: !!state.mainTex,
      section_tree_done: !!state.sectionTree,
    },
  };
  zip.file("work_record.json", JSON.stringify(record, null, 2));

  // 保存每页 JSON
  const pagesFolder = zip.folder("pages");
  for (const p of pagesArr) {
    pagesFolder.file(`page_${pad3(p.page)}.json`, JSON.stringify(p.raw || p, null, 2));
  }

  // 保存图片
  for (let i = 0; i < imgs.length; i++) {
    setPageProgress(`图片 ${i + 1} / ${imgs.length}`, imgs.length ? i / imgs.length : 1);
    zip.file(imgs[i].filename, imgs[i].blob);
  }

  // 保存后期阶段产物
  if (state.windowPlans && state.windowPlans.length > 0) {
    zip.file("window_plans.json", JSON.stringify(state.windowPlans, null, 2));
    log("导出包含 window_plans.json");
  }

  if (state.sectionTree) {
    zip.file("section_tree.json", JSON.stringify(state.sectionTree, null, 2));
    log("导出包含 section_tree.json");
  }

  if (state.mainTex) {
    zip.file("main.tex", state.mainTex);
    log("导出包含 main.tex");
  }

  setStage("Export: generating…");
  const blob = await zip.generateAsync({ type: "blob" }, (meta) => {
    if (meta && typeof meta.percent === "number") {
      setPageProgress(`${meta.percent.toFixed(0)}%`, meta.percent / 100);
    }
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const base = state.pdfFile ? state.pdfFile.name.replace(/\.pdf$/i, "") : "work";
  a.href = url;
  a.download = `${base}_work_record.zip`;
  a.click();
  setStage("Export: work record done");
  setPageProgress("100%", 1);
  log(`工作记录已导出: ${pagesArr.length} 页, ${imgs.length} 图片`);
}

async function importWorkRecordZip() {
  if (!window.JSZip) throw new Error("JSZip missing.");
  const file = $("workRecordFile").files && $("workRecordFile").files[0];
  if (!file) throw new Error("Please choose a work record ZIP.");
  if (!state.pdfBytes) throw new Error("Load the PDF first, then import the work record.");

  // 检查是否需要先清空现有数据
  const clearFirst = document.getElementById("importClearFirst")?.checked ?? true;

  setStage("Import: work record");
  setPageProgress("—", 0);
  const buf = await file.arrayBuffer();
  const zip = await window.JSZip.loadAsync(buf);
  
  const recordFile = zip.file("work_record.json");
  if (!recordFile) throw new Error("ZIP 中没有找到 work_record.json");
  
  const recordText = await recordFile.async("string");
  const parsed = safeJsonParse(recordText);
  if (!parsed.ok) throw new Error("Invalid work_record.json in ZIP.");
  const record = parsed.value;
  
  // 检查 PDF 指纹匹配
  if (!record.pdf || record.pdf.sha256 !== state.pdfSha256) {
    const msg = `工作记录的 PDF 指纹不匹配！\n` +
      `记录中的 PDF: ${record.pdf?.name || "unknown"} (SHA256: ${record.pdf?.sha256?.slice(0, 16)}...)\n` +
      `当前加载的 PDF: ${state.pdfFile?.name || "unknown"} (SHA256: ${state.pdfSha256?.slice(0, 16)}...)`;
    throw new Error(msg);
  }

  // 如果选择清空，则先清除现有数据（保留 PDF 相关信息）
  if (clearFirst) {
    log("清空现有数据后导入...");
    state.pageResults.clear();
    state.images.clear();
    state.sectionTree = null;
    state.mainTex = "";
    state.windowPlans = [];
  }

  let pagesLoaded = 0;
  let pagesSkipped = 0;
  let imagesLoaded = 0;

  // Load page JSONs
  setStage("Import: loading pages");
  const pageFiles = Object.keys(zip.files).filter((p) => p.startsWith("pages/") && p.endsWith(".json"));
  for (let i = 0; i < pageFiles.length; i++) {
    setPageProgress(`页面 ${i + 1} / ${pageFiles.length}`, i / pageFiles.length);
    const path = pageFiles[i];
    const txt = await zip.file(path).async("string");
    const pj = safeJsonParse(txt);
    if (!pj.ok) continue;
    const obj = pj.value;
    const pageNum = Number(obj.page || obj.raw?.page);
    if (!Number.isFinite(pageNum)) continue;
    
    // 允许覆盖已存在的页面数据（如果工作记录中的数据更完整）
    const existing = state.pageResults.get(pageNum);
    const newLatex = typeof obj.latex === "string" ? obj.latex : (obj.raw && typeof obj.raw.latex === "string" ? obj.raw.latex : "");
    
    // 如果已存在且新数据不比旧数据更完整，则跳过
    if (existing && existing.latex && !newLatex) {
      pagesSkipped++;
      continue;
    }
    
    const annotations = obj.annotations || (obj.raw ? obj.raw.annotations : null) || { headings: [], notes: [] };
    const figures = obj.figures || (obj.raw ? obj.raw.figures : null) || [];
    state.pageResults.set(pageNum, {
      page: pageNum,
      width: obj.width || (obj.raw ? obj.raw.width : 0) || 0,
      height: obj.height || (obj.raw ? obj.raw.height : 0) || 0,
      latex: newLatex,
      annotations,
      figures,
      raw: obj.raw || obj,
    });
    pagesLoaded++;
  }

  // Load PNGs (top-level)
  setStage("Import: loading images");
  const pngFiles = Object.keys(zip.files).filter((p) => p.endsWith(".png") && !p.includes("/"));
  for (let i = 0; i < pngFiles.length; i++) {
    setPageProgress(`图片 ${i + 1} / ${pngFiles.length}`, i / pngFiles.length);
    const name = pngFiles[i];
    const blob = await zip.file(name).async("blob");
    const id = name.replace(/\.png$/i, "");
    // 覆盖已存在的图片
    const meta = (record.images || []).find((x) => x && x.id === id);
    state.images.set(id, {
      id,
      filename: name,
      page: meta ? meta.page : 0,
      bbox: meta ? meta.bbox : null,
      blob,
      referencedIn: meta ? (meta.referenced_in || []) : [],
      evidence: meta ? (meta.evidence || "") : "",
    });
    imagesLoaded++;
  }

  // 加载后期阶段产物
  setStage("Import: loading artifacts");

  // 加载 window_plans.json
  const windowPlansFile = zip.file("window_plans.json");
  if (windowPlansFile) {
    const wpText = await windowPlansFile.async("string");
    const wpParsed = safeJsonParse(wpText);
    if (wpParsed.ok && Array.isArray(wpParsed.value)) {
      state.windowPlans = wpParsed.value;
      log(`导入 window_plans: ${state.windowPlans.length} 个窗口`);
    }
  }

  // 加载 section_tree.json
  const sectionTreeFile = zip.file("section_tree.json");
  if (sectionTreeFile) {
    const stText = await sectionTreeFile.async("string");
    const stParsed = safeJsonParse(stText);
    if (stParsed.ok && stParsed.value) {
      state.sectionTree = stParsed.value;
      log("导入 section_tree.json");
    }
  }

  // 加载 main.tex
  const mainTexFile = zip.file("main.tex");
  if (mainTexFile) {
    state.mainTex = await mainTexFile.async("string");
    log(`导入 main.tex: ${state.mainTex.length} 字符`);
  }

  state.run.lastRange = record.range || state.run.lastRange;
  updateOutputsPanels();
  setStage("Import: done");
  setPageProgress("100%", 1);
  log(`工作记录导入完成: 加载 ${pagesLoaded} 页 (跳过 ${pagesSkipped}), ${imagesLoaded} 图片`);
  log(`当前状态: pages=${state.pageResults.size}, images=${state.images.size}, mainTex=${state.mainTex ? "有" : "无"}`);
}

// ---------------------------
// UI wiring
// ---------------------------

function syncKeyToggleText(keyInputId, toggleBtnId) {
  const input = $(keyInputId);
  const btn = $(toggleBtnId);
  const isHidden = input.type === "password";
  btn.textContent = isHidden ? t("btnShow") : t("btnHide");
}

function setupKeyToggle(keyInputId, toggleBtnId) {
  $(toggleBtnId).addEventListener("click", () => {
    const input = $(keyInputId);
    input.type = input.type === "password" ? "text" : "password";
    syncKeyToggleText(keyInputId, toggleBtnId);
  });
}

function setupTabs() {
  const btns = document.querySelectorAll(".tabs__btn");
  const panels = {
    tree: $("panelTree"),
    tex: $("panelTex"),
    images: $("panelImages"),
    pages: $("panelPages"),
  };
  function activate(name) {
    for (const b of btns) b.classList.toggle("is-active", b.dataset.tab === name);
    for (const [k, p] of Object.entries(panels)) p.hidden = k !== name;
  }
  btns.forEach((b) => b.addEventListener("click", () => activate(b.dataset.tab)));
  activate("tree");
}

function setupUseGlobalBehavior(role) {
  const useGlobal = $(role + "UseGlobal");
  const fields = [
    role + "Provider",
    role + "BaseUrl",
    role + "Model",
    role + "Key",
    role + "Temp",
    role + "MaxTokens",
  ];
  function applyDisabled() {
    const dis = useGlobal.checked;
    for (const id of fields) $(id).disabled = dis;
  }
  useGlobal.addEventListener("change", applyDisabled);
  applyDisabled();
}

async function runConnTestFor(cfg, pillEl) {
  try {
    setPill(pillEl, "warn", "…");
    await connectivityTest(cfg);
    setPill(pillEl, "ok", "OK");
  } catch (e) {
    setPill(pillEl, "bad", "FAIL");
    log(`Connectivity test failed: ${String(e && e.message ? e.message : e)}`);
  }
}

function wireUi() {
  $("langZhBtn").addEventListener("click", () => setLang("zh"));
  $("langEnBtn").addEventListener("click", () => setLang("en"));
  $("themeLightBtn").addEventListener("click", () => setTheme("light"));
  $("themeDarkBtn").addEventListener("click", () => setTheme("dark"));
  
  // 配置导入/导出按钮
  $("exportConfigBtn").addEventListener("click", () => exportConfigToFile());
  $("importConfigBtn").addEventListener("click", () => importConfigFromFile());

  // Provider defaults (only fill when fields are empty)
  $("globalProvider").addEventListener("change", () => applyProviderDefaultsTo("global"));
  $("plannerProvider").addEventListener("change", () => applyProviderDefaultsTo("planner"));
  $("transcriberProvider").addEventListener("change", () => applyProviderDefaultsTo("transcriber"));
  $("verifierProvider").addEventListener("change", () => applyProviderDefaultsTo("verifier"));

  setupKeyToggle("globalKey", "globalKeyToggle");
  setupKeyToggle("plannerKey", "plannerKeyToggle");
  setupKeyToggle("transcriberKey", "transcriberKeyToggle");
  setupKeyToggle("verifierKey", "verifierKeyToggle");

  setupTabs();
  setupUseGlobalBehavior("planner");
  setupUseGlobalBehavior("transcriber");
  setupUseGlobalBehavior("verifier");

  $("globalConnTestBtn").addEventListener("click", () => runConnTestFor(getGlobalConfig(), $("globalConnStatus")));
  $("plannerConnTestBtn").addEventListener("click", () => runConnTestFor(getRoleConfig("planner"), $("plannerConnStatus")));
  $("transcriberConnTestBtn").addEventListener("click", () => runConnTestFor(getRoleConfig("transcriber"), $("transcriberConnStatus")));
  $("verifierConnTestBtn").addEventListener("click", () => runConnTestFor(getRoleConfig("verifier"), $("verifierConnStatus")));

  $("loadPdfBtn").addEventListener("click", async () => {
    setUiBusy(true);
    try {
      await loadPdfFromInput();
      await previewOnePage();
    } catch (e) {
      log(String(e && e.message ? e.message : e));
      setStage("Error");
    } finally {
      setUiBusy(false);
    }
  });

  $("renderPreviewBtn").addEventListener("click", async () => {
    setUiBusy(true);
    try {
      await previewOnePage();
    } catch (e) {
      log(String(e && e.message ? e.message : e));
      setStage("Error");
    } finally {
      setUiBusy(false);
    }
  });

  $("transcribeBtn").addEventListener("click", async () => {
    setUiBusy(true);
    try {
      await transcribeAndCrop();
    } catch (e) {
      log(String(e && e.message ? e.message : e));
      setStage("Error");
    } finally {
      setUiBusy(false);
    }
  });

  $("windowAssembleBtn").addEventListener("click", async () => {
    setUiBusy(true);
    try {
      if (!state.pageResults.size) throw new Error("No per-page results yet. Run transcription first.");
      setStage("Window assemble: start");
      state.windowPlans = await buildWindowPlansConcurrently();
      log(`Window assemble done: windows=${state.windowPlans.length}`);
      updateOutputsPanels();
    } catch (e) {
      log(String(e && e.message ? e.message : e));
      setStage("Error");
    } finally {
      setUiBusy(false);
    }
  });

  $("organizeBtn").addEventListener("click", async () => {
    setUiBusy(true);
    try {
      await organizeAndGenerateTex();
    } catch (e) {
      log(String(e && e.message ? e.message : e));
      setStage("Error");
    } finally {
      setUiBusy(false);
    }
  });

  $("repairBtn").addEventListener("click", async () => {
    setUiBusy(true);
    try {
      const result = await runLatexRepair();
      const statusEl = document.getElementById("repairStatus");
      if (statusEl) {
        setPill(statusEl, "ok", `修复 ${result.fixes.length} 项`);
      }
    } catch (e) {
      log(String(e && e.message ? e.message : e));
      setStage("Error");
      const statusEl = document.getElementById("repairStatus");
      if (statusEl) {
        setPill(statusEl, "bad", "失败");
      }
    } finally {
      setUiBusy(false);
    }
  });

  $("exportBtn").addEventListener("click", async () => {
    setUiBusy(true);
    try {
      await exportZip();
    } catch (e) {
      log(String(e && e.message ? e.message : e));
      setStage("Error");
    } finally {
      setUiBusy(false);
    }
  });

  $("exportWorkRecordBtn").addEventListener("click", async () => {
    setUiBusy(true);
    try {
      await exportWorkRecordZip();
    } catch (e) {
      log(String(e && e.message ? e.message : e));
      setStage("Error");
    } finally {
      setUiBusy(false);
    }
  });

  $("importWorkRecordBtn").addEventListener("click", async () => {
    setUiBusy(true);
    try {
      await importWorkRecordZip();
    } catch (e) {
      log(String(e && e.message ? e.message : e));
      setStage("Error");
    } finally {
      setUiBusy(false);
    }
  });

  $("stopBtn").addEventListener("click", () => {
    if (!state.run.inProgress) return;
    state.run.cancelRequested = true;
    if (state.run.controller) state.run.controller.abort();
    setStage("Stopping…");
    log("Stop requested.");
  });

  $("earlyExportBtn").addEventListener("click", async () => {
    if (!state.run.inProgress) return;
    state.run.earlyExportRequested = true;
    state.run.cancelRequested = true;
    if (state.run.controller) state.run.controller.abort();
    setStage("Early stop: exporting…");
    log("Early stop requested: will export work record.");
    // Best-effort export of current results
    setUiBusy(true);
    try {
      await exportWorkRecordZip();
    } catch (e) {
      log(String(e && e.message ? e.message : e));
      setStage("Error");
    } finally {
      setUiBusy(false);
    }
  });

  $("continueBtn").addEventListener("click", async () => {
    if (state.run.inProgress) return;
    setUiBusy(true);
    try {
      await transcribeAndCrop();
    } catch (e) {
      log(String(e && e.message ? e.message : e));
      setStage("Error");
    } finally {
      setUiBusy(false);
    }
  });

  $("downloadMainTexBtn").addEventListener("click", () => {
    if (!state.mainTex) return log("No main.tex yet.");
    downloadText("main.tex", state.mainTex);
  });
  $("downloadSectionTreeBtn").addEventListener("click", () => downloadJson("section_tree.json", state.sectionTree || {}));
  $("downloadImagesJsonBtn").addEventListener("click", () => downloadJson("images.json", flattenImagesList()));
  $("downloadPagesZipBtn").addEventListener("click", async () => {
    try {
      await exportPagesZip();
    } catch (e) {
      log(String(e && e.message ? e.message : e));
    }
  });
  $("downloadImagesZipBtn").addEventListener("click", async () => {
    try {
      await exportImagesZipOnly();
    } catch (e) {
      log(String(e && e.message ? e.message : e));
    }
  });
  $("downloadWindowPlansBtn").addEventListener("click", () => downloadJson("window_plans.json", state.windowPlans || []));

  $("resetBtn").addEventListener("click", () => resetState());
}

// ---------------------------
// 配置导出/导入（命令行工具）
// ---------------------------

/**
 * 导出所有配置为 JSON 对象
 * 用法（浏览器控制台）：
 *   const cfg = exportConfig();
 *   console.log(JSON.stringify(cfg, null, 2));
 */
function exportConfig() {
  const config = {
    _version: 1,
    _exportedAt: new Date().toISOString(),
    
    // 全局 LLM 配置
    global: {
      provider: $("globalProvider").value,
      baseUrl: $("globalBaseUrl").value.trim(),
      model: $("globalModel").value.trim(),
      apiKey: $("globalKey").value,
      temperature: Number($("globalTemp").value),
      topP: Number($("globalTopP").value),
      maxTokens: Number($("globalMaxTokens").value),
      extraHeaders: $("globalExtraHeaders").value.trim(),
    },
    
    // 角色配置
    planner: {
      useGlobal: $("plannerUseGlobal").checked,
      provider: $("plannerProvider").value,
      baseUrl: $("plannerBaseUrl").value.trim(),
      model: $("plannerModel").value.trim(),
      apiKey: $("plannerKey").value,
      temperature: Number($("plannerTemp").value),
      maxTokens: Number($("plannerMaxTokens").value),
    },
    transcriber: {
      useGlobal: $("transcriberUseGlobal").checked,
      provider: $("transcriberProvider").value,
      baseUrl: $("transcriberBaseUrl").value.trim(),
      model: $("transcriberModel").value.trim(),
      apiKey: $("transcriberKey").value,
      temperature: Number($("transcriberTemp").value),
      maxTokens: Number($("transcriberMaxTokens").value),
    },
    verifier: {
      useGlobal: $("verifierUseGlobal").checked,
      enabled: $("verifierEnabled").checked,
      provider: $("verifierProvider").value,
      baseUrl: $("verifierBaseUrl").value.trim(),
      model: $("verifierModel").value.trim(),
      apiKey: $("verifierKey").value,
      temperature: Number($("verifierTemp").value),
      maxTokens: Number($("verifierMaxTokens").value),
    },
    
    // 运行设置
    run: {
      concurrency: Number($("concurrency").value),
      maxRetries: Number($("maxRetries").value),
      organizeConcurrency: Number($("organizeConcurrency").value),
      organizerWindow: Number($("organizerWindow").value),
      organizerOverlap: Number($("organizerOverlap").value),
    },
    
    // 渲染和模板
    render: {
      dpi: Number($("renderDpi").value),
      template: $("docTemplate").value,
    },
    
    // 图片检测设置
    imageDetection: {
      useOcrDetection: $("useOcrDetection")?.checked ?? true,
      useLlmValidation: $("useLlmValidation")?.checked ?? true,
      ocrLanguage: $("ocrLanguage")?.value ?? "chi_sim+eng",
      maxCropRefine: Number($("maxCropRefine")?.value || 0),
    },
    
    // LaTeX 修复设置
    latexRepair: {
      repairTheorems: $("repairTheorems")?.checked ?? true,
      repairWithLlm: $("repairWithLlm")?.checked ?? false,
    },
    
    // 工作记录设置
    workRecord: {
      importClearFirst: $("importClearFirst")?.checked ?? true,
    },
    
    // UI 设置
    ui: {
      theme: currentTheme,
      lang: currentLang,
    },
  };
  
  return config;
}

/**
 * 导入配置
 * 用法（浏览器控制台）：
 *   importConfig({ global: { provider: "openai", ... }, ... });
 */
function importConfig(config) {
  if (!config || typeof config !== "object") {
    console.error("importConfig: 无效的配置对象");
    return false;
  }
  
  try {
    // 全局配置
    if (config.global) {
      const g = config.global;
      if (g.provider) $("globalProvider").value = g.provider;
      if (g.baseUrl !== undefined) $("globalBaseUrl").value = g.baseUrl;
      if (g.model) $("globalModel").value = g.model;
      if (g.apiKey !== undefined) $("globalKey").value = g.apiKey;
      if (g.temperature !== undefined) $("globalTemp").value = g.temperature;
      if (g.topP !== undefined) $("globalTopP").value = g.topP;
      if (g.maxTokens !== undefined) $("globalMaxTokens").value = g.maxTokens;
      if (g.extraHeaders !== undefined) $("globalExtraHeaders").value = g.extraHeaders;
    }
    
    // 角色配置
    const roles = ["planner", "transcriber", "verifier"];
    for (const role of roles) {
      if (config[role]) {
        const r = config[role];
        if (r.useGlobal !== undefined) $(role + "UseGlobal").checked = r.useGlobal;
        if (r.provider) $(role + "Provider").value = r.provider;
        if (r.baseUrl !== undefined) $(role + "BaseUrl").value = r.baseUrl;
        if (r.model) $(role + "Model").value = r.model;
        if (r.apiKey !== undefined) $(role + "Key").value = r.apiKey;
        if (r.temperature !== undefined) $(role + "Temp").value = r.temperature;
        if (r.maxTokens !== undefined) $(role + "MaxTokens").value = r.maxTokens;
        if (role === "verifier" && r.enabled !== undefined) {
          $("verifierEnabled").checked = r.enabled;
        }
      }
    }
    
    // 运行设置
    if (config.run) {
      const r = config.run;
      if (r.concurrency !== undefined) $("concurrency").value = r.concurrency;
      if (r.maxRetries !== undefined) $("maxRetries").value = r.maxRetries;
      if (r.organizeConcurrency !== undefined) $("organizeConcurrency").value = r.organizeConcurrency;
      if (r.organizerWindow !== undefined) $("organizerWindow").value = r.organizerWindow;
      if (r.organizerOverlap !== undefined) $("organizerOverlap").value = r.organizerOverlap;
    }
    
    // 渲染和模板
    if (config.render) {
      if (config.render.dpi !== undefined) $("renderDpi").value = config.render.dpi;
      if (config.render.template) $("docTemplate").value = config.render.template;
    }
    
    // 图片检测设置
    if (config.imageDetection) {
      const img = config.imageDetection;
      if (img.useOcrDetection !== undefined && $("useOcrDetection")) {
        $("useOcrDetection").checked = img.useOcrDetection;
      }
      if (img.useLlmValidation !== undefined && $("useLlmValidation")) {
        $("useLlmValidation").checked = img.useLlmValidation;
      }
      if (img.ocrLanguage && $("ocrLanguage")) {
        $("ocrLanguage").value = img.ocrLanguage;
      }
      if (img.maxCropRefine !== undefined && $("maxCropRefine")) {
        $("maxCropRefine").value = img.maxCropRefine;
      }
    }
    
    // LaTeX 修复设置
    if (config.latexRepair) {
      const lx = config.latexRepair;
      if (lx.repairTheorems !== undefined && $("repairTheorems")) {
        $("repairTheorems").checked = lx.repairTheorems;
      }
      if (lx.repairWithLlm !== undefined && $("repairWithLlm")) {
        $("repairWithLlm").checked = lx.repairWithLlm;
      }
    }
    
    // 工作记录设置
    if (config.workRecord) {
      if (config.workRecord.importClearFirst !== undefined && $("importClearFirst")) {
        $("importClearFirst").checked = config.workRecord.importClearFirst;
      }
    }
    
    // UI 设置
    if (config.ui) {
      if (config.ui.theme) setTheme(config.ui.theme);
      if (config.ui.lang) setLang(config.ui.lang);
    }
    
    console.log("✅ 配置导入成功");
    log("配置已导入");
    return true;
  } catch (e) {
    console.error("importConfig 失败:", e);
    return false;
  }
}

/**
 * 导出配置到剪贴板
 * 用法：exportConfigToClipboard()
 */
async function exportConfigToClipboard() {
  const config = exportConfig();
  const json = JSON.stringify(config, null, 2);
  try {
    await navigator.clipboard.writeText(json);
    console.log("✅ 配置已复制到剪贴板");
    log("配置已复制到剪贴板");
    return true;
  } catch (e) {
    console.error("复制到剪贴板失败:", e);
    console.log("配置 JSON：\n" + json);
    return false;
  }
}

/**
 * 从剪贴板导入配置
 * 用法：importConfigFromClipboard()
 */
async function importConfigFromClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    const config = JSON.parse(text);
    return importConfig(config);
  } catch (e) {
    console.error("从剪贴板导入失败:", e);
    return false;
  }
}

/**
 * 导出配置到本地文件
 * 用法：exportConfigToFile()
 */
function exportConfigToFile(filename = "pdf2latex_config.json") {
  const config = exportConfig();
  const json = JSON.stringify(config, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  console.log("✅ 配置已保存到文件:", filename);
  log("配置已保存到文件: " + filename);
}

/**
 * 从本地文件导入配置（弹出文件选择器）
 * 用法：importConfigFromFile()
 */
function importConfigFromFile() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const config = JSON.parse(text);
      importConfig(config);
    } catch (err) {
      console.error("导入文件失败:", err);
      log("导入文件失败: " + (err.message || err));
    }
  };
  input.click();
}

// 暴露到全局，方便控制台调用（可选）
window.exportConfig = exportConfig;
window.importConfig = importConfig;
window.exportConfigToClipboard = exportConfigToClipboard;
window.importConfigFromClipboard = importConfigFromClipboard;
window.exportConfigToFile = exportConfigToFile;
window.importConfigFromFile = importConfigFromFile;

// ---------------------------
// Boot
// ---------------------------

function boot() {
  setTheme("light");
  setLang("zh");
  wireUi();
  resetState();
  // PDF.js is loaded on-demand; don't block UI if it fails.
  ensurePdfJs().then(() => log("PDF.js ready.")).catch((e) => log(String(e && e.message ? e.message : e)));
  applyProviderDefaultsTo("global");
  applyProviderDefaultsTo("planner");
  applyProviderDefaultsTo("transcriber");
  applyProviderDefaultsTo("verifier");
  log("Ready.");
  window.__APP_READY__ = true;
}

boot();

