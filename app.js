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
// Figure Caption Detection
// ---------------------------

// 图标题正则模式（中英文）
const FIGURE_CAPTION_PATTERNS = [
  // 中文模式
  /^图\s*(\d+(?:[.\-]\d+)*)/i,
  /^圖\s*(\d+(?:[.\-]\d+)*)/i,
  // 英文模式
  /^figure\s*(\d+(?:[.\-]\d+)*)/i,
  /^fig\.\s*(\d+(?:[.\-]\d+)*)/i,
  /^fig\s+(\d+(?:[.\-]\d+)*)/i,
];

function isFigureCaption(text) {
  const trimmed = (text || "").trim();
  for (const pattern of FIGURE_CAPTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return true;
    }
  }
  return false;
}

function extractFigureCaptionsFromOcr(ocrResult) {
  const captions = [];
  
  // 从行级别结果中查找图标题
  for (const line of ocrResult.lines || []) {
    if (isFigureCaption(line.text)) {
      captions.push({
        text: line.text.trim(),
        bbox: line.bbox,
        confidence: line.confidence,
      });
    }
  }
  
  return captions;
}

// LLM 分析图标题的提示词
function buildCaptionAnalysisPrompt(ocrLines) {
  const linesJson = ocrLines.map((l, i) => ({
    index: i,
    text: l.text,
    y: l.bbox.y,
    x: l.bbox.x,
  }));
  
  return `你是图片标题识别专家。以下是 OCR 提取的文本行列表（含坐标）。
请找出所有的图片标题（如"图 1.1 xxx"、"Figure 2.3 xxx"等）。

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

注意：
- 只识别图片标题，不要识别表格标题（表 X.X / Table X）
- 标题通常以"图"、"圖"、"Figure"、"Fig."开头
- 如果没有找到图标题，返回空数组`;
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
// Image Processing: Edge Detection
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

function sobelEdgeDetection(grayData, threshold) {
  const { gray, width, height } = grayData;
  const edges = new Uint8Array(width * height);
  
  // Sobel 算子
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

function findRectanglesAboveCaption(edges, width, height, captionBbox, minWidth, minHeight) {
  // 在标题上方搜索矩形区域
  const searchTop = 0;
  const searchBottom = captionBbox.y - 5; // 标题上方留一点间距
  const searchLeft = Math.max(0, captionBbox.x - 50);
  const searchRight = Math.min(width, captionBbox.x + captionBbox.w + 50);
  
  if (searchBottom <= searchTop) return null;
  
  // 从标题位置向上扫描，寻找水平边缘线
  const horizontalLines = [];
  
  for (let y = searchBottom; y >= searchTop; y--) {
    let lineStart = -1;
    let lineLength = 0;
    
    for (let x = searchLeft; x < searchRight; x++) {
      if (edges[y * width + x] > 0) {
        if (lineStart < 0) lineStart = x;
        lineLength++;
      } else {
        if (lineLength > minWidth * 0.5) {
          horizontalLines.push({ y, x1: lineStart, x2: lineStart + lineLength });
        }
        lineStart = -1;
        lineLength = 0;
      }
    }
    if (lineLength > minWidth * 0.5) {
      horizontalLines.push({ y, x1: lineStart, x2: lineStart + lineLength });
    }
  }
  
  // 尝试找到构成矩形的边
  // 简化策略：找到最接近标题的底边，然后向上找顶边
  if (horizontalLines.length < 2) return null;
  
  // 按 y 坐标排序（从下到上）
  horizontalLines.sort((a, b) => b.y - a.y);
  
  // 底边：最接近标题的水平线
  const bottomLine = horizontalLines[0];
  
  // 顶边：在底边上方，长度相近的水平线
  let topLine = null;
  for (let i = 1; i < horizontalLines.length; i++) {
    const line = horizontalLines[i];
    const lengthDiff = Math.abs((line.x2 - line.x1) - (bottomLine.x2 - bottomLine.x1));
    const heightDiff = bottomLine.y - line.y;
    
    if (heightDiff >= minHeight && lengthDiff < minWidth * 0.3) {
      topLine = line;
      break;
    }
  }
  
  if (!topLine) return null;
  
  // 构建矩形
  const rect = {
    x: Math.min(bottomLine.x1, topLine.x1),
    y: topLine.y,
    w: Math.max(bottomLine.x2, topLine.x2) - Math.min(bottomLine.x1, topLine.x1),
    h: bottomLine.y - topLine.y,
  };
  
  // 验证矩形合理性
  if (rect.w < minWidth || rect.h < minHeight) return null;
  if (rect.w / rect.h > 5 || rect.h / rect.w > 5) return null; // 宽高比过极端
  
  return rect;
}

// ---------------------------
// Image Processing: Whitespace Detection
// ---------------------------

function detectWhitespaceBoundary(grayData, captionBbox, minHeight) {
  const { gray, width, height } = grayData;
  
  // 从标题位置向上扫描
  const searchTop = 0;
  const searchBottom = captionBbox.y - 5;
  const searchLeft = Math.max(0, captionBbox.x - 30);
  const searchRight = Math.min(width, captionBbox.x + captionBbox.w + 30);
  
  if (searchBottom <= searchTop) return null;
  
  // 计算每行的像素密度（非白色像素占比）
  const rowDensity = [];
  const whiteThreshold = 240; // 接近白色的阈值
  
  for (let y = searchBottom; y >= searchTop; y--) {
    let nonWhiteCount = 0;
    for (let x = searchLeft; x < searchRight; x++) {
      if (gray[y * width + x] < whiteThreshold) {
        nonWhiteCount++;
      }
    }
    rowDensity.push({
      y,
      density: nonWhiteCount / (searchRight - searchLeft),
    });
  }
  
  // 寻找密度变化的边界
  // 策略：从标题向上，找到第一个"低密度区"后的"高密度区"结束点
  
  const lowDensityThreshold = 0.02; // 空白行阈值
  const highDensityThreshold = 0.1; // 内容行阈值
  
  let inFigure = false;
  let figureTop = -1;
  let figureBottom = searchBottom;
  let consecutiveLowDensity = 0;
  
  for (let i = 0; i < rowDensity.length; i++) {
    const { y, density } = rowDensity[i];
    
    if (!inFigure) {
      // 还没进入图片区域
      if (density > highDensityThreshold) {
        inFigure = true;
        figureBottom = y;
      }
    } else {
      // 已在图片区域内
      if (density < lowDensityThreshold) {
        consecutiveLowDensity++;
        if (consecutiveLowDensity > 5) {
          // 连续多行空白，认为图片结束
          figureTop = y + consecutiveLowDensity;
          break;
        }
      } else {
        consecutiveLowDensity = 0;
        figureTop = y;
      }
    }
  }
  
  if (figureTop < 0 || figureBottom - figureTop < minHeight) {
    return null;
  }
  
  // 左右边界：扫描列密度
  let figureLeft = searchLeft;
  let figureRight = searchRight;
  
  // 左边界
  for (let x = searchLeft; x < searchRight; x++) {
    let colDensity = 0;
    for (let y = figureTop; y <= figureBottom; y++) {
      if (gray[y * width + x] < whiteThreshold) colDensity++;
    }
    if (colDensity / (figureBottom - figureTop) > lowDensityThreshold) {
      figureLeft = x;
      break;
    }
  }
  
  // 右边界
  for (let x = searchRight - 1; x >= searchLeft; x--) {
    let colDensity = 0;
    for (let y = figureTop; y <= figureBottom; y++) {
      if (gray[y * width + x] < whiteThreshold) colDensity++;
    }
    if (colDensity / (figureBottom - figureTop) > lowDensityThreshold) {
      figureRight = x;
      break;
    }
  }
  
  return {
    x: figureLeft,
    y: figureTop,
    w: figureRight - figureLeft,
    h: figureBottom - figureTop,
  };
}

// ---------------------------
// Combined Figure Detection
// ---------------------------

async function detectFigureBboxes(canvas, pageNum) {
  const useOcr = document.getElementById("useOcrDetection")?.checked ?? true;
  const useEdge = document.getElementById("useEdgeDetection")?.checked ?? true;
  const useWhitespace = document.getElementById("useWhitespaceDetection")?.checked ?? true;
  const edgeThreshold = Number(document.getElementById("edgeThreshold")?.value || 50);
  
  const width = canvas.width;
  const height = canvas.height;
  const minFigWidth = width * 0.1;
  const minFigHeight = height * 0.05;
  
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
  
  // 2. 用正则直接识别图标题
  let captions = extractFigureCaptionsFromOcr(ocrResult);
  log(`页 ${pageNum}: 正则识别到 ${captions.length} 个图标题`);
  
  // 3. 如果正则没找到，尝试用 LLM 分析
  if (captions.length === 0 && ocrResult.lines.length > 0) {
    log(`页 ${pageNum}: 尝试 LLM 分析图标题...`);
    const llmCfg = getRoleConfig("transcriber");
    const { maxRetries } = getRunSettings();
    captions = await analyzeCaptionsWithLlm(ocrResult.lines, llmCfg, maxRetries);
    log(`页 ${pageNum}: LLM 识别到 ${captions.length} 个图标题`);
  }
  
  if (captions.length === 0) {
    log(`页 ${pageNum}: 未检测到图标题`);
    return detectedFigures;
  }
  
  // 4. 图像处理：检测图片边界
  const grayData = canvasToGrayscale(canvas);
  let edges = null;
  if (useEdge) {
    edges = sobelEdgeDetection(grayData, edgeThreshold);
  }
  
  // 5. 对每个图标题，检测其上方的图片区域
  for (let i = 0; i < captions.length; i++) {
    const caption = captions[i];
    const figureId = caption.figureId || `p${pageNum}_fig${i + 1}`;
    
    log(`页 ${pageNum}: 处理图标题 "${caption.text.slice(0, 30)}..." (y=${caption.bbox.y})`);
    
    let bbox = null;
    
    // 策略 A：黑框检测
    if (useEdge && edges) {
      bbox = findRectanglesAboveCaption(edges, width, height, caption.bbox, minFigWidth, minFigHeight);
      if (bbox) {
        log(`页 ${pageNum}: 黑框检测成功 - ${figureId}`);
      }
    }
    
    // 策略 B：空白边界检测（回退）
    if (!bbox && useWhitespace) {
      bbox = detectWhitespaceBoundary(grayData, caption.bbox, minFigHeight);
      if (bbox) {
        log(`页 ${pageNum}: 空白边界检测成功 - ${figureId}`);
      }
    }
    
    if (bbox) {
      // 验证 bbox 合理性
      bbox = normalizeBbox(bbox, width, height);
      if (bbox) {
        detectedFigures.push({
          id: figureId,
          bbox,
          caption: caption.text,
          captionBbox: caption.bbox,
          method: edges ? "edge" : "whitespace",
        });
      }
    } else {
      log(`页 ${pageNum}: 无法检测图片边界 - ${figureId}，将使用 LLM 估计`);
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
      
      // 如果是 LLM 检测的，可能需要自校正
      if (fig.method === "llm" && maxCropRefine > 0) {
        log(`页 ${pageNum}: 图 ${id} 使用 LLM bbox，尝试自校正`);
        bbox = await refineFigureBboxWithLlm({
          pageNum,
          width,
          height,
          figureId: id,
          initialBbox: bbox,
          pageCanvas: canvas,
          llmCfg: transcriberCfg,
          maxRetries,
          maxRefine: maxCropRefine,
          signal,
        });
      }
      
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
  if (template === "article") {
    return `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath,amssymb,amsthm}
\\usepackage{graphicx}
\\usepackage{geometry}
\\geometry{margin=1in}
\\begin{document}
`;
  }
  // ctexart default
  return `\\documentclass[UTF8]{ctexart}
\\usepackage{amsmath,amssymb,amsthm}
\\usepackage{graphicx}
\\usepackage{geometry}
\\geometry{margin=1in}
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
  // 检查是否需要添加定理环境定义
  const needsTheorem = /\\begin\{theorem\}/.test(latex);
  const needsDefinition = /\\begin\{definition\}/.test(latex);
  const needsExample = /\\begin\{example\}/.test(latex);
  const needsProof = /\\begin\{proof\}/.test(latex);

  if (!needsTheorem && !needsDefinition && !needsExample) {
    return latex;
  }

  const preambleAdditions = [];
  if (needsTheorem || needsDefinition || needsExample) {
    preambleAdditions.push("\\usepackage{amsthm}");
  }
  if (needsTheorem) {
    preambleAdditions.push("\\newtheorem{theorem}{定理}[section]");
  }
  if (needsDefinition) {
    preambleAdditions.push("\\newtheorem{definition}{定义}[section]");
  }
  if (needsExample) {
    preambleAdditions.push("\\newtheorem{example}{例}[section]");
  }

  if (preambleAdditions.length === 0) return latex;

  // 在 \begin{document} 之前插入
  const insertPoint = latex.indexOf("\\begin{document}");
  if (insertPoint === -1) return latex;

  const addition = preambleAdditions.join("\n") + "\n";
  return latex.slice(0, insertPoint) + addition + latex.slice(insertPoint);
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

  setStage("Export: preparing ZIP");
  setPageProgress("—", 0);

  const zip = new window.JSZip();
  zip.file("main.tex", state.mainTex);
  zip.file("section_tree.json", JSON.stringify(state.sectionTree || {}, null, 2));
  zip.file("images.json", JSON.stringify(flattenImagesList(), null, 2));

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
    setPageProgress(`${i + 1} / ${imgs.length}`, imgs.length ? i / imgs.length : 1);
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

