"use strict";

/* Data and helpers shared by the game (script.js) and the statistics page
   (stats.js). Both are classic scripts, so these declarations are visible to
   whichever file is loaded after this one. */

const STORAGE_KEY = "orbit-shift-progress-v2";
const LEGACY_STORAGE_KEY = "orbit-shift-progress-v1";

/* Every property the container layer understands, with the value used when a
   mission does not expose it as a control. */
const CONTAINER_CONTROLS = {
  "flex-direction": {
    styleProperty: "flexDirection",
    fallback: "row",
    options: ["row", "row-reverse", "column", "column-reverse"],
  },
  "justify-content": {
    styleProperty: "justifyContent",
    fallback: "flex-start",
    options: ["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"],
  },
  "align-items": {
    styleProperty: "alignItems",
    fallback: "flex-start",
    options: ["flex-start", "center", "flex-end", "stretch"],
  },
  "flex-wrap": {
    styleProperty: "flexWrap",
    fallback: "nowrap",
    options: ["nowrap", "wrap", "wrap-reverse"],
  },
  "align-content": {
    styleProperty: "alignContent",
    /* CSS initial value: a single flex line stretches to fill the container, which
       is what makes flex-wrap a no-op while every item still fits on one line. */
    fallback: "stretch",
    options: ["stretch", "flex-start", "center", "flex-end", "space-between", "space-around"],
  },
  gap: {
    styleProperty: "gap",
    fallback: "0px",
    options: ["0px", "8px", "16px", "32px", "48px"],
  },
};

/* Properties that are set on a single ship rather than on the container. */
const ITEM_CONTROLS = {
  order: {
    styleProperty: "order",
    fallback: "0",
    options: ["0", "1", "2", "3", "4", "5"],
  },
  "align-self": {
    styleProperty: "alignSelf",
    fallback: "auto",
    options: ["auto", "flex-start", "center", "flex-end"],
  },
};

const CORE_CONTROLS = ["flex-direction", "justify-content", "align-items", "flex-wrap"];

/* ---------------------------------------------------------------- missions */

const missions = [
  {
    title: "Edge of Orbit",
    difficulty: "Cadet",
    instruction:
      "Place the three scout ships in one row, spread them from edge to edge, and center them vertically.",
    tip: "justify-content moves items along the main axis; align-items works across it.",
    count: 3,
    icons: ["🚀", "🛸", "🛰️"],
    unitWidth: 72,
    unitHeight: 64,
    controls: CORE_CONTROLS,
    solution: {
      "flex-direction": "row",
      "justify-content": "space-between",
      "align-items": "center",
      "flex-wrap": "nowrap",
    },
  },
  {
    title: "Lunar Descent",
    difficulty: "Cadet",
    instruction:
      "Stack the landers from top to bottom, center the column horizontally, and dock it at the bottom edge.",
    tip: "With a column direction, the main axis runs from top to bottom.",
    count: 4,
    icons: ["🛸", "🚀", "🛰️", "🚀"],
    unitWidth: 72,
    unitHeight: 64,
    controls: CORE_CONTROLS,
    solution: {
      "flex-direction": "column",
      "justify-content": "flex-end",
      "align-items": "center",
      "flex-wrap": "nowrap",
    },
  },
  {
    title: "Reverse Convoy",
    difficulty: "Navigator",
    instruction:
      "Reverse the flight order, leave equal breathing room around every ship, and keep the convoy at the top.",
    tip: "row-reverse changes both the visual order and the direction of the main axis.",
    count: 3,
    icons: ["🛰️", "🚀", "🛸"],
    unitWidth: 72,
    unitHeight: 64,
    controls: CORE_CONTROLS,
    solution: {
      "flex-direction": "row-reverse",
      "justify-content": "space-around",
      "align-items": "flex-start",
      "flex-wrap": "nowrap",
    },
  },
  {
    title: "Station Wall",
    difficulty: "Navigator",
    instruction:
      "Build a reversed vertical column, spread the modules between top and bottom, and attach it to the right wall.",
    tip: "For a vertical main axis, align-items controls left-to-right placement.",
    count: 4,
    icons: ["🔭", "🛰️", "🚀", "🛸"],
    unitWidth: 72,
    unitHeight: 64,
    controls: CORE_CONTROLS,
    solution: {
      "flex-direction": "column-reverse",
      "justify-content": "space-between",
      "align-items": "flex-end",
      "flex-wrap": "nowrap",
    },
  },
  {
    title: "Solar Core",
    difficulty: "Navigator",
    instruction:
      "Keep one forward-facing row and pull all five craft into a tight formation at the exact center of the field.",
    tip: "Centering on both axes requires two different Flexbox properties.",
    count: 5,
    icons: ["🚀", "🛰️", "🛸", "🔭", "🚀"],
    unitWidth: 72,
    unitHeight: 64,
    controls: CORE_CONTROLS,
    solution: {
      "flex-direction": "row",
      "justify-content": "center",
      "align-items": "center",
      "flex-wrap": "nowrap",
    },
  },
  {
    title: "Satellite Sweep",
    difficulty: "Commander",
    instruction:
      "Allow the six wide satellites to wrap into new rows, give every craft equal space around it, and center each craft within its row.",
    tip: "When items no longer fit, flex-wrap lets the container create additional flex lines.",
    count: 6,
    icons: ["🛰️", "🔭", "🛰️", "🔭", "🛰️", "🔭"],
    unitWidth: 172,
    unitHeight: 64,
    controls: CORE_CONTROLS,
    solution: {
      "flex-direction": "row",
      "justify-content": "space-around",
      "align-items": "center",
      "flex-wrap": "wrap",
      "align-content": "space-around",
    },
  },
  {
    title: "Gravity Channel",
    difficulty: "Commander",
    instruction:
      "Form a downward column, distribute the craft between the top and bottom, and hold the column against the left wall.",
    tip: "Changing flex-direction also changes which physical direction justify-content controls.",
    count: 4,
    icons: ["🚀", "🛸", "🚀", "🛰️"],
    unitWidth: 72,
    unitHeight: 64,
    controls: CORE_CONTROLS,
    solution: {
      "flex-direction": "column",
      "justify-content": "space-between",
      "align-items": "flex-start",
      "flex-wrap": "nowrap",
    },
  },
  {
    title: "Deep-Space Formation",
    difficulty: "Captain",
    instruction:
      "Reverse the fleet direction, wrap the eight cruisers into rows, spread each row edge to edge, and dock the ships at the bottom of each line.",
    tip: "The final formation combines direction, spacing, cross-axis alignment, and wrapping.",
    count: 8,
    icons: ["🚀", "🛸", "🛰️", "🔭", "🚀", "🛸", "🛰️", "🔭"],
    unitWidth: 126,
    unitHeight: 64,
    controls: CORE_CONTROLS,
    solution: {
      "flex-direction": "row-reverse",
      "justify-content": "space-between",
      "align-items": "flex-end",
      "flex-wrap": "wrap",
      "align-content": "space-around",
    },
  },
  {
    title: "Cargo Spacing",
    difficulty: "Commander",
    instruction:
      "Centre the four cargo pods on both axes, then push them apart with a fixed 32-pixel gap instead of letting justify-content do the spacing.",
    tip: "gap adds space between items; justify-content distributes whatever space is left over.",
    count: 4,
    icons: ["📦", "📦", "📦", "📦"],
    unitWidth: 72,
    unitHeight: 64,
    controls: [...CORE_CONTROLS, "gap"],
    solution: {
      "flex-direction": "row",
      "justify-content": "center",
      "align-items": "center",
      "flex-wrap": "nowrap",
      gap: "32px",
    },
  },
  {
    title: "Twin Decks",
    difficulty: "Commander",
    instruction:
      "Wrap the six deck modules onto two lines, centre each line horizontally, and pin one line to the very top of the field and the other to the very bottom.",
    tip: "justify-content spaces items inside a line; align-content spaces the lines themselves.",
    count: 6,
    icons: ["🛰️", "🔭", "🛰️", "🔭", "🛰️", "🔭"],
    unitWidth: 172,
    unitHeight: 64,
    controls: [...CORE_CONTROLS, "align-content"],
    solution: {
      "flex-direction": "row",
      "justify-content": "center",
      "align-items": "center",
      "flex-wrap": "wrap",
      "align-content": "space-between",
    },
  },
  {
    title: "Rogue Scout",
    difficulty: "Captain",
    instruction:
      "Spread the patrol evenly across the top of the field — but scout 3 breaks formation and drops on its own to the bottom edge.",
    tip: "align-self overrides align-items for a single flex item.",
    count: 4,
    icons: ["🚀", "🚀", "🛸", "🚀"],
    unitWidth: 72,
    unitHeight: 64,
    controls: ["flex-direction", "justify-content", "align-items"],
    itemControls: ["align-self"],
    solution: {
      "flex-direction": "row",
      "justify-content": "space-evenly",
      "align-items": "flex-start",
      "flex-wrap": "nowrap",
    },
    itemSolution: [{}, {}, { "align-self": "flex-end" }, {}],
  },
  {
    title: "Priority Launch",
    difficulty: "Captain",
    instruction:
      "Spread the launch row from edge to edge and centre it vertically, then re-order the queue so the flagship 🛰️ launches first on the left, followed by ships 1, 2 and 3 in their original sequence.",
    tip: "order changes where an item is painted without touching the HTML.",
    count: 4,
    icons: ["🚀", "🛸", "🔭", "🛰️"],
    unitWidth: 72,
    unitHeight: 64,
    controls: ["flex-direction", "justify-content", "align-items"],
    itemControls: ["order"],
    solution: {
      "flex-direction": "row",
      "justify-content": "space-between",
      "align-items": "center",
      "flex-wrap": "nowrap",
    },
    itemSolution: [{ order: "1" }, { order: "2" }, { order: "3" }, { order: "0" }],
  },
];

/* ------------------------------------------------------------------ score */

const HINT_COST = 15;
const ATTEMPT_PENALTY = 12;
const MIN_ATTEMPT_SCORE = 40;
const MIN_SCORE = 10;
const FAST_SOLVE_MS = 30000;
const STEADY_SOLVE_MS = 60000;
const FAST_BONUS = 20;
const STEADY_BONUS = 10;

/* ---------------------------------------------------------------- progress */

function createInitialState() {
  return {
    currentMission: 0,
    completed: [],
    attempts: missions.map(() => 0),
    scores: missions.map(() => 0),
    hints: missions.map(() => 0),
    stars: missions.map(() => 0),
    elapsed: missions.map(() => 0),
    solveTimes: missions.map(() => 0),
    saved: missions.map(() => null),
  };
}

function readNumberArray(source, length) {
  return Array.from({ length }, (_, index) => {
    const value = Number(Array.isArray(source) ? source[index] : 0);
    return Number.isFinite(value) && value > 0 ? value : 0;
  });
}

function loadState() {
  const initial = createInitialState();

  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY));
  } catch {
    return initial;
  }

  if (!saved || typeof saved !== "object") {
    return initial;
  }

  const completed = Array.isArray(saved.completed)
    ? saved.completed.filter((value) => Number.isInteger(value) && value >= 0 && value < missions.length)
    : [];

  return {
    currentMission: Number.isInteger(saved.currentMission) ? saved.currentMission : 0,
    completed: [...new Set(completed)].sort((left, right) => left - right),
    attempts: readNumberArray(saved.attempts, missions.length),
    scores: readNumberArray(saved.scores, missions.length),
    hints: readNumberArray(saved.hints, missions.length),
    stars: readNumberArray(saved.stars, missions.length),
    elapsed: readNumberArray(saved.elapsed, missions.length),
    solveTimes: readNumberArray(saved.solveTimes, missions.length),
    saved: missions.map((_, index) => (Array.isArray(saved.saved) ? saved.saved[index] ?? null : null)),
  };
}

/* ----------------------------------------------------------------- format */

function renderStars(count) {
  return "★".repeat(count) + "☆".repeat(3 - count);
}

function formatDuration(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

