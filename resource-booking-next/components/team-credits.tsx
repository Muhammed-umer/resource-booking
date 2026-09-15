"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** The team behind the portal, in the order the team agreed on. */
const TEAM: { name: string; linkedin: string }[] = [
  { name: "Muhammed Umer S", linkedin: "https://www.linkedin.com/in/muhammed-umer-s" },
  { name: "Dineshkumar M", linkedin: "https://www.linkedin.com/in/dineshkumar-m-48a00a2ab/" },
  { name: "Pavithra Malini", linkedin: "https://www.linkedin.com/in/pavithra-malini-832071331/" },
  { name: "Bindhu R", linkedin: "https://www.linkedin.com/in/bindhu-r-68a4a42a1/" },
];

const BATCH = "CSE · 2023 – 2027 batch";

function LinkedInIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

/**
 * "Developed by" entry at the bottom of the sidebar. Opens a card in the
 * centre of the screen naming the team with links to their LinkedIn profiles.
 * The card is portalled to <body>: the sidebar is transformed for its slide
 * animation, which would otherwise trap a fixed-position child inside it.
 */
export function TeamCredits() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-auto flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-white/80 transition-colors hover:bg-primary-dark hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 0 0-3-3.87M9 20H4v-2a4 4 0 0 1 3-3.87m6-5.13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm6 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
        <span>
          <span className="block font-medium">Developed by</span>
          <span className="block text-xs text-white/60">{BATCH}</span>
        </span>
      </button>

      {open &&
        createPortal(
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-credits-title"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white p-6 text-center text-gray-800 shadow-xl sm:max-w-xl sm:p-8"
          >
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">Designed &amp; developed by</p>
            <h2 id="team-credits-title" className="mt-1 text-lg font-bold">
              {BATCH}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">Government College of Engineering, Erode</p>

            <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {TEAM.map((member) => (
                <li key={member.linkedin}>
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1.5 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 font-medium text-gray-800 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                  >
                    <span className="text-base">{member.name}</span>
                    <span className="flex items-center gap-1 text-xs text-[#0A66C2]">
                      <LinkedInIcon />
                      LinkedIn
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-6 w-full rounded-lg border border-gray-300 py-2 font-semibold text-gray-700 hover:bg-gray-100 sm:w-auto sm:px-8"
            >
              Close
            </button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
