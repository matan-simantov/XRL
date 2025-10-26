import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const DOMAIN_SUGGESTIONS = [
  "Energy",
  "Oil and Gas",
  "Fossil Fuels",
  "Nuclear",
  "Renewable Energy",
  "Solar",
  "Wind Energy",
  "Hydroelectric",
  "Geothermal Energy",
  "Biofuel",
  "Power Grid",
  "Electrical Distribution",
  "Charging Infrastructure",
  "Energy Storage",
  "Energy Management",
  "Energy Efficiency",
  "Clean Energy",
  "CleanTech",
  "Alternative Fuels",
  "Fusion",
];

const QUICK_TAGS = [
  "Solar",
  "Wind Energy",
  "Energy Storage",
  "Nuclear",
  "Renewable Energy",
];

interface DomainSelectorProps {
  value: string | null;
  onChange: (value: string) => void;
  error?: string;
}

export function DomainSelector({ value, onChange, error }: DomainSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const handleSelect = (domain: string) => {
    onChange(domain);
    setOpen(false);
    setSearch("");
  };

  const handleCustom = () => {
    if (search.trim()) {
      onChange(search.trim());
      setOpen(false);
      setSearch("");
    }
  };

  const filteredDomains = DOMAIN_SUGGESTIONS.filter((domain) =>
    domain.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-[40px] text-left font-normal"
          >
            {value || "Select or type domain..."}
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search or type custom domain..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                <div className="p-2">
                  <p className="text-sm text-muted-foreground mb-2">No suggestions found</p>
                  <Button size="sm" onClick={handleCustom} className="w-full">
                    Use "{search}"
                  </Button>
                </div>
              </CommandEmpty>
              <CommandGroup heading="Suggestions">
                {filteredDomains.map((domain) => (
                  <CommandItem key={domain} onSelect={() => handleSelect(domain)}>
                    {domain}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {value}
            <button
              onClick={() => onChange("")}
              className="ml-2 hover:text-destructive"
              aria-label="Clear selection"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}

      {!value && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground">Quick select:</span>
          {QUICK_TAGS.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="cursor-pointer hover:bg-accent"
              onClick={() => handleSelect(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}
