/**
 * Changelog metadata for the Drone Flight Planner application.
 * Structured data for programmatic rendering in the UI.
 */

export type ChangelogItemType = "bugfix" | "enhancement";

export interface ChangelogItem {
  type: ChangelogItemType;
  description: string;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  items: ChangelogItem[];
}

export const changelogEntries: ChangelogEntry[] = [
  {
    version: "v0.23",
    date: "2026-03-20",
    items: [
      {
        type: "enhancement",
        description: "Added industry trends.",
      }
    ],
  },
  {
    version: "v0.2",
    date: "2026-03-07",
    items: [
      {
        type: "enhancement",
        description: "Complete UI redesign for better user experience.",
      }
    ],
  },
  {
    version: "v0.1",
    date: "2025-10-27",
    items: [
      {
        type: "enhancement",
        description: "User interface improvements for accessibility.",
      },
    ],
  },
  {
    version: "v0.0",
    date: "2025-10-24",
    items: [
      { type: "bugfix", description: "Speed profile charts now correctly display the blur-free speeds." },
      { type: "bugfix", description: "Clicking reset now also resets the template configuration dropdown." },
      { type: "bugfix", description: "Aligned 'Overlap' and 'Sidelap' verbiage." },
      { type: "enhancement", description: "Added Skydio drone X10 and R10 drone presets." },
      { type: "enhancement", description: "Improved UI/UX for speed profile charts." },
    ],
  },
  {
    version: "v0.0-beta",
    date: "2025-10-23",
    items: [
      {
        type: "bugfix",
        description: "For max velocity and acceleration, we are now able to delete all text to enter a new value.",
      },
      {
        type: "bugfix",
        description: "We now are able to hover over start and end points on flight path visualization to see coordinates.",
      },
      {
        type: "enhancement",
        description: "Added template configuration groups for bulk configuration presets.",
      },
      { type: "enhancement", description: "Ensured total mobile responsiveness." },
      { type: "enhancement", description: "UI design improvements for better user experience." },
    ],
  },
  {
    version: "0.0-alpha",
    date: "2025-10-21",
    items: [{ type: "enhancement", description: "Initial alpha release." }],
  },
];

/** Current app version, derived from the latest changelog entry. */
export const currentVersion = changelogEntries[0]?.version ?? "v0.0.0";
