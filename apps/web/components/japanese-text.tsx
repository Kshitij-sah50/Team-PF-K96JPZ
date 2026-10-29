"use client";

import { useRef, useState, type ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import "~/app/japanese-text.css";

export function JapaneseText({
  children,
  meaning,
  className,
  asChild = false,
  touchToggle = true,
}: {
  children: ReactNode;
  meaning: string;
  className?: string;
  asChild?: boolean;
  touchToggle?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const touch = useRef(false);
  return (
    <Tooltip open={open} onOpenChange={setOpen} delayDuration={180}>
      <TooltipTrigger
        asChild
        onPointerEnter={(event) => {
          if (event.pointerType !== "touch") setOpen(true);
        }}
        onPointerDown={(event) => {
          touch.current = event.pointerType === "touch";
        }}
        onClick={(event) => {
          if (touch.current && touchToggle) {
            event.preventDefault();
            event.stopPropagation();
            setOpen((value) => !value);
          }
        }}
      >
        {asChild ? (
          children
        ) : (
          <span
            lang="ja"
            className={`japanese-text ${className ?? ""}`}
            tabIndex={0}
            role="button"
            aria-label={`${typeof children === "string" ? `${children}: ` : ""}${meaning}`}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setOpen((value) => !value);
              }
            }}
          >
            {children}
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent className="japanese-translation" sideOffset={8} collisionPadding={12}>
        <span lang="en">{meaning}</span>
      </TooltipContent>
    </Tooltip>
  );
}
