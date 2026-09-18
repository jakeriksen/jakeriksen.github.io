"use client";

import { useSyncExternalStore } from "react";

/**
 * Viewer preferences live as attributes on <html>, which makes the DOM the
 * single source of truth: CSS, React and the render loop all read the same
 * value and there is no copy to keep in sync. Each one defaults to a media
 * query and is overridden, permanently, the moment the viewer picks a side.
 */
type PreferenceSpec<T extends string> = {
  attribute: string;
  storageKey: string;
  media: string;
  /** Value used when the media query matches; `other` is used when it does not. */
  matched: T;
  other: T;
};

function createPreference<T extends string>({
  attribute,
  storageKey,
  media,
  matched,
  other,
}: PreferenceSpec<T>) {
  const dataAttribute = `data-${attribute}`;

  const read = (): T =>
    document.documentElement.getAttribute(dataAttribute) === matched
      ? matched
      : other;

  const stored = (): T | null => {
    try {
      const value = localStorage.getItem(storageKey);
      return value === matched || value === other ? (value as T) : null;
    } catch {
      return null;
    }
  };

  const subscribe = (onChange: () => void) => {
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [dataAttribute],
    });

    // Follow the system only while the viewer has not made a choice of their own.
    const query = window.matchMedia(media);
    const onSystemChange = () => {
      if (stored()) return;
      document.documentElement.setAttribute(
        dataAttribute,
        query.matches ? matched : other
      );
    };
    query.addEventListener("change", onSystemChange);

    return () => {
      observer.disconnect();
      query.removeEventListener("change", onSystemChange);
    };
  };

  return {
    /* Runs before first paint so the resolved value is on <html> when the CSS
       lands. It always writes a concrete value, which is why the stylesheet
       needs no media-query duplicates. */
    script: `(function(){try{var v=localStorage.getItem(${JSON.stringify(
      storageKey
    )});if(v!==${JSON.stringify(matched)}&&v!==${JSON.stringify(
      other
    )}){v=matchMedia(${JSON.stringify(media)}).matches?${JSON.stringify(
      matched
    )}:${JSON.stringify(other)}}document.documentElement.setAttribute(${JSON.stringify(
      dataAttribute
    )},v)}catch(e){document.documentElement.setAttribute(${JSON.stringify(
      dataAttribute
    )},${JSON.stringify(other)})}})()`,

    use: () => useSyncExternalStore(subscribe, read, () => other),

    toggle: () => {
      const next = read() === matched ? other : matched;
      document.documentElement.setAttribute(dataAttribute, next);
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        // Private mode: the choice just will not persist.
      }
    },
  };
}

const theme = createPreference({
  attribute: "theme",
  storageKey: "theme",
  media: "(prefers-color-scheme: light)",
  matched: "light",
  other: "dark",
});

const motion = createPreference({
  attribute: "motion",
  storageKey: "motion",
  // A phone has no cursor to follow, so tracking would leave the scene dark
  // except during a drag. "hover: none" picks those devices and starts them in
  // ambient instead. Comma is OR in a media query list.
  media: "(prefers-reduced-motion: reduce), (hover: none)",
  matched: "off",
  other: "on",
});

export const PREFERENCES_SCRIPT = `${theme.script};${motion.script}`;

export const useTheme = theme.use;
export const toggleTheme = theme.toggle;
export const useMotion = motion.use;
export const toggleMotion = motion.toggle;

const BUTTON_CLASS =
  "tip group -my-2 flex items-center py-2 text-ink-dim transition-colors hover:text-accent";

/* Both icons ship and CSS picks one. Choosing in JS would mean the server
   guessing the preference and mismatching on hydration. */

export function ThemeToggle() {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle colour theme"
      className={`${BUTTON_CLASS} tip-below tip-theme`}
    >
      <svg
        className="pref-theme-day size-[17px] transition-transform duration-300 group-hover:rotate-45"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        aria-hidden
      >
        <circle cx="12" cy="12" r="4.1" />
        <path d="M12 2.6v2.1M12 19.3v2.1M4.4 4.4l1.5 1.5M18.1 18.1l1.5 1.5M2.6 12h2.1M19.3 12h2.1M4.4 19.6l1.5-1.5M18.1 5.9l1.5-1.5" />
      </svg>
      <svg
        className="pref-theme-night size-[17px] transition-transform duration-300 group-hover:-rotate-12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.6 8.6 0 1 0 11.1 11.1Z" />
      </svg>
    </button>
  );
}

export function MotionToggle() {
  return (
    <button
      type="button"
      onClick={toggleMotion}
      aria-label="Toggle the cursor-reactive background"
      className={`${BUTTON_CLASS} tip-motion`}
    >
      <svg
        className="pref-motion-on size-[17px]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M5.6 3.2 18 10.6l-5.9 1.2-2.4 5.6Z" />
        <path className="pref-slash" d="M3.4 3.4 20.6 20.6" />
      </svg>
      <svg
        className="pref-motion-off size-[17px]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M5.6 3.2 18 10.6l-5.9 1.2-2.4 5.6Z" />
      </svg>
    </button>
  );
}
