(function () {
  const isTrading = location.pathname.startsWith("/trading");
  const target = isTrading ? "/" : "/trading/index.html";
  const color = isTrading ? "#0f3d33" : "#0d1b2a";

  function goTarget() {
    location.href = target;
  }

  // 인스타그램 사진 넘기기처럼, 지금 몇 번째 화면인지만 보여주는 점 2개 (클릭 아님, 스와이프로만 이동)
  function renderDots() {
    const wrap = document.createElement("div");
    wrap.style.cssText = `
      position: fixed;
      bottom: 14px;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      gap: 8px;
      z-index: 10;
      pointer-events: none;
    `;
    [0, 1].forEach((i) => {
      const active = isTrading ? i === 1 : i === 0;
      const dot = document.createElement("span");
      dot.style.cssText = `
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: ${color};
        opacity: ${active ? 0.9 : 0.25};
      `;
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
      if (Math.abs(dx) < 60) return;
      // 홈: 왼쪽으로 스와이프 -> 트레이딩. 트레이딩: 오른쪽으로 스와이프 -> 홈
      if (!isTrading && dx < 0) goTarget();
      if (isTrading && dx > 0) goTarget();
    }, { passive: true });
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderDots();
    setupSwipe();
  });
})();
