(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const buttons = [...document.querySelectorAll("[data-choice]")];
  let realNames = false;
  let selectedChoice = null;
  let toastTimer = null;
  const stories = {
    chaos: {
      label:"CANON EVENT / ROUTE A — CHAOS",
      title:"The incident has acquired a sequel.",
      text:"Lambo says, with full confidence, that the next plan is foolproof. Trixiee gives him the kind of look usually reserved for suspicious emails. Five minutes later they are deep into a brand-new side quest nobody asked for. The plan fails. The bit becomes legendary. The group chat receives a 47-message debrief.",
      art:"ϟ",
      className:"result-chaos",
      toast:"CHAOS ROUTE SELECTED. THE ARCHIVES ARE ALREADY WORRIED."
    },
    soft: {
      label:"CANON EVENT / ROUTE B — THE SOFT ENDING",
      title:"A sincere moment escaped containment.",
      text:"For once, nobody makes a joke immediately. Lambo says something properly nice. Trixiee pretends not to be touched, with limited success. The silence isn't awkward; it's the kind that says, underneath all the bits and nonsense, I'm really glad it's you. Naturally, someone ruins the moment with a terrible sticker. Balance is restored.",
      art:"♡",
      className:"result-soft",
      toast:"WHOLESOME ROUTE SELECTED. THE ARCHIVES ARE A LITTLE EMOTIONAL."
    }
  };
  function toast(message) {
    const el=$("toast");el.textContent=message;el.classList.add("show");
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2600);
  }
  function updateNames() {
    document.querySelectorAll("[data-real][data-nick]").forEach(el=>{
      el.textContent=realNames?el.dataset.real:el.dataset.nick;
    });
    $("name-mode-label").textContent=realNames?"REAL NAMES":"NICKNAMES";
    $("name-mode").setAttribute("aria-pressed",String(realNames));
    document.body.classList.toggle("real-names",realNames);
    toast(realNames?"THE RECORDS NOW USE NEEL & PRAGYNA.":"LAMBO & TRIXIEE ARE BACK ON THE COVER.");
  }
  function chooseStory(key) {
    const story=stories[key];if(!story)return;
    selectedChoice=key;
    buttons.forEach(b=>{
      const on=b.dataset.choice===key;
      b.classList.toggle("selected",on);
      b.setAttribute("aria-pressed",String(on));
    });
    const result=$("choice-result");
    result.hidden=false;
    result.className="choice-result "+story.className;
    $("result-label").textContent=story.label;
    $("result-title").textContent=story.title;
    $("result-text").textContent=realNames?story.text.replace(/Lambo/g,"Neel").replace(/Trixiee/g,"Pragyna"):story.text;
    $("result-art").innerHTML="<span>"+story.art+"</span>";
    $("result-art").style.background=key==="chaos"?"#f05a42":"#2f51d5";
    $("result-art").style.color=key==="chaos"?"#f1ca4c":"#f5eedf";
    result.scrollIntoView({behavior:"smooth",block:"nearest"});
    toast(story.toast);
  }
  function nextPage() {
    if(!selectedChoice){toast("PICK YOUR TIMELINE FIRST. THE LORE NEEDS A DIRECTION.");$("choose").scrollIntoView({behavior:"smooth"});return;}
    $("field-guide").scrollIntoView({behavior:"smooth",block:"start"});
    toast("CHARACTER FILES UNLOCKED. EXTREMELY BIASED SOURCES AHEAD.");
  }
  function resetComic() {
    selectedChoice=null;
    buttons.forEach(b=>{b.classList.remove("selected");b.setAttribute("aria-pressed","false")});
    $("choice-result").hidden=true;
    $("choice-result").className="choice-result";
    realNames=false;updateNames();
    $("cover").scrollIntoView({behavior:"smooth",block:"start"});
    toast("ISSUE 001 RESET. THE LORE REMAINS QUESTIONABLE.");
  }
  $("name-mode").addEventListener("click",()=>{realNames=!realNames;updateNames();});
  $("begin-story").addEventListener("click",()=>{$("chapter-one").scrollIntoView({behavior:"smooth",block:"start"});toast("TURN THE PAGE. LET THE NONSENSE BEGIN.");});
  buttons.forEach(b=>b.addEventListener("click",()=>chooseStory(b.dataset.choice)));
  $("next-page").addEventListener("click",nextPage);
  $("read-again").addEventListener("click",resetComic);
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener("click",e=>{
      const id=a.getAttribute("href").slice(1);
      const target=document.getElementById(id);
      if(target){e.preventDefault();target.scrollIntoView({behavior:"smooth",block:"start"});}
    });
  });
  document.addEventListener("keydown",e=>{
    if(e.key==="1"){chooseStory("chaos");}
    if(e.key==="2"){chooseStory("soft");}
  });
  updateNamesSilent();
  function updateNamesSilent(){
    realNames=false;
    document.querySelectorAll("[data-real][data-nick]").forEach(el=>el.textContent=el.dataset.nick);
    $("name-mode-label").textContent="NICKNAMES";
    $("name-mode").setAttribute("aria-pressed","false");
  }
})();