"use strict";

/* Reads the progress saved by the game and renders it as a log. This page never
   writes progress; the only change it can make is clearing it outright. */

const state = loadState();

const elements = {
  statCards: document.querySelector("#statCards"),
  logPanel: document.querySelector("#logPanel"),
  emptyState: document.querySelector("#emptyState"),
  missionLogBody: document.querySelector("#missionLogBody"),
  totalAttempts: document.querySelector("#totalAttempts"),
  totalTime: document.querySelector("#totalTime"),
  totalHints: document.querySelector("#totalHints"),
  totalStars: document.querySelector("#totalStars"),
  totalScore: document.querySelector("#totalScore"),
  clearProgressButton: document.querySelector("#clearProgressButton"),
};

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function isComplete(index) {
  return state.completed.includes(index);
}

function isUnlocked(index) {
  return index === 0 || isComplete(index - 1);
}

/* The Flexbox properties a mission actually requires: the ones it exposes whose
   answer differs from the value the property would take on its own. */
function requiredProperties(mission) {
  const container = mission.controls.filter(
    (key) => (mission.solution[key] ?? CONTAINER_CONTROLS[key].fallback) !== CONTAINER_CONTROLS[key].fallback,
  );
  const items = (mission.itemControls ?? []).filter((key) =>
    (mission.itemSolution ?? []).some((values) => values?.[key] !== undefined),
  );
  return [...container, ...items];
}

function buildCard(label, value, detail) {
  const card = document.createElement("li");
  const title = document.createElement("span");
  const figure = document.createElement("strong");
  const note = document.createElement("span");

  title.className = "stat-card-label";
  title.textContent = label;
  figure.className = "stat-card-value";
  figure.textContent = value;
  note.className = "stat-card-note";
  note.textContent = detail;

  card.className = "stat-card";
  card.append(title, figure, note);
  return card;
}

function renderCards() {
  const cleared = state.completed.length;
  const attempts = sum(state.attempts);
  const clearedAttempts = state.attempts.filter((_, index) => isComplete(index));
  const averageAttempts = cleared === 0 ? 0 : sum(clearedAttempts) / cleared;
  const fastest = state.solveTimes.filter((time, index) => isComplete(index) && time > 0);

  elements.statCards.replaceChildren(
    buildCard("Cleared", `${cleared} / ${missions.length}`, `${missions.length - cleared} remaining`),
    buildCard("Score", String(sum(state.scores)), `max ${missions.length * 120}`),
    buildCard("Stars", `${sum(state.stars)} / ${missions.length * 3}`, "three per mission"),
    buildCard("Time", formatDuration(sum(state.solveTimes)), fastest.length === 0 ? "no solves" : `best ${formatDuration(Math.min(...fastest))}`),
    buildCard("Attempts", String(attempts), cleared === 0 ? "none yet" : `${averageAttempts.toFixed(1)} average`),
    buildCard("Hints", String(sum(state.hints)), `${sum(state.hints) * HINT_COST} points spent`),
  );
}

function appendCell(row, text, className) {
  const cell = document.createElement("td");
  cell.textContent = text;
  if (className) {
    cell.className = className;
  }
  row.append(cell);
}

function renderTable() {
  elements.missionLogBody.replaceChildren(
    ...missions.map((mission, index) => {
      const row = document.createElement("tr");
      const header = document.createElement("th");
      const complete = isComplete(index);

      header.scope = "row";
      header.textContent = String(index + 1);
      row.append(header);
      row.classList.toggle("is-cleared", complete);

      appendCell(row, mission.title);
      appendCell(row, requiredProperties(mission).join(", "), "properties");
      appendCell(row, complete ? "Cleared" : isUnlocked(index) ? "Unlocked" : "Locked");
      appendCell(row, String(state.attempts[index]));
      appendCell(row, complete ? formatDuration(state.solveTimes[index]) : "—");
      appendCell(row, String(state.hints[index]));
      appendCell(row, complete ? renderStars(state.stars[index]) : "—", "stars");
      appendCell(row, complete ? String(state.scores[index]) : "—");
      return row;
    }),
  );

  elements.totalAttempts.textContent = String(sum(state.attempts));
  elements.totalTime.textContent = formatDuration(sum(state.solveTimes));
  elements.totalHints.textContent = String(sum(state.hints));
  elements.totalStars.textContent = `${sum(state.stars)} / ${missions.length * 3}`;
  elements.totalScore.textContent = String(sum(state.scores));
}

function clearProgress() {
  if (!window.confirm("Clear every completed mission, score, and attempt?")) {
    return;
  }
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* Nothing to clear when storage is unavailable. */
  }
  window.location.reload();
}

const nothingRecorded = state.completed.length === 0 && sum(state.attempts) === 0;
elements.emptyState.hidden = !nothingRecorded;
elements.logPanel.hidden = nothingRecorded;
elements.clearProgressButton.disabled = nothingRecorded;

renderCards();
if (!nothingRecorded) {
  renderTable();
}

elements.clearProgressButton.addEventListener("click", clearProgress);
