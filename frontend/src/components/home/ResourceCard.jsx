import React from "react";

const ResourceCard = ({
  title,
  subtitle,
  capacity,
  icon,
  colorTheme,
  onClick,
}) => {
  // Dynamic color classes based on the prop
  const colors = {
    teal: {
      bg: "bg-primary/5",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      hoverText: "group-hover:text-primary",
      hoverBg: "group-hover:bg-primary",
      border: "hover:border-primary/30",
    },
    orange: {
      bg: "bg-orange-50",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      hoverText: "group-hover:text-orange-600",
      hoverBg: "group-hover:bg-orange-500",
      border: "hover:border-orange-500/30",
    },
    purple: {
      bg: "bg-purple-50",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      hoverText: "group-hover:text-purple-600",
      hoverBg: "group-hover:bg-purple-600",
      border: "hover:border-purple-600/30",
    },
  };

  const theme = colors[colorTheme] || colors.teal;

  return (
    <div
      onClick={onClick}
      className={`relative bg-white h-auto md:min-h-[19rem] rounded-2xl p-6 md:p-8 shadow-md border border-gray-100 cursor-pointer transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl ${theme.border} active:scale-95 flex flex-col justify-between overflow-hidden group`}
    >
      {/* Decorative Blob */}
      <div
        className={`absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 ${theme.bg} rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`}
      ></div>

      <div>
        {/* Icon */}
        <div
          className={`w-14 h-14 md:w-16 md:h-16 ${theme.iconBg} rounded-2xl flex items-center justify-center ${theme.iconColor} mb-4 md:mb-6 ${theme.hoverBg} group-hover:text-white transition-colors duration-300 shadow-sm`}
        >
          {icon}
        </div>

        <h3
          className={`text-xl md:text-2xl font-bold text-gray-800 ${theme.hoverText} transition-colors`}
        >
          {title}
        </h3>
        <p className="text-sm md:text-base text-gray-500 mt-2 font-medium">
          {subtitle}
        </p>
      </div>

      {/* Footer (Hidden on Mobile) */}
      <div className="hidden md:flex justify-between items-end border-t border-gray-50 pt-4 mt-4">
        <span className="text-sm font-semibold text-gray-400">
          Capacity: {capacity}
        </span>
        <span
          className={`text-sm font-bold opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all ${theme.iconColor}`}
        >
          Book Now →
        </span>
      </div>
    </div>
  );
};

export default ResourceCard;
