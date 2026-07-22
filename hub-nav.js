(function () {
  const isTrading = location.pathname.startsWith("/trading");
  const target = isTrading ? "/" : "/trading/index.html";
  const color = isTrading ? "#0f3d33" : "#0d1b2a";
  const side = isTrading ? "left" : "right";

  function goTarget() {
    location.href = target;
  }

  function renderPeek() {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes hubNavPeekFlash {
        0% { opacity: 0.2; }
        35% { opacity: 0.85; }
        100% { opacity: 0.3; }
      }
      .hub-nav-peek {
        position: fixed;
        top: 50%;
        ${side}: 0;
        transform: translateY(-50%);
        width: 14px;
        height: 20vh;
        border-radius: 999px;
        background: ${color};
        border: none;
        padding: 0;
        cursor: pointer;
        z-index: 10;
        opacity: 0.3;
        animation: hubNavPeekFlash 1.4s ease-in-out 1;
      }
    `;
    document.head.appendChild(style);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "hub-nav-peek";
    btn.setAttribute("aria-label", isTrading ? "이규영 홈으로" : "트레이딩 일지로");
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
    renderPeek();
    setupSwipe();
  });
})();
