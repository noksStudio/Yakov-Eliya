"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MotionConfig } from "framer-motion";
import {
  Accessibility,
  Contrast,
  Droplet,
  Link2,
  Minus,
  MousePointer2,
  PauseCircle,
  Plus,
  RotateCcw,
  SunMoon,
  Type,
  X,
  AlignJustify,
} from "lucide-react";

type Settings = {
  zoom: number;
  contrast: boolean;
  grayscale: boolean;
  invert: boolean;
  links: boolean;
  readableFont: boolean;
  spacing: boolean;
  stopMotion: boolean;
  bigCursor: boolean;
};

const DEFAULTS: Settings = {
  zoom: 0,
  contrast: false,
  grayscale: false,
  invert: false,
  links: false,
  readableFont: false,
  spacing: false,
  stopMotion: false,
  bigCursor: false,
};

const STORAGE_KEY = "a11y-settings";
const ZOOM_LEVELS = [1, 1.1, 1.2, 1.3];

const toggles: { key: Exclude<keyof Settings, "zoom">; label: string; icon: typeof Contrast }[] = [
  { key: "contrast", label: "ניגודיות גבוהה", icon: Contrast },
  { key: "invert", label: "היפוך צבעים", icon: SunMoon },
  { key: "grayscale", label: "גווני אפור", icon: Droplet },
  { key: "links", label: "הדגשת קישורים", icon: Link2 },
  { key: "readableFont", label: "גופן קריא", icon: Type },
  { key: "spacing", label: "ריווח טקסט", icon: AlignJustify },
  { key: "stopMotion", label: "עצירת אנימציות", icon: PauseCircle },
  { key: "bigCursor", label: "סמן גדול", icon: MousePointer2 },
];

function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const hidden = usePathname().startsWith("/admin");

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--a11y-zoom", String(ZOOM_LEVELS[settings.zoom]));
    root.classList.toggle("a11y-zoom", settings.zoom > 0);
    root.classList.toggle("a11y-links", settings.links);
    root.classList.toggle("a11y-font", settings.readableFont);
    root.classList.toggle("a11y-spacing", settings.spacing);
    root.classList.toggle("a11y-motion", settings.stopMotion);
    root.classList.toggle("a11y-cursor", settings.bigCursor);
    const filters = [
      settings.contrast && "contrast(1.4)",
      settings.grayscale && "grayscale(1)",
      settings.invert && "invert(1) hue-rotate(180deg)",
    ].filter(Boolean);
    root.style.filter = filters.join(" ");
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  return (
    <MotionConfig reducedMotion={settings.stopMotion ? "always" : "user"}>
      {children}
      {!hidden && <AccessibilityWidget settings={settings} setSettings={setSettings} />}
    </MotionConfig>
  );
}

function AccessibilityWidget({
  settings,
  setSettings,
}: {
  settings: Settings;
  setSettings: (updater: (s: Settings) => Settings) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>("button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const changeZoom = (delta: number) =>
    setSettings((s) => ({ ...s, zoom: Math.min(ZOOM_LEVELS.length - 1, Math.max(0, s.zoom + delta)) }));

  return (
    <div className="a11y-widget fixed left-0 top-1/2 z-[70] -translate-y-1/2">
      <button
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        aria-label="תפריט נגישות"
        aria-expanded={open}
        aria-controls="a11y-panel"
        className="flex h-11 w-11 items-center justify-center rounded-r-xl bg-black text-white shadow-[0_4px_16px_rgba(0,0,0,0.5)] outline-offset-2 transition-[width] hover:w-12"
      >
        <Accessibility className="h-6 w-6" strokeWidth={2} />
      </button>

      {open && (
        <div
          ref={panelRef}
          id="a11y-panel"
          role="dialog"
          aria-label="הגדרות נגישות"
          className="absolute left-[3.25rem] top-1/2 max-h-[85vh] w-[min(300px,calc(100vw-4.5rem))] -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-4 text-[#111] shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">הגדרות נגישות</h2>
            <button
              onClick={() => {
                setOpen(false);
                triggerRef.current?.focus();
              }}
              aria-label="סגירת תפריט הנגישות"
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl bg-[#f2f2f2] px-3 py-2.5">
            <span className="text-sm font-medium">גודל טקסט</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => changeZoom(1)}
                aria-label="הגדלת טקסט"
                disabled={settings.zoom === ZOOM_LEVELS.length - 1}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white disabled:opacity-30"
              >
                <Plus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm tabular-nums" aria-live="polite">
                {Math.round(ZOOM_LEVELS[settings.zoom] * 100)}%
              </span>
              <button
                onClick={() => changeZoom(-1)}
                aria-label="הקטנת טקסט"
                disabled={settings.zoom === 0}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white disabled:opacity-30"
              >
                <Minus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            {toggles.map((t) => (
              <button
                key={t.key}
                onClick={() => setSettings((s) => ({ ...s, [t.key]: !s[t.key] }))}
                aria-pressed={settings[t.key]}
                className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition-colors ${
                  settings[t.key] ? "border-black bg-black text-white" : "border-[#ddd] bg-white hover:border-black"
                }`}
              >
                <t.icon className="h-5 w-5" />
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setSettings(() => DEFAULTS)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#ddd] py-2.5 text-sm font-medium hover:border-black"
          >
            <RotateCcw className="h-4 w-4" />
            איפוס הגדרות
          </button>
          <Link
            href="/accessibility"
            onClick={() => setOpen(false)}
            className="mt-3 block text-center text-sm font-medium underline underline-offset-4"
          >
            הצהרת נגישות
          </Link>
        </div>
      )}
    </div>
  );
}
