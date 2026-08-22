"use strict";

/* ------------------------------------------------------------------ config */

const BOARD_WIDTH = 640;
const BOARD_HEIGHT = 360;
const MIN_BOARD_SCALE = 0.4;

/* A ship counts as docked when it sits within this many board pixels of its beacon. */
const MATCH_TOLERANCE_PX = 1.5;

/* ---------------------------------------------------------------- elements */

const elements = {
  missionNav: document.querySelector("#missionNav"),
  missionNumber: document.querySelector("#missionNumber"),
  missionDifficulty: document.querySelector("#missionDifficulty"),
  missionTitle: document.querySelector("#missionTitle"),
  missionInstruction: document.querySelector("#missionInstruction"),
  missionTip: document.querySelector("#missionTip"),
  controlForm: document.querySelector("#controlForm"),
  containerControls: document.querySelector("#containerControls"),
  itemFieldset: document.querySelector("#itemFieldset"),
  itemControls: document.querySelector("#itemControls"),
  codePreview: document.querySelector("#codePreview"),
  resetButton: document.querySelector("#resetButton"),
  hintButton: document.querySelector("#hintButton"),
  nextButton: document.querySelector("#nextButton"),
  feedback: document.querySelector("#feedback"),
  attemptCount: document.querySelector("#attemptCount"),
  missionTimer: document.querySelector("#missionTimer"),
  hintCount: document.querySelector("#hintCount"),
  missionStars: document.querySelector("#missionStars"),
  progressText: document.querySelector("#progressText"),
  progressTrack: document.querySelector("#progressTrack"),
  headerScore: document.querySelector("#headerScore"),
  headerStars: document.querySelector("#headerStars"),
  headerCompleted: document.querySelector("#headerCompleted"),
  headerTotal: document.querySelector("#headerTotal"),
  boardScroll: document.querySelector(".board-scroll"),
  boardStage: document.querySelector("#boardStage"),
  scaleNote: document.querySelector("#scaleNote"),
  playfield: document.querySelector("#playfield"),
  targetLayer: document.querySelector("#targetLayer"),
  fleetLayer: document.querySelector("#fleetLayer"),
  completionPanel: document.querySelector("#completionPanel"),
  completionSummary: document.querySelector("#completionSummary"),
  restartButton: document.querySelector("#restartButton"),
  clearProgressButton: document.querySelector("#clearProgressButton"),
};

/* ------------------------------------------------------------------- state */

function defaultContainerValues(mission) {
  const values = {};
  mission.controls.forEach((key) => {
    values[key] = CONTAINER_CONTROLS[key].fallback;
  });
  return values;
}

function defaultItemValues(mission) {
  const keys = mission.itemControls ?? [];
  return Array.from({ length: mission.count }, () => {
    const values = {};
    keys.forEach((key) => {
      values[key] = ITEM_CONTROLS[key].fallback;
    });
    return values;
  });
}

let state = loadState();
let boardScale = 1;
let timerHandle = null;
let activeSince = null;

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* The game stays fully playable when storage is unavailable. */
  }
}

function isMissionComplete(index) {
  return state.completed.includes(index);
}

function isMissionUnlocked(index) {
  return index === 0 || isMissionComplete(index - 1);
}

function getFirstIncompleteMission() {
  const index = missions.findIndex((_, missionIndex) => !isMissionComplete(missionIndex));
  return index === -1 ? missions.length - 1 : index;
}

function normalizeCurrentMission() {
  if (
    !Number.isInteger(state.currentMission) ||
    state.currentMission < 0 ||
    state.currentMission >= missions.length ||
    !isMissionUnlocked(state.currentMission)
  ) {
    state.currentMission = getFirstIncompleteMission();
  }
}

/* ---------------------------------------------------------------- controls */

function buildSelect(name, labelText, definition, value) {
  const label = document.createElement("label");
  const caption = document.createElement("span");
  const select = document.createElement("select");

  caption.textContent = labelText;
  select.dataset.control = name;
  select.name = name;

  definition.options.forEach((option) => {
    const element = document.createElement("option");
    element.value = option;
    element.textContent = option;
    select.append(element);
  });

  select.value = value;
  label.append(caption, select);
  return label;
}

function renderControls(mission, containerValues, itemValues) {
  elements.containerControls.replaceChildren(
    ...mission.controls.map((key) =>
      buildSelect(`container:${key}`, key, CONTAINER_CONTROLS[key], containerValues[key]),
    ),
  );

  const itemKeys = mission.itemControls ?? [];
  elements.itemFieldset.hidden = itemKeys.length === 0;
  elements.itemControls.replaceChildren();

  if (itemKeys.length === 0) {
    return;
  }

  itemKeys.forEach((key) => {
    for (let index = 0; index < mission.count; index += 1) {
      elements.itemControls.append(
        buildSelect(
          `item:${key}:${index}`,
          `${mission.icons[index]} ship ${index + 1} · ${key}`,
          ITEM_CONTROLS[key],
          itemValues[index][key],
        ),
      );
    }
  });
}

function readControls(mission) {
  const container = {};
  mission.controls.forEach((key) => {
    container[key] = elements.controlForm.querySelector(`[data-control="container:${key}"]`).value;
  });

  const itemKeys = mission.itemControls ?? [];
  const items = Array.from({ length: mission.count }, (_, index) => {
    const values = {};
    itemKeys.forEach((key) => {
      values[key] = elements.controlForm.querySelector(`[data-control="item:${key}:${index}"]`).value;
    });
    return values;
  });

  return { container, items };
}

/* A mission only exposes some properties. Every other property keeps the value
   the mission was designed with, so the beacons and the fleet always agree. */
function resolveContainer(mission, chosen) {
  const resolved = {};
  Object.keys(CONTAINER_CONTROLS).forEach((key) => {
    resolved[key] = chosen[key] ?? mission.solution[key] ?? CONTAINER_CONTROLS[key].fallback;
  });
  return resolved;
}

function resolveItems(mission, chosen) {
  const solution = mission.itemSolution ?? [];
  return Array.from({ length: mission.count }, (_, index) => {
    const resolved = {};
    Object.keys(ITEM_CONTROLS).forEach((key) => {
      resolved[key] = chosen[index]?.[key] ?? solution[index]?.[key] ?? ITEM_CONTROLS[key].fallback;
    });
    return resolved;
  });
}

function applyContainer(layer, values) {
  Object.entries(CONTAINER_CONTROLS).forEach(([key, definition]) => {
    layer.style[definition.styleProperty] = values[key];
  });
}

function applyItems(layer, values) {
  Array.from(layer.children).forEach((child, index) => {
    Object.entries(ITEM_CONTROLS).forEach(([key, definition]) => {
      child.style[definition.styleProperty] = values[index][key];
    });
  });
}

/* ----------------------------------------------------------------- preview */

function updateCodePreview(mission, container, items) {
  const lines = ["display: flex;"];

  Object.keys(CONTAINER_CONTROLS).forEach((key) => {
    const value = container[key];
    const exposed = mission.controls.includes(key);
    if (exposed || value !== CONTAINER_CONTROLS[key].fallback) {
      lines.push(`${key}: ${value};`);
    }
  });

  const itemKeys = mission.itemControls ?? [];
  itemKeys.forEach((key) => {
    items.forEach((values, index) => {
      if (values[key] !== ITEM_CONTROLS[key].fallback) {
        lines.push("", `.ship:nth-child(${index + 1}) {`, `  ${key}: ${values[key]};`, "}");
      }
    });
  });

  elements.codePreview.textContent = lines.join("\n");
}

/* ------------------------------------------------------------------- board */

function renderBoard(mission) {
  const docks = [];
  const ships = [];

  for (let index = 0; index < mission.count; index += 1) {
    const dock = document.createElement("div");
    dock.className = "dock";
    dock.textContent = String(index + 1);
    docks.push(dock);

    const ship = document.createElement("li");
    ship.className = "ship";
    ship.textContent = mission.icons[index];
    ship.setAttribute("aria-label", `Spacecraft ${index + 1}`);
    ships.push(ship);
  }

  elements.targetLayer.replaceChildren(...docks);
  elements.fleetLayer.replaceChildren(...ships);

  [elements.targetLayer, elements.fleetLayer].forEach((layer) => {
    layer.style.setProperty("--unit-width", `${mission.unitWidth}px`);
    layer.style.setProperty("--unit-height", `${mission.unitHeight}px`);
  });

  applyContainer(elements.targetLayer, resolveContainer(mission, mission.solution));
  applyItems(elements.targetLayer, resolveItems(mission, mission.itemSolution ?? []));
}

function updateBoard() {
  const mission = missions[state.currentMission];
  const chosen = readControls(mission);
  const container = resolveContainer(mission, chosen.container);
  const items = resolveItems(mission, chosen.items);

  applyContainer(elements.fleetLayer, container);
  applyItems(elements.fleetLayer, items);
  updateCodePreview(mission, container, items);
  elements.playfield.classList.remove("is-success", "is-error");
}

function updateBoardScale() {
  const available = elements.boardScroll.clientWidth;
  const fitted = available > 0 ? available / BOARD_WIDTH : 1;
  boardScale = Math.max(MIN_BOARD_SCALE, Math.min(1, fitted));

  elements.boardStage.style.setProperty("--board-scale", String(boardScale));
  elements.boardStage.style.height = `${Math.round(BOARD_HEIGHT * boardScale)}px`;
  elements.scaleNote.textContent =
    boardScale === 1
      ? `The mission board is always ${BOARD_WIDTH} × ${BOARD_HEIGHT}.`
      : `The mission board is always ${BOARD_WIDTH} × ${BOARD_HEIGHT}, shown here at ${Math.round(boardScale * 100)}% so the whole field fits. Every solution stays identical.`;
}

/* Positions are read relative to the board and divided by the display scale,
   so a measurement means the same thing on a phone and on a desktop. */
function measureLayer(layer) {
  const board = elements.playfield.getBoundingClientRect();
  return Array.from(layer.children).map((child) => {
    const rect = child.getBoundingClientRect();
    return {
      x: (rect.left - board.left) / boardScale,
      y: (rect.top - board.top) / boardScale,
      width: rect.width / boardScale,
      height: rect.height / boardScale,
    };
  });
}

function isDocked() {
  const ships = measureLayer(elements.fleetLayer);
  const docks = measureLayer(elements.targetLayer);

  return (
    ships.length === docks.length &&
    ships.every((ship, index) => {
      const dock = docks[index];
      return (
        Math.abs(ship.x - dock.x) <= MATCH_TOLERANCE_PX &&
        Math.abs(ship.y - dock.y) <= MATCH_TOLERANCE_PX &&
        Math.abs(ship.width - dock.width) <= MATCH_TOLERANCE_PX &&
        Math.abs(ship.height - dock.height) <= MATCH_TOLERANCE_PX
      );
    })
  );
}

/* ------------------------------------------------------------------- score */

function starsFor(attempts, hints) {
  if (attempts <= 1 && hints === 0) {
    return 3;
  }
  if (attempts <= 3 && hints <= 1) {
    return 2;
  }
  return 1;
}

function speedBonus(milliseconds) {
  if (milliseconds < FAST_SOLVE_MS) {
    return FAST_BONUS;
  }
  return milliseconds < STEADY_SOLVE_MS ? STEADY_BONUS : 0;
}

function scoreFor(attempts, hints, milliseconds) {
  const base = Math.max(MIN_ATTEMPT_SCORE, 100 - (attempts - 1) * ATTEMPT_PENALTY);
  return Math.max(MIN_SCORE, base + speedBonus(milliseconds) - hints * HINT_COST);
}

/* ------------------------------------------------------------------- timer */

function currentElapsed(index) {
  const running = activeSince === null ? 0 : performance.now() - activeSince;
  return state.elapsed[index] + running;
}

function renderTimer() {
  const index = state.currentMission;
  const value = isMissionComplete(index) ? state.solveTimes[index] : currentElapsed(index);
  elements.missionTimer.textContent = formatDuration(value);
}

function stopTimer() {
  if (activeSince !== null) {
    state.elapsed[state.currentMission] += performance.now() - activeSince;
    activeSince = null;
  }
  if (timerHandle !== null) {
    window.clearInterval(timerHandle);
    timerHandle = null;
  }
}

function startTimer() {
  stopTimer();
  if (isMissionComplete(state.currentMission)) {
    return;
  }
  activeSince = performance.now();
  timerHandle = window.setInterval(renderTimer, 1000);
}

/* --------------------------------------------------------------- rendering */

function setFeedback(type, message) {
  elements.feedback.className = `feedback feedback-${type}`;
  elements.feedback.textContent = message;
}

function renderNavigation() {
  elements.missionNav.replaceChildren(
    ...missions.map((mission, index) => {
      const button = document.createElement("button");
      const complete = isMissionComplete(index);
      const unlocked = isMissionUnlocked(index);

      button.type = "button";
      button.textContent = complete ? "✓" : String(index + 1);
      button.classList.toggle("current", index === state.currentMission);
      button.classList.toggle("complete", complete);
      button.disabled = !unlocked;
      button.setAttribute(
        "aria-label",
        `Mission ${index + 1}: ${mission.title}${
          complete ? `, complete, ${state.stars[index]} of 3 stars` : unlocked ? "" : ", locked"
        }`,
      );
      if (index === state.currentMission) {
        button.setAttribute("aria-current", "step");
      }
      button.addEventListener("click", () => loadMission(index));
      return button;
    }),
  );
}

function updateSummary() {
  const completedCount = state.completed.length;
  const totalScore = state.scores.reduce((total, value) => total + value, 0);
  const totalStars = state.stars.reduce((total, value) => total + value, 0);

  elements.headerScore.textContent = String(totalScore);
  elements.headerStars.textContent = String(totalStars);
  elements.headerCompleted.textContent = String(completedCount);
  elements.headerTotal.textContent = String(missions.length);
  elements.progressText.textContent = `${completedCount} of ${missions.length} complete`;
  elements.progressTrack.max = missions.length;
  elements.progressTrack.value = completedCount;
  elements.progressTrack.textContent = `${completedCount} of ${missions.length} complete`;

  const allComplete = completedCount === missions.length;
  elements.completionPanel.hidden = !allComplete;
  if (allComplete) {
    elements.completionSummary.textContent = `Final score: ${totalScore} points and ${totalStars} of ${
      missions.length * 3
    } stars across ${missions.length} missions. Revisit any mission or begin a fresh run.`;
  }
}

function updateMissionStats() {
  const index = state.currentMission;
  const complete = isMissionComplete(index);

  elements.attemptCount.textContent = String(state.attempts[index]);
  elements.hintCount.textContent = String(state.hints[index]);
  elements.missionStars.textContent = complete ? renderStars(state.stars[index]) : "☆☆☆";
  elements.missionStars.setAttribute(
    "aria-label",
    complete ? `${state.stars[index]} of 3 stars` : "Not cleared yet",
  );
  renderTimer();
}

/* ----------------------------------------------------------------- actions */

function loadMission(index) {
  if (!isMissionUnlocked(index)) {
    return;
  }

  stopTimer();
  state.currentMission = index;

  const mission = missions[index];
  const stored = state.saved[index];
  const containerValues = { ...defaultContainerValues(mission), ...(stored?.container ?? {}) };
  const itemValues = defaultItemValues(mission).map((values, itemIndex) => ({
    ...values,
    ...(stored?.items?.[itemIndex] ?? {}),
  }));

  elements.missionNumber.textContent = `Mission ${index + 1} of ${missions.length}`;
  elements.missionDifficulty.textContent = mission.difficulty;
  elements.missionTitle.textContent = mission.title;
  elements.missionInstruction.textContent = mission.instruction;
  elements.missionTip.textContent = `Tip: ${mission.tip}`;
  elements.nextButton.textContent = index === missions.length - 1 ? "Finish route →" : "Next mission →";
  elements.nextButton.disabled = !isMissionComplete(index);
  elements.hintButton.disabled = isMissionComplete(index);
  elements.playfield.classList.remove("is-success", "is-error");

  renderBoard(mission);
  renderControls(mission, containerValues, itemValues);
  updateBoard();

  setFeedback(
    isMissionComplete(index) ? "success" : "neutral",
    isMissionComplete(index)
      ? "Mission already cleared. Replay the formation or continue to the next mission."
      : "Match each ship with a glowing beacon, then check your docking.",
  );

  renderNavigation();
  updateMissionStats();
  updateSummary();
  startTimer();
  saveState();
}

function rememberControls() {
  const mission = missions[state.currentMission];
  state.saved[state.currentMission] = readControls(mission);
}

function handleControlChange() {
  updateBoard();
  rememberControls();
  saveState();
}

function findFirstDifference(mission, chosen) {
  const containerKey = mission.controls.find(
    (key) => chosen.container[key] !== (mission.solution[key] ?? CONTAINER_CONTROLS[key].fallback),
  );
  if (containerKey) {
    return {
      label: containerKey,
      value: mission.solution[containerKey] ?? CONTAINER_CONTROLS[containerKey].fallback,
    };
  }

  const itemKeys = mission.itemControls ?? [];
  for (const key of itemKeys) {
    for (let index = 0; index < mission.count; index += 1) {
      const target = mission.itemSolution?.[index]?.[key] ?? ITEM_CONTROLS[key].fallback;
      if (chosen.items[index][key] !== target) {
        return { label: `${key} on ship ${index + 1}`, value: target };
      }
    }
  }

  return null;
}

function revealHint() {
  const index = state.currentMission;
  if (isMissionComplete(index)) {
    return;
  }

  const mission = missions[index];
  const difference = findFirstDifference(mission, readControls(mission));

  if (!difference) {
    setFeedback("neutral", "Your controls already match a working solution — press Check docking.");
    return;
  }

  state.hints[index] += 1;
  setFeedback("hint", `Hint: set ${difference.label} to ${difference.value}. (−${HINT_COST} points)`);
  updateMissionStats();
  saveState();
}

function countMisplacedShips() {
  const ships = measureLayer(elements.fleetLayer);
  const docks = measureLayer(elements.targetLayer);
  return ships.filter((ship, index) => {
    const dock = docks[index];
    return (
      Math.abs(ship.x - dock.x) > MATCH_TOLERANCE_PX || Math.abs(ship.y - dock.y) > MATCH_TOLERANCE_PX
    );
  }).length;
}

function checkSolution(event) {
  event.preventDefault();

  const index = state.currentMission;
  const alreadyComplete = isMissionComplete(index);

  state.attempts[index] += 1;

  if (!isDocked()) {
    const misplaced = countMisplacedShips();
    elements.playfield.classList.remove("is-success");
    elements.playfield.classList.add("is-error");
    window.setTimeout(() => elements.playfield.classList.remove("is-error"), 420);
    setFeedback(
      "error",
      `${misplaced} ${misplaced === 1 ? "ship is" : "ships are"} still away from a beacon. Adjust the controls and try again.`,
    );
    updateMissionStats();
    updateSummary();
    saveState();
    return;
  }

  stopTimer();
  const solveTime = state.elapsed[index];
  const earned = scoreFor(state.attempts[index], state.hints[index], solveTime);
  const stars = starsFor(state.attempts[index], state.hints[index]);

  if (!alreadyComplete) {
    state.completed.push(index);
    state.completed.sort((left, right) => left - right);
    state.solveTimes[index] = solveTime;
    state.scores[index] = earned;
    state.stars[index] = stars;
  } else if (earned > state.scores[index]) {
    state.scores[index] = earned;
    state.stars[index] = Math.max(state.stars[index], stars);
    state.solveTimes[index] = Math.min(state.solveTimes[index], solveTime);
  }

  elements.playfield.classList.remove("is-error");
  elements.playfield.classList.add("is-success");
  elements.nextButton.disabled = false;
  elements.hintButton.disabled = true;

  setFeedback(
    "success",
    alreadyComplete
      ? "Perfect docking. This mission stays complete."
      : `Docking confirmed in ${formatDuration(solveTime)} — ${earned} points, ${renderStars(stars)}. The next route is unlocked.`,
  );

  renderNavigation();
  updateMissionStats();
  updateSummary();
  saveState();
}

function resetMission() {
  const mission = missions[state.currentMission];
  renderControls(mission, defaultContainerValues(mission), defaultItemValues(mission));
  updateBoard();
  rememberControls();
  saveState();
  setFeedback("neutral", "Controls reset to their default values. Try a new formation.");
}

function goToNextMission() {
  if (!isMissionComplete(state.currentMission)) {
    return;
  }

  if (state.currentMission < missions.length - 1) {
    loadMission(state.currentMission + 1);
    document.querySelector(".workspace").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  updateSummary();
  elements.completionPanel.scrollIntoView({ behavior: "smooth", block: "center" });
}

function clearProgress() {
  stopTimer();
  state = createInitialState();
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* In-memory progress is cleared even when storage is unavailable. */
  }
  loadMission(0);
}

function handleVisibilityChange() {
  if (document.hidden) {
    stopTimer();
    return;
  }
  startTimer();
}

/* -------------------------------------------------------------------- boot */

elements.controlForm.addEventListener("change", handleControlChange);
elements.controlForm.addEventListener("submit", checkSolution);
elements.resetButton.addEventListener("click", resetMission);
elements.hintButton.addEventListener("click", revealHint);
elements.nextButton.addEventListener("click", goToNextMission);
elements.restartButton.addEventListener("click", clearProgress);
elements.clearProgressButton.addEventListener("click", () => {
  if (window.confirm("Clear every completed mission, score, and attempt?")) {
    clearProgress();
  }
});
document.addEventListener("visibilitychange", handleVisibilityChange);

if (typeof ResizeObserver === "function") {
  new ResizeObserver(updateBoardScale).observe(elements.boardScroll);
} else {
  window.addEventListener("resize", updateBoardScale);
}

updateBoardScale();
normalizeCurrentMission();
loadMission(state.currentMission);
