# Drone Flight Planner

A lightweight Next.js app for planning simple aerial survey missions. It generates a lawn‑mower style flight plan from camera intrinsics and mission parameters, visualizes the path, and runs a local simulation to preview drone motion.

This repository is intended as a practical prototype — easy to run locally and extend for custom workflows.

Hosted demo: [https://drone-path-planner.vercel.app/](https://drone-path-planner.vercel.app/)

## Key features

- Generate a grid-based flight plan from camera + mission settings
- Visualize flight path, start/end markers, and live simulated drone position
- Compact configuration panel with camera presets and mission presets
- Lightweight mission statistics (distance, estimated time, GSD, footprint)
- Keyboard- and screen-reader-friendly waypoint table

## Quick start

1. Install dependencies

```bash
npm install
# or
pnpm install
# or
yarn
```

2. Start dev server

```bash
npm run dev
```

3. Open your browser at `http://localhost:3000`


## Basic usage

1. Set camera parameters (or choose a camera preset).
2. Set mission parameters: overlap, sidelap, height, survey width/length, exposure.
3. Click **Generate Flight Plan**. The map and waypoint table update.
4. Use the simulation controls (Start / Pause / Stop / Reset) to preview drone motion.

Notes:
- Overlap and sidelap are ratios in `[0, 1)`. Values near 1 increase coverage and flight time.
- Exposure time affects the allowed flight speed for blur-free images.

## Simulation controls

- Start: begin a fresh simulation. If paused, the Start control resumes the simulation (no reset).
- Pause / Resume: temporarily stops motion while keeping the current state.
- Stop: stops and clears running flag (keeps last position visible).
- Reset: reset simulation state to the first waypoint.

Waypoint table highlights current, completed, and upcoming rows during simulation. Only the table auto-scrolls to keep the active waypoint visible — the main page scroll remains unchanged.

## CI/CD
The app is deployed to Vercel on every push to the `main` branch. See the [hosted demo](https://drone-path-planner.vercel.app/).

Branches made off main are version branches with the naming convention `vx.x` (e.g., `v0.1`).

Features, enhancements, and bug fixes are made on the version branches.

- To release:
    1. Update `CHANGELOG.md`.
    2. Commit with message `Release vx.x.`.
    3. Tag the branch `vx.x`.
    4. Draft a GitHub release with the changelog.
    5. Increment the release ENV variable in Vercel.
    6. Open a PR to `main` titled `Release vx.x.`.
    7. Merge PR to trigger deployment.
    8. Publish the GitHub release.