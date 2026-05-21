const yearNode = document.getElementById("year");
const navLinks = Array.from(document.querySelectorAll(".nav a"));
const revealNodes = Array.from(document.querySelectorAll(".section, .card, .timeline-card, .project-card, .prompt-card, .contact-card"));
const copyButtons = Array.from(document.querySelectorAll("[data-copy]"));

yearNode.textContent = new Date().getFullYear();

// 让页面随着滚动逐步显现，帮助新手看出区块结构。
revealNodes.forEach((node) => node.classList.add("reveal"));

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  { threshold: 0.15 }
);

revealNodes.forEach((node) => observer.observe(node));

// 滚动时高亮当前导航项，方便理解页面分区。
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  },
  { threshold: 0.5 }
);

document.querySelectorAll("main section[id]").forEach((section) => sectionObserver.observe(section));

copyButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const selector = button.getAttribute("data-copy");
    const source = document.querySelector(selector);

    if (!source) return;

    try {
      const text = source.textContent.trim();
      await copyWithFallback(text);

      const label = button.textContent;
      button.textContent = "已复制";
      setTimeout(() => {
        button.textContent = label;
      }, 1200);
    } catch {
      button.textContent = "复制失败";
      setTimeout(() => {
        button.textContent = "复制";
      }, 1200);
    }
  });
});

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
