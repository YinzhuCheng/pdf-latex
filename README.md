# PDF → LaTeX（LLM-only / Cloudflare 静态站）

一个可部署到 **Cloudflare Pages** 的纯静态网页工具：仅通过 **大模型 API（OpenAI / Gemini / Claude 三种协议）**，将“扫描版数学教材 PDF”在**用户指定的页码范围**内转写为：

- **按章节组织的 LaTeX 文本**（`main.tex`）
- **PNG 图像裁剪**（从原 PDF 页面渲染图剪裁得到）
- **章节树（Section Tree）**（仅基于显式证据）
- **图像资源清单**（唯一 ID + 引用关系）
- **每页 JSON**（每页 LaTeX + 局部结构标注 + 图像 bbox）

> 重要约束（已按需求实现）：  
> - **输入 = PDF + 页码范围**（范围外不处理）  
> - **不调用任何专用 OCR / PDF 解析 / 文档分析工具**  
> - **先转写，后组织**（按页 JSON → 跨页组织）  
> - 允许规划 LLM / 后校验 LLM，不同角色可用不同 key/url/model，且有统一设置入口  
> - 运行时显示进度（阶段 + 页/窗口进度）  

---

## 部署（Cloudflare Pages）

这是纯静态站点，无构建步骤。

- **Build command**: 留空  
- **Output directory**: `/`（仓库根目录）

仓库关键文件：

- `index.html`
- `styles.css`
- `app.js`

---

## 使用说明（浏览器端）

1. 打开页面，选择 PDF 文件
2. 设置页码范围（含首尾）
3. 配置大模型协议与参数（支持输入 `key / url / model / temperature / top-p / max tokens`；key 默认黑点隐藏，可切换显示）
4. 点 **加载 PDF**（会显示总页数，并可预览一页）
5. 点 **1) 按页转写 + 剪裁出图**
6. 点 **2) 章节组织 + 生成 main.tex**
7. 点 **3) 导出 ZIP**（包含所有输出与 PNG）

---

## 输出长什么样（ZIP 内容）

- `main.tex`：组织好的 LaTeX（含每页边界注释）
- `section_tree.json`：章节树（全局结构）
- `images.json`：图像资源列表（唯一 ID、bbox、引用页等）
- `pages/page_###.json`：每页转写产物（LaTeX + headings/notes + figures bbox）
- `p##_fig#.png`：剪裁图像（与 `main.tex` 同目录，文件名与 ID 对齐，例如 `p10_fig1.png`）

---

## 章节结构的“显式证据”原则

- 每页转写会产出 `annotations.headings[]`，每个 heading 必须带 `evidence`（原文片段）
- **章节组织（固定为 LLM + 证据校验）**：对滑动窗口做跨页组织，并对 `section_tree` 做证据校验；若发现“无证据标题”，自动回退到确定性组织（仅显式证据）

---

## 三种协议规范（前端实现要点）

本项目在 `app.js` 中提供三个适配器，并统一到同一个配置模型：

- **OpenAI**：`POST /v1/chat/completions`（支持图像：`image_url`）
- **Claude (Anthropic)**：`POST /v1/messages`（支持图像：base64）
- **Gemini**：`POST /v1beta/models/{model}:generateContent`（支持 `inlineData`）

> 注意：具体模型名请按你的服务端/代理支持填写。

---

## CORS 说明（强烈建议使用代理）

很多情况下浏览器直接请求 OpenAI/Anthropic/Google 会因为 **CORS** 失败。建议使用你自己的 **Cloudflare Worker** 作为简单转发代理，并在 UI 里把 `Base URL` 填成 Worker 的地址。

下面是一个最小可用的 Worker 示例（仅作参考，请自行加上鉴权/限流/日志/允许的上游域名白名单等安全措施）：

```js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Example: https://your-worker.example.com/openai/v1/chat/completions
    //          https://your-worker.example.com/claude/v1/messages
    //          https://your-worker.example.com/gemini/v1beta/models/...:generateContent
    const upstream = url.pathname.startsWith("/openai/")
      ? "https://api.openai.com/" + url.pathname.replace("/openai/", "")
      : url.pathname.startsWith("/claude/")
        ? "https://api.anthropic.com/" + url.pathname.replace("/claude/", "")
        : url.pathname.startsWith("/gemini/")
          ? "https://generativelanguage.googleapis.com/" + url.pathname.replace("/gemini/", "")
          : null;
    if (!upstream) return new Response("Bad route", { status: 400 });

    const newReq = new Request(upstream + url.search, request);
    // Optionally inject auth here from env (safer than putting key in browser).
    // newReq.headers.set("Authorization", `Bearer ${env.OPENAI_KEY}`);
    const resp = await fetch(newReq);

    const headers = new Headers(resp.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Headers", "*");
    headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    return new Response(resp.body, { status: resp.status, headers });
  },
};
```

---

## PDF 渲染依赖（已内置，无需外网 CDN）

本仓库已将 **PDF.js** 作为静态资源放在 `vendor/pdfjs/`，页面通过本地模块加载，不再依赖外部 CDN。  
如果你仍看到类似 `pdfjsLib is not defined`，通常意味着这些文件在部署产物中缺失或被路径重写。

## 成功标准对齐

- **LaTeX 可编译（语法上）**：可选启用“后校验 LLM”做语法/引用一致性检查，并在日志输出问题
- **章节结构仅基于显式证据**：确定性组织默认严格遵守；LLM 组织有证据校验与回退
- **图像唯一 ID + 引用点**：图像 ID 规范为 `p{page}_fig{n}`，PNG 文件名与 ID 对齐，LaTeX 中要求显式 `\includegraphics{...png}`
