(function () {
  const TRACK_FIRST = "XI9sH6w_DYw";   // Played on death #1 & #2
  const TRACK_STREAK = "69QF_87XoNE";  // Played after 2-3 repeated deaths (streak >= 3)

  let streak = 0;
  let currentVideoId = null;
  let boxEl = null;
  let frameWrap = null;
  let labelEl = null;

  function ensureUI() {
    if (boxEl || !document.body) return;
    boxEl = document.createElement("div");
    boxEl.id = "death-music-box";
    boxEl.style.cssText = [
      "position:fixed",
      "right:14px",
      "bottom:60px",
      "width:224px",
      "background:#111622",
      "border:2px solid #f43f5e",
      "border-radius:10px",
      "box-shadow:0 8px 28px rgba(0,0,0,0.65)",
      "z-index:9999",
      "display:none",
      "overflow:hidden",
      "font-family:monospace",
      "color:#f8fafc"
    ].join(";");

    const header = document.createElement("div");
    header.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:4px 8px;background:#1e293b;font-size:11px;font-weight:700;";
    labelEl = document.createElement("span");
    labelEl.textContent = "BUSTED SOUNDTRACK";

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "✕";
    closeBtn.title = "Stop music";
    closeBtn.style.cssText = "background:none;border:none;color:#f43f5e;font-weight:900;cursor:pointer;font-size:13px;padding:0 4px;";
    closeBtn.addEventListener("click", stop);

    header.appendChild(labelEl);
    header.appendChild(closeBtn);
    boxEl.appendChild(header);

    frameWrap = document.createElement("div");
    frameWrap.style.cssText = "width:224px;height:126px;background:#000;";
    boxEl.appendChild(frameWrap);

    document.body.appendChild(boxEl);
  }

  function playVideo(videoId, label) {
    ensureUI();
    if (!boxEl || !frameWrap) return;
    if (currentVideoId === videoId && frameWrap.firstChild) {
      boxEl.style.display = "block";
      return;
    }
    currentVideoId = videoId;
    labelEl.textContent = label;
    frameWrap.innerHTML = "";
    const iframe = document.createElement("iframe");
    iframe.width = "224";
    iframe.height = "126";
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&playsinline=1&rel=0`;
    iframe.title = "Death Soundtrack";
    iframe.allow = "autoplay; encrypted-media; picture-in-picture";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.style.cssText = "border:0;display:block;";
    frameWrap.appendChild(iframe);
    boxEl.style.display = "block";
  }

  function onDeath() {
    streak += 1;
    if (streak >= 3) {
      playVideo(TRACK_STREAK, `STREAK x${streak} — R.I.P.`);
    } else {
      playVideo(TRACK_FIRST, `OOF x${streak}`);
    }
  }

  function stop() {
    currentVideoId = null;
    if (frameWrap) frameWrap.innerHTML = "";
    if (boxEl) boxEl.style.display = "none";
  }

  function onWin() {
    streak = 0;
    stop();
  }

  function resetStreak() {
    streak = 0;
    stop();
  }

  window.addEventListener("pagehide", stop);
  window.addEventListener("beforeunload", stop);

  window.DeathMusic = { onDeath, stop, onWin, resetStreak, getStreak: () => streak };
})();
