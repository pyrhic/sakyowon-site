(function () {
  const PAGES = ["/writing/index.html", "/", "/trading/index.html"];

  function getSection() {
    if (location.pathname.startsWith("/trading")) return 2;
    if (location.pathname.startsWith("/writing")) return 0;
    return 1;
  }

  const COLORS = ["#111111", "#0d1b2a", "#0f3d33"];
  const section = getSection();
  const color = COLORS[section];

  function goTo(idx) {
    location.href = PAGES[idx];
  }

  // 인스타그램 사진 넘기기처럼, 지금 몇 번째 화면인지만 보여주는 점 - 누르면 그 페이지로 이동
  function renderDots() {
    const wrap = document.createElement("div");
    wrap.style.cssText = `
      position: fixed;
      bottom: 14px;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      gap: 10px;
      z-index: 10;
    `;
    PAGES.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.style.cssText = `
        width: 7px;
        height: 7px;
        padding: 0;
        border: none;
        border-radius: 50%;
        background: ${color};
        opacity: ${i === section ? 0.9 : 0.25};
        cursor: pointer;
      `;
      if (i !== section) dot.addEventListener("click", () => goTo(i));
      wrap.appendChild(dot);
    });
    document.body.appendChild(wrap);
  }

  function setupSwipe() {
    let startX = null;
    document.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
    document.addEventListener("touchend", (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      startX = null;
      if (dx < -60 && section < PAGES.length - 1) goTo(section + 1);
      else if (dx > 60 && section > 0) goTo(section - 1);
    }, { passive: true });
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderDots();
    setupSwipe();
  });
})();
