"use client";

import Link from "next/link";
import type { ComponentProps, ReactElement } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";

const sections = {
  watchtower: {
    name: "The Watchtower",
    meaning: "A lookout for observing the night sky.",
    action:
      "Search cities, find nearby stargazing spots, and compare cloud cover, humidity, visibility and Night Honor Scores.",
  },
  scroll: {
    name: "Celestial Scroll",
    meaning: "Celestial means relating to the sky; a scroll is a rolled manuscript.",
    action:
      "Browse moon phases, meteor windows, eclipses and launches on the lunar calendar. Open event details and set reminders.",
  },
  lens: {
    name: "Spirit Lens",
    meaning: "A poetic name for a lens that reveals faint details.",
    action:
      "Restore a space image locally, compare before and after, zoom in, and inspect star and galaxy candidates.",
  },
  signals: {
    name: "Signal Observatory",
    meaning:
      "An observatory is a place for studying the sky; signals are measured changes in light.",
    action:
      "Import a light-curve or spectrum CSV and flag unusual measurements for further investigation.",
  },
  honor: {
    name: "Honor journal",
    meaning:
      "Honor Points recognize your self-reported observing practice; a dojo is a place of training.",
    action:
      "Record events you observed, earn points and badges, and export the journal saved on this device.",
  },
};
type Section = keyof typeof sections;

export function NavigationHint({
  section,
  children,
  side = "top",
}: {
  section: Section;
  children: ReactElement;
  side?: "top" | "right";
}) {
  const note = sections[section];
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} sideOffset={8} className="navigation-hint">
        <strong>{note.name}</strong>
        <p>{note.meaning}</p>
        <p>{note.action}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function NavigationLink({
  section,
  hintSide,
  ...props
}: ComponentProps<typeof Link> & { section: Section; hintSide?: "top" | "right" }) {
  return (
    <NavigationHint section={section} side={hintSide}>
      <Link {...props} />
    </NavigationHint>
  );
}
