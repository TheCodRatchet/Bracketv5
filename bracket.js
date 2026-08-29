let ORIGINAL_ENTRIES = [];
let CURRENT_ROUNDS = [];

const ROUND_NAMES = [
  "Round of 256",
  "Round of 128",
  "Round of 64",
  "Round of 32",
  "Round of 16",
  "Quarterfinals",
  "Semifinals",
  "Final"
];

function initBracket(entries) {
  ORIGINAL_ENTRIES = JSON.parse(JSON.stringify(entries));

  const saved = localStorage.getItem("tournamentState");

  if (saved) {
    CURRENT_ROUNDS = JSON.parse(saved);
    buildMatches(CURRENT_ROUNDS);
    renderBracket(CURRENT_ROUNDS);
    setupResetButton();
    return;
  }

  startNewTournament(entries);
}

function startNewTournament(entries) {
  const shuffled = shuffle(entries.map(e => ({
    ...e,
    status: "none"
  })));

  const rounds = [];
  let current = shuffled;

  while (current.length > 2) {
    const nextRoundSize = Math.ceil(current.length / 2);

    const nextRound = new Array(nextRoundSize).fill(null).map((_, idx) => ({
      id: -idx - 1,
      name: "TBD",
      description: "",
      youtube: "",
      status: "none"
    }));

    rounds.push({ entries: current, next: nextRound });
    current = nextRound;
  }

  rounds.push({ entries: current, next: [] });

  CURRENT_ROUNDS = rounds;

  buildMatches(CURRENT_ROUNDS);
  renderBracket(CURRENT_ROUNDS);
  saveTournament();
  setupResetButton();
}

function saveTournament() {
  localStorage.setItem("tournamentState", JSON.stringify(CURRENT_ROUNDS));
}

function setupResetButton() {
  document.getElementById("resetBtn").onclick = () => {
    localStorage.removeItem("tournamentState");
    CURRENT_ROUNDS = [];
    document.getElementById("bracket").innerHTML = "";
    startNewTournament(JSON.parse(JSON.stringify(ORIGINAL_ENTRIES)));
  };
}

function shuffle(arr) {
  let a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildMatches(rounds) {
  rounds.forEach((round) => {
    const list = round.entries;
    const matches = [];

    for (let i = 0; i < list.length; i += 2) {
      const p1 = list[i];
      const p2 = list[i + 1] || {
        id: null,
        name: "TBD",
        description: "",
        youtube: "",
        status: "none"
      };

      matches.push({ p1, p2 });
    }

    round.matches = matches;
  });
}

function renderBracket(rounds) {
  const bracketDiv = document.getElementById("bracket");
  bracketDiv.innerHTML = "";

  let globalMatchCounter = 1;
  const roundDivs = [];

  rounds.forEach((round, rIndex) => {
    const roundDiv = document.createElement("div");
    roundDiv.className = "round";

    const roundTitle = document.createElement("div");
    roundTitle.className = "round-title";
    roundTitle.textContent = ROUND_NAMES[rIndex];
    roundDiv.appendChild(roundTitle);

    round.matches.forEach((match, mIndex) => {
      const matchDiv = document.createElement("div");
      matchDiv.className = "match";
      matchDiv.dataset.matchIndex = mIndex;

      const title = document.createElement("div");
      title.className = "match-title";
      title.textContent = `Match ${globalMatchCounter++}`;
      matchDiv.appendChild(title);

      const p1Div = createPlayerDiv(match.p1, matchDiv, "p1");
      const p2Div = createPlayerDiv(match.p2, matchDiv, "p2");

      matchDiv.appendChild(p1Div);
      matchDiv.appendChild(p2Div);

      const btn = document.createElement("button");
      btn.className = "advance-btn";
      btn.textContent = "Advance Winner";

      btn.onclick = () => {
        const selected = matchDiv.querySelector(".player.selected");
        if (!selected) return;

        const selectedSlot = selected.dataset.slot;
        const winner = selectedSlot === "p1" ? match.p1 : match.p2;
        const loser = selectedSlot === "p1" ? match.p2 : match.p1;

        winner.status = "winner";
        loser.status = "loser";

        const nextRound = rounds[rIndex + 1]?.entries;
        if (nextRound && nextRound[mIndex]) {
          nextRound[mIndex] = { ...winner, status: "none" };
        }

        buildMatches(rounds);
        renderBracket(rounds);
        saveTournament();
      };

      matchDiv.appendChild(btn);
      roundDiv.appendChild(matchDiv);
    });

    bracketDiv.appendChild(roundDiv);
    roundDivs.push(roundDiv);
  });

  centerAfterLayout(roundDivs);

  const finalRound = rounds[rounds.length - 1];
  const winnerEntry = finalRound.entries.find(e => e.status === "winner");

  const winnerRoundDiv = document.createElement("div");
  winnerRoundDiv.className = "round";

  const winnerTitle = document.createElement("div");
  winnerTitle.className = "round-title";
  winnerTitle.textContent = "Winner";
  winnerRoundDiv.appendChild(winnerTitle);

  if (winnerEntry) {
    const winnerDiv = document.createElement("div");
    winnerDiv.className = "player winner";
    winnerDiv.textContent = winnerEntry.name;

    const img = document.createElement("img");
    img.src = `${winnerEntry.id}.jpg`;
    img.className = "entry-image";

    winnerDiv.appendChild(img);
    winnerRoundDiv.appendChild(winnerDiv);
  }

  bracketDiv.appendChild(winnerRoundDiv);
}

function centerAfterLayout(roundDivs) {
  const imgs = document.querySelectorAll("img");

  let loaded = 0;
  const total = imgs.length;

  const runCentering = () => {
    requestAnimationFrame(() => {
      applyCentering(roundDivs);
    });
  };

  if (total === 0) {
    runCentering();
    return;
  }

  imgs.forEach(img => {
    if (img.complete) {
      loaded++;
      if (loaded === total) runCentering();
    } else {
      img.onload = () => {
        loaded++;
        if (loaded === total) runCentering();
      };
      img.onerror = () => {
        loaded++;
        if (loaded === total) runCentering();
      };
    }
  });
}

function applyCentering(roundDivs) {
  for (let r = 1; r < roundDivs.length; r++) {
    const prevRound = roundDivs[r - 1];
    const currRound = roundDivs[r];

    const prevMatches = [...prevRound.querySelectorAll(".match")];
    const currMatches = [...currRound.querySelectorAll(".match")];

    currMatches.forEach((matchDiv, i) => {
      const parent1 = prevMatches[i * 2];
      const parent2 = prevMatches[i * 2 + 1];

      if (!parent1 || !parent2) return;

      const mid = (parent1.offsetTop + parent2.offsetTop) / 2;
      const currentTop = matchDiv.offsetTop;

      const offset = mid - currentTop;

      matchDiv.style.marginTop = `${offset}px`;
    });
  }
}

function createPlayerDiv(entry, matchDiv, slot) {
  const div = document.createElement("div");
  div.className = "player";

  const title = document.createElement("div");
  title.textContent = entry.name;
  div.appendChild(title);

  const img = document.createElement("img");
  img.src = `${entry.id}.jpg`;
  img.className = "entry-image";
  div.appendChild(img);

  div.dataset.slot = slot;

  if (entry.status === "winner") {
    div.classList.add("winner");
  } else if (entry.status === "loser") {
    div.classList.add("loser");
  }

  div.onclick = () => {
    matchDiv.querySelectorAll(".player").forEach(p => p.classList.remove("selected"));
    div.classList.add("selected");
  };

  return div;
}
