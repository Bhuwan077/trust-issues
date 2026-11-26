(function () {
  const TRACK_FIRST = "XI9sH6w_DYw";   // Played on death #1 & #2
  const TRACK_STREAK = "69QF_87XoNE";  // Played after 2-3 repeated deaths (streak >= 3)

  let streak = 0;
  let frameWrap = null;
  let apiLoaded = false;
  let pendingTrack = null;

  const players = {
    [TRACK_FIRST]: { yt: null, ready: false, prebuffered: false, prebuffering: false },
    [TRACK_STREAK]: { yt: null, ready: false, prebuffered: false, prebuffering: false }
  };

  function ensureContainer() {
    if (frameWrap || !document.body) return;
    frameWrap = document.createElement("div");
    frameWrap.id = "death-music-bg";
    frameWrap.setAttribute("aria-hidden", "true");
    frameWrap.style.cssText = "position:fixed;right:0;bottom:0;width:1px;height:1px;overflow:hidden;opacity:0.01;pointer-events:none;z-index:-1;";
    for (const vid of [TRACK_FIRST, TRACK_STREAK]) {
      const slot = document.createElement("div");
      slot.id = `death-music-slot-${vid}`;
      frameWrap.appendChild(slot);
    }
    document.body.appendChild(frameWrap);
  }

  function loadYTApi() {
    if (apiLoaded || (window.YT && window.YT.Player)) return;
    apiLoaded = true;
    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (typeof prevReady === "function") try { prevReady(); } catch (_) {}
      initAllPlayers();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    document.head.appendChild(tag);
  }

  function initPlayerFor(videoId) {
    const entry = players[videoId];
    if (!entry || entry.yt || !window.YT || !window.YT.Player) return;
    ensureContainer();
    const slot = document.getElementById(`death-music-slot-${videoId}`);
    if (!slot) return;
    entry.yt = new window.YT.Player(slot, {
      width: "1",
      height: "1",
      videoId: videoId,
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
          entry.ready = true;
          // Pre-buffer muted so death playback starts instantly with zero 2-3s load delay
          if (pendingTrack === videoId) {
            pendingTrack = null;
            playVideo(videoId);
          } else if (!entry.prebuffered && !entry.prebuffering) {
            entry.prebuffering = true;
            try {
              entry.yt.mute();
              entry.yt.playVideo();
            } catch (_) { entry.prebuffering = false; }
          }
        },
        onStateChange: function (e) {
          if (!e) return;
          if (e.data === 1 && entry.prebuffering) {
            entry.prebuffering = false;
            entry.prebuffered = true;
            try {
              entry.yt.pauseVideo();
              entry.yt.seekTo(0, true);
              entry.yt.unMute();
            } catch (_) {}
            return;
          }
          // 0 = YT.PlayerState.ENDED -> stop after playing once
          if (e.data === 0) {
            try {
              entry.yt.pauseVideo();
              entry.yt.seekTo(0, true);
            } catch (_) {}
          }
        }
      }
    });
  }

  function initAllPlayers() {
    initPlayerFor(TRACK_FIRST);
    initPlayerFor(TRACK_STREAK);
  }

  function unlockOnGesture() {
    ensureContainer();
    loadYTApi();
    if (window.YT && window.YT.Player) initAllPlayers();
  }

  function playVideo(videoId) {
    ensureContainer();
    loadYTApi();
    // Stop the other track if it was playing
    const otherId = videoId === TRACK_FIRST ? TRACK_STREAK : TRACK_FIRST;
    const other = players[otherId];
    if (other && other.yt && other.ready) {
      try { other.yt.pauseVideo(); other.yt.seekTo(0, true); } catch (_) {}
    }

    const entry = players[videoId];
    if (entry && entry.yt && entry.ready) {
      entry.prebuffering = false;
      try {
        entry.yt.unMute();
        entry.yt.setVolume(100);
        entry.yt.seekTo(0, true);
        entry.yt.playVideo();
        return;
      } catch (_) {}
    }
    pendingTrack = videoId;
    if (window.YT && window.YT.Player) initAllPlayers();
  }

  function onDeath() {
    streak += 1;
    playVideo(streak >= 3 ? TRACK_STREAK : TRACK_FIRST);
  }

  function stop() {
    pendingTrack = null;
    for (const vid of [TRACK_FIRST, TRACK_STREAK]) {
      const entry = players[vid];
      if (entry && entry.yt && entry.ready) {
        entry.prebuffering = false;
        try {
          entry.yt.pauseVideo();
          entry.yt.seekTo(0, true);
        } catch (_) {}
      }
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
