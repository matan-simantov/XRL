import { useEffect } from "react";

// Color palette definitions with shades
export const colorPalettes: Record<string, {
  primary: string; // HSL for primary
  primaryStrong: string; // Darker shade
  primaryGhost: string; // Light background shade
  primaryChip: string; // Very light shade for chips/tags
  primaryHex: string; // Hex for CSS
  primaryStrongHex: string;
  primaryGhostHex: string;
  primaryChipHex: string;
  ring: string; // HSL for ring color
}> = {
  blue: {
    primary: "217 91% 60%", // Nice blue (hsl(217, 91%, 60%))
    primaryStrong: "217 91% 55%", // Darker blue
    primaryGhost: "217 91% 97%", // Very light blue background
    primaryChip: "217 91% 95%", // Light blue for chips
    primaryHex: "#3B82F6", // blue-500
    primaryStrongHex: "#2563EB", // blue-600
    primaryGhostHex: "#DBEAFE", // blue-100
    primaryChipHex: "#EFF6FF", // blue-50
    ring: "217 91% 60%",
  },
  purple: {
    primary: "258 90% 66%",
    primaryStrong: "258 90% 61%",
    primaryGhost: "258 90% 97%",
    primaryChip: "258 90% 95%",
    primaryHex: "#9333EA", // purple-600
    primaryStrongHex: "#7E22CE", // purple-700
    primaryGhostHex: "#F3E8FF", // purple-100
    primaryChipHex: "#FAF5FF", // purple-50
    ring: "258 90% 66%",
  },
  green: {
    primary: "142 76% 36%",
    primaryStrong: "142 76% 31%",
    primaryGhost: "142 76% 97%",
    primaryChip: "142 76% 95%",
    primaryHex: "#059669", // emerald-600
    primaryStrongHex: "#047857", // emerald-700
    primaryGhostHex: "#D1FAE5", // emerald-100
    primaryChipHex: "#ECFDF5", // emerald-50
    ring: "142 76% 36%",
  },
  orange: {
    primary: "24 95% 53%",
    primaryStrong: "24 95% 48%",
    primaryGhost: "24 95% 97%",
    primaryChip: "24 95% 95%",
    primaryHex: "#EA580C", // orange-600
    primaryStrongHex: "#C2410C", // orange-700
    primaryGhostHex: "#FFEDD5", // orange-100
    primaryChipHex: "#FFF7ED", // orange-50
    ring: "24 95% 53%",
  },
  red: {
    primary: "0 84% 60%",
    primaryStrong: "0 84% 55%",
    primaryGhost: "0 84% 97%",
    primaryChip: "0 84% 95%",
    primaryHex: "#DC2626", // red-600
    primaryStrongHex: "#B91C1C", // red-700
    primaryGhostHex: "#FEE2E2", // red-100
    primaryChipHex: "#FEF2F2", // red-50
    ring: "0 84% 60%",
  },
  pink: {
    primary: "330 81% 60%",
    primaryStrong: "330 81% 55%",
    primaryGhost: "330 81% 97%",
    primaryChip: "330 81% 95%",
    primaryHex: "#DB2777", // pink-600
    primaryStrongHex: "#BE185D", // pink-700
    primaryGhostHex: "#FCE7F3", // pink-100
    primaryChipHex: "#FDF2F8", // pink-50
    ring: "330 81% 60%",
  },
};

// Tailwind classes for dynamic colors in components
export const getColorClasses = (color: string) => {
  const palette = colorPalettes[color] || colorPalettes.blue;
  
  return {
    // Text colors
    text: `text-[${palette.primaryHex}]`,
    textStrong: `text-[${palette.primaryStrongHex}]`,
    
    // Background colors
    bg: `bg-[${palette.primaryHex}]`,
    bgStrong: `bg-[${palette.primaryStrongHex}]`,
    bgGhost: `bg-[${palette.primaryGhostHex}]`,
    bgChip: `bg-[${palette.primaryChipHex}]`,
    
    // Hover states
    hover: `hover:bg-[${palette.primaryStrongHex}]`,
    
    // Border colors
    border: `border-[${palette.primaryHex}]`,
    borderStrong: `border-[${palette.primaryStrongHex}]`,
    
    // Dark mode variants
    darkBg: `dark:bg-[${palette.primaryHex.replace('#', '#')}]`,
    darkBgGhost: `dark:bg-[${palette.primaryGhostHex.replace('#', '#')}]`,
    
    // For WeightsTable specific colors
    tableHeaderBg: `bg-[${palette.primaryGhostHex}]`,
    tableHeaderText: `text-[${palette.primaryStrongHex}]`,
    tableCellBg: `bg-[${palette.primaryGhostHex}]/70`,
    darkTableHeaderBg: `dark:bg-[${palette.primaryHex}]/10`,
    darkTableHeaderText: `dark:text-[${palette.primaryHex}]`,
    darkTableCellBg: `dark:bg-[${palette.primaryHex}]/20`,
  };
};

export const useThemeColor = () => {
  useEffect(() => {
    const updateThemeColors = (color: string = "blue") => {
      const palette = colorPalettes[color] || colorPalettes.blue;
      const root = document.documentElement;
      
      // Update CSS variables
      root.style.setProperty("--primary", palette.primary);
      root.style.setProperty("--primary-foreground", "0 0% 100%");
      root.style.setProperty("--accent", palette.primary);
      root.style.setProperty("--accent-foreground", "0 0% 100%");
      root.style.setProperty("--ring", palette.ring);
      
      // Update custom hex variables for legacy CSS
      root.style.setProperty("--primary-hex", palette.primaryHex);
      root.style.setProperty("--primary-strong-hex", palette.primaryStrongHex);
      root.style.setProperty("--primary-ghost-hex", palette.primaryGhostHex);
      root.style.setProperty("--primary-chip-hex", palette.primaryChipHex);
      
      // Update sidebar colors
      root.style.setProperty("--sidebar-primary", palette.primary);
      root.style.setProperty("--sidebar-ring", palette.ring);
      
      // Update dark mode colors too
      root.style.setProperty("--dark-primary", palette.primary);
      root.style.setProperty("--dark-accent", palette.primary);
      root.style.setProperty("--dark-ring", palette.ring);
    };

    // Get initial color from localStorage
    const savedColor = localStorage.getItem("xrl:buttonColor") || "blue";
    updateThemeColors(savedColor);

    // Listen for color changes
    const handleColorChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      updateThemeColors(customEvent.detail || "blue");
    };

    window.addEventListener("colorChange", handleColorChange);
    return () => window.removeEventListener("colorChange", handleColorChange);
  }, []);

  return null;
};

