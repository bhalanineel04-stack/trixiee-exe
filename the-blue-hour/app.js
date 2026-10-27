(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const ocean = $("ocean");
  const canvas = $("sea-canvas");
  const ctx = canvas.getContext("2d", { alpha: true });
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let width = 0, height = 0, dpr = 1, lastTime = 0, elapsed = 0;
  let entered = false, dawn = false, soundOn = false, audioCtx = null, masterGain = null;
  const collected = new Set();
  const motes = [];
  const bubbles = [];
  const ripples = [];
  const bursts = [];
  const palette = ["#9af9ff", "#c7c0ff", "#ffdca3", "#f7b6dc", "#a9f7dc"];
  const targets = [
    { id: 1, x: .735, y: .265, color: "#9af9ff", sway: 21, phase: .8 },
    { id: 2, x: .89,  y: .435, color: "#ffe4a4", sway: 16, phase: 2.4 },
    { id: 3, x: .72,  y: .625, color: "#f7b6dc", sway: 23, phase: 4.2 },
    { id: 4, x: .43,  y: .705, color: "#b9b3ff", sway: 18, phase: 5.1 },
    { id: 5, x: .20,  y: .54,  color: "#a9f7dc", sway: 17, phase: 1.7 }
  ];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.8);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seedMotes();
    seedBubbles();
  }
  function seedMotes() {
    motes.length = 0;
    const count = clamp(Math.round(width * height / 8500), 65, 180);
    for (let i = 0; i < count; i++) {
      motes.push({
        x: Math.random() * width, y: Math.random() * height,
        r: rand(.35, 1.8), alpha: rand(.11, .6), phase: rand(0, Math.PI * 2),
        speed: rand(.08, .38), drift: rand(-.24, .24),
        color: palette[Math.floor(Math.random() * palette.length)]
      });
    }
  }
  function seedBubbles() {
    bubbles.length = 0;
    const count = clamp(Math.round(width / 22), 24, 60);
    for (let i = 0; i < count; i++) {
      bubbles.push({x:Math.random()*width,y:Math.random()*height,r:rand(.6,2.6),speed:rand(5,21),drift:rand(-7,7),alpha:rand(.06,.3),phase:rand(0,7)});
    }
  }
  function targetPosition(t, time) {
    return {
      x: t.x * width + Math.sin(time * .00035 + t.phase) * t.sway,
      y: t.y * height + Math.cos(time * .00031 + t.phase * 1.37) * t.sway * .56
    };
  }
  function drawBackground(time) {
    const dawnMix = dawn ? clamp((time - dawnStart) / 3600, 0, 1) : 0;
    const centerX = width * (.56 + Math.sin(time * .00005) * .035);
    const centerY = height * (.46 + Math.cos(time * .00007) * .04);
    const glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * .8);
    if (dawnMix > 0) {
      glow.addColorStop(0, "rgba(244,164,178," + (.08 + dawnMix * .16) + ")");
      glow.addColorStop(.42, "rgba(137,133,191," + (.07 + dawnMix * .10) + ")");
      glow.addColorStop(1, "rgba(6,20,38,0)");
    } else {
      glow.addColorStop(0, "rgba(79,127,190,.105)");
      glow.addColorStop(.4, "rgba(53,84,151,.06)");
      glow.addColorStop(1, "rgba(3,12,29,0)");
    }
    ctx.fillStyle = glow;
    ctx.fillRect(0,0,width,height);

    ctx.save();
    ctx.globalAlpha = .08;
    for (let i = 0; i < 5; i++) {
      const x = width * (.15 + i * .18) + Math.sin(time * .00013 + i * 1.2) * 45;
      ctx.beginPath();
      ctx.moveTo(x, -20);
      ctx.quadraticCurveTo(x + Math.sin(time * .0001 + i) * 90, height * .36, x - 60 + Math.sin(time * .00007 + i) * 45, height * .8);
      ctx.strokeStyle = i % 2 ? "#a9ccff" : "#b2faff";
      ctx.lineWidth = width * .025;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 30;
      ctx.stroke();
    }
    ctx.restore();
  }
  function drawMotes(time, dt) {
    for (const p of motes) {
      p.y -= p.speed * dt * .014;
      p.x += (p.drift + Math.sin(time * .0002 + p.phase) * .18) * dt * .02;
      if (p.y < -5) { p.y = height + 5; p.x = Math.random() * width; }
      if (p.x < -5) p.x = width + 5;
      if (p.x > width + 5) p.x = -5;
      const pulse = .55 + .45 * Math.sin(time * .0011 + p.phase);
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha * pulse;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.r > 1.2 ? 9 : 0;
      ctx.arc(p.x, p.y, p.r * (1 + .14 * pulse), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }
  function drawBubbles(time, dt) {
    for (const b of bubbles) {
      b.y -= b.speed * dt * .014;
      b.x += Math.sin(time * .0006 + b.phase) * b.drift * dt * .002;
      if (b.y < -10) { b.y = height + rand(0, 70); b.x = rand(0,width); }
      ctx.beginPath();
      ctx.strokeStyle = "#c1f7ff";
      ctx.globalAlpha = b.alpha;
      ctx.lineWidth = .7;
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.stroke();
      if (b.r > 1.8) {
        ctx.beginPath();
        ctx.fillStyle = "#fff";
        ctx.globalAlpha = b.alpha * .75;
        ctx.arc(b.x - b.r*.25, b.y - b.r*.3, .45, 0, Math.PI*2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
  function drawFlow(time) {
    ctx.save();
    ctx.lineWidth = 1;
    for (let row = 0; row < 13; row++) {
      const baseY = height * (.24 + row * .057);
      ctx.beginPath();
      for (let x = -20; x <= width + 20; x += 16) {
        const y = baseY + Math.sin(x * .005 + time * .00035 + row) * (7 + row*.34) + Math.cos(x * .0022 - time * .00016) * 9;
        if (x === -20) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.strokeStyle = row % 3 === 0 ? "#9af9ff" : "#aaaaff";
      ctx.globalAlpha = .025 + (row % 4) * .007;
      ctx.stroke();
    }
    ctx.restore();
  }
  function drawTarget(t, time) {
    const p = targetPosition(t, time);
    t.px = p.x; t.py = p.y;
    const got = collected.has(t.id);
    if (got) {
      ctx.save();
      ctx.globalAlpha = .28;
      ctx.beginPath();
      ctx.strokeStyle = t.color;
      ctx.lineWidth = 1;
      ctx.arc(p.x,p.y, 12 + Math.sin(time*.002 + t.phase)*2,0,Math.PI*2);
      ctx.stroke();
      ctx.restore();
      return;
    }
    const pulse = .65 + .35 * Math.sin(time*.002 + t.phase);
    const radius = 24 + pulse * 9;
    const halo = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,radius*2.2);
    halo.addColorStop(0,t.color + "b8");
    halo.addColorStop(.18,t.color + "46");
    halo.addColorStop(.55,t.color + "16");
    halo.addColorStop(1,t.color + "00");
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(p.x,p.y,radius*2.2,0,Math.PI*2); ctx.fill();
    ctx.save();
    ctx.translate(p.x,p.y);
    ctx.rotate(time*.00025 + t.phase);
    ctx.strokeStyle = t.color;
    ctx.globalAlpha = .36 + pulse*.22;
    ctx.lineWidth = .8;
    ctx.beginPath();
    ctx.ellipse(0,0,12 + pulse*2,5 + pulse,0,0,Math.PI*2);
    ctx.stroke();
    ctx.rotate(-time*.0005 - t.phase);
    ctx.globalAlpha = .8;
    ctx.beginPath();
    ctx.moveTo(0,-4); ctx.lineTo(0,4); ctx.moveTo(-4,0); ctx.lineTo(4,0);
    ctx.stroke();
    ctx.restore();
    ctx.beginPath();
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = t.color;
    ctx.shadowBlur = 17 + pulse*12;
    ctx.globalAlpha = .75 + pulse*.25;
    ctx.arc(p.x,p.y, 2.2 + pulse*.5,0,Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
  function drawRipples(time) {
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.age += 16;
      const progress = r.age / r.life;
      if (progress >= 1) { ripples.splice(i,1); continue; }
      for (let ring = 0; ring < 3; ring++) {
        const phase = (progress + ring*.18) % 1;
        ctx.beginPath();
        ctx.arc(r.x,r.y, 3 + phase * r.max, 0, Math.PI*2);
        ctx.strokeStyle = r.color || "#9af9ff";
        ctx.lineWidth = 1.1 - phase*.6;
        ctx.globalAlpha = (1-phase) * .32;
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }
  function drawBursts(dt) {
    for(let i=bursts.length-1;i>=0;i--){
      const b=bursts[i]; b.life-=dt;
      if(b.life<=0){bursts.splice(i,1);continue}
      b.x+=b.vx*dt*.05;b.y+=b.vy*dt*.05;b.vy+=.002*dt;
      ctx.beginPath();ctx.fillStyle=b.color;ctx.globalAlpha=clamp(b.life/850,0,1);
      ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
  }
  function render(time) {
    if (!ctx) return;
    if (!lastTime) lastTime = time;
    const dt = Math.min(time - lastTime, 40);
    lastTime = time;
    elapsed = time;
    ctx.clearRect(0,0,width,height);
    drawBackground(time);
    drawFlow(time);
    drawMotes(time,dt);
    drawBubbles(time,dt);
    for (const t of targets) drawTarget(t,time);
    drawRipples(time);
    drawBursts(dt);
    requestAnimationFrame(render);
  }
  let dawnStart = 0;

  function showRipple(x,y,color="#9af9ff",max=85) {
    ripples.push({x,y,age:0,life:1250,max,color});
    for(let i=0;i<17;i++){
      const angle=Math.random()*Math.PI*2, speed=rand(.3,2.4);
      bursts.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-1,r:rand(.8,2.3),life:rand(350,850),color:palette[Math.floor(Math.random()*palette.length)]});
    }
  }
  function collectTarget(t) {
    if (collected.has(t.id)) return;
    collected.add(t.id);
    showRipple(t.px,t.py,t.color,160);
    $("tide-count").textContent = String(collected.size).padStart(2,"0");
    const percent = collected.size / targets.length;
    ocean.style.setProperty("--progress", percent);
    $("instruction").innerHTML = collected.size === 5
      ? '<span class="finger">✦</span><span>The tide has brought every light to you.<br><em>Now watch what the water remembers.</em></span>'
      : '<span class="finger">✧</span><span>A little light, kept safe.<br><em>' + (targets.length-collected.size) + ' more tide ' + (targets.length-collected.size===1?"light":"lights") + ' are still wandering.</em></span>';
    if (collected.size === targets.length) {
      $("transform-button").disabled = false;
      $("transform-button").textContent = "LET THE OCEAN TURN  ↗";
      toast("ALL FIVE TIDE LIGHTS FOUND. SOMETHING IS CHANGING.");
    } else {
      toast("TIDE LIGHT " + collected.size + " OF 5 — HELD FOR YOU ✧");
    }
    playTone(360 + collected.size*85, .7);
  }
  function handlePointer(event) {
    if (!entered || dawn) return;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (width / rect.width);
    const y = (event.clientY - rect.top) * (height / rect.height);
    let closest = null, distance = Infinity;
    for (const t of targets) {
      if(collected.has(t.id)) continue;
      const p = targetPosition(t, performance.now());
      const d = Math.hypot(x-p.x,y-p.y);
      if(d < distance){distance=d;closest=t}
    }
    if (closest && distance < Math.max(39, Math.min(width,height)*.07)) {
      closest.px = x; closest.py = y;
      collectTarget(closest);
    } else {
      showRipple(x,y,"#9af9ff",65);
      playTone(220, .3);
      toast("A ripple in the quiet. KEEP FOLLOWING THE GLOWING LIGHTS.");
    }
  }
  function toast(message) {
    let element = $("toast");
    if (!element) {
      element = document.createElement("div");
      element.id = "toast";
      element.className = "ocean-toast";
      element.setAttribute("aria-live","polite");
      document.body.appendChild(element);
      const style = document.createElement("style");
      style.textContent = ".ocean-toast{position:absolute;z-index:30;left:50%;top:83px;transform:translate(-50%,-8px);background:#e6f8ff;color:#10243e;border:1px solid #b5e9f6;padding:11px 15px;font:8px 'DM Mono',monospace;letter-spacing:.06em;text-align:center;max-width:calc(100% - 35px);box-shadow:0 6px 26px #020c2044;opacity:0;pointer-events:none;transition:.25s}.ocean-toast.show{opacity:1;transform:translate(-50%,0)}";
      document.head.appendChild(style);
    }
    element.textContent=message;element.classList.add("show");
    clearTimeout(toast.timer);toast.timer=setTimeout(()=>element.classList.remove("show"),2300);
  }
  function playTone(freq=390,vol=.4) {
    if (!soundOn || !audioCtx || !masterGain) return;
    try {
      const osc=audioCtx.createOscillator(), gain=audioCtx.createGain();
      osc.type="sine";osc.frequency.setValueAtTime(freq,audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(Math.max(110,freq*.65),audioCtx.currentTime+1.5);
      gain.gain.setValueAtTime(.0001,audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.035*vol,audioCtx.currentTime+.07);
      gain.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+1.6);
      osc.connect(gain);gain.connect(masterGain);osc.start();osc.stop(audioCtx.currentTime+1.7);
    }catch(_){}
  }
  async function toggleSound() {
    if (!soundOn) {
      try {
        const AC=window.AudioContext||window.webkitAudioContext;
        if(!AC){toast("THIS BROWSER DOESN’T SUPPORT AMBIENT SOUND.");return}
        audioCtx=audioCtx||new AC();
        if(audioCtx.state==="suspended") await audioCtx.resume();
        masterGain=audioCtx.createGain();masterGain.gain.value=.12;masterGain.connect(audioCtx.destination);
        const drone=audioCtx.createOscillator(), low=audioCtx.createOscillator();
        const g=audioCtx.createGain(), g2=audioCtx.createGain();
        drone.type="sine";drone.frequency.value=110;low.type="sine";low.frequency.value=164.81;
        g.gain.value=.055;g2.gain.value=.024;
        drone.connect(g);low.connect(g2);g.connect(masterGain);g2.connect(masterGain);
        drone.start();low.start();soundOn=true;
        $("sound-state").textContent="ON";$("sound-toggle").setAttribute("aria-label","Turn ambient sound off");
        toast("QUIET AMBIENT TONES ON. TAP AGAIN TO SILENCE.");
      }catch(_){soundOn=false;toast("SOUND COULDN’T START IN THIS BROWSER.");}
    }else{
      if(masterGain)masterGain.gain.setTargetAtTime(0,audioCtx.currentTime,.15);
      soundOn=false;$("sound-state").textContent="OFF";$("sound-toggle").setAttribute("aria-label","Turn ambient sound on");
      toast("BACK TO THE SOUND OF NOTHING. ♡");
    }
  }
  function beginOcean() {
    if(entered)return;
    entered=true;ocean.classList.add("entered");
    toast("WELCOME TO THE BLUE. LET YOUR EYES ADJUST.");
    $("interaction-layer").setAttribute("aria-label","Tap a glowing tide light to collect it. Five lights unlock the dawn.");
  }
  function beginDawn() {
    if(collected.size!==5 || dawn)return;
    dawn=true;dawnStart=performance.now();ocean.classList.add("dawn");
    $("phase-label").textContent="DEPTH 000 · THE BLUE BECOMING MORNING";
    $("instruction").style.opacity="0";$("transform-button").style.opacity="0";
    const veil=document.createElement("div");veil.className="dawn-particles";veil.setAttribute("aria-hidden","true");ocean.appendChild(veil);
    for(let i=0;i<65;i++){
      const star=document.createElement("i");
      star.style.left=(Math.random()*100)+"%";
      star.style.top=(25+Math.random()*70)+"%";
      star.style.setProperty("--delay",(Math.random()*2.7)+"s");
      veil.appendChild(star);
    }
    playTone(580,.85);
  }
  function reset() {
    collected.clear();entered=false;dawn=false;dawnStart=0;lastTime=0;
    ocean.classList.remove("entered","dawn");ocean.style.setProperty("--progress",0);
    $("phase-label").textContent="DEPTH 011 · MIDNIGHT BLUE";
    $("tide-count").textContent="00";
    $("instruction").style.opacity="";
    $("instruction").innerHTML='<span class="finger">✧</span><span>Touch the little lights as they drift past.<br><em>They only glow when someone notices.</em></span>';
    $("transform-button").disabled=true;$("transform-button").textContent="LET THE OCEAN TURN  ↗";$("transform-button").style.opacity="";
    $("note-shade").hidden=true;
    const dust=ocean.querySelector(".dawn-particles");if(dust)dust.remove();
    ripples.length=0;bursts.length=0;
    toast("THE WATER IS QUIET AGAIN. TAKE ANOTHER LITTLE DIVE.");
    $("dive-button").focus();
  }

  function makeDawnStars() {
    // Delicate moving light dust behind the final message.
    const style = document.createElement("style");
    style.textContent=".dawn-particles{position:absolute;inset:0;overflow:hidden;pointer-events:none}.dawn-particles i{position:absolute;width:3px;height:3px;border-radius:50%;background:#ffe8dd;box-shadow:0 0 12px #ffe0d4;opacity:0;animation:dawn-drift 5s var(--delay) ease-in-out infinite alternate}@keyframes dawn-drift{0%{transform:translateY(22px) scale(.55);opacity:0}45%{opacity:.65}100%{transform:translateY(-24px) scale(1.3);opacity:.1}}";
    document.head.appendChild(style);
  }
  makeDawnStars();
  canvas.addEventListener("pointerdown", handlePointer, {passive:true});
  $("dive-button").addEventListener("click",beginOcean);
  $("transform-button").addEventListener("click",beginDawn);
  $("sound-toggle").addEventListener("click",toggleSound);
  $("open-note").addEventListener("click",()=>{$("note-shade").hidden=false;$("close-note").focus();playTone(620,.6)});
  $("close-note").addEventListener("click",()=>{$("note-shade").hidden=true});
  $("note-shade").addEventListener("click",event=>{if(event.target===$("note-shade"))$("note-shade").hidden=true});
  $("start-again").addEventListener("click",reset);
  const returnBtn=$("return-to-water");
  if(returnBtn)returnBtn.addEventListener("click",reset);
  document.addEventListener("keydown",event=>{if(event.key==="Escape")$("note-shade").hidden=true});
  window.addEventListener("resize",resize,{passive:true});
  resize();
  if(reducedMotion) {
    // Keep the scene interactive while reducing constant animation movement.
    for(const m of motes){m.speed*=.25;m.drift*=.25}
  }
  requestAnimationFrame(render);
})();