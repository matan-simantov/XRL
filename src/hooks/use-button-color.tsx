import { useState, useEffect } from "react";

export const colorClasses = {
  purple: {
    bg: "bg-purple-600",
    hover: "hover:bg-purple-700",
    active: "active:bg-purple-800",
    text: "text-purple-600",
    bgLight: "bg-purple-600/10",
  },
  blue: {
    bg: "bg-blue-600",
    hover: "hover:bg-blue-700",
    active: "active:bg-blue-800",
    text: "text-blue-600",
    bgLight: "bg-blue-600/10",
  },
  green: {
    bg: "bg-green-600",
    hover: "hover:bg-green-700",
    active: "active:bg-green-800",
    text: "text-green-600",
    bgLight: "bg-green-600/10",
  },
  orange: {
    bg: "bg-orange-600",
    hover: "hover:bg-orange-700",
    active: "active:bg-orange-800",
    text: "text-orange-600",
    bgLight: "bg-orange-600/10",
  },
  red: {
    bg: "bg-red-600",
    hover: "hover:bg-red-700",
    active: "active:bg-red-800",
    text: "text-red-600",
    bgLight: "bg-red-600/10",
  },
  pink: {
    bg: "bg-pink-600",
    hover: "hover:bg-pink-700",
    active: "active:bg-pink-800",
    text: "text-pink-600",
    bgLight: "bg-pink-600/10",
  },
};

export const useButtonColor = () => {
  const [buttonColor, setButtonColor] = useState(() => {
    const saved = localStorage.getItem("xrl:buttonColor");
    return (saved as keyof typeof colorClasses) || "blue";
  });

  useEffect(() => {
    const handleColorChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setButtonColor(customEvent.detail as keyof typeof colorClasses);
    };

    window.addEventListener("colorChange", handleColorChange);
    return () => window.removeEventListener("colorChange", handleColorChange);
  }, []);

  const getButtonClasses = () => {
    const colors = colorClasses[buttonColor];
    return `${colors.bg} ${colors.hover} ${colors.active} text-white`;
  };

  const getTextClass = () => {
    return colorClasses[buttonColor].text;
  };

  const getBgLightClass = () => {
    return colorClasses[buttonColor].bgLight;
  };

  return { buttonColor, getButtonClasses, getTextClass, getBgLightClass };
};

