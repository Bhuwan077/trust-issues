(function () {
  const TRACK_FIRST = "XI9sH6w_DYw";   // Played on death #1 & #2
  const TRACK_STREAK = "69QF_87XoNE";  // Played after 2-3 repeated deaths (streak >= 3)

  let streak = 0;
  let currentVideoId = null;
  let frameWrap = null;

  function ensureContainer() {
    if (frameWrap || !document.body) return;
    frameWrap = document.createElement("div");
    frameWrap.id = "death-music-bg";
    frameWrap.setAttribute("aria-hidden", "true");
    frameWrap.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;";
    document.body.appendChild(frameWrap);
  }

  function playVideo(videoId) {
    ensureContainer();
    if (!frameWrap) return;
    if (currentVideoId === videoId && frameWrap.firstChild) return;
    currentVideoId = videoId;
    frameWrap.innerHTML = "";
    const iframe = document.createElement("iframe");
    iframe.width = "1";
    iframe.height = "1";
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&playsinline=1&rel=0`;
    iframe.title = "Death Soundtrack";
    iframe.allow = "autoplay; encrypted-media";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.style.cssText = "border:0;";
    frameWrap.appendChild(iframe);
  }

  function onDeath() {
    streak += 1;
    playVideo(streak >= 3 ? TRACK_STREAK : TRACK_FIRST);
  }

  function stop() {
    currentVideoId = null;
    if (frameWrap) frameWrap.innerHTML = "";
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
