(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const stations = [
    {
      freq:"88.6", code:"STATION 01 · THE BRAVE LITTLE THING", name:"THE BRAVE LITTLE THING",
      title:"The brave<br><em>little thing.</em>",
      text:"A small reminder from the morning desk: you have made it through every difficult day you thought you couldn't. You don't need to be fearless today. Being gentle with yourself is brave enough.",
      subtitle:"A SMALL CHEER FROM SOMEONE IN YOUR CORNER",
      mode:"COURAGE / FM", transmission:"You're stronger than the weather, but you never have to prove it."
    },
    {
      freq:"91.7", code:"STATION 02 · THE SOFT PLACE", name:"THE SOFT PLACE",
      title:"The soft<br><em>place.</em>",
      text:"A reminder that you do not have to make a perfect morning out of an imperfect day. You just have to arrive in it, one small breath at a time.",
      subtitle:"A LITTLE REMINDER, JUST FOR YOU",
      mode:"WARMTH / FM", transmission:"Take a slow breath. Let your shoulders drop. You are allowed to take the day gently."
    },
    {
      freq:"103.4", code:"STATION 03 · A NOTE FOR LATER", name:"A NOTE FOR LATER",
      title:"A note for<br><em>later.</em>",
      text:"For whenever you hear this again: somebody is quietly rooting for you. Not just for the big wins or the shiny days, but for the ordinary you, on the ordinary days. Especially then.",
      subtitle:"SAVE THIS FREQUENCY FOR LATER",
      mode:"REMEMBER / FM", transmission:"This is your reminder for later: you matter, even when the day feels a little sideways."
    }
  ];
  let current=1, playing=false, soundOn=false, speech=null, audio=null, master=null, humNodes=[], playTimer=null,toastTimer=null;
  const dial=$("big-dial");
  const pointer=dial.querySelector(".dial-pointer");
  const audioMeter=$("audio-meter");
  const playButton=$("play-broadcast");
  const playSymbol=playButton.querySelector(".play-symbol");
  const playName=playButton.querySelector("span:nth-child(2)");
  const playOriginal=playButton.innerHTML;
  const reducedMotion=matchMedia("(prefers-reduced-motion: reduce)").matches;

  function toast(message) {
    const el=$("toast");
    el.textContent=message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>el.classList.remove("show"),2400);
  }
  function stationAngle(index){return [-47,0,47][index]||0}
  function tune(index,announce=true) {
    current=Math.max(0,Math.min(stations.length-1,index));
    const s=stations[current];
    $("frequency").textContent=s.freq;
    $("station-code").textContent=s.code;
    $("dial-title").textContent=s.name;
    $("display-mode").textContent=s.mode;
    $("broadcast-title").innerHTML=s.title;
    $("broadcast-text").textContent=s.text;
    $("play-subtitle").textContent=s.subtitle;
    $("live-tag").textContent="ON AIR · STATION "+String(current+1).padStart(2,"0");
    $("tuner-marker").style.left=([4,31,77][current])+"%";
    pointer.style.transform="rotate("+stationAngle(current)+"deg)";
    dial.setAttribute("aria-valuenow",String(current));
    dial.setAttribute("aria-valuetext",s.name+" "+s.freq+" MHz");
    document.querySelectorAll("[data-station]").forEach(button=>{
      const active=Number(button.dataset.station)===current;
      button.classList.toggle("active",active);
      button.setAttribute("aria-pressed",String(active));
    });
    $("audio-meter").classList.remove("playing");
    playing=false;
    clearTimeout(playTimer);
    if(speech&&"speechSynthesis"in window){speechSynthesis.cancel();speech=null;}
    resetPlayButton();
    if(announce)toast("TUNED TO "+s.freq+" FM — "+s.name+".");
    chime(240+current*95,.11);
  }
  function resetPlayButton() {
    playButton.classList.remove("is-playing");
    playSymbol.textContent="▶";
    playName.innerHTML='PLAY THIS TRANSMISSION<small id="play-subtitle">'+stations[current].subtitle+'</small>';
    playButton.querySelector(".play-arrow").textContent="↗";
  }
  function finishPlayback() {
    playing=false;
    audioMeter.classList.remove("playing");
    clearTimeout(playTimer);
    resetPlayButton();
    if(speech){speech=null;}
    toast("TRANSMISSION COMPLETE. KEEP THE NICE PART.");
  }
  function playBroadcast() {
    if(playing) {
      if("speechSynthesis"in window) speechSynthesis.cancel();
      finishPlayback();
      toast("TRANSMISSION PAUSED. TUNE IN WHENEVER.");
      return;
    }
    playing=true;
    const s=stations[current];
    audioMeter.classList.add("playing");
    playButton.classList.add("is-playing");
    playSymbol.textContent="Ⅱ";
    playName.innerHTML='TRANSMISSION IN PROGRESS<small id="play-subtitle">PLEASE STAY ON THIS FREQUENCY</small>';
    playButton.querySelector(".play-arrow").textContent="•";
    toast("NOW TRANSMITTING ON "+s.freq+" FM.");
    if(soundOn) {
      chime(330+current*105,.2);
      if("speechSynthesis"in window && typeof SpeechSynthesisUtterance!=="undefined") {
        speech=new SpeechSynthesisUtterance(s.transmission+" "+s.text);
        speech.rate=.86;
        speech.pitch=1.02;
        speech.volume=.85;
        const voices=speechSynthesis.getVoices();
        const preferred=voices.find(v=>/^en/i.test(v.lang)&&/Samantha|Google US English|Karen|Aria|Jenny|Zira/i.test(v.name))||voices.find(v=>/^en/i.test(v.lang));
        if(preferred) speech.voice=preferred;
        speech.onend=()=>{if(playing)finishPlayback();};
        speech.onerror=()=>{speech=null;};
        try{speechSynthesis.cancel();speechSynthesis.speak(speech);}catch(_){speech=null;}
      }
    }
    const duration=soundOn&&speech?Math.max(7000,Math.min(26000,(s.text.length+s.transmission.length)*65)):9000;
    playTimer=setTimeout(()=>{if(playing)finishPlayback();},duration);
  }
  async function toggleSound() {
    if(!soundOn) {
      soundOn=true;
      try {
        const AudioContextType=window.AudioContext||window.webkitAudioContext;
        if(AudioContextType) {
          audio=audio||new AudioContextType();
          if(audio.state==="suspended")await audio.resume();
          master=audio.createGain();master.gain.value=0.035;master.connect(audio.destination);
          const hum1=audio.createOscillator(),hum2=audio.createOscillator();
          const gain1=audio.createGain(),gain2=audio.createGain();
          hum1.type="sine";hum1.frequency.value=110;
          hum2.type="sine";hum2.frequency.value=164.81;
          gain1.gain.value=.45;gain2.gain.value=.18;
          hum1.connect(gain1);hum2.connect(gain2);gain1.connect(master);gain2.connect(master);
          hum1.start();hum2.start();humNodes=[hum1,hum2];
        }
      }catch(_){}
      $("sound-state").textContent="ON";$("sound-toggle").setAttribute("aria-pressed","true");
      toast("A SOFT RADIO HUM IS ON. CLICK AGAIN TO MUTE.");
      chime(392,.2);
    }else{
      soundOn=false;
      if(master&&audio)master.gain.setTargetAtTime(0,audio.currentTime,.05);
      humNodes.forEach(n=>{try{n.stop()}catch(_){}});
      humNodes=[];
      if("speechSynthesis"in window)speechSynthesis.cancel();
      $("sound-state").textContent="OFF";$("sound-toggle").setAttribute("aria-pressed","false");
      toast("SOUND OFF. THE MESSAGE IS STILL HERE.");
    }
  }
  function chime(freq=300,duration=.13) {
    if(!soundOn)return;
    try {
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC)return;
      audio=audio||new AC();
      if(audio.state==="suspended")audio.resume();
      const destination=master||audio.destination;
      const osc=audio.createOscillator(),gain=audio.createGain();
      osc.type="sine";osc.frequency.setValueAtTime(freq,audio.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq*.76,audio.currentTime+duration);
      gain.gain.setValueAtTime(.0001,audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(.14,audio.currentTime+.018);
      gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+duration+.03);
      osc.connect(gain);gain.connect(destination);osc.start();osc.stop(audio.currentTime+duration+.05);
    }catch(_){}
  }
  document.querySelectorAll("[data-station]").forEach(button=>{
    button.addEventListener("click",()=>tune(Number(button.dataset.station)));
  });
  $("big-dial").addEventListener("keydown",e=>{
    if(e.key==="ArrowLeft"||e.key==="ArrowDown"){e.preventDefault();tune((current+2)%3);}
    if(e.key==="ArrowRight"||e.key==="ArrowUp"){e.preventDefault();tune((current+1)%3);}
    if(e.key==="Home"){e.preventDefault();tune(0);}
    if(e.key==="End"){e.preventDefault();tune(2);}
    if(e.key==="Enter"||e.key===" "){e.preventDefault();playBroadcast();}
  });
  let dialStartX=null;
  dial.addEventListener("pointerdown",e=>{dialStartX=e.clientX;try{dial.setPointerCapture(e.pointerId)}catch(_){}});
  dial.addEventListener("pointerup",e=>{
    if(dialStartX===null)return;
    const delta=e.clientX-dialStartX;
    if(Math.abs(delta)>13)tune((current+(delta<0?2:1))%3);
    else tune((current+1)%3);
    dialStartX=null;
  });
  // Pointer tuning is handled by pointerup; keyboard tuning is handled above.
  $("play-broadcast").addEventListener("click",playBroadcast);
  $("sound-toggle").addEventListener("click",toggleSound);
  $("back-to-top").addEventListener("click",()=>{window.scrollTo({top:0,behavior:"smooth"});tune(1,false);});
  window.addEventListener("pagehide",()=>{if("speechSynthesis"in window)speechSynthesis.cancel();if(audio)audio.close().catch(()=>{});});

  // A soft diagonal rain animation; deliberately subdued behind the content.
  const rain=$("rain"),rctx=rain.getContext("2d");
  let rw=0,rh=0,rdpr=1,drops=[];
  function resizeRain(){
    rdpr=Math.min(window.devicePixelRatio||1,1.5);
    rw=window.innerWidth;rh=window.innerHeight;
    rain.width=Math.round(rw*rdpr);rain.height=Math.round(rh*rdpr);
    rain.style.width=rw+"px";rain.style.height=rh+"px";
    rctx.setTransform(rdpr,0,0,rdpr,0,0);
    const n=Math.min(110,Math.max(36,Math.round(rw/9)));
    drops=Array.from({length:n},()=>({x:Math.random()*rw,y:Math.random()*rh,len:5+Math.random()*16,speed:1.5+Math.random()*4,alpha:.05+Math.random()*.13,w:.45+Math.random()*.75}));
  }
  let lastRain=0;
  function drawRain(now){
    const delta=Math.min(2,(now-(lastRain||now))/16.67||1);lastRain=now;
    rctx.clearRect(0,0,rw,rh);
    rctx.lineCap="round";
    for(const d of drops){
      d.y+=d.speed*delta;d.x-=.45*delta;
      if(d.y>rh+20){d.y=-d.len-Math.random()*50;d.x=Math.random()*rw;}
      if(d.x<-10)d.x=rw+10;
      rctx.beginPath();rctx.moveTo(d.x,d.y);rctx.lineTo(d.x-2.4,d.y+d.len);
      rctx.strokeStyle="#536c65";rctx.globalAlpha=d.alpha;rctx.lineWidth=d.w;rctx.stroke();
    }
    rctx.globalAlpha=1;
    if(!reducedMotion)requestAnimationFrame(drawRain);
  }
  window.addEventListener("resize",resizeRain,{passive:true});
  resizeRain();
  requestAnimationFrame(drawRain);
  tune(1,false);
})();