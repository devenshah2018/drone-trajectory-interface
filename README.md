# Drone Flight Planner

A modern web app for planning and visualizing aerial survey missions. Generate grid-style flight plans, preview drone motion, and analyze mission stats—all in your browser.

## How to Use

### 1. Access the Tool
Visit: [drone-path-planner.vercel.app](https://drone-path-planner.vercel.app)

### 2. Configure Your Mission
- Use the configuration panel to select a camera model and mission preset, or enter custom parameters:
  - Focal length, sensor size, image resolution
  - Flight height, overlap, sidelap, exposure time
- Preset options are available for common cameras and typical survey missions.

### 3. Generate a Flight Plan
- Click **Generate Flight Plan**. The app computes a lawn-mower grid of waypoints covering your survey area, optimized for your settings.

### 4. Analyze the Flight Plan
- **Flight Path Visualization:** Interactive panel shows the route and waypoints. Hover for details.
- **Mission Statistics:** Coverage area, ground sampling distance (GSD), image footprint, total waypoints, estimated flight time.
- **Waypoint Table:** Lists all waypoints, updates live during simulation.
- **Speed Profile Chart:** Shows drone speed along each segment, with min/max/acceleration indicators.

### 5. Simulate the Mission
- Click **Start** to run a simulation. The drone icon moves along the route, and stats/table update live.
- **Pause**, **resume**, or **reset** as needed to inspect specific waypoints or segments.

### 6. Export and Share
- Export your flight plan as **Excel**, **PDF**, or **JSON** for use in other tools or sharing with your team.

### 7. Feedback
- Use the **Feedback** button to send suggestions or report issues directly from the app.


## Features
- Grid-based flight plan generation from camera and mission settings
- Interactive flight path visualization and waypoint table
- Real-time simulation of drone movement
- Mission statistics and speed profile analysis
- Export options: Excel, PDF, JSON
- Mobile responsive, accessible, and enterprise-quality UI

---

For questions or feedback, use the app’s built-in Feedback button or open an issue on GitHub.