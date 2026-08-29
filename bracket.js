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
    const bracketDiv = document.getElementById("bracket");
    renderBracket(CURRENT_ROUNDS, bracketDiv);
    setupResetButton();
    return;
  }

  startNewTournament(entries);
}

function startNewTournament(entries) {
  const bracketDiv = document.getElementById("bracket");

  const shuffled = shuffle(entries.map((e, i) => ({
    id: i + 1,
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
  renderBracket(CURRENT_ROUNDS, bracketDiv);
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

function renderBracket(rounds, bracketDiv) {
  bracketDiv.innerHTML = "";

  let globalMatchCounter = 1;

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
        renderBracket(rounds, bracketDiv);
        saveTournament();
      };

      matchDiv.appendChild(btn);
      roundDiv.appendChild(matchDiv);
    });

    bracketDiv.appendChild(roundDiv);
  });

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
    img.src = `images/${winnerEntry.id}.jpg`;
    img.className = "entry-image";

    winnerDiv.appendChild(img);
    winnerRoundDiv.appendChild(winnerDiv);
  }

  bracketDiv.appendChild(winnerRoundDiv);
}

function createPlayerDiv(entry, matchDiv, slot) {
  const div = document.createElement("div");
  div.className = "player";

  const title = document.createElement("div");
  title.textContent = entry.name;
  div.appendChild(title);

  const img = document.createElement("img");
  img.src = `${entry.id}.jpg`;   // ← LOAD FROM MAIN FOLDER
  img.className = "entry-image";
  div.appendChild(img);

  div.dataset.name = entry.name || "";
  div.dataset.description = entry.description || "";
  div.dataset.youtube = entry.youtube || "";
  div.dataset.slot = slot;

  if (entry.status === "winner") div.classList.add("winner");
  if (entry.status === "loser") div.classList.add("loser");

  const arrow = document.createElement("span");
  arrow.className = "dropdown-arrow";
  arrow.textContent = "▶";

  arrow.onclick = (e) => {
    e.stopPropagation();
    toggleDetails(div, entry, arrow);
  };

  div.appendChild(arrow);

  div.onclick = (e) => {
    e.stopPropagation();
    matchDiv.querySelectorAll(".player").forEach(p => p.classList.remove("selected"));
    div.classList.add("selected");
  };

  return div;
}

function toggleDetails(div, entry, arrow) {
  const existing = div.querySelector(".entry-details");
  if (existing) {
    existing.remove();
    arrow.textContent = "▶";
    return;
  }

  arrow.textContent = "▼";

  const details = document.createElement("div");
  details.className = "entry-details";

  const descLines = (entry.description || "")
    .split("\n")
    .map(line => `<p>${line}</p>`)
    .join("");

  if (!entry.youtube) {
    details.innerHTML = `${descLines}<p>No video.</p>`;
  } else {
    let embedUrl = "";

    if (entry.youtube.includes("youtube.com/watch")) {
      const id = entry.youtube.split("v=")[1]?.split(/[&?]/)[0];
      embedUrl = `https://www.youtube.com/embed/${id}`;
    } else if (entry.youtube.includes("youtu.be/")) {
      const id = entry.youtube.split("youtu.be/")[1]?.split(/[?&]/)[0];
      embedUrl = `https://www.youtube.com/embed/${id}`;
    } else {
      embedUrl = null;
    }

    details.innerHTML = `
      ${descLines}
      ${
        embedUrl
          ? `<iframe src="${embedUrl}" allowfullscreen></iframe>`
          : `<p><a href="${entry.youtube}" target="_blank">${entry.youtube}</a></p>`
      }
    `;
  }

  div.appendChild(details);
}
