(() => {
  const clues = {
    photo: {
      id: "photo", exhibit: "EXHIBIT 01 / RECOVERED PHOTOGRAPH", title: "A rare kind of light",
      art: "☀", fragment: "S", item: "01 / PHOTOGRAPH",
      copy: "This tiny photograph came from an unusually ordinary Tuesday. The report says the light in the room changed the second the right person walked in. In the corner, someone has written the first fragment: S. It feels relevant."
    },
    tape: {
      id: "tape", exhibit: "EXHIBIT 02 / AUDIO EVIDENCE", title: "The laugh track",
      art: "♫", fragment: "T", item: "02 / CASSETTE",
      copy: "A recovered recording: a little giggling, a questionable opinion, and absolutely no useful information for the actual investigation. A note on the tape case says this is the next fragment: T. We are choosing to trust it."
    },
    note: {
      id: "note", exhibit: "EXHIBIT 03 / UNSIGNED FIELD NOTE", title: "Some people are the plot twist",
      art: "✎", fragment: "AR", item: "03 / FIELD NOTE",
      copy: "The last note is in handwriting that looks suspiciously familiar. It reads: “The best things rarely announce themselves. You notice them, then one day you realise they've become part of your favourite story.” Beneath it: final fragment AR."
    }
  };
  const found = new Set();
  const $ = (id) => document.getElementById(id);
  const clueModal = $("clue-modal");
  const letterModal = $("letter-modal");
  const toast = $("toast");
  let activeClue = null;
  let toastTimer = null;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }
  function openModal(modal) {
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    const close = modal.querySelector("[data-close]");
    if (close) close.focus();
  }
  function closeModal(modal) {
    modal.hidden = true;
    document.body.style.overflow = "";
  }
  function openClue(id) {
    const clue = clues[id];
    if (!clue) return;
    activeClue = clue;
    $("modal-exhibit").textContent = clue.exhibit;
    $("modal-art").textContent = clue.art;
    $("modal-title").textContent = clue.title;
    $("modal-copy").textContent = clue.copy;
    $("modal-letter").textContent = found.has(id) ? clue.fragment : "?";
    $("collect-clue").textContent = found.has(id) ? "EVIDENCE ALREADY COLLECTED ✓" : "COLLECT EVIDENCE +";
    $("collect-clue").disabled = found.has(id);
    $("collect-clue").style.opacity = found.has(id) ? ".55" : "1";
    openModal(clueModal);
  }
  function renderProgress() {
    const parts = [];
    ["photo", "tape", "note"].forEach(id => {
      const clue = clues[id];
      parts.push(found.has(id) ? clue.fragment : "_");
    });
    // The fragments intentionally combine as S + T + AR = STAR.
    const slotValues = [
      found.has("photo") ? "S" : "_",
      found.has("tape") ? "T" : "_",
      found.has("note") ? "A" : "_",
      found.has("note") ? "R" : "_"
    ];
    slotValues.forEach((value, index) => $("slot" + (index + 1)).textContent = value);
    $("progress").textContent = found.size + " / 3 EXHIBITS INSPECTED";
    $("collected").innerHTML = "";
    Object.values(clues).forEach(clue => {
      const tag = document.createElement("span");
      tag.className = found.has(clue.id) ? "done" : "";
      tag.textContent = found.has(clue.id) ? clue.item + " · " + clue.fragment : clue.item + " · PENDING";
      $("collected").appendChild(tag);
      const button = document.querySelector('[data-clue="' + clue.id + '"]');
      if (button) {
        button.classList.toggle("is-collected", found.has(clue.id));
        const badge = button.querySelector(".clue-badge");
        if (badge) badge.textContent = found.has(clue.id) ? "✓" : clue.id === "photo" ? "01" : clue.id === "tape" ? "02" : "03";
      }
    });
    if (found.size === 3) {
      $("lock-feedback").innerHTML = 'ALL FRAGMENTS RECOVERED: <span>THE FOUR-LETTER WORD IS READY.</span>';
      $("lock-icon").textContent = "✳";
      $("lock-icon").style.animation = "pulse 1.2s infinite";
    }
  }
  function burstConfetti() {
    const symbols = ["✳", "★", "✦", "♡", "✧"];
    for (let i = 0; i < 28; i++) {
      const bit = document.createElement("span");
      bit.textContent = symbols[i % symbols.length];
      bit.style.cssText = "position:fixed;z-index:60;left:" + (Math.random() * 100) + "vw;top:-24px;font-size:" + (12 + Math.random() * 20) + "px;color:" + (i % 2 ? "#e93b2f" : "#d3f35b") + ";pointer-events:none;transition:transform 1.6s cubic-bezier(.2,.8,.2,1),opacity 1.6s";
      document.body.appendChild(bit);
      requestAnimationFrame(() => {
        bit.style.transform = "translateY(" + (window.innerHeight + 60) + "px) rotate(" + (Math.random() * 720 - 360) + "deg)";
        bit.style.opacity = "0";
      });
      setTimeout(() => bit.remove(), 1800);
    }
  }

  document.querySelectorAll("[data-clue]").forEach(button => {
    button.addEventListener("click", () => openClue(button.dataset.clue));
  });
  $("collect-clue").addEventListener("click", () => {
    if (!activeClue || found.has(activeClue.id)) return;
    found.add(activeClue.id);
    const fragment = activeClue.fragment;
    const id = activeClue.id;
    closeModal(clueModal);
    renderProgress();
    showToast("EVIDENCE COLLECTED: " + fragment + " — " + id.toUpperCase());
    if (found.size === 3) {
      setTimeout(() => showToast("ALL THREE EXHIBITS RECOVERED. THE LOCKBOX IS READY."), 1250);
    }
  });
  document.querySelectorAll("[data-close]").forEach(button => {
    button.addEventListener("click", () => {
      const modal = button.closest(".modal-backdrop");
      if (modal) closeModal(modal);
    });
  });
  [clueModal, letterModal].forEach(modal => modal.addEventListener("click", e => {
    if (e.target === modal) closeModal(modal);
  }));
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      if (!clueModal.hidden) closeModal(clueModal);
      if (!letterModal.hidden) closeModal(letterModal);
    }
  });
  $("start-case").addEventListener("click", () => {
    $("investigation").scrollIntoView({ behavior: "smooth" });
    setTimeout(() => showToast("DETECTIVE, YOUR CASE IS NOW OPEN."), 500);
  });
  $("unlock-form").addEventListener("submit", e => {
    e.preventDefault();
    if (found.size < 3) {
      showToast("NOT SO FAST — INSPECT ALL THREE EXHIBITS FIRST.");
      $("evidence-board").scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const guess = $("secret-code").value.trim().toUpperCase().replace(/[^A-Z]/g, "");
    if (guess === "STAR") {
      $("lock-icon").textContent = "🔓";
      $("lock-icon").style.animation = "none";
      $("lock-feedback").innerHTML = 'ACCESS GRANTED: <span>CASE 011 IS SOLVED.</span>';
      $("unlock-small").textContent = "THE SEAL IS BROKEN. YOUR NOTE IS READY.";
      $("open-letter").disabled = false;
      $("open-letter").innerHTML = 'OPEN THE SEALED NOTE <span>↗</span>';
      $("secret-code").value = "STAR";
      $("secret-code").disabled = true;
      e.submitter.disabled = true;
      e.submitter.textContent = "DECODED ✓";
      burstConfetti();
      showToast("CORRECT. CASE 011 IS NOW OFFICIALLY CLOSED.");
      $("closing").scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      $("lock-feedback").innerHTML = 'ACCESS DENIED: <span>THAT WORD DOESN’T FIT THE EVIDENCE.</span>';
      $("secret-code").select();
      showToast("HMM. CHECK THE FRAGMENTS ON YOUR EVIDENCE BOARD.");
    }
  });
  $("open-letter").addEventListener("click", () => {
    if ($("open-letter").disabled) return;
    openModal(letterModal);
    burstConfetti();
  });
  $("reset-case").addEventListener("click", () => {
    found.clear();
    activeClue = null;
    $("secret-code").disabled = false;
    $("secret-code").value = "";
    const submit = $("unlock-form").querySelector('button[type="submit"]');
    submit.disabled = false;
    submit.textContent = "DECODE ↗";
    $("open-letter").disabled = true;
    $("open-letter").innerHTML = 'OPEN THE SEALED NOTE <span>↗</span>';
    $("unlock-small").textContent = "THE NOTE IS SEALED UNTIL THE CASE IS SOLVED.";
    $("lock-icon").textContent = "▣";
    $("lock-icon").style.animation = "none";
    $("lock-feedback").innerHTML = 'CASE PROGRESS: <span id="progress">0 / 3 EXHIBITS INSPECTED</span>';
    renderProgress();
    closeModal(clueModal);
    closeModal(letterModal);
    showToast("INVESTIGATION RESET. A FRESH CASE FILE IS READY.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  renderProgress();
})();