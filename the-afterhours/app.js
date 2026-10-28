(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const storage = {
    get(key, fallback) { try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch (_) { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, value); return true; } catch (_) { return false; } },
    remove(key) { try { localStorage.removeItem(key); } catch (_) {} }
  };
  const subjects = {
    literature: {
      title: "Literature & the human condition", label: "LITERATURE", note: "Read a page slowly. Ask what it is trying to tell you, and what it reminds you of.",
      prompts: [
        "What is one idea from this chapter you want to carry into real life?",
        "What does the main character want — and what are they afraid to admit?",
        "Find one sentence you love. What makes it work?",
        "What changes between the first and last page of this section?"
      ]
    },
    math: {
      title: "Mathematics & the art of getting there", label: "MATHEMATICS", note: "Work one example without looking at the solution. Getting stuck is part of the method.",
      prompts: [
        "Which exact step stops making sense? Write it down, not just 'the whole thing'.",
        "Can you explain this formula in words instead of symbols?",
        "Try one example with smaller numbers. What becomes clearer?",
        "What is the one thing you need to remember before the next problem?"
      ]
    },
    science: {
      title: "Science & the beautiful why", label: "SCIENCE", note: "Turn each fact into a question. Understanding the 'why' tends to stay longer than memorising the 'what'.",
      prompts: [
        "What would you expect to happen if this variable changed?",
        "Can you explain the concept to someone who has never studied it?",
        "Which cause leads to which effect in this section?",
        "What evidence supports the idea — and what would challenge it?"
      ]
    },
    language: {
      title: "Languages & other ways to see", label: "LANGUAGES", note: "Say the new phrase out loud. A language becomes yours through use, not just through highlighting.",
      prompts: [
        "Write one new phrase you could actually use this week.",
        "Which word has a meaning you can't translate perfectly?",
        "Make one sentence using three things you learned today.",
        "What did you understand without translating word for word?"
      ]
    },
    anything: {
      title: "The Big Mess (also a subject)", label: "THE BIG MESS", note: "Name the one thing that matters most right now. You don't have to sort the whole pile at once.",
      prompts: [
        "What is the smallest useful next step you can take in ten minutes?",
        "What part is confusing, and what part do you already know?",
        "If you could finish only one thing today, what would help Future You most?",
        "What can wait until tomorrow without anything terrible happening?"
      ]
    }
  };
  const allPrompts = [
    "What can you do in ten minutes that Future You will thank you for?",
    "Write one question you are allowed not to know the answer to yet.",
    "What did you understand today that was confusing yesterday?",
    "If you had to explain this page in one sentence, what would you say?",
    "What is enough progress for this session — not a perfect session?",
    "Name the next step so clearly that starting it tomorrow feels easy."
  ];
  const subjectKeys = Object.keys(subjects);
  const TODAY = new Date();
  const dayKey = TODAY.getFullYear()+"-"+String(TODAY.getMonth()+1).padStart(2,"0")+"-"+String(TODAY.getDate()).padStart(2,"0");
  const ledgerKey = "afterhours-ledger-"+dayKey;
  const notesKey = "afterhours-notes";
  const quietKey = "afterhours-quiet";
  const selectedKey = "afterhours-subject";
  let selected = subjectKeys.includes(storage.get(selectedKey,"literature")) ? storage.get(selectedKey,"literature") : "literature";
  let duration = 25*60;
  let remaining = duration;
  let running = false;
  let endAt = 0;
  let timerId = null;
  let toastTimer = null;
  let sessionStarted = false;
  let completedSinceStart = false;
  let notesSaveTimer = null;
  let chapters = new Set([selected]);
  let ledger = readLedger();
  chapters = new Set([...(ledger.subjects || []), selected]);
  let promptIdx = 0;

  function readLedger() {
    try {
      const saved = JSON.parse(storage.get(ledgerKey, "{}"));
      return {
        sessions: Math.max(0, Number(saved.sessions)||0),
        minutes: Math.max(0, Number(saved.minutes)||0),
        subjects: Array.isArray(saved.subjects) ? saved.subjects.filter(k => subjectKeys.includes(k)) : [selected]
      };
    } catch (_) { return {sessions:0,minutes:0,subjects:[selected]}; }
  }
  function saveLedger() {
    storage.set(ledgerKey, JSON.stringify({sessions:ledger.sessions,minutes:ledger.minutes,subjects:[...chapters]}));
  }
  function toast(message) {
    const el = $("toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
  }
  function displayTime(seconds) {
    const m=Math.floor(Math.max(0,seconds)/60), s=Math.max(0,seconds)%60;
    return String(m).padStart(2,"0")+"<span>:"+String(s).padStart(2,"0")+"</span>";
  }
  function updateTimerDisplay() {
    $("timer-time").innerHTML=displayTime(remaining);
    const fraction=duration ? remaining/duration : 0;
    const circumference=2*Math.PI*108;
    $("ring-progress").style.strokeDasharray=String(circumference);
    $("ring-progress").style.strokeDashoffset=String(circumference*(1-fraction));
    $("timer-caption").textContent=running?"IN YOUR FOCUS":duration===300?"A LITTLE RESET":duration===3000?"DEEP READING":"A LITTLE FOCUS";
    $("timer-subcaption").textContent=running?"ONE THING AT A TIME":duration===300?"BREATHE. STRETCH. SIP WATER.":"ONE PAGE AT A TIME";
    $("quiet-clock").textContent=String(Math.floor(Math.max(0,remaining)/60)).padStart(2,"0")+":"+String(Math.max(0,remaining)%60).padStart(2,"0");
    $("quiet-subject").textContent=subjects[selected].label+" · "+(running?"ONE THING AT A TIME":"ONE PAGE AT A TIME");
    $("quiet-timer-control").textContent=running?"Ⅱ PAUSE FOCUS":"▶ START / RESUME FOCUS";
    $("focus-status").textContent=running?"FOCUS IN PROGRESS":remaining===0?"SESSION COMPLETE":sessionStarted?"PAUSED, STILL YOURS":"WAITING FOR YOU";
    $("start-timer").innerHTML=running?'<span>Ⅱ</span> PAUSE A LITTLE':'<span>▶</span> '+(sessionStarted?"KEEP GOING":"START FOCUS");
    document.title=(running?Math.ceil(remaining/60)+"m · ":"")+"THE AFTERHOURS LIBRARY";
  }
  function renderLedger() {
    $("session-count").textContent=String(ledger.sessions).padStart(2,"0");
    $("minutes-count").textContent=String(ledger.minutes).padStart(3,"0");
    $("chapters-count").textContent=String(Math.max(chapters.size,1)).padStart(2,"0");
    $("ledger-message").textContent=ledger.sessions===0?"THE FIRST PAGE IS ALWAYS THE HARDEST. YOU'RE HERE.":ledger.sessions===1?"ONE SESSION DONE. THAT COUNTS MORE THAN YOU THINK.":ledger.sessions<4?"LOOK AT YOU, MAKING TIME FOR YOURSELF.":"LOOK AT THAT. YOU SHOWED UP FOR YOUR FUTURE SELF.";
    saveLedger();
  }
  function updateSubject(key, announce=true) {
    if(!subjects[key]) return;
    selected=key;storage.set(selectedKey,key);chapters.add(key);ledger.subjects=[...chapters];
    const s=subjects[key];
    $("selected-subject").textContent=s.title;
    $("subject-note").textContent=s.note;
    $("focus-subject").textContent=s.label;
    $("daily-question").textContent=s.prompts[0];
    promptIdx=0;
    document.querySelectorAll("[data-subject]").forEach(btn=>{
      const active=btn.dataset.subject===key;
      btn.classList.toggle("active",active);
      btn.setAttribute("aria-pressed",String(active));
    });
    renderLedger();
    if(announce)toast("BOOK OPENED: "+s.label+". FIND YOUR PLACE.");
  }
  function shufflePrompt() {
    const s=subjects[selected];
    let candidates=s.prompts.filter(p=>p!==$("daily-question").textContent);
    if(!candidates.length)candidates=allPrompts.filter(p=>p!==$("daily-question").textContent);
    const p=candidates[Math.floor(Math.random()*candidates.length)]||allPrompts[promptIdx++%allPrompts.length];
    $("daily-question").textContent=p;
    toast("A NEW QUESTION FOR YOUR MARGINS.");
  }
  function selectDuration(minutes) {
    duration=minutes*60;remaining=duration;running=false;sessionStarted=false;completedSinceStart=false;endAt=0;
    clearInterval(timerId);timerId=null;
    document.querySelectorAll("[data-minutes]").forEach(btn=>{
      const active=Number(btn.dataset.minutes)===minutes;
      btn.classList.toggle("active",active);btn.setAttribute("aria-pressed",String(active));
    });
    updateTimerDisplay();
  }
  function startTimer() {
    if(running){pauseTimer();return;}
    if(remaining<=0){remaining=duration;completedSinceStart=false;sessionStarted=false;}
    running=true;sessionStarted=true;endAt=Date.now()+remaining*1000;
    clearInterval(timerId);
    timerId=setInterval(tick,250);
    updateTimerDisplay();
    if(!completedSinceStart)toast("YOUR FOCUS SESSION HAS STARTED. YOU'VE GOT THIS.");
  }
  function pauseTimer() {
    if(!running)return;
    remaining=Math.max(0,Math.ceil((endAt-Date.now())/1000));
    running=false;clearInterval(timerId);timerId=null;
    updateTimerDisplay();toast("PAUSED. YOU CAN COME BACK WHENEVER.");
  }
  function tick() {
    if(!running)return;
    remaining=Math.max(0,Math.ceil((endAt-Date.now())/1000));
    updateTimerDisplay();
    if(remaining===0)finishTimer();
  }
  function finishTimer() {
    running=false;clearInterval(timerId);timerId=null;
    if(!completedSinceStart){
      completedSinceStart=true;
      ledger.sessions+=1;
      ledger.minutes+=Math.round(duration/60);
      renderLedger();
      $("focus-status").textContent="SESSION COMPLETE";
      $("timer-caption").textContent="YOU DID IT";
      $("timer-subcaption").textContent="THAT COUNTS. REALLY.";
      $("start-timer").innerHTML='<span>↻</span> ANOTHER SESSION';
      toast("SESSION COMPLETE. PLEASE BE A LITTLE PROUD OF YOURSELF. ✳");
      if("Notification" in window && Notification.permission==="granted"){
        try{new Notification("The Afterhours Library",{body:"Your focus session is complete. Stretch, sip water, and take a little break."});}catch(_){}
      }
    }
    updateTimerDisplay();
  }
  function resetTimer() {
    running=false;clearInterval(timerId);timerId=null;remaining=duration;sessionStarted=false;completedSinceStart=false;endAt=0;
    updateTimerDisplay();toast("TIMER RESET. NO JUDGEMENT, JUST A FRESH START.");
  }
  function setQuiet(on, notify=true) {
    document.body.classList.toggle("quiet-mode",on);
    $("quiet-toggle").setAttribute("aria-pressed",String(on));
    $("quiet-label").textContent=on?"QUIET MODE ON":"QUIET MODE";
    storage.set(quietKey,on?"1":"0");
    $("focus-overlay").hidden=!on;
    if(notify){if(on)toast("QUIET MODE. JUST YOU AND THE PAGE.");else toast("THE LIBRARY IS BACK AROUND YOU.");}
  }
  function saveNotes() {
    const ok=storage.set(notesKey,$("study-notes").value);
    $("save-status").textContent=ok?"AUTOSAVED ON THIS DEVICE · "+new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}).toUpperCase():"LOCAL STORAGE IS UNAVAILABLE IN THIS BROWSER";
  }

  document.querySelectorAll("[data-subject]").forEach(button=>button.addEventListener("click",()=>updateSubject(button.dataset.subject)));
  document.querySelectorAll("[data-minutes]").forEach(button=>button.addEventListener("click",()=>selectDuration(Number(button.dataset.minutes))));
  $("shuffle-prompt").addEventListener("click",shufflePrompt);
  $("start-timer").addEventListener("click",startTimer);
  $("reset-timer").addEventListener("click",resetTimer);
  $("quiet-toggle").addEventListener("click",()=>setQuiet(!$("quiet-toggle").getAttribute("aria-pressed").includes("true")));
  $("exit-focus").addEventListener("click",()=>setQuiet(false));
  $("quiet-timer-control").addEventListener("click",startTimer);
  $("go-study").addEventListener("click",()=>{$("study").scrollIntoView({behavior:"smooth",block:"start"});setTimeout(()=>$("timer-time").animate([{transform:"scale(1)"},{transform:"scale(1.055)"},{transform:"scale(1)"}],{duration:430}),400);});
  $("back-top").addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));
  $("footer-start").addEventListener("click",()=>{$("study").scrollIntoView({behavior:"smooth",block:"start"});});
  $("study-notes").value=storage.get(notesKey,"");
  $("study-notes").addEventListener("input",()=>{
    $("save-status").textContent="SAVING YOUR THOUGHTS…";
    clearTimeout(notesSaveTimer);notesSaveTimer=setTimeout(saveNotes,250);
  });
  $("clear-notes").addEventListener("click",()=>{
    if(!$("study-notes").value)return toast("THIS PAGE IS ALREADY EMPTY.");
    $("study-notes").value="";saveNotes();toast("A CLEAN PAGE. ROOM TO BEGIN AGAIN.");
  });
  $("reset-ledger").addEventListener("click",()=>{
    ledger={sessions:0,minutes:0,subjects:[selected]};chapters=new Set([selected]);renderLedger();toast("TODAY'S LEDGER HAS BEEN RESET.");
  });
  $("focus-overlay").hidden=true;
  $("quiet-toggle").setAttribute("aria-pressed","false");
  $("notes-date").textContent=TODAY.toLocaleDateString(undefined,{month:"short",day:"2-digit",year:"numeric"}).toUpperCase();
  const savedQuiet=storage.get(quietKey,"0")==="1";
  // Always start quietly; persist the choice only after the visitor toggles it.
  setQuiet(savedQuiet,false);
  updateSubject(selected,false);
  renderLedger();
  selectDuration(25);
})();