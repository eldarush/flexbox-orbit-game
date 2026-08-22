# Orbit Shift

Orbit Shift is an interactive Flexbox learning game built with semantic HTML, CSS and vanilla
JavaScript. Twelve space missions ask the player to dock a fleet of spacecraft onto glowing
beacons by changing real Flexbox properties.

## Play

- Live game: https://eldarush.github.io/flexbox-orbit-game/
- Repository: https://github.com/eldarush/flexbox-orbit-game

## Local preview

Open `index.html` in a modern browser. No installation, build step or server is required.

## What the game teaches

| Property | Introduced in |
| --- | --- |
| `display: flex` | every mission |
| `flex-direction` | mission 1 |
| `justify-content` | mission 1 |
| `align-items` | mission 1 |
| `flex-wrap` | mission 6 |
| `gap` | mission 9 |
| `align-content` | mission 10 |
| `align-self` | mission 11 |
| `order` | mission 12 |

Every mission needs at least two properties working together and seven of them need three or
more, so the difficulty rises from a single row to wrapped, reversed and re-ordered formations.

## How a solution is checked

The game does **not** compare the values of the dropdowns. When the player presses
*Check docking* it measures the real position and size of every ship and every beacon with
`getBoundingClientRect()` and passes the mission when each ship sits within 1.5 board pixels of
its beacon.

That matters, because several different property combinations produce exactly the same layout —
`flex-wrap: wrap` does nothing while the items still fit on one line, and `align-items: stretch`
behaves like `flex-start` for items with a fixed height. A checker that compared strings would
reject those visually correct answers. Measuring the board accepts every genuinely correct
solution and nothing else.

Each mission also exposes only the properties it is about. Any property a mission does not
expose keeps the value the mission was designed with, and it is applied to the beacons and to
the fleet alike, so the target can never drift away from what the player can actually reach.

## Features

- Twelve missions with a clear written objective and visible target beacons
- Live CSS preview of the declaration the player is building
- Per-mission attempt counter, stopwatch, hint counter and 1–3 star rating
- Score per mission: 100 points, −12 per extra attempt, +20 for a solve under 30 seconds,
  −15 per hint
- Progressive hints that name the next property to change, free when nothing is wrong
- Progress, scores, timings and the player's own answers saved to `localStorage`
- Mission log table with attempts, time, hints, rating and score for every mission
- Free navigation back to any completed mission, with the player's saved solution restored
- Reset to defaults per mission, and a full progress wipe
- Success and error animations, respecting `prefers-reduced-motion`

## Responsiveness

The mission board is always 640 × 360 CSS pixels, so a solution is never affected by the screen
size. On screens too narrow to show it at full size the board is scaled down with a CSS
`transform`, which changes only how large it appears — the layout inside it, and therefore every
mission's solution, stays identical. The current scale is displayed above the board.

## Constraints

- No external JavaScript libraries
- No CSS Grid anywhere in the project — every layout uses Flexbox
- All navigation happens on a single HTML page

## Project files

- `index.html` — semantic game interface
- `styles.css` — responsive design and Flexbox layouts
- `script.js` — mission data, controls, geometric validation, scoring and saved progress
