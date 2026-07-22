(function () {
  const PAGES = [
    { href: "/trading/log.html", label: "오늘 입력" },
    { href: "/trading/weekly.html", label: "주간 리포트" },
    { href: "/trading/todo.html", label: "투두리스트" },
    { href: "/trading/assets.html", label: "자산현황" },
    { href: "/trading/ambition.html", label: "Ambition" },
  ];

  function currentIndex() {
    const path = location.pathname;
    return PAGES.findIndex((p) => p.href === path);
  }

  function goTo(idx) {
    const wrapped = (idx + PAGES.length) % PAGES.length;
    location.href = PAGES[wrapped].href;
  }

  function renderNav() {
    const idx = currentIndex();
    if (idx === -1) return;
    const nav = document.createElement("div");
    nav.className = "carousel-nav";
    nav.innerHTML =
      '<button type="button" class="arrow" id="carouselPrev">◀</button>' +
      '<div class="dots">' +
      PAGES.map((_, i) => `<span class="${i === idx ? "active" : ""}"></span>`).join("") +
      "</div>" +
      '<button type="button" class="arrow" id="carouselNext">▶</button>';
    document.querySelector(".wrap").appendChild(nav);
    document.getElementById("carouselPrev").addEventListener("click", () => goTo(idx - 1));
    document.getElementById("carouselNext").addEventListener("click", () => goTo(idx + 1));
  }

  function setupSwipe() {
    let startX = null;
    document.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
    document.addEventListener("touchend", (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) < 60) return;
      const idx = currentIndex();
      if (idx === -1) return;
      if (dx < 0) goTo(idx + 1);
      else goTo(idx - 1);
    }, { passive: true });
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderNav();
    setupSwipe();
  });
})();
