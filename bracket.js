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

  const roundDivs = [];

  rounds.forEach((round, rIndex) => {
    const roundDiv = document.createElement("div");
    roundDiv.className = "round";

    const title = document.createElement("div");
    title.className = "round-title";
    title.textContent = ROUND_NAMES[rIndex];
    roundDiv.appendChild(title);

    round.matches.forEach((match, mIndex) => {
      const matchDiv = createMatchDiv(match, rIndex, mIndex);
      roundDiv.appendChild(matchDiv);

      if (mIndex < round.matches.length - 1) {
        const spacer = document.createElement("div");
        spacer.className = "spacer";
        roundDiv.appendChild(spacer);
      }
    });

    bracketDiv.appendChild(roundDiv);
    roundDivs.push(roundDiv);
  });

  alignRounds(roundDivs);
}

function alignRounds(roundDivs) {
  for (let r = 1; r < roundDivs.length; r++) {
    const prevRound = roundDivs[r - 1];
    const currRound = roundDivs[r];

    const prevMatches = [...prevRound.querySelectorAll(".match")];
    const currMatches = [...currRound.querySelectorAll(".match")];

    currMatches.forEach((matchDiv, i) => {
      const parent1 = prevMatches[i * 2];
      const parent2 = prevMatches[i * 2 + 1];

      const mid = (parent1.offsetTop + parent2.offsetTop) / 2;

      matchDiv.style.marginTop = `${mid - matchDiv.offsetTop}px`;
    });
  }
}

function createMatchDiv(match, rIndex, mIndex) {
  const matchDiv = document.createElement("div");
  matchDiv.className = "match";

  const title = document.createElement("div");
  title.className = "match-title";
  title.textContent = `Match ${rIndex * 1000 + mIndex}`;
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

    const winner = selected.dataset.slot === "p1" ? match.p1 : match.p2;
    const loser = selected.dataset.slot === "p1" ? match.p2 : match.p1;

    winner.status = "winner";
    loser.status = "loser";

    const nextRound = CURRENT_ROUNDS[rIndex + 1]?.entries;
    if (nextRound && nextRound[mIndex]) {
      nextRound[mIndex] = { ...winner, status: "none" };
    }

    buildMatches(CURRENT_ROUNDS);
    renderBracket(CURRENT_ROUNDS);
    saveTournament();
  };

  matchDiv.appendChild(btn);

  return matchDiv;
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

  div.onclick = () => {
    matchDiv.querySelectorAll(".player").forEach(p => p.classList.remove("selected"));
    div.classList.add("selected");
  };

  return div;
}
