(function () {
  const TRACK_FIRST = "XI9sH6w_DYw";   // Played on death #1 & #2
  const TRACK_STREAK = "69QF_87XoNE";  // Played after 2 repeated deaths (streak >= 3)
  const TRACK_VICTORY = "kDMEx29RlE8"; // Played when all levels of a game are completed

  let streak = 0;
  let frameWrap = null;
  let ytSlot = null;
  let fallbackSlot = null;
  let ytPlayer = null;
  let ytReady = false;
  let apiLoaded = false;
  let pendingVideoId = null;
  let isPlaying = false;

  const HIDDEN_STYLE = "position:fixed;right:2px;bottom:2px;width:12px;height:12px;overflow:hidden;opacity:0.02;pointer-events:none;z-index:1;";

  function ensureContainer() {
    if (frameWrap || !document.body) return;
    frameWrap = document.createElement("div");
    frameWrap.id = "death-music-bg";
    frameWrap.setAttribute("aria-hidden", "true");
    frameWrap.style.cssText = HIDDEN_STYLE;

    ytSlot = document.createElement("div");
    ytSlot.id = "death-music-yt-slot";
    fallbackSlot = document.createElement("div");
    fallbackSlot.id = "death-music-fallback";

    frameWrap.appendChild(ytSlot);
    frameWrap.appendChild(fallbackSlot);
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
    if (!ytSlot) return;
    const vars = {
      autoplay: 0,
      controls: 0,
      disablekb: 1,
      fs: 0,
      playsinline: 1,
      rel: 0
    };
    if (window.location && /^https?:$/i.test(window.location.protocol)) {
      vars.origin = window.location.origin;
    }
    ytPlayer = new window.YT.Player(ytSlot, {
      width: "12",
      height: "12",
      playerVars: vars,
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
          if (!e) return;
          if (e.data === 1) {
            isPlaying = true;
            if (fallbackSlot) fallbackSlot.innerHTML = "";
          } else if (e.data === 5 && pendingVideoId === null && isPlaying) {
            // If cued while trying to play, force playVideo
            try { ytPlayer.playVideo(); } catch (_) {}
          } else if (e.data === 0) {
            // 0 = YT.PlayerState.ENDED -> stop after playing once
            isPlaying = false;
            try { ytPlayer.pauseVideo(); } catch (_) {}
          }
        },
        onError: function () {
          isPlaying = false;
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
      pendingVideoId = null;
      if (fallbackSlot) fallbackSlot.innerHTML = "";
      try {
        ytPlayer.unMute();
        ytPlayer.setVolume(100);
        isPlaying = true;
        ytPlayer.loadVideoById(videoId, 0);
        ytPlayer.playVideo();
        return;
      } catch (_) {}
    }
    pendingVideoId = videoId;
    if (window.YT && window.YT.Player && !ytPlayer) {
      initYTPlayer();
      return;
    }
    // Fallback iframe in separate fallbackSlot so ytSlot is never destroyed
    if (!fallbackSlot) return;
    fallbackSlot.innerHTML = "";
    const iframe = document.createElement("iframe");
    iframe.width = "12";
    iframe.height = "12";
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`;
    iframe.title = "Death Soundtrack";
    iframe.allow = "autoplay; encrypted-media";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.style.cssText = "border:0;";
    fallbackSlot.appendChild(iframe);
  }

  function onDeath() {
    streak += 1;
    playVideo(streak >= 3 ? TRACK_STREAK : TRACK_FIRST);
  }

  function stop() {
    pendingVideoId = null;
    isPlaying = false;
    if (fallbackSlot) fallbackSlot.innerHTML = "";
    if (ytPlayer && ytReady) {
      try { ytPlayer.stopVideo(); } catch (_) {}
    }
  }

  function onWin() {
    streak = 0;
    stop();
  }

  function playVictory() {
    streak = 0;
    playVideo(TRACK_VICTORY);
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

  window.DeathMusic = { onDeath, stop, onWin, playVictory, resetStreak, getStreak: () => streak, isPlaying: () => isPlaying };
})();
