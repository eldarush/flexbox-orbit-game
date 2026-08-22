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
    instruction: "Spread three ships from edge to edge in one row and center them vertically.",
    tip: "Use justify-content and align-items.",
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
    instruction: "Stack four ships in a centered column at the bottom.",
    tip: "A column makes the main axis vertical.",
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
    instruction: "Reverse the row, add equal space around each ship, and keep it at the top.",
    tip: "row-reverse changes the order and main axis.",
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
    instruction: "Make a reversed column, spread it from top to bottom, and place it on the right.",
    tip: "In a column, align-items moves items left or right.",
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
    instruction: "Center all five ships together in one row.",
    tip: "Center the main axis and cross axis.",
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
    instruction: "Wrap six wide ships into rows with equal space around them.",
    tip: "flex-wrap creates another line when items do not fit.",
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
    instruction: "Make a left-side column spread from top to bottom.",
    tip: "flex-direction changes the axis used by justify-content.",
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
    instruction: "Reverse and wrap eight ships. Spread each row edge to edge and drop the ships to the bottom of their row.",
    tip: "Combine direction, spacing, alignment, and wrapping.",
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
    },
  },
  {
    title: "Cargo Spacing",
    difficulty: "Commander",
    instruction: "Center four cargo pods and place a 32-pixel gap between them.",
    tip: "gap adds fixed space between items.",
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
    instruction: "Wrap six modules into two centered rows at the top and bottom.",
    tip: "align-content controls space between flex lines.",
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
    instruction: "Space the row evenly across the top, then move ship 3 to the bottom.",
    tip: "align-self moves one item on the cross axis.",
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
    instruction: "Spread the row edge to edge and center it. Move the satellite to the first position.",
    tip: "order changes an item's visual position.",
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
