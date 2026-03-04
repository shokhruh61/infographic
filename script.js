const topicInput = document.getElementById("topic");
const generateBtn = document.getElementById("generateBtn");
const summarizeBtn = document.getElementById("summarizeBtn");
const exportPngBtn = document.getElementById("exportPngBtn");
const exportSvgBtn = document.getElementById("exportSvgBtn");
const infographic = document.getElementById("infographic");
const cardTemplate = document.getElementById("cardTemplate");

let infographicModel = null;

const iconMap = {
  climate: ["🌍", "🌿", "☀️", "💧"],
  sales: ["📈", "🛒", "💳", "🏪"],
  health: ["🩺", "💊", "🏃", "🥗"],
  education: ["📚", "🎓", "🧠", "✏️"],
  technology: ["🤖", "💻", "🔌", "🛰️"],
  finance: ["💰", "📊", "🏦", "📉"],
};

generateBtn.addEventListener("click", () => {
  const text = topicInput.value.trim();
  if (!text) return;

  infographicModel = buildModel(text);
  renderInfographic(infographicModel);
});

summarizeBtn.addEventListener("click", () => {
  const text = topicInput.value.trim();
  if (!text) return;
  topicInput.value = summarizeText(text);
});

exportSvgBtn.addEventListener("click", () => {
  if (!infographicModel) return;
  const svg = createExportSvg(infographicModel);
  downloadFile("infographic.svg", "image/svg+xml;charset=utf-8", svg);
});

exportPngBtn.addEventListener("click", async () => {
  if (!infographicModel) return;
  const svg = createExportSvg(infographicModel);
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f4f7ff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);

    canvas.toBlob((pngBlob) => {
      const pngUrl = URL.createObjectURL(pngBlob);
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = "infographic.png";
      a.click();
      URL.revokeObjectURL(pngUrl);
    });
  };
  img.src = url;
});

function summarizeText(text) {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length <= 3) return text;

  return [sentences[0], sentences[1], sentences.at(-1)].join(" ");
}

function buildModel(text) {
  const clean = text.replace(/\s+/g, " ").trim();
  const title = clean.split(/[.!?]/)[0].slice(0, 65);
  const bullets = extractBullets(clean);
  const numbers = extractNumbers(clean);
  const icons = suggestIcons(clean);

  return {
    title: toTitleCase(title || "Infographic Overview"),
    subtitle: "Auto-generated visual summary",
    bullets,
    icons,
    numbers,
  };
}

function extractBullets(text) {
  const chunks = text
    .split(/[.!?;]\s+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 20);

  if (!chunks.length) {
    return ["Key insight available after generation."];
  }

  return chunks.slice(0, 5).map((line) => line.slice(0, 90));
}

function extractNumbers(text) {
  const matches = [...text.matchAll(/([A-Za-z][A-Za-z\s]{2,18})?\s?(\d+(?:\.\d+)?)%?/g)];
  const values = matches
    .map((m, i) => ({
      label: (m[1] || `Metric ${i + 1}`).trim().slice(-16),
      value: Number(m[2]),
    }))
    .filter((item) => Number.isFinite(item.value) && item.value > 0)
    .slice(0, 6);

  if (!values.length) {
    return [
      { label: "Reach", value: 48 },
      { label: "Growth", value: 72 },
      { label: "Impact", value: 61 },
    ];
  }

  return values;
}

function suggestIcons(text) {
  const lower = text.toLowerCase();
  for (const [key, icons] of Object.entries(iconMap)) {
    if (lower.includes(key)) return icons;
  }
  return ["✨", "📌", "🎯", "📣"];
}

function renderInfographic(model) {
  infographic.innerHTML = "";

  const titleCard = makeCard("title-card", `<h2>${model.title}</h2><p>${model.subtitle}</p>`);
  const iconCard = makeCard(
    "icon-card",
    `<h3>Suggested Icons</h3><div class="icon-list">${model.icons.map((i) => `<span>${i}</span>`).join("")}</div>`
  );
  const bulletCard = makeCard(
    "bullets-card",
    `<h3>Highlights</h3><ul>${model.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>`
  );

  const barCard = makeCard("chart-card", '<h3>Bar Chart</h3><canvas id="barCanvas"></canvas>');
  const pieCard = makeCard("chart-card", '<h3>Pie Chart</h3><canvas id="pieCanvas"></canvas>');

  [titleCard, iconCard, bulletCard, barCard, pieCard].forEach((card) => infographic.appendChild(card));
  setupDragAndDrop();

  drawBarChart(document.getElementById("barCanvas"), model.numbers);
  drawPieChart(document.getElementById("pieCanvas"), model.numbers);
}

function makeCard(className, content) {
  const card = cardTemplate.content.firstElementChild.cloneNode(false);
  card.classList.add(className);
  card.innerHTML = content;
  return card;
}

function drawBarChart(canvas, data) {
  const ctx = canvas.getContext("2d");
  const width = (canvas.width = 560);
  const height = (canvas.height = 280);
  const max = Math.max(...data.map((d) => d.value));

  ctx.clearRect(0, 0, width, height);
  data.forEach((item, i) => {
    const x = 60 + i * 82;
    const barHeight = (item.value / max) * 180;
    const y = 230 - barHeight;

    ctx.fillStyle = ["#6a5cff", "#17c0ff", "#ff7d6b", "#ffd166", "#00c48c", "#748ffc"][i % 6];
    ctx.fillRect(x, y, 52, barHeight);

    ctx.fillStyle = "#2c3359";
    ctx.font = "12px sans-serif";
    ctx.fillText(item.label.slice(0, 10), x - 4, 248);
    ctx.fillText(String(item.value), x + 10, y - 8);
  });
}

function drawPieChart(canvas, data) {
  const ctx = canvas.getContext("2d");
  const width = (canvas.width = 560);
  const height = (canvas.height = 280);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let current = -Math.PI / 2;

  ctx.clearRect(0, 0, width, height);

  data.forEach((item, i) => {
    const slice = (item.value / total) * Math.PI * 2;
    const color = ["#6a5cff", "#17c0ff", "#ff7d6b", "#ffd166", "#00c48c", "#748ffc"][i % 6];

    ctx.beginPath();
    ctx.moveTo(165, 140);
    ctx.arc(165, 140, 90, current, current + slice);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    ctx.fillStyle = "#2c3359";
    ctx.font = "13px sans-serif";
    ctx.fillText(`${item.label.slice(0, 10)} (${Math.round((item.value / total) * 100)}%)`, 300, 50 + i * 24);

    current += slice;
  });
}

function setupDragAndDrop() {
  let dragging = null;

  infographic.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("dragstart", () => {
      dragging = card;
      card.classList.add("dragging");
    });

    card.addEventListener("dragend", () => {
      dragging = null;
      card.classList.remove("dragging");
      infographic.querySelectorAll(".drop-target").forEach((el) => el.classList.remove("drop-target"));
    });

    card.addEventListener("dragover", (event) => {
      event.preventDefault();
      if (card !== dragging) card.classList.add("drop-target");
    });

    card.addEventListener("dragleave", () => card.classList.remove("drop-target"));

    card.addEventListener("drop", (event) => {
      event.preventDefault();
      card.classList.remove("drop-target");
      if (!dragging || card === dragging) return;

      const cards = [...infographic.children];
      const from = cards.indexOf(dragging);
      const to = cards.indexOf(card);

      if (from < to) {
        infographic.insertBefore(dragging, card.nextSibling);
      } else {
        infographic.insertBefore(dragging, card);
      }
    });
  });
}

function createExportSvg(model) {
  const chartBars = model.numbers
    .map((d, i) => {
      const h = Math.round((d.value / Math.max(...model.numbers.map((n) => n.value))) * 120);
      return `<g><rect x="${70 + i * 80}" y="${480 - h}" width="44" height="${h}" rx="8" fill="${palette(i)}"/><text x="${72 + i * 80}" y="500" font-size="12" fill="#1f2440">${escapeXml(d.label.slice(0, 8))}</text></g>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#211d45" />
      <stop offset="60%" stop-color="#4e5bff" />
      <stop offset="100%" stop-color="#17c0ff" />
    </linearGradient>
  </defs>
  <rect width="1200" height="800" rx="26" fill="url(#bg)"/>
  <rect x="40" y="40" width="760" height="180" rx="18" fill="#ffffff"/>
  <text x="70" y="110" font-size="44" font-weight="700" fill="#1f2440">${escapeXml(model.title)}</text>
  <text x="70" y="160" font-size="24" fill="#4b5480">${escapeXml(model.subtitle)}</text>

  <rect x="830" y="40" width="330" height="180" rx="18" fill="#ffffff"/>
  <text x="860" y="90" font-size="28" fill="#1f2440">Icons</text>
  <text x="860" y="145" font-size="42">${model.icons.join(" ")}</text>

  <rect x="40" y="250" width="560" height="510" rx="18" fill="#ffffff"/>
  <text x="70" y="300" font-size="30" fill="#1f2440">Highlights</text>
  ${model.bullets
    .slice(0, 5)
    .map(
      (bullet, i) =>
        `<text x="70" y="${350 + i * 60}" font-size="23" fill="#2f3760">• ${escapeXml(bullet.slice(0, 45))}</text>`
    )
    .join("")}

  <rect x="630" y="250" width="530" height="510" rx="18" fill="#ffffff"/>
  <text x="660" y="300" font-size="30" fill="#1f2440">Auto Chart</text>
  <line x1="660" y1="480" x2="1120" y2="480" stroke="#a9b3db" stroke-width="2"/>
  ${chartBars}
</svg>`;
}

function palette(i) {
  return ["#6a5cff", "#17c0ff", "#ff7d6b", "#ffd166", "#00c48c", "#748ffc"][i % 6];
}

function downloadFile(filename, mime, content) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toTitleCase(text) {
  return text
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function escapeXml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
