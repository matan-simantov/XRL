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
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {value.map((category) => (
          <Badge key={category} variant="secondary" className="text-sm">
            {category}
            <button
              onClick={() => removeCategory(category)}
              className="ml-2 hover:text-destructive"
              aria-label={`Remove ${category}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {value.length === 0 && (
          <span className="text-sm text-muted-foreground">No categories selected</span>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        {value.length} / 10 selected
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-lg p-3">
        {displayedCategories.map((category) => (
          <div key={category} className="flex items-center space-x-2">
            <Checkbox
              id={category}
              checked={value.includes(category)}
              onCheckedChange={() => toggleCategory(category)}
              disabled={!value.includes(category) && value.length >= 10}
            />
            <Label
              htmlFor={category}
              className="text-sm font-normal cursor-pointer flex-1"
            >
              {category}
            </Label>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setShowAll(!showAll)}
        className="w-full"
      >
        {showAll ? (
          <>
            <ChevronUp className="h-4 w-4 mr-2" />
            Show Less
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4 mr-2" />
            Show All ({SECONDARY_CATEGORIES.length} total)
          </>
        )}
      </Button>

      <div className="flex gap-2">
        <Input
          placeholder="Add custom category..."
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={value.length >= 10}
        />
        <Button
          type="button"
          onClick={addCustom}
          disabled={!customInput.trim() || value.length >= 10}
          size="icon"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
