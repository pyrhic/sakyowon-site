(function () {
  const isTrading = location.pathname.startsWith("/trading");
  const target = isTrading ? "/" : "/trading/index.html";
  const color = isTrading ? "#0f3d33" : "#0d1b2a";
  const label = isTrading ? "◀" : "▶";
  const side = isTrading ? "left" : "right";

  function goTarget() {
    location.href = target;
  }

  function renderArrow() {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.setAttribute("aria-label", isTrading ? "이규영 홈으로" : "트레이딩 일지로");
    btn.style.cssText = `
      position: fixed;
      top: 50%;
      ${side}: 10px;
      transform: translateY(-50%);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid ${color};
      background: rgba(255,255,255,0.85);
      color: ${color};
      font-size: 1.1rem;
      font-weight: 700;
      cursor: pointer;
      z-index: 10;
    `;
    btn.addEventListener("click", goTarget);
    document.body.appendChild(btn);
  }

  function setupSwipe() {
    let startX = null;
    document.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
    document.addEventListener("touchend", (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) < 60) return;
      // 홈: 왼쪽으로 스와이프 -> 트레이딩. 트레이딩: 오른쪽으로 스와이프 -> 홈
      if (!isTrading && dx < 0) goTarget();
      if (isTrading && dx > 0) goTarget();
    }, { passive: true });
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderArrow();
    setupSwipe();
  });
})();
