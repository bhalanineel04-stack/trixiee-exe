(() => {
  const $ = (s) => document.querySelector(s);
  const starfield = $("#starfield");
  for (let i = 0; i < 105; i++) {
    const star = document.createElement("i");
    star.className = "star";
    star.style.left = Math.random() * 100 + "%";
    star.style.top = Math.random() * 100 + "%";
    star.style.setProperty("--o", (0.25 + Math.random() * 0.7).toFixed(2));
    star.style.setProperty("--d", (2 + Math.random() * 4).toFixed(2) + "s");
    star.style.animationDelay = (-Math.random() * 5).toFixed(2) + "s";
    starfield.appendChild(star);
  }
  const diyas = [...document.querySelectorAll(".diya")];
  const progress = $("#progress");
  const litCount = $("#litCount");
  function updateLights() {
    const count = diyas.filter(d => d.dataset.lit === "true").length;
    litCount.textContent = count + " OF 5 LIGHTS AWAKENED";
    progress.style.width = (count * 20) + "%";
    if (count === 5) {
      litCount.textContent = "ALL FIVE LIGHTS ARE SHINING ✦ MAKE A WISH!";
      burst(window.innerWidth / 2, window.innerHeight * .45, 55);
    }
  }
  diyas.forEach(diya => diya.addEventListener("click", () => {
    diya.dataset.lit = diya.dataset.lit !== "true" ? "true" : "false";
    updateLights();
  }));
  $("#explore").addEventListener("click", () => $("#lights").scrollIntoView({behavior:"smooth"}));
  const wishInput = $("#wishInput");
  const charCount = $("#charCount");
  wishInput.addEventListener("input", () => charCount.textContent = wishInput.value.length + " / 140");
  const savedWish = localStorage.getItem("trixiee-diwali-wish");
  if (savedWish) showWish(savedWish);
  function showWish(wish) {
    $("#wishResult").textContent = "“" + wish + "”";
    $("#sealed").classList.add("show");
  }
  $("#wishForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const wish = wishInput.value.trim();
    if (!wish) return;
    localStorage.setItem("trixiee-diwali-wish", wish);
    showWish(wish);
    burst(window.innerWidth * .7, window.innerHeight * .55, 42);
  });
  function burst(x, y, amount = 42) {
    const layer = $("#burstLayer");
    const colors = ["#ffd17d", "#ff9d9c", "#fff1cf", "#c4a8ff", "#ffab69"];
    for (let i = 0; i < amount; i++) {
      const p = document.createElement("i");
      p.className = "particle";
      const angle = Math.random() * Math.PI * 2;
      const distance = 45 + Math.random() * 125;
      p.style.left = x + "px";
      p.style.top = y + "px";
      p.style.setProperty("--x", Math.cos(angle) * distance + "px");
      p.style.setProperty("--y", Math.sin(angle) * distance + "px");
      p.style.setProperty("--c", colors[Math.floor(Math.random() * colors.length)]);
      p.style.setProperty("--t", (0.8 + Math.random() * 1.1) + "s");
      layer.appendChild(p);
      setTimeout(() => p.remove(), 2100);
    }
  }
  $("#fireworks").addEventListener("click", () => {
    const status = $("#fireworkStatus");
    status.textContent = "THIS ONE'S FOR YOU, TRIXIEE ✦";
    const launch = () => burst(Math.random() * window.innerWidth, 100 + Math.random() * window.innerHeight * .62, 48);
    for (let i = 0; i < 7; i++) setTimeout(launch, i * 260);
    setTimeout(() => status.textContent = "A whole sky of good things, coming up.", 3300);
  });
})();