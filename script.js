"use strict";

const STORAGE_KEY = "orbit-shift-progress-v1";

const DEFAULT_CONTROLS = Object.freeze({
  flexDirection: "row",
  justifyContent: "flex-start",
  alignItems: "flex-start",
  flexWrap: "nowrap",
});

const missions = [
  {
    title: "Edge of Orbit",
    difficulty: "Cadet",
    instruction: "Place the three scout ships in one row, spread them from edge to edge, and center them vertically.",
    tip: "justify-content moves items along the main axis; align-items works across it.",
    count: 3,
    icons: ["🚀", "🛸", "🛰️"],
    unitWidth: 72,
    unitHeight: 64,
    solution: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "nowrap",
    },
  },
  {
    title: "Lunar Descent",
    difficulty: "Cadet",
    instruction: "Stack the landers from top to bottom, center the column horizontally, and dock it at the bottom edge.",
    tip: "With a column direction, the main axis runs from top to bottom.",
    count: 4,
    icons: ["🛸", "🚀", "🛰️", "🚀"],
    unitWidth: 72,
    unitHeight: 64,
    solution: {
      flexDirection: "column",
      justifyContent: "flex-end",
      alignItems: "center",
      flexWrap: "nowrap",
    },
  },
  {
    title: "Reverse Convoy",
    difficulty: "Navigator",
    instruction: "Reverse the flight order, leave equal breathing room around every ship, and keep the convoy at the top.",
    tip: "row-reverse changes both the visual order and the direction of the main axis.",
    count: 3,
    icons: ["🛰️", "🚀", "🛸"],
    unitWidth: 72,
    unitHeight: 64,
    solution: {
      flexDirection: "row-reverse",
      justifyContent: "space-around",
      alignItems: "flex-start",
      flexWrap: "nowrap",
    },
  },
  {
    title: "Station Wall",
    difficulty: "Navigator",
    instruction: "Build a reversed vertical column, spread the modules between top and bottom, and attach it to the right wall.",
    tip: "For a vertical main axis, align-items controls left-to-right placement.",
    count: 4,
    icons: ["🔭", "🛰️", "🚀", "🛸"],
    unitWidth: 72,
    unitHeight: 64,
    solution: {
      flexDirection: "column-reverse",
      justifyContent: "space-between",
      alignItems: "flex-end",
      flexWrap: "nowrap",
    },
  },
  {
    title: "Solar Core",
    difficulty: "Navigator",
    instruction: "Keep one forward-facing row and pull all five craft into a tight formation at the exact center of the field.",
    tip: "Centering on both axes requires two different Flexbox properties.",
    count: 5,
    icons: ["🚀", "🛰️", "🛸", "🔭", "🚀"],
    unitWidth: 72,
    unitHeight: 64,
    solution: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      flexWrap: "nowrap",
    },
  },
  {
    title: "Satellite Sweep",
    difficulty: "Commander",
    instruction: "Allow the six wide satellites to wrap into new rows, give every craft equal space around it, and center each craft within its row.",
    tip: "When items no longer fit, flex-wrap lets the container create additional flex lines.",
    count: 6,
    icons: ["🛰️", "🔭", "🛰️", "🔭", "🛰️", "🔭"],
    unitWidth: 172,
    unitHeight: 64,
    solution: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      flexWrap: "wrap",
    },
  },
  {
    title: "Gravity Channel",
    difficulty: "Commander",
    instruction: "Form a downward column, distribute the craft between the top and bottom, and hold the column against the left wall.",
    tip: "Changing flex-direction also changes which physical direction justify-content controls.",
    count: 4,
    icons: ["🚀", "🛸", "🚀", "🛰️"],
    unitWidth: 72,
    unitHeight: 64,
    solution: {
      flexDirection: "column",
      justifyContent: "space-between",
      alignItems: "flex-start",
      flexWrap: "nowrap",
    },
  },
  {
    title: "Deep-Space Formation",
    difficulty: "Captain",
    instruction: "Reverse the fleet direction, wrap the eight cruisers into rows, spread each row edge to edge, and dock the ships at the bottom of each line.",
    tip: "The final formation combines direction, spacing, cross-axis alignment, and wrapping.",
    count: 8,
    icons: ["🚀", "🛸", "🛰️", "🔭", "🚀", "🛸", "🛰️", "🔭"],
    unitWidth: 126,
    unitHeight: 64,
    solution: {
      flexDirection: "row-reverse",
      justifyContent: "space-between",
      alignItems: "flex-end",
      flexWrap: "wrap",
    },
  },
];

const elements = {
  missionNav: document.querySelector("#missionNav"),
  missionNumber: document.querySelector("#missionNumber"),
  missionDifficulty: document.querySelector("#missionDifficulty"),
  missionTitle: document.querySelector("#missionTitle"),
  missionInstruction: document.querySelector("#missionInstruction"),
  missionTip: document.querySelector("#missionTip"),
  controlForm: document.querySelector("#controlForm"),
  flexDirection: document.querySelector("#flexDirection"),
  justifyContent: document.querySelector("#justifyContent"),
  alignItems: document.querySelector("#alignItems"),
  flexWrap: document.querySelector("#flexWrap"),
  codePreview: document.querySelector("#codePreview"),
  resetButton: document.querySelector("#resetButton"),
  nextButton: document.querySelector("#nextButton"),
  feedback: document.querySelector("#feedback"),
  attemptCount: document.querySelector("#attemptCount"),
  progressText: document.querySelector("#progressText"),
  progressTrack: document.querySelector("#progressTrack"),
  headerScore: document.querySelector("#headerScore"),
  headerCompleted: document.querySelector("#headerCompleted"),
  playfield: document.querySelector("#playfield"),
  targetLayer: document.querySelector("#targetLayer"),
  fleetLayer: document.querySelector("#fleetLayer"),
  completionPanel: document.querySelector("#completionPanel"),
  completionSummary: document.querySelector("#completionSummary"),
  restartButton: document.querySelector("#restartButton"),
  clearProgressButton: document.querySelector("#clearProgressButton"),
};

function createInitialState() {
  return {
    currentMission: 0,
    completed: [],
    attempts: Array(missions.length).fill(0),
    scores: Array(missions.length).fill(0),
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (!saved || !Array.isArray(saved.completed) || !Array.isArray(saved.attempts) || !Array.isArray(saved.scores)) {
      return createInitialState();
    }

    const completed = saved.completed.filter(
      (value) => Number.isInteger(value) && value >= 0 && value < missions.length,
    );

    return {
      currentMission: Number.isInteger(saved.currentMission) ? saved.currentMission : 0,
      completed: [...new Set(completed)],
      attempts: missions.map((_, index) => Number(saved.attempts[index]) || 0),
      scores: missions.map((_, index) => Number(saved.scores[index]) || 0),
    };
  } catch {
    return createInitialState();
  }
}

let state = loadState();

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The game remains fully playable when storage is unavailable.
  }
}

function isMissionUnlocked(index) {
  return index === 0 || state.completed.includes(index - 1);
}

function getFirstIncompleteMission() {
  const index = missions.findIndex((_, missionIndex) => !state.completed.includes(missionIndex));
  return index === -1 ? missions.length - 1 : index;
}

function normalizeCurrentMission() {
  if (
    state.currentMission < 0 ||
    state.currentMission >= missions.length ||
    !isMissionUnlocked(state.currentMission)
  ) {
    state.currentMission = getFirstIncompleteMission();
  }
}

function getCurrentControls() {
  return {
    flexDirection: elements.flexDirection.value,
    justifyContent: elements.justifyContent.value,
    alignItems: elements.alignItems.value,
    flexWrap: elements.flexWrap.value,
  };
}

function setControls(values) {
  elements.flexDirection.value = values.flexDirection;
  elements.justifyContent.value = values.justifyContent;
  elements.alignItems.value = values.alignItems;
  elements.flexWrap.value = values.flexWrap;
  updateFleet();
}

function applyFlexValues(layer, values) {
  layer.style.flexDirection = values.flexDirection;
  layer.style.justifyContent = values.justifyContent;
  layer.style.alignItems = values.alignItems;
  layer.style.flexWrap = values.flexWrap;
}

function updateCodePreview(values) {
  elements.codePreview.textContent = [
    "display: flex;",
    `flex-direction: ${values.flexDirection};`,
    `justify-content: ${values.justifyContent};`,
    `align-items: ${values.alignItems};`,
    `flex-wrap: ${values.flexWrap};`,
  ].join("\n");
}

function updateFleet() {
  const values = getCurrentControls();
  applyFlexValues(elements.fleetLayer, values);
  updateCodePreview(values);
  elements.playfield.classList.remove("is-success", "is-error");
}

function createBoardItem(className, text, label) {
  const item = document.createElement(className === "ship" ? "li" : "div");
  item.className = className;
  item.textContent = text;
  if (label) {
    item.setAttribute("aria-label", label);
  }
  return item;
}

function renderBoard(mission) {
  elements.targetLayer.replaceChildren();
  elements.fleetLayer.replaceChildren();

  [elements.targetLayer, elements.fleetLayer].forEach((layer) => {
    layer.style.setProperty("--unit-width", `${mission.unitWidth}px`);
    layer.style.setProperty("--unit-height", `${mission.unitHeight}px`);
  });

  for (let index = 0; index < mission.count; index += 1) {
    elements.targetLayer.append(createBoardItem("dock", String(index + 1)));
    elements.fleetLayer.append(
      createBoardItem("ship", mission.icons[index], `Spacecraft ${index + 1}`),
    );
  }

  applyFlexValues(elements.targetLayer, mission.solution);
}

function setFeedback(type, message) {
  elements.feedback.className = `feedback feedback-${type}`;
  elements.feedback.textContent = message;
}

function renderNavigation() {
  elements.missionNav.replaceChildren();

  missions.forEach((mission, index) => {
    const button = document.createElement("button");
    const complete = state.completed.includes(index);
    const unlocked = isMissionUnlocked(index);

    button.type = "button";
    button.textContent = complete ? "✓" : String(index + 1);
    button.classList.toggle("current", index === state.currentMission);
    button.classList.toggle("complete", complete);
    button.disabled = !unlocked;
    button.setAttribute(
      "aria-label",
      `Mission ${index + 1}: ${mission.title}${complete ? ", complete" : unlocked ? "" : ", locked"}`,
    );
    if (index === state.currentMission) {
      button.setAttribute("aria-current", "step");
    }
    button.addEventListener("click", () => loadMission(index));
    elements.missionNav.append(button);
  });
}

function updateSummary() {
  const completedCount = state.completed.length;
  const totalScore = state.scores.reduce((total, value) => total + value, 0);
  elements.headerScore.textContent = String(totalScore);
  elements.headerCompleted.textContent = String(completedCount);
  elements.progressText.textContent = `${completedCount} of ${missions.length} complete`;
  elements.progressTrack.value = completedCount;
  elements.progressTrack.textContent = `${completedCount} of ${missions.length} complete`;

  const allComplete = completedCount === missions.length;
  elements.completionPanel.hidden = !allComplete;
  if (allComplete) {
    elements.completionSummary.textContent =
      `Final score: ${totalScore} points across ${missions.length} missions. You can revisit any mission or begin a fresh run.`;
  }
}

function loadMission(index) {
  if (!isMissionUnlocked(index)) {
    return;
  }

  state.currentMission = index;
  saveState();

  const mission = missions[index];
  const alreadyComplete = state.completed.includes(index);

  elements.missionNumber.textContent = `Mission ${index + 1} of ${missions.length}`;
  elements.missionDifficulty.textContent = mission.difficulty;
  elements.missionTitle.textContent = mission.title;
  elements.missionInstruction.textContent = mission.instruction;
  elements.missionTip.textContent = `Tip: ${mission.tip}`;
  elements.attemptCount.textContent = String(state.attempts[index]);
  elements.nextButton.textContent = index === missions.length - 1 ? "Finish route →" : "Next mission →";
  elements.nextButton.disabled = !alreadyComplete;
  elements.playfield.classList.remove("is-success", "is-error");

  renderBoard(mission);
  setControls(DEFAULT_CONTROLS);

  if (alreadyComplete) {
    setFeedback("success", "Mission already cleared. Replay the formation or continue to the next unlocked mission.");
  } else {
    setFeedback("neutral", "Match each ship with a glowing beacon, then check your docking.");
  }

  renderNavigation();
  updateSummary();
}

function describeProperty(property) {
  const labels = {
    flexDirection: "flex-direction",
    justifyContent: "justify-content",
    alignItems: "align-items",
    flexWrap: "flex-wrap",
  };
  return labels[property];
}

function checkSolution(event) {
  event.preventDefault();

  const missionIndex = state.currentMission;
  const mission = missions[missionIndex];
  const values = getCurrentControls();
  const mismatches = Object.keys(mission.solution).filter(
    (property) => values[property] !== mission.solution[property],
  );

  state.attempts[missionIndex] += 1;
  elements.attemptCount.textContent = String(state.attempts[missionIndex]);

  if (mismatches.length === 0) {
    const wasComplete = state.completed.includes(missionIndex);
    const earnedScore = Math.max(40, 100 - (state.attempts[missionIndex] - 1) * 12);

    if (!wasComplete) {
      state.completed.push(missionIndex);
      state.completed.sort((left, right) => left - right);
      state.scores[missionIndex] = earnedScore;
    } else {
      state.scores[missionIndex] = Math.max(state.scores[missionIndex], earnedScore);
    }

    elements.playfield.classList.remove("is-error");
    elements.playfield.classList.add("is-success");
    elements.nextButton.disabled = false;
    setFeedback(
      "success",
      wasComplete
        ? "Perfect docking. This mission remains complete."
        : `Docking confirmed. Mission cleared for ${earnedScore} points — the next route is unlocked.`,
    );
  } else {
    elements.playfield.classList.remove("is-success");
    elements.playfield.classList.add("is-error");
    window.setTimeout(() => elements.playfield.classList.remove("is-error"), 420);

    const extraHint = state.attempts[missionIndex] >= 2
      ? ` Recheck ${mismatches.map(describeProperty).join(", ")}.`
      : " Compare the ships with the numbered beacons and try again.";

    setFeedback(
      "error",
      `${mismatches.length} ${mismatches.length === 1 ? "property needs" : "properties need"} adjustment.${extraHint}`,
    );
  }

  saveState();
  renderNavigation();
  updateSummary();
}

function resetMission() {
  setControls(DEFAULT_CONTROLS);
  elements.playfield.classList.remove("is-success", "is-error");
  setFeedback("neutral", "Mission controls reset to their default values. Try a new formation.");
}

function goToNextMission() {
  if (!state.completed.includes(state.currentMission)) {
    return;
  }

  if (state.currentMission < missions.length - 1) {
    loadMission(state.currentMission + 1);
    document.querySelector(".workspace").scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    updateSummary();
    elements.completionPanel.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function clearProgress() {
  state = createInitialState();
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors; in-memory progress is still cleared.
  }
  loadMission(0);
}

elements.controlForm.addEventListener("input", updateFleet);
elements.controlForm.addEventListener("submit", checkSolution);
elements.resetButton.addEventListener("click", resetMission);
elements.nextButton.addEventListener("click", goToNextMission);
elements.restartButton.addEventListener("click", clearProgress);
elements.clearProgressButton.addEventListener("click", () => {
  if (window.confirm("Clear every completed mission, score, and attempt?")) {
    clearProgress();
  }
});

normalizeCurrentMission();
loadMission(state.currentMission);
