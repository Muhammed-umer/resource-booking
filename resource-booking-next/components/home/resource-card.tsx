"use client";

import { NavIcon, type NavIconName } from "@/components/nav-icons";

type Theme = "teal" | "orange" | "purple";

const THEMES: Record<
  Theme,
  {
    blob: string;
    iconBg: string;
    iconColor: string;
    hoverText: string;
    hoverBg: string;
    border: string;
  }
> = {
  teal: {
    blob: "bg-primary/5",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    hoverText: "group-hover:text-primary",
    hoverBg: "group-hover:bg-primary",
    border: "hover:border-primary/30",
  },
  orange: {
    blob: "bg-orange-50",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    hoverText: "group-hover:text-orange-600",
    hoverBg: "group-hover:bg-orange-500",
    border: "hover:border-orange-500/30",
  },
  purple: {
    blob: "bg-purple-50",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    hoverText: "group-hover:text-purple-600",
    hoverBg: "group-hover:bg-purple-600",
    border: "hover:border-purple-600/30",
  },
};

export function ResourceCard({
  title,
  subtitle,
  capacity,
  icon,
  colorTheme,
  onClick,
}: {
  title: string;
  subtitle: string;
  capacity: string;
  icon: NavIconName;
  colorTheme: Theme;
  onClick: () => void;
}) {
  const theme = THEMES[colorTheme];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex h-auto flex-col justify-between overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 text-left shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl active:scale-95 md:min-h-76 md:p-8 ${theme.border}`}
    >
      <div
        className={`absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-bl-full transition-transform group-hover:scale-110 md:h-32 md:w-32 ${theme.blob}`}
      />

      <div className="relative">
        <div
          className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition-colors duration-300 group-hover:text-white md:mb-6 md:h-16 md:w-16 ${theme.iconBg} ${theme.iconColor} ${theme.hoverBg}`}
        >
          <NavIcon name={icon} className="h-7 w-7 md:h-8 md:w-8" />
        </div>

        <h3
          className={`text-xl font-bold text-gray-800 transition-colors md:text-2xl ${theme.hoverText}`}
        >
          {title}
        </h3>
        <p className="mt-2 text-sm font-medium text-gray-500 md:text-base">
          {subtitle}
        </p>
      </div>

      <div className="mt-4 hidden items-end justify-between border-t border-gray-50 pt-4 md:flex">
        <span className="text-sm font-semibold text-gray-400">
          Capacity: {capacity}
        </span>
        <span
          className={`translate-x-2 text-sm font-bold opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 ${theme.iconColor}`}
        >
          Book now →
        </span>
      </div>
    </button>
  );
}
