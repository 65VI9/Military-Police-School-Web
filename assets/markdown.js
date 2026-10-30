(function () {
const EMOJI = {smile: [0x1F604], grin: [0x1F601], joy: [0x1F602], heart: [0x2764, 0xFE0F], fire: [0x1F525], star: [0x2B50], tada: [0x1F389], thumbsup: [0x1F44D], thumbsdown: [0x1F44E], wave: [0x1F44B], salute: [0x1FAE1], warning: [0x26A0, 0xFE0F], white_check_mark: [0x2705], x: [0x274C], eyes: [0x1F440], pray: [0x1F64F], muscle: [0x1F4AA], trophy: [0x1F3C6], medal: [0x1F396, 0xFE0F], shield: [0x1F6E1, 0xFE0F], rotating_light: [0x1F6A8], police_car: [0x1F693], cop: [0x1F46E], flag_us: [0x1F1FA, 0x1F1F8], "100": [0x1F4AF], clap: [0x1F44F], rocket: [0x1F680], handshake: [0x1F91D]};
const TIME_STYLES = {t: {timeStyle: "short"}, T: {timeStyle: "medium"}, d: {dateStyle: "short"}, D: {dateStyle: "long"}, f: {dateStyle: "long", timeStyle: "short"}, F: {dateStyle: "full", timeStyle: "short"}};
const RELATIVE_STEPS = [["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60], ["second", 1]];
const SAFE_LINK = /^(https?:\/\/|mailto:|#\/)/i;
const CALLOUTS = ["info", "important", "notice", "success"];
const DEFAULT_RESULT_COLUMNS = ["Roblox Username", "Discord Username", "Position"];
const LEGACY_RESULT_KEYS = ["roblox", "discord", "position"];
const TODAY = new Date().toLocaleDateString("sv-SE");
function Esc(text) { return String(text ?? "").replace(/[&<>"']/g, (char) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[char])); }
function Src(path, base) { const clean = String(path ?? ""); return /^(https?:|data:|blob:|\/)/i.test(clean) ? clean : (base || "") + clean; }
function CssUrl(path) { return String(path).replace(/['"()\\\s]/g, (char) => "%" + char.charCodeAt(0).toString(16).padStart(2, "0")); }
function FormatDate(text) { const day = new Date(text + "T00:00:00"); return isNaN(day) ? text : day.toLocaleDateString("en-US", {year: "numeric", month: "long", day: "numeric"}); }
function IsClosed(application) { return application.status === "closed" || (application.status !== "open" && !!(application.deadline && application.deadline < TODAY)); }
function LinkHtml(url, labelHtml) { return `<a href="${Esc(url)}"${/^https?:/i.test(url) ? ' target="_blank" rel="noopener noreferrer"' : ""}>${labelHtml}</a>`; }
function TimeHtml(stamp, style) {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(stamp);
  const moment = /^\d+$/.test(stamp) ? new Date(Number(stamp) * 1000) : new Date(dateOnly ? stamp + "T00:00:00" : stamp);
  if (isNaN(moment)) return Esc("<t:" + stamp + ">");
  let label;
  if (style === "R") {
    const gap = Math.round((moment - Date.now()) / 1000);
    const [unit, size] = RELATIVE_STEPS.find(([, step]) => Math.abs(gap) >= step) || RELATIVE_STEPS[5];
    label = new Intl.RelativeTimeFormat("en", {numeric: "auto"}).format(Math.round(gap / size), unit);
  } else label = new Intl.DateTimeFormat("en-US", TIME_STYLES[style || (dateOnly ? "D" : "f")]).format(moment);
  return `<time class="dtime" datetime="${moment.toISOString()}">${Esc(label)}</time>`;
}
function Inline(text) {
  const parked = [];
  const Park = (html) => "\u0000" + (parked.push(html) - 1) + "\u0000";
  let work = String(text ?? "").replace(/\u0000/g, "");
  work = work.replace(/(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/g, (_, ticks, code) => Park(`<code>${Esc(code.trim())}</code>`));
  work = work.replace(/\\([\\`*_~|>#\[\]()<:-])/g, (_, char) => Park(Esc(char)));
  work = work.replace(/\[([^\]\n]+)\]\(\s*([^\s)]+)\s*\)/g, (whole, label, url) => SAFE_LINK.test(url) ? Park(LinkHtml(url, Inline(label))) : whole);
  work = work.replace(/<(https?:\/\/[^\s<>]+)>/g, (_, url) => Park(LinkHtml(url, Esc(url))));
  work = work.replace(/<t:(\d{1,12}|\d{4}-\d{2}-\d{2}(?:T[\d:.]+Z?)?)(?::([tTdDfFR]))?>/g, (_, stamp, style) => Park(TimeHtml(stamp, style)));
  work = work.replace(/<(@&?|#)([^>\s]+)>/g, (_, sign, name) => Park(`<span class="mention">${Esc(/^\d+$/.test(name) ? (sign === "#" ? "#channel" : sign === "@" ? "@user" : "@role") : sign.replace("&", "") + name)}</span>`));
  work = work.replace(/(^|[\s(])(https?:\/\/[^\s<>]+[^\s<>.,;:!?)\]'"])/g, (_, lead, url) => lead + Park(LinkHtml(url, Esc(url))));
  work = work.replace(/:([a-z0-9_]+):/gi, (whole, name) => EMOJI[name.toLowerCase()] ? Park(String.fromCodePoint(...EMOJI[name.toLowerCase()])) : whole);
  work = Esc(work)
    .replace(/\|\|([\s\S]+?)\|\|/g, '<span class="spoiler">$1</span>')
    .replace(/\*\*\*(?=\S)([\s\S]+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(?=\S)([\s\S]+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(?=\S)([\s\S]+?)__/g, "<u>$1</u>")
    .replace(/~~(?=\S)([\s\S]+?)~~/g, "<s>$1</s>")
    .replace(/\*(?=[^\s*])([^*\n]+?)\*/g, "<em>$1</em>")
    .replace(/(^|[^\w])_(?=[^\s_])([^_\n]+?)_(?!\w)/g, "$1<em>$2</em>");
  let guard = 0;
  while (/\u0000\d+\u0000/.test(work) && guard++ < 4) work = work.replace(/\u0000(\d+)\u0000/g, (_, index) => parked[Number(index)]);
  return work;
}
function ListHtml(rows) {
  let html = "";
  const stack = [];
  rows.forEach((row) => {
    const tag = row.ordered ? "ol" : "ul";
    while (stack.length > row.depth + 1) html += `</li></${stack.pop()}>`;
    if (stack.length === row.depth + 1 && stack[row.depth] !== tag) html += `</li></${stack.pop()}>`;
    if (stack.length === row.depth + 1) html += "</li>";
    else while (stack.length < row.depth + 1) { stack.push(tag); html += `<${tag} class="list">`; }
    html += `<li>${Inline(row.text)}`;
  });
  while (stack.length) html += `</li></${stack.pop()}>`;
  return html;
}
function Markdown(text) {
  const lines = String(text ?? "").replace(/\r/g, "").replace(/\s+$/, "").split("\n");
  const out = [];
  let run = [];
  const Flush = () => { if (run.length) out.push(`<div class="run">${run.join("<br>")}</div>`); run = []; };
  for (let at = 0; at < lines.length; at++) {
    const line = lines[at];
    const heading = line.match(/^(#{1,3}) (.+)$/);
    const subtext = line.match(/^-# (.+)$/);
    if (/^```/.test(line)) {
      Flush();
      const rest = line.slice(3);
      const code = /^\w*$/.test(rest.trim()) ? [] : [rest];
      at++;
      while (at < lines.length && !/^```/.test(lines[at])) code.push(lines[at++]);
      out.push(`<pre class="codeblock"><code>${Esc(code.join("\n"))}</code></pre>`);
    } else if (/^>>> ?/.test(line)) {
      Flush();
      out.push(`<div class="dq">${[line.replace(/^>>> ?/, ""), ...lines.slice(at + 1)].map(Inline).join("<br>")}</div>`);
      at = lines.length;
    } else if (/^> /.test(line)) {
      Flush();
      const quoted = [];
      while (at < lines.length && /^> /.test(lines[at])) quoted.push(lines[at++].slice(2));
      at--;
      out.push(`<div class="dq">${quoted.map(Inline).join("<br>")}</div>`);
    } else if (heading) {
      Flush();
      out.push(`<h${heading[1].length + 1} class="slab mdh mdh${heading[1].length}">${Inline(heading[2])}</h${heading[1].length + 1}>`);
    } else if (subtext) {
      Flush();
      out.push(`<div class="subtext">${Inline(subtext[1])}</div>`);
    } else if (/^(\s*)([-*]|\d+\.) .+$/.test(line)) {
      Flush();
      const rows = [];
      let previous = -1;
      while (at < lines.length && /^(\s*)([-*]|\d+\.) .+$/.test(lines[at])) {
        const parts = lines[at].match(/^(\s*)([-*]|\d+\.) (.+)$/);
        const depth = Math.min(Math.floor(parts[1].length / 2), previous + 1);
        rows.push({depth, ordered: /\d/.test(parts[2]), text: parts[3]});
        previous = depth;
        at++;
      }
      at--;
      out.push(ListHtml(rows));
    } else run.push(Inline(line));
  }
  Flush();
  return out.join("");
}
function TableHtml(text) {
  const rows = String(text ?? "").split("\n").map((row) => row.trim()).filter(Boolean).map((row) => row.replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim())).filter((row) => !row.every((cell) => /^:?-{2,}:?$/.test(cell)));
  if (!rows.length) return "";
  const [head, ...rest] = rows;
  const cells = (row, tag) => row.map((cell) => `<${tag}>${Inline(cell)}</${tag}>`).join("");
  return `<div class="scroll mdscroll"><table class="mdtable"><thead><tr>${cells(head, "th")}</tr></thead><tbody>${rest.map((row) => `<tr>${cells(row, "td")}</tr>`).join("")}</tbody></table></div>`;
}
function BlockHtml(block, opts = {}) {
  if (block.type === "h") return `<h3 class="slab sub">${Esc(block.text)}</h3>`;
  if (block.type === "qa") return `<div class="qa"><h3 class="slab">${Esc(block.q)}</h3><div class="md">${Markdown(block.a)}</div></div>`;
  if (block.type === "ul" || block.type === "ol") return `<${block.type} class="list">${String(block.text ?? "").split("\n").filter(Boolean).map((line) => `<li>${Inline(line)}</li>`).join("")}</${block.type}>`;
  if (block.type === "quote") return `<blockquote class="slab">${String(block.text ?? "").split("\n").map(Inline).join("<br>")}${block.by ? `<cite>${Esc(block.by)}</cite>` : ""}</blockquote>`;
  if (block.type === "img") return block.src ? `<figure><img src="${Esc(Src(block.src, opts.base))}" alt="${Esc(block.caption || "")}">${block.caption ? `<figcaption>${Esc(block.caption)}</figcaption>` : ""}</figure>` : "";
  if (block.type === "callout") return `<div class="callout c-${CALLOUTS.includes(block.variant) ? block.variant : "info"}">${block.title ? `<b class="ct slab">${Esc(block.title)}</b>` : ""}<div class="md">${Markdown(block.text)}</div></div>`;
  if (block.type === "table") return TableHtml(block.text);
  if (block.type === "button") return block.label && SAFE_LINK.test(block.url || "") ? `<p class="btnp"><a class="btn ${block.style === "hollow" ? "hollow" : "solid"}" href="${Esc(block.url)}"${/^https?:/i.test(block.url) ? ' target="_blank" rel="noopener noreferrer"' : ""}>${Esc(block.label)}</a></p>` : "";
  if (block.type === "divider") return `<hr class="rule">`;
  return `<div class="body md">${Markdown(block.text)}</div>`;
}
function BodyHtml(body, opts = {}) {
  return (body || []).map((block, index) => opts.mark ? `<div class="blk" data-b="${index}">${BlockHtml(block, opts)}</div>` : BlockHtml(block, opts)).join("");
}
function ArticleHtml(article, opts = {}) {
  const lead = article.image ? `<figure class="lead"><img src="${Esc(Src(article.image, opts.base))}" alt="${Esc(article.imageCaption || article.title)}">${article.imageCaption ? `<figcaption>${Esc(article.imageCaption)}</figcaption>` : ""}</figure>` : "";
  const byline = [article.category, FormatDate(article.date), article.author].filter(Boolean).map(Esc).join(" | ");
  return `<p class="meta">${byline}</p>${lead}${BodyHtml(article.body, opts)}<a class="back" href="#/news">Back to all news</a>`;
}
function ResultCell(text) { return text ? `<td>${Esc(text)}</td>` : `<td class="tbd">To Be Determined</td>`; }
function ResultsHtml(application) {
  const columns = Array.isArray(application.resultColumns) && application.resultColumns.length ? application.resultColumns : DEFAULT_RESULT_COLUMNS;
  const entries = (Array.isArray(application.results) ? application.results : []).filter(Boolean);
  const rows = entries.length ? entries.map((entry) => `<tr>${columns.map((column, index) => ResultCell(Array.isArray(entry) ? entry[index] : entry[LEGACY_RESULT_KEYS[index]])).join("")}</tr>`).join("") : `<tr><td class="tbd only" colspan="${columns.length}">To Be Determined</td></tr>`;
  return `<div class="outcome"><h3 class="cond">Results</h3><div class="scroll"><table><thead><tr>${columns.map((column) => `<th>${Esc(column)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
function ApplicationHtml(application, opts = {}) {
  const closed = typeof opts.closed === "boolean" ? opts.closed : IsClosed(application);
  const byline = [FormatDate(application.date), application.deadline ? "Deadline: " + FormatDate(application.deadline) : ""].filter(Boolean).map(Esc).join(" | ");
  const apply = !closed && /^https?:\/\//.test(application.link || "") ? `<p><a class="btn solid" href="${Esc(application.link)}" target="_blank" rel="noopener noreferrer">Apply now</a></p>` : "";
  const stamp = closed ? `<div class="stamp" aria-hidden="true"><span class="stamp-top">Military Police School</span><b class="stamp-main">Closed</b><span class="stamp-bot">Applications no longer accepted</span></div>` : "";
  const outcome = closed && Array.isArray(application.results) ? ResultsHtml(application) : "";
  return `${stamp}${outcome}<p class="meta">${byline}</p>${BodyHtml(application.body, opts)}${apply}<a class="back" href="#/join">Back to Join</a>`;
}
function TileHtml(article, opts = {}) {
  const picture = Src(article.image || "assets/banner.webp", opts.base);
  const focus = /^[a-z0-9% .-]{1,40}$/i.test(String(article.imagePosition)) ? article.imagePosition : "center";
  return `<div class="tile${article.featured ? " big" : ""}"><div class="bg" style="background-image:url('${Esc(CssUrl(picture))}');background-position:${Esc(focus)}"></div><div class="txt"><h3 class="slab">${Esc(article.title || "Untitled")}</h3>${article.featured && article.excerpt ? `<p>${Esc(article.excerpt)}</p>` : ""}<span class="more cond">${opts.label || "READ MORE"}</span></div></div>`;
}
document.addEventListener("click", (event) => {
  const hidden = event.target.closest && event.target.closest(".spoiler");
  if (hidden) hidden.classList.toggle("on");
});
window.Md = {Esc, Inline, Markdown, BlockHtml, BodyHtml, ArticleHtml, ApplicationHtml, TileHtml, FormatDate, IsClosed};
})();
