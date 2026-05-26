(function () {
  var soundOn = true;
  var audioContext = null;
  var particleCanvas = document.getElementById("particleField");
  var ctx = particleCanvas.getContext("2d");
  var particles = [];
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ensureAudio() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === "suspended") audioContext.resume();
    return audioContext;
  }

  function tone(type) {
    if (!soundOn) return;
    var context = ensureAudio();
    var osc = context.createOscillator();
    var gain = context.createGain();
    var now = context.currentTime;
    var map = {
      pop: [580, 210, 0.12],
      tick: [920, 680, 0.035],
      stamp: [240, 120, 0.1],
      chime: [660, 990, 0.08],
      swoosh: [1400, 260, 0.075]
    };
    var config = map[type] || map.pop;
    osc.type = type === "tick" ? "triangle" : "sine";
    osc.frequency.setValueAtTime(config[0], now);
    osc.frequency.exponentialRampToValueAtTime(config[1], now + 0.12);
    gain.gain.setValueAtTime(config[2], now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  function resizeCanvas() {
    var ratio = window.devicePixelRatio || 1;
    particleCanvas.width = window.innerWidth * ratio;
    particleCanvas.height = window.innerHeight * ratio;
    particleCanvas.style.width = window.innerWidth + "px";
    particleCanvas.style.height = window.innerHeight + "px";
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function createParticles() {
    var count = Math.min(90, Math.floor(window.innerWidth / 18));
    particles = Array.from({ length: count }, function () {
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2.2 + 0.8,
        speed: Math.random() * 0.22 + 0.05,
        hue: Math.random() * 80 + 270,
        alpha: Math.random() * 0.28 + 0.08
      };
    });
  }

  function drawParticles() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    particles.forEach(function (particle) {
      ctx.beginPath();
      ctx.fillStyle = "hsla(" + particle.hue + ", 78%, 72%, " + particle.alpha + ")";
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      if (!prefersReducedMotion) {
        particle.y += particle.speed;
        particle.x += Math.sin(particle.y * 0.01) * 0.12;
        if (particle.y > window.innerHeight + 10) particle.y = -10;
      }
    });
    requestAnimationFrame(drawParticles);
  }

  function revealElements() {
    document.querySelectorAll(".reveal").forEach(function (element, index) {
      window.setTimeout(function () {
        element.classList.add("is-visible");
      }, 90 + index * 80);
    });
  }

  function showToast(text) {
    var toast = document.getElementById("toast");
    toast.textContent = text;
    toast.classList.add("is-visible");
    window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 1400);
  }

  function copyTokens() {
    var code = document.getElementById("tokenCode").textContent;
    navigator.clipboard.writeText(code).then(function () {
      tone("chime");
      showToast("Tokens copied");
    }).catch(function () {
      showToast("Copy unavailable");
    });
  }

  function initTilt() {
    if (prefersReducedMotion) return;
    document.querySelectorAll(".tilt-card").forEach(function (card) {
      card.addEventListener("pointermove", function (event) {
        var rect = card.getBoundingClientRect();
        var px = (event.clientX - rect.left) / rect.width - 0.5;
        var py = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = "rotateX(" + (-py * 4).toFixed(2) + "deg) rotateY(" + (px * 5).toFixed(2) + "deg) translateY(-4px)";
      });
      card.addEventListener("pointerleave", function () {
        card.style.transform = "";
      });
    });
  }

  function initPointerAura() {
    document.addEventListener("pointermove", function (event) {
      var x = (event.clientX / window.innerWidth - 0.5) * 12;
      var y = (event.clientY / window.innerHeight - 0.5) * 12;
      document.documentElement.style.setProperty("--tilt-x", x + "px");
      document.documentElement.style.setProperty("--tilt-y", y + "px");
    });
  }

  document.querySelectorAll("[data-sound]").forEach(function (button) {
    button.addEventListener("click", function () {
      tone(button.dataset.sound);
    });
  });

  document.querySelectorAll(".primary-action, .ghost-action").forEach(function (button) {
    button.addEventListener("pointerdown", function () {
      button.style.transform = "translate(4px, 5px) scale(0.98)";
      button.style.boxShadow = "3px 4px 0 var(--ink)";
    });
    button.addEventListener("pointerup", function () {
      window.setTimeout(function () {
        button.style.transform = "";
        button.style.boxShadow = "";
      }, 120);
    });
    button.addEventListener("pointerleave", function () {
      button.style.transform = "";
      button.style.boxShadow = "";
    });
  });

  document.getElementById("soundToggle").addEventListener("click", function (event) {
    soundOn = !soundOn;
    event.currentTarget.classList.toggle("is-muted", !soundOn);
    event.currentTarget.querySelector("span").textContent = soundOn ? "sound" : "muted";
    if (soundOn) tone("pop");
  });

  document.getElementById("copyTokens").addEventListener("click", copyTokens);

  resizeCanvas();
  createParticles();
  drawParticles();
  revealElements();
  initTilt();
  initPointerAura();
  window.addEventListener("resize", function () {
    resizeCanvas();
    createParticles();
  });
}());
