const STORAGE_KEY = "codex-prompt-tool-state-v1";

const templateConfigs = {
  feature: {
    raw: `请在当前项目里新增一个功能：{功能名}。
目标是：{你想解决的问题}。
请先查看项目结构，给出简短计划，再开始修改。
改完后请告诉我每个文件做了什么。`,
    fields: ["featureName", "goal"],
    build(values) {
      return `请在当前项目里新增一个功能：${values.featureName || "{功能名}"}。
目标是：${values.goal || "{你想解决的问题}"}。
请先查看项目结构，给出简短计划，再开始修改。
改完后请告诉我每个文件做了什么。`;
    }
  },
  style: {
    raw: `请把当前页面的视觉风格调整为：{风格描述}。
要求保留现有内容结构，只优化布局、颜色、字号和响应式表现。
请尽量让页面看起来更清晰、更有层次。`,
    fields: ["styleGoal"],
    build(values) {
      return `请把当前页面的视觉风格调整为：${values.styleGoal || "{风格描述}"}。
要求保留现有内容结构，只优化布局、颜色、字号和响应式表现。
请尽量让页面看起来更清晰、更有层次。`;
    }
  },
  bug: {
    raw: `我遇到一个问题：
现象：{现象}
报错：{报错}
复现步骤：{步骤}
请先帮我分析可能原因，再给出最小修改。`,
    fields: ["symptom", "error", "steps"],
    build(values) {
      return `我遇到一个问题：
现象：${values.symptom || "{现象}"}
报错：${values.error || "{报错}"}
复现步骤：${values.steps || "{步骤}"}
请先帮我分析可能原因，再给出最小修改。`;
    }
  },
  explain: {
    raw: `请用适合 0 基础的方式解释这段代码：
对象：{想解释的对象}
1. 每个文件是做什么的
2. 关键变量和函数是什么意思
3. 我应该先看哪几处
4. 如果我要改它，最安全的入口在哪里`,
    fields: ["target"],
    build(values) {
      return `请用适合 0 基础的方式解释这段代码：
对象：${values.target || "{想解释的对象}"}
1. 每个文件是做什么的
2. 关键变量和函数是什么意思
3. 我应该先看哪几处
4. 如果我要改它，最安全的入口在哪里`;
    }
  }
};

const yearNode = document.getElementById("year");
const cards = Array.from(document.querySelectorAll("[data-template-card]"));
const revealNodes = Array.from(document.querySelectorAll(".section, .template-card, .mini-tip"));
const pageNavLinks = Array.from(document.querySelectorAll("[data-page-nav] a"));
const state = loadState();

yearNode.textContent = new Date().getFullYear();

revealNodes.forEach((node) => node.classList.add("reveal"));

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  { threshold: 0.12 }
);

revealNodes.forEach((node) => revealObserver.observe(node));

if (pageNavLinks.length > 0) {
  const pageSections = Array.from(document.querySelectorAll("main section[id]"));
  const pageNavObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        pageNavLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    { threshold: 0.35, rootMargin: "-10% 0px -55% 0px" }
  );

  pageSections.forEach((section) => pageNavObserver.observe(section));
}

cards.forEach((card) => {
  const key = card.getAttribute("data-template-card");
  const config = templateConfigs[key];

  if (!config) return;

  const fields = Array.from(card.querySelectorAll("[data-field]"));
  const output = document.getElementById(`output-${key}`);
  const copyTemplateButton = card.querySelector("[data-copy-template]");
  const copyGeneratedButton = card.querySelector("[data-copy-generated]");
  const resetButton = card.querySelector("[data-reset-template]");

  fields.forEach((field) => {
    const fieldName = field.getAttribute("data-field");
    field.value = state[key]?.[fieldName] || "";

    field.addEventListener("input", () => {
      state[key] = state[key] || {};
      state[key][fieldName] = field.value;
      saveState(state);
      output.value = config.build(state[key]);
    });
  });

  output.value = config.build(state[key] || {});

  copyTemplateButton?.addEventListener("click", async () => {
    await copyText(config.raw, copyTemplateButton, "复制原始模板");
  });

  copyGeneratedButton?.addEventListener("click", async () => {
    await copyText(output.value, copyGeneratedButton, "复制生成结果");
  });

  resetButton?.addEventListener("click", () => {
    state[key] = {};
    fields.forEach((field) => {
      field.value = "";
    });
    output.value = config.build({});
    saveState(state);
  });
});

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveState(nextState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  } catch {
    // 本地存储不可用时，页面仍然保持可用。
  }
}

async function copyText(text, button, defaultLabel) {
  try {
    await copyWithFallback(text);

    button.textContent = "已复制";
    setTimeout(() => {
      button.textContent = defaultLabel;
    }, 1200);
  } catch {
    button.textContent = "复制失败";
    setTimeout(() => {
      button.textContent = defaultLabel;
    }, 1200);
  }
}

async function copyWithFallback(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // 某些 file:// 或内嵌浏览器环境会拒绝 clipboard API，继续走降级方案。
    }
  }

  const temp = document.createElement("textarea");
  temp.value = text;
  temp.setAttribute("readonly", "");
  temp.style.position = "fixed";
  temp.style.top = "0";
  temp.style.left = "0";
  temp.style.opacity = "0";
  document.body.appendChild(temp);
  temp.focus();
  temp.select();
  temp.setSelectionRange(0, temp.value.length);

  const copied = document.execCommand("copy");
  temp.remove();

  if (!copied) {
    throw new Error("copy failed");
  }
}
