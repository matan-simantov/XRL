import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const colorOptions = [
  { name: "Purple", value: "purple", bg: "bg-purple-600", hover: "hover:bg-purple-700" },
  { name: "Blue", value: "blue", bg: "bg-blue-600", hover: "hover:bg-blue-700" },
  { name: "Green", value: "green", bg: "bg-green-600", hover: "hover:bg-green-700" },
  { name: "Orange", value: "orange", bg: "bg-orange-600", hover: "hover:bg-orange-700" },
  { name: "Red", value: "red", bg: "bg-red-600", hover: "hover:bg-red-700" },
  { name: "Pink", value: "pink", bg: "bg-pink-600", hover: "hover:bg-pink-700" },
];

const Settings = () => {
  const [selectedColor, setSelectedColor] = useState(() => {
    const saved = localStorage.getItem("xrl:buttonColor");
    return saved || "blue";
  });

  useEffect(() => {
    localStorage.setItem("xrl:buttonColor", selectedColor);
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent("colorChange", { detail: selectedColor }));
  }, [selectedColor]);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-6">Settings</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize how the platform looks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode" className="text-foreground">Dark Mode</Label>
            <Switch id="dark-mode" disabled />
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Pick your own template!</p>
            <div className="flex gap-3">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    selectedColor === color.value
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50"
                  }`}
                  title={color.name}
                >
                  <div className={`w-12 h-12 rounded ${color.bg}`}></div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
