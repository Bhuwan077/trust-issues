(function () {
  const TRACK_FIRST = "XI9sH6w_DYw";   // Played on death #1 & #2
  const TRACK_STREAK = "69QF_87XoNE";  // Played after 2-3 repeated deaths (streak >= 3)

  let streak = 0;
  let frameWrap = null;
  let ytPlayer = null;
  let ytReady = false;
  let pendingVideoId = null;
  let apiLoaded = false;

  function ensureContainer() {
    if (frameWrap || !document.body) return;
    // Keep 1x1 inside viewport with 0.01 opacity so browsers do not suspend autoplay as "offscreen/hidden"
    frameWrap = document.createElement("div");
    frameWrap.id = "death-music-bg";
    frameWrap.setAttribute("aria-hidden", "true");
    frameWrap.style.cssText = "position:fixed;right:0;bottom:0;width:1px;height:1px;overflow:hidden;opacity:0.01;pointer-events:none;z-index:-1;";
    const slot = document.createElement("div");
    slot.id = "death-music-yt-slot";
    frameWrap.appendChild(slot);
    document.body.appendChild(frameWrap);
  }

  function loadYTApi() {
    if (apiLoaded || (window.YT && window.YT.Player)) return;
    apiLoaded = true;
    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (typeof prevReady === "function") try { prevReady(); } catch (_) {}
      initYTPlayer();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    document.head.appendChild(tag);
  }

  function initYTPlayer() {
    if (ytPlayer || !window.YT || !window.YT.Player) return;
    ensureContainer();
    if (!frameWrap) return;
    const slot = document.getElementById("death-music-yt-slot");
    if (!slot) return;
    ytPlayer = new window.YT.Player(slot, {
      width: "1",
      height: "1",
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        playsinline: 1,
        rel: 0
      },
      events: {
        onReady: function () {
          ytReady = true;
          if (pendingVideoId) {
            const vid = pendingVideoId;
            pendingVideoId = null;
            playVideo(vid);
          }
        },
        onStateChange: function (e) {
          // 0 = YT.PlayerState.ENDED -> stop after playing once
          if (e && e.data === 0) stop();
        }
      }
    });
  }

  function unlockOnGesture() {
    ensureContainer();
    loadYTApi();
    if (window.YT && window.YT.Player && !ytPlayer) initYTPlayer();
  }

  function playVideo(videoId) {
    ensureContainer();
    loadYTApi();
    if (ytPlayer && ytReady) {
      try {
        ytPlayer.unMute();
        ytPlayer.setVolume(100);
        ytPlayer.loadVideoById(videoId);
        return;
      } catch (_) {}
    }
    pendingVideoId = videoId;
    if (window.YT && window.YT.Player && !ytPlayer) {
      initYTPlayer();
      return;
    }
    // Fallback iframe if YT IFrame API is still loading or blocked
    if (!frameWrap) return;
    frameWrap.innerHTML = "";
    const iframe = document.createElement("iframe");
    iframe.width = "1";
    iframe.height = "1";
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`;
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
    pendingVideoId = null;
    if (ytPlayer && ytReady) {
      try { ytPlayer.stopVideo(); } catch (_) {}
      return;
    }
    if (frameWrap) {
      frameWrap.innerHTML = '<div id="death-music-yt-slot"></div>';
    }
  }

  function onWin() {
    streak = 0;
    stop();
  }

  function resetStreak() {
    streak = 0;
    stop();
  }

  window.addEventListener("pointerdown", unlockOnGesture, { once: true, passive: true });
  window.addEventListener("touchstart", unlockOnGesture, { once: true, passive: true });
  window.addEventListener("keydown", unlockOnGesture, { once: true, passive: true });
  window.addEventListener("pagehide", stop);
  window.addEventListener("beforeunload", stop);

  window.DeathMusic = { onDeath, stop, onWin, resetStreak, getStreak: () => streak };
})();
