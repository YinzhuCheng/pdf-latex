/* eslint-disable no-console */

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
    lblOrganizerMode: "章节组织",
    hintOrganizerMode: "“先转写后组织”：先按页产出，再做跨页组织（含滑动窗口）。",
    lblWindow: "跨页窗口",
    hintWindow: "窗口大小 / 重叠页数（仅在 LLM 组织时使用）。",
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
    lblOrganizerMode: "Organization",
    hintOrganizerMode: "\"Transcribe first, organize later\": per-page output first, then cross-page organization (with sliding windows).",
    lblWindow: "Cross-page window",
    hintWindow: "Window size / overlap pages (used only in LLM organization mode).",
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
    lblOrganizerMode: "lblOrganizerMode",
    hintOrganizerMode: "hintOrganizerMode",
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
  // pageNum -> { page, width, height, latex, annotations, figures, raw }
  pageResults: new Map(),
  // imageId -> { id, filename, page, bbox, blob, referencedIn }
  images: new Map(),
  sectionTree: null,
  mainTex: "",
};

function resetState() {
  state.pdfFile = null;
  state.pdfBytes = null;
  state.pdfDoc = null;
  state.totalPages = 0;
  state.pageResults.clear();
  state.images.clear();
  state.sectionTree = null;
  state.mainTex = "";
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
    "organizeBtn",
    "exportBtn",
    "resetBtn",
    "renderPreviewBtn",
    "globalConnTestBtn",
    "plannerConnTestBtn",
    "transcriberConnTestBtn",
    "verifierConnTestBtn",
  ];
  for (const id of ids) $(id).disabled = isBusy;
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
  if (!window.pdfjsLib) throw new Error("pdfjsLib missing");
  // Use CDN worker.
  // eslint-disable-next-line no-undef
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.js";
}

async function loadPdfFromInput() {
  const file = $("pdfFile").files && $("pdfFile").files[0];
  if (!file) throw new Error("Please choose a PDF file.");
  state.pdfFile = file;
  state.pdfBytes = await file.arrayBuffer();
  setStage("PDF: loading…");
  // eslint-disable-next-line no-undef
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

async function callOpenAI(cfg, { system, userText, imageDataUrl }) {
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
  const data = await fetchJson(url, { method: "POST", headers, body: JSON.stringify(body) });
  const msg = data.choices && data.choices[0] && data.choices[0].message;
  const text = msg && msg.content;
  if (!text) throw new Error("OpenAI: empty response.");
  return String(text);
}

async function callClaude(cfg, { system, userText, imageDataUrl }) {
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
  const data = await fetchJson(url, { method: "POST", headers, body: JSON.stringify(body) });
  const parts = data.content;
  const textPart = Array.isArray(parts) ? parts.find((p) => p && p.type === "text") : null;
  const text = textPart && textPart.text;
  if (!text) throw new Error("Claude: empty response.");
  return String(text);
}

async function callGemini(cfg, { system, userText, imageDataUrl }) {
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
  const data = await fetchJson(url, { method: "POST", headers, body: JSON.stringify(body) });
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

async function connectivityTest(cfgIn) {
  const cfg = normalizeProviderDefaults(cfgIn);
  const sys = "You are a connectivity test endpoint. Reply with exactly: OK";
  const user = "Reply with exactly: OK";
  const text = await llmCall(cfg, { system: sys, userText: user, imageDataUrl: null });
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
  const scale = Number($("renderScale").value || 2);

  const transcriberCfg = getRoleConfig("transcriber");

  setStage("Transcribe: start");
  const total = end - start + 1;
  for (let i = 0; i < total; i++) {
    const pageNum = start + i;
    setPageProgress(`${pageNum} / ${end}`, i / total);
    setStage(`Transcribe: rendering page ${pageNum}`);
    log(`Rendering page ${pageNum}…`);
    const { canvas, width, height } = await renderPageToCanvas(pageNum, scale);

    // show preview as we go
    const out = $("previewCanvas");
    out.width = canvas.width;
    out.height = canvas.height;
    out.getContext("2d").drawImage(canvas, 0, 0);

    const dataUrl = canvas.toDataURL("image/png");
    const system = "You are a careful math textbook transcriber. Output JSON only.";
    const userText = buildTranscriptionPrompt({ pageNum, width, height });
    setStage(`Transcribe: LLM page ${pageNum}`);
    log(`Calling LLM for page ${pageNum}…`);

    let respText = await llmCall(transcriberCfg, { system, userText, imageDataUrl: dataUrl });
    respText = stripCodeFences(respText);

    const parsed = safeJsonParse(respText);
    if (!parsed.ok) {
      log(`LLM output not JSON on page ${pageNum}. Will retry once with a stricter prompt.`);
      await sleep(250);
      const userText2 =
        userText +
        "\n\n再次强调：必须输出严格 JSON，且不要使用 Markdown 代码块或任何额外文字。";
      respText = await llmCall(transcriberCfg, { system, userText: userText2, imageDataUrl: dataUrl });
      respText = stripCodeFences(respText);
    }
    const parsed2 = safeJsonParse(respText);
    if (!parsed2.ok) {
      throw new Error(`Page ${pageNum}: LLM output is not valid JSON.`);
    }
    const obj = parsed2.value;

    if (obj.page !== pageNum) {
      log(`Warning: page mismatch. expected=${pageNum}, got=${obj.page}`);
    }
    const latex = typeof obj.latex === "string" ? obj.latex : "";
    const annotations = obj.annotations && typeof obj.annotations === "object" ? obj.annotations : { headings: [], notes: [] };
    const figures = Array.isArray(obj.figures) ? obj.figures : [];

    // Crop figures
    for (let fi = 0; fi < figures.length; fi++) {
      const fig = figures[fi] || {};
      const id = String(fig.id || `p${pageNum}_fig${fi + 1}`);
      const bbox = normalizeBbox(fig.bbox, width, height);
      if (!bbox) {
        log(`Page ${pageNum}: skip figure ${id} (invalid bbox).`);
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
        evidence: String(fig.evidence || ""),
      });
    }

    const includeIds = extractIncludeGraphicsIds(latex);
    for (const id of includeIds) {
      const img = state.images.get(id);
      if (img) {
        if (!img.referencedIn.includes(pageNum)) img.referencedIn.push(pageNum);
      } else {
        // We'll still list it later for diagnostics.
      }
    }

    state.pageResults.set(pageNum, {
      page: pageNum,
      width,
      height,
      latex,
      annotations,
      figures,
      raw: obj,
    });

    log(`Transcribed page ${pageNum}: latex_chars=${latex.length}, figures=${figures.length}`);
    updateOutputsPanels();
  }
  setPageProgress(`${end} / ${end}`, 1);
  setStage("Transcribe: done");
  log("Transcription done.");
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
    const resp = stripCodeFences(await llmCall(plannerCfg, { system, userText, imageDataUrl: null }));
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
  setStage("Verify: LLM check");
  const images = flattenImagesList();
  const system = "You are a strict JSON-only verifier.";
  const userText = buildVerifierPrompt({ mainTex, images });
  const resp = stripCodeFences(await llmCall(verifierCfg, { system, userText, imageDataUrl: null }));
  const parsed = safeJsonParse(resp);
  if (!parsed.ok) throw new Error("Verifier returned invalid JSON.");
  return parsed.value;
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
  setStage("Organize: start");
  let result;
  if ($("organizerMode").value === "llm") {
    result = await organizeWithLlm();
    if (result.organizerIssues && result.organizerIssues.length) {
      log(`Organizer issues: ${JSON.stringify(result.organizerIssues).slice(0, 500)}…`);
    }
  } else {
    result = buildLatexDocumentDeterministic();
  }
  state.sectionTree = result.sectionTree;
  state.mainTex = result.mainTex;

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
  setStage("Organize: done");
  log("Organization done.");
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
  try {
    initPdfJs();
    applyProviderDefaultsTo("global");
    applyProviderDefaultsTo("planner");
    applyProviderDefaultsTo("transcriber");
    applyProviderDefaultsTo("verifier");
    log("Ready.");
  } catch (e) {
    setStage("Init error");
    log(`Init error: ${String(e && e.message ? e.message : e)}`);
    log("If PDF rendering fails, check that pdf.js CDN is reachable.");
  }
}

boot();

