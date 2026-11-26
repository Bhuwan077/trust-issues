(function () {
  const TRACK_FIRST = "XI9sH6w_DYw";   // Played on death #1 & #2
  const TRACK_STREAK = "69QF_87XoNE";  // Played after 2-3 repeated deaths (streak >= 3)

  const isIOS = typeof navigator !== "undefined" && (
    /iPad|iPhone|iPod/.test(navigator.userAgent || "") ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );

  let streak = 0;
  let frameWrap = null;
  let hintEl = null;
  let ytPlayer = null;
  let ytReady = false;
  let apiLoaded = false;
  let pendingVideoId = null;
  let isPlaying = false;
  let iosCheckTimer = null;

  const HIDDEN_STYLE = "position:fixed;right:2px;bottom:2px;width:12px;height:12px;overflow:hidden;opacity:0.02;pointer-events:none;z-index:1;";
  const IOS_PROMPT_STYLE = "position:fixed;right:12px;bottom:56px;width:210px;height:118px;overflow:hidden;opacity:1;pointer-events:auto;z-index:9999;border:2px solid #f43f5e;border-radius:10px;background:#111622;box-shadow:0 8px 24px rgba(0,0,0,0.65);";

  function ensureContainer() {
    if (frameWrap || !document.body) return;
    frameWrap = document.createElement("div");
    frameWrap.id = "death-music-bg";
    frameWrap.setAttribute("aria-hidden", "true");
    frameWrap.style.cssText = HIDDEN_STYLE;

    hintEl = document.createElement("div");
    hintEl.textContent = "TAP PLAY FOR DEATH SONG (iOS)";
    hintEl.style.cssText = "display:none;background:#1e293b;color:#f8fafc;font:bold 10px monospace;text-align:center;padding:3px 4px;pointer-events:none;";
    frameWrap.appendChild(hintEl);

    const slot = document.createElement("div");
    slot.id = "death-music-yt-slot";
    frameWrap.appendChild(slot);
    document.body.appendChild(frameWrap);
  }

  function hideContainer() {
    if (iosCheckTimer) { clearTimeout(iosCheckTimer); iosCheckTimer = null; }
    if (frameWrap) frameWrap.style.cssText = HIDDEN_STYLE;
    if (hintEl) hintEl.style.display = "none";
  }

  function showIOSUnlockPrompt() {
    if (!frameWrap) return;
    frameWrap.style.cssText = IOS_PROMPT_STYLE;
    if (hintEl) hintEl.style.display = "block";
    if (ytPlayer && ytPlayer.setSize) {
      try { ytPlayer.setSize(210, 96); } catch (_) {}
    }
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
    const slot = document.getElementById("death-music-yt-slot");
    if (!slot) return;
    const vars = {
      autoplay: 0,
      controls: isIOS ? 1 : 0,
      disablekb: 1,
      fs: 0,
      playsinline: 1,
      rel: 0
    };
    if (window.location && /^https?:$/i.test(window.location.protocol)) {
      vars.origin = window.location.origin;
    }
    ytPlayer = new window.YT.Player(slot, {
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
            hideContainer();
          } else if (e.data === 0) {
            // 0 = YT.PlayerState.ENDED -> stop after playing once
            isPlaying = false;
            hideContainer();
            try { ytPlayer.stopVideo(); } catch (_) {}
          }
        },
        onError: function () {
          isPlaying = false;
          hideContainer();
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
    if (iosCheckTimer) { clearTimeout(iosCheckTimer); iosCheckTimer = null; }
    if (ytPlayer && ytReady) {
      pendingVideoId = null;
      try {
        ytPlayer.unMute();
        ytPlayer.setVolume(100);
        ytPlayer.loadVideoById({ videoId: videoId, startSeconds: 0 });
        isPlaying = false;
        if (isIOS) {
          iosCheckTimer = setTimeout(() => {
            if (!isPlaying) showIOSUnlockPrompt();
          }, 700);
        }
        return;
      } catch (_) {}
    }
    pendingVideoId = videoId;
    if (window.YT && window.YT.Player && !ytPlayer) {
      initYTPlayer();
      return;
    }
    // Fallback iframe if YT API hasn't finished loading yet
    if (!frameWrap) return;
    frameWrap.innerHTML = "";
    const iframe = document.createElement("iframe");
    iframe.width = isIOS ? "210" : "12";
    iframe.height = isIOS ? "118" : "12";
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`;
    iframe.title = "Death Soundtrack";
    iframe.allow = "autoplay; encrypted-media";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.style.cssText = "border:0;";
    frameWrap.appendChild(iframe);
    if (isIOS) frameWrap.style.cssText = IOS_PROMPT_STYLE;
  }

  function onDeath() {
    streak += 1;
    playVideo(streak >= 3 ? TRACK_STREAK : TRACK_FIRST);
  }

  function stop() {
    pendingVideoId = null;
    isPlaying = false;
    hideContainer();
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

  window.DeathMusic = { onDeath, stop, onWin, resetStreak, getStreak: () => streak, isPlaying: () => isPlaying };
})();
