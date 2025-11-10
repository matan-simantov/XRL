import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const SECONDARY_CATEGORIES = [
  "Carbon Capture",
  "Pollution Control",
  "Environmental Engineering / Consulting",
  "Recycling / Waste Management",
  "Water / Water Purification",
  "Mining / Mining Technology",
  "Logistics / Marine Transportation",
  "Environmental Consulting",
  "Advanced Materials",
  "Nanotechnology",
  "GreenTech",
  "Semiconductor",
  "Manufacturing",
  "Industrial Automation / Robotics",
  "Infrastructure",
  "Biomass Energy",
  "Chemical / Chemical Engineering",
  "Smart Cities / Smart Buildings",
  "Lighting",
  "HVAC",
  "Robotics",
  "Transportation",
  "Logistics",
  "Green Building",
  "Sustainability",
  "Impact Investing / Green Finance",
  "Recycling / Circular Economy",
  "Water - Energy Nexus",
];

const TOP_CATEGORIES = SECONDARY_CATEGORIES.slice(0, 10);

interface SecondaryCategorySelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function SecondaryCategorySelector({
  value,
  onChange,
}: SecondaryCategorySelectorProps) {
  const [showAll, setShowAll] = useState(false);
  const [customInput, setCustomInput] = useState("");

  const displayedCategories = showAll ? SECONDARY_CATEGORIES : TOP_CATEGORIES;

  const toggleCategory = (category: string) => {
    if (value.includes(category)) {
      onChange(value.filter((c) => c !== category));
    } else {
      if (value.length < 10) {
        onChange([...value, category]);
      }
    }
  };

  const removeCategory = (category: string) => {
    onChange(value.filter((c) => c !== category));
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (trimmed && !value.includes(trimmed) && value.length < 10) {
      onChange([...value, trimmed]);
      setCustomInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustom();
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <p className="text-sm text-muted-foreground mb-3">
        Select up to 10 relevant categories. You can also add custom categories.
      </p>
      
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <ChevronDown className="w-4 h-4" />
          <span>{value.length} selected</span>
        </div>
        {value.length >= 10 && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">Maximum reached</span>
        )}
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
        {value.map((category) => (
            <span key={category} className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-blue-200 rounded-full text-sm font-medium text-blue-900 shadow-sm hover:shadow-md transition-shadow">
            {category}
            <button
              onClick={() => removeCategory(category)}
                className="ml-1 hover:text-red-600 transition-colors"
              aria-label={`Remove ${category}`}
            >
              <X className="h-3 w-3" />
            </button>
            </span>
          ))}
      </div>
      )}

      <div className="grid grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-2">
        {displayedCategories.map((category) => {
          const isSelected = value.includes(category);
          const isDisabled = !isSelected && value.length >= 10;
          return (
            <div
              key={category}
              className={`domain-option ${isSelected ? 'selected' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !isDisabled && toggleCategory(category)}
            >
            <Checkbox
              id={category}
                checked={isSelected}
                onCheckedChange={() => !isDisabled && toggleCategory(category)}
                disabled={isDisabled}
                className="pointer-events-none"
            />
            <Label
              htmlFor={category}
                className="text-[#111111] font-normal cursor-pointer flex-1 ml-2 pointer-events-none"
            >
              {category}
            </Label>
          </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setShowAll(!showAll)}
        className="w-full hover:bg-accent transition-colors"
      >
        {showAll ? (
          <>
            <ChevronUp className="h-4 w-4 mr-2" />
            Show Less
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4 mr-2" />
            Show More ({SECONDARY_CATEGORIES.length - TOP_CATEGORIES.length} more)
          </>
        )}
      </Button>

      <div className="flex gap-2 pt-2">
        <Input
          placeholder="Add custom category..."
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={value.length >= 10}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={addCustom}
          disabled={!customInput.trim() || value.length >= 10}
          size="icon"
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
