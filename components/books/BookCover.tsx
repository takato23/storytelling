"use client";

import React from "react";
import { siteContent } from "@/lib/site-content";

interface BookCoverProps {
  imageSrc: string;
  title: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  titleClassName?: string;
  logoText?: string;
  showLogo?: boolean;
  priorityTone?: "warm" | "default";
}

function splitTitle(title: string): string[] {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 3) return [title];

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > 18 && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);

  if (lines.length <= 3) return lines;

  return [
    lines.slice(0, 2).join(" "),
    lines.slice(2, 4).join(" "),
    lines.slice(4).join(" "),
  ].filter(Boolean);
}

export function BookCover({
  imageSrc,
  title,
  alt,
  className = "",
  imageClassName = "",
  titleClassName = "",
  logoText = ".nido.nido",
  showLogo = true,
  priorityTone = "warm",
}: BookCoverProps) {
  const titleLines = splitTitle(title);

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      <img
        src={imageSrc}
        alt={alt}
        className={`h-full w-full object-cover ${imageClassName}`}
      />

      <div
        className={`absolute inset-0 ${
          priorityTone === "warm"
            ? "bg-[linear-gradient(180deg,rgba(32,20,10,0.18)_0%,rgba(0,0,0,0)_30%,rgba(0,0,0,0.08)_72%,rgba(26,14,8,0.24)_100%)]"
            : "bg-[linear-gradient(180deg,rgba(0,0,0,0.12)_0%,rgba(0,0,0,0)_35%,rgba(0,0,0,0.18)_100%)]"
        }`}
      />

      <div className="absolute inset-x-[10%] top-[8%]">
        <div className="rounded-[26px] bg-white/10 px-5 py-4 backdrop-blur-[2px]">
          <h3
            className={`font-[var(--font-quicksand)] text-center text-[clamp(1.15rem,3vw,2rem)] font-extrabold leading-[1.05] tracking-[-0.02em] text-[#FFF8ED] drop-shadow-[0_3px_12px_rgba(0,0,0,0.35)] ${titleClassName}`}
          >
            {titleLines.map((line, index) => (
              <span key={`${line}-${index}`} className="block">
                {line}
              </span>
            ))}
          </h3>
        </div>
      </div>

      {showLogo && (
        <div className="absolute inset-x-0 bottom-[5.5%] flex justify-center">
          <div className="rounded-full bg-[#fff8ed]/88 px-4 py-1.5 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.5)] backdrop-blur-sm">
            <span className="font-[var(--font-quicksand)] text-[11px] font-bold uppercase tracking-[0.28em] text-[#6F4E37]">
              {logoText || siteContent.brand.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
