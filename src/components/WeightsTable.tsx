import { useState, useEffect, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Mail, ChevronLeft, ChevronRight, RefreshCw, Eye, EyeOff, FileText, CheckCircle, MoreVertical, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useButtonColor } from "@/hooks/use-button-color";
import { getColorClasses } from "@/hooks/use-theme-color";
import { toast } from "sonner";
import { updateRunTableState, getSession } from "@/lib/storage";

interface WeightsTableProps {
  llms: string[];
  participants: { name: string; email: string }[];
  domains: string[];
  initialLlmWeight?: number; // From the form
  formData?: any; // All form data for viewing parameters
  onClose: () => void;
}

// Category definitions with default weights
const CATEGORIES = {
  "Companies / Firms": {
    defaultWeight: 24.444444,
    color: "blue",
  },
  "Israeli Funding / Financing": {
    defaultWeight: 23.703704,
    color: "green",
  },
  "Competition": {
    defaultWeight: 17.777778,
    color: "purple",
  },
  "Global Funding / Financing": {
    defaultWeight: 11.111111,
    color: "orange",
  },
  "Knowledge and Infrastructure": {
    defaultWeight: 8.888889,
    color: "teal",
  },
  "Human Capital": {
    defaultWeight: 8.148148,
    color: "pink",
  },
  "Academia": {
    defaultWeight: 5.925926,
    color: "indigo",
  },
} as const;

type CategoryName = keyof typeof CATEGORIES;

interface Parameter {
  short: string;
  full: string;
  category: CategoryName;
}

// Organized parameters by category
const parameters: Parameter[] = [
  // Competition (12 parameters)
  { short: "IPOs Worldwide", full: "Number of IPOs in the sector worldwide in the past 5 years (2019–2025)", category: "Competition" },
  { short: "M&A Worldwide", full: "Number of companies worldwide that were acquired or merged in the past 5 years (2019–2025)", category: "Competition" },
  { short: "Active Companies Worldwide", full: "Number of active companies in the sector worldwide", category: "Competition" },
  { short: "New Companies Worldwide", full: "Number of new companies in the past 5 years (2019–2025)", category: "Competition" },
  { short: "Pre-Seed & Seed Worldwide", full: "Number of companies in the sector worldwide that raised Pre-Seed & Seed rounds (2019–2025)", category: "Competition" },
  { short: "Series A Worldwide", full: "Number of companies in the sector worldwide that raised a Series A round (2019–2025)", category: "Competition" },
  { short: "Series B–C Worldwide", full: "Number of companies in the sector worldwide that raised Series B–C rounds (2019–2025)", category: "Competition" },
  { short: "Late-Stage Worldwide", full: "Number of companies in the sector worldwide that raised late-stage rounds (2019–2025)", category: "Competition" },
  { short: "Series A/Seed Ratio Worldwide", full: "Ratio of companies that raised a Series A round out of those that raised a Seed round in the past 5 years (2019–2025)", category: "Competition" },
  { short: "New Blood Flow Worldwide", full: '"New blood" flow in the sector worldwide (new activities/active activities) (2019–2025)', category: "Competition" },
  { short: "Avg Company Age Worldwide", full: "Average age of an active company worldwide", category: "Competition" },
  { short: "Google Trends Change", full: "% change in Google Trends searches in the past 5 years worldwide (2019–2025)", category: "Competition" },
  
  // Global Funding / Financing (6 parameters)
  { short: "Total Capital Raised", full: "Total capital raised ($) (2019–2025)", category: "Global Funding / Financing" },
  { short: "Capital: Pre-Seed & Seed", full: "Total capital raised in Pre-Seed & Seed rounds ($) (2019–2025)", category: "Global Funding / Financing" },
  { short: "Capital: Series A", full: "Total capital raised in Series A rounds ($) (2019–2025)", category: "Global Funding / Financing" },
  { short: "Capital: Series B–C", full: "Total capital raised in Series B–C rounds ($) (2019–2025)", category: "Global Funding / Financing" },
  { short: "Capital: Series D–J", full: "Total capital raised in Series D–J rounds ($) (2019–2025)", category: "Global Funding / Financing" },
  { short: "Avg IPO Amount", full: "Average IPO amount ($) for companies that went public between 2019–2025", category: "Global Funding / Financing" },
  
  // Human Capital (5 parameters)
  { short: "Incubators", full: "Number of incubators in the sector", category: "Human Capital" },
  { short: "Private Accelerators", full: "Number of private accelerators in the sector", category: "Human Capital" },
  { short: "Communities", full: "Number of communities in the sector", category: "Human Capital" },
  { short: "Employees in Sector", full: "Number of employees in the sector", category: "Human Capital" },
  { short: "Training Programs", full: "Number of professional non-academic training programs and entrepreneurship support frameworks", category: "Human Capital" },
  
  // Companies / Firms (15 parameters)
  { short: "Active Companies Israel", full: "Number of active companies in the sector in Israel", category: "Companies / Firms" },
  { short: "New Companies Israel", full: "Number of new companies in the past 5 years (2019–2025)", category: "Companies / Firms" },
  { short: "Seed Rounds Israel", full: "Number of companies in the sector in Israel that raised Seed rounds (2020–2025)", category: "Companies / Firms" },
  { short: "Series A Israel", full: "Number of companies in the sector in Israel that raised a Series A round (2019–2025)", category: "Companies / Firms" },
  { short: "Series B–C Israel", full: "Number of companies in the sector in Israel that raised Series B–C rounds (2019–2025)", category: "Companies / Firms" },
  { short: "Late-Stage Israel", full: "Number of companies in the sector in Israel that raised late-stage rounds (2019–2025)", category: "Companies / Firms" },
  { short: "% Change in Funding Israel", full: "% change in the number of companies that raised funding in the sector in the past 5 years (2019–2025 compared to 2014–2018)", category: "Companies / Firms" },
  { short: "Avg Company Age Israel", full: "Average age of an active company (years)", category: "Companies / Firms" },
  { short: "Revenue Stage Israel", full: "Number of active companies in Israel that reached the revenue growth stage (sales stage)", category: "Companies / Firms" },
  { short: "M&A Israel", full: "Number of companies acquired or merged in the past 5 years (2019–2025)", category: "Companies / Firms" },
  { short: "IPOs Israel", full: "Number of IPOs in the past 5 years (2019–2025)", category: "Companies / Firms" },
  { short: "Acquiring Companies Israel", full: "Number of acquiring companies in the past 5 years (2019–2025)", category: "Companies / Firms" },
  { short: "Series A/Pre-Seed Ratio Israel", full: "Ratio of companies that raised a Series A round out of those that raised a Seed or Pre-Seed round in the past 5 years (2019–2025)", category: "Companies / Firms" },
  { short: "New Blood Flow Israel", full: '"New blood" flow into the sector (new active companies ÷ active companies) (2019–2025)', category: "Companies / Firms" },
  { short: "Multinationals Israel", full: "Number of multinationals in the sector in Israel", category: "Companies / Firms" },
  
  // Financing (14 parameters - previously Israeli Funding / Financing)
  { short: "Non-VC Israeli Investors", full: "Number of Israeli investors who are not venture capital", category: "Israeli Funding / Financing" },
  { short: "Israeli VC Investors", full: "Number of Israeli venture capital investors", category: "Israeli Funding / Financing" },
  { short: "Total Capital Raised Israel", full: "Total capital raised ($) (2019–2025)", category: "Israeli Funding / Financing" },
  { short: "Capital: Seed Israel", full: "Total capital raised in Seed rounds ($) (2019–2025)", category: "Israeli Funding / Financing" },
  { short: "Capital: Series A Israel", full: "Total capital raised in Series A rounds ($) (2019–2025)", category: "Israeli Funding / Financing" },
  { short: "Capital: Series B–C Israel", full: "Total capital raised in Series B–C rounds ($) (2019–2025)", category: "Israeli Funding / Financing" },
  { short: "Capital: Series D–J Israel", full: "Total capital raised in Series D–J rounds ($) (2019–2025)", category: "Israeli Funding / Financing" },
  { short: "Foreign Investors", full: "Number of foreign investors", category: "Israeli Funding / Financing" },
  { short: "% Change Total Capital", full: "% change in total capital raised in the past 6 years (2019–2025 compared to 2014–2018)", category: "Israeli Funding / Financing" },
  { short: "% Change Seed Capital", full: "% change in total capital raised in Seed rounds in the past 6 years (2019–2025 compared to 2014–2018)", category: "Israeli Funding / Financing" },
  { short: "% Change Series A Capital", full: "% change in total capital raised in Series A rounds in the past 6 years (2019–2025 compared to 2014–2018)", category: "Israeli Funding / Financing" },
  { short: "% Change Series B–C Capital", full: "% change in total capital raised in Series B–C rounds in the past 6 years (2019–2025 compared to 2014–2018)", category: "Israeli Funding / Financing" },
  { short: "% Change Late-Stage Capital", full: "% change in total capital raised in late-stage rounds in the past 5 years (2019–2025 compared to 2014–2018)", category: "Israeli Funding / Financing" },
  { short: "Avg IPO Amount Israel", full: "Average IPO amount ($) for companies that went public between 2019–2025", category: "Israeli Funding / Financing" },
  
  // Knowledge and Infrastructure (10 parameters)
  { short: "Market Size 2030", full: "Market size estimate for 2030", category: "Knowledge and Infrastructure" },
  { short: "Leading Researchers Worldwide", full: "Number of leading researchers worldwide", category: "Knowledge and Infrastructure" },
  { short: "Patents Worldwide", full: "Number of patents worldwide", category: "Knowledge and Infrastructure" },
  { short: "Top 50 Publications Worldwide", full: "Number of publications by the top 50 researchers published in the past 10 years worldwide", category: "Knowledge and Infrastructure" },
  { short: "Leading Researchers Israel", full: "Number of leading researchers in Israel", category: "Knowledge and Infrastructure" },
  { short: "Top 50 Publications Israel", full: "Number of publications by the top 50 researchers published in the past 10 years in Israel", category: "Knowledge and Infrastructure" },
  { short: "Patent Share Israel", full: "Share of patents registered in Israel relative to patents worldwide", category: "Knowledge and Infrastructure" },
  { short: "Patents Registered Israel", full: "Number of patents registered in Israel", category: "Knowledge and Infrastructure" },
  { short: "ERC Projects", full: "Number of ERC projects in the field in the past 5 years", category: "Knowledge and Infrastructure" },
  { short: "Total ERC Grants", full: "Total ERC grants in the field (€) in the past 5 years", category: "Knowledge and Infrastructure" },
  
  // Academia (8 parameters - keeping existing)
  { short: "Academic Programs", full: "Number of academic programs related to the sector", category: "Academia" },
  { short: "Students Enrolled", full: "Number of students enrolled in sector-related programs", category: "Academia" },
  { short: "Researchers in Sector", full: "Number of researchers in the sector", category: "Academia" },
  { short: "University-Industry Collaborations", full: "Number of university-industry collaborations (2020–2025)", category: "Academia" },
  { short: "Academic Spin-offs", full: "Number of academic spin-offs in the sector (2020–2025)", category: "Academia" },
  { short: "Research Funding", full: "Research funding in the sector ($) (2020–2025)", category: "Academia" },
  { short: "PhD Graduates", full: "Number of PhD graduates in sector-related fields (2020–2025)", category: "Academia" },
  { short: "Academic Institutions", full: "Number of academic institutions with sector programs", category: "Academia" },
];

// Helper function to get parameters by category
const getParametersByCategory = (category: CategoryName): Parameter[] => {
  return parameters.filter(p => p.category === category);
};

// Helper function to get parameter indices by category
const getParameterIndicesByCategory = (category: CategoryName): number[] => {
  return parameters
    .map((p, index) => ({ param: p, index }))
    .filter(({ param }) => param.category === category)
    .map(({ index }) => index);
};

// Generate explanation for LLM based on its weights (2 sentences)
const generateLLMExplanation = (llmName: string): string => {
  const explanations = [
    `Competition category received higher weight due to observed market saturation signals and increased competitive dynamics in this sector. Global Funding was reduced based on current economic trends indicating tighter capital availability.`,
    `Companies/Firms category was prioritized as a key market indicator reflecting the sector's maturity and business ecosystem strength. Competition weights were adjusted lower considering the stable competitive landscape.`,
    `Israeli Funding category received emphasis for local market assessment, reflecting the importance of domestic investment patterns. Knowledge Infrastructure was weighted higher due to its critical role in sector innovation and R&D capacity.`,
    `Human Capital category received increased focus for talent development needs, recognizing the sector's reliance on skilled workforce. Academia weight was elevated to reflect the importance of academic partnerships and research collaboration.`,
  ];
  return explanations[Math.floor(Math.random() * explanations.length)];
};

// Generate explanation for participant (2 sentences, only shown if participant has values)
const generateParticipantExplanation = (participantName: string): string => {
  const explanations = [
    `${participantName}'s weight distribution reflects extensive industry experience and deep market insights from hands-on work in the sector. The category weights were determined based on practical observations of what factors most significantly impact sector performance.`,
    `Based on ${participantName}'s domain expertise, certain categories received higher priority due to their strategic relevance and observed correlation with successful outcomes. The weighting approach considers both current market trends and future projections from practical experience.`,
    `${participantName}'s recommendations prioritize categories that have proven most influential in decision-making processes based on real-world experience. The distribution reflects a balanced approach considering multiple factors while emphasizing the most critical dimensions.`,
  ];
  return explanations[Math.floor(Math.random() * explanations.length)];
};

// Generate IIA default weights based on category distribution
const generateIIADefaultWeights = (): Record<number, number> => {
  const weights: Record<number, number> = {};
  
  Object.keys(CATEGORIES).forEach((categoryName) => {
    const category = categoryName as CategoryName;
    const categoryWeight = CATEGORIES[category].defaultWeight;
    const categoryParams = getParameterIndicesByCategory(category);
    const paramCount = categoryParams.length;
    
    if (paramCount > 0) {
      const weightPerParam = categoryWeight / paramCount;
      categoryParams.forEach((paramIndex) => {
        // Round to 1 decimal place and ensure no negative
        const rounded = Math.round(weightPerParam * 10) / 10;
        weights[paramIndex] = Math.max(0, parseFloat(rounded.toFixed(1)));
      });
    }
  });
  
  // Ensure sum is exactly 100
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  if (Math.abs(total - 100) > 0.05) {
    const diff = 100 - total;
    const lastParamIndex = parameters.length - 1;
    const newValue = (weights[lastParamIndex] || 0) + diff;
    weights[lastParamIndex] = Math.max(0, parseFloat(newValue.toFixed(1))); // Ensure no negative and 1 decimal
  }
  
  // Final pass: ensure all values have exactly 1 decimal place and no negatives
  Object.keys(weights).forEach((key) => {
    const paramIndex = parseInt(key);
    weights[paramIndex] = parseFloat(Math.max(0, weights[paramIndex]).toFixed(1));
  });
  
  return weights;
};

// Generate LLM weights close to defaults but with variation (±10-15%)
const generateLLMWeights = (): Record<number, number> => {
  const weights: Record<number, number> = {};
  const categoryWeights: Record<CategoryName, number> = {} as Record<CategoryName, number>;
  
  // Generate category weights with variation
  Object.keys(CATEGORIES).forEach((categoryName) => {
    const category = categoryName as CategoryName;
    const defaultWeight = CATEGORIES[category].defaultWeight;
    // Add ±10-15% variation
    const variation = (Math.random() * 0.1 + 0.05) * (Math.random() > 0.5 ? 1 : -1);
    categoryWeights[category] = Math.max(0, defaultWeight * (1 + variation));
  });
  
  // Normalize category weights to sum to 100
  const totalCategoryWeight = Object.values(categoryWeights).reduce((sum, w) => sum + w, 0);
  Object.keys(categoryWeights).forEach((categoryName) => {
    const category = categoryName as CategoryName;
    categoryWeights[category] = (categoryWeights[category] / totalCategoryWeight) * 100;
  });
  
  // Distribute weights to parameters within each category
  Object.keys(CATEGORIES).forEach((categoryName) => {
    const category = categoryName as CategoryName;
    const categoryWeight = categoryWeights[category];
    const categoryParams = getParameterIndicesByCategory(category);
    const paramCount = categoryParams.length;
    
    if (paramCount > 0) {
      const weightPerParam = categoryWeight / paramCount;
      categoryParams.forEach((paramIndex) => {
        // Round to 1 decimal place and ensure no negative
        const rounded = Math.round(weightPerParam * 10) / 10;
        weights[paramIndex] = Math.max(0, parseFloat(rounded.toFixed(1)));
      });
    }
  });
  
  // Ensure sum is exactly 100
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  if (Math.abs(total - 100) > 0.05) {
    const diff = 100 - total;
    const lastParamIndex = parameters.length - 1;
    const newValue = (weights[lastParamIndex] || 0) + diff;
    weights[lastParamIndex] = Math.max(0, parseFloat(newValue.toFixed(1))); // Ensure no negative and 1 decimal
  }
  
  // Final pass: ensure all values have exactly 1 decimal place
  Object.keys(weights).forEach((key) => {
    const paramIndex = parseInt(key);
    weights[paramIndex] = parseFloat(Math.max(0, weights[paramIndex]).toFixed(1));
  });
  
  return weights;
};

// Generate weights that sum to 100 for a column with relatively close values
const generateWeightsForColumn = (): number[] => {
  const llmWeights = generateLLMWeights();
  const weights: (number | null)[] = Array.from({ length: parameters.length }, () => null);
  
  Object.keys(llmWeights).forEach((paramIndexStr) => {
    const paramIndex = parseInt(paramIndexStr);
    weights[paramIndex] = llmWeights[paramIndex];
  });
  
  return weights as number[];
};

export const WeightsTable = ({ llms = [], participants = [], domains = [], initialLlmWeight = 50, formData, onClose }: WeightsTableProps) => {
  // Early return if essential props are missing or invalid
  if (!domains || domains.length === 0) {
    return (
      <Card className="mt-6 shadow-lg mx-auto w-full max-w-[95vw] p-8">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-muted-foreground">No domains available</p>
          <Button onClick={onClose} variant="outline">Close</Button>
        </div>
      </Card>
    );
  }

  if (!llms || llms.length === 0) {
    return (
      <Card className="mt-6 shadow-lg mx-auto w-full max-w-[95vw] p-8">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-muted-foreground">No LLMs available</p>
          <Button onClick={onClose} variant="outline">Close</Button>
        </div>
      </Card>
    );
  }

  const { getButtonClasses } = useButtonColor();
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showParametersDialog, setShowParametersDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showMissingDataDialog, setShowMissingDataDialog] = useState(false);
  const [missingParticipantsList, setMissingParticipantsList] = useState<string[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<{ name: string; email: string } | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [currentDomainIndex, setCurrentDomainIndex] = useState(0);
  
  // Load from saved state if available (recalculate on formData change)
  const savedState = formData?.tableState;
  
  const [llmWeight, setLlmWeight] = useState(initialLlmWeight);
  
  // Track which columns are disabled
  const [disabledLlms, setDisabledLlms] = useState<Set<string>>(new Set());
  const [disabledParticipants, setDisabledParticipants] = useState<Set<string>>(new Set());
  const [isMeDisabled, setIsMeDisabled] = useState(false);
  
  // Results comparison table
  const [showResultsTable, setShowResultsTable] = useState(false);
  const [resultData, setResultData] = useState<Record<string, Record<number, number>>>({});
  // Always start with weights view when opening from History
  const [viewMode, setViewMode] = useState<'weights' | 'results'>('weights');
  
  // Track which categories are expanded (default: all closed)
  const [expandedCategories, setExpandedCategories] = useState<Set<CategoryName>>(new Set());
  
  const toggleCategory = (category: CategoryName) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };
  
  // Generate data for all domains (must be before userWeights)
  const generateInitialDomainsData = () => {
    try {
      const domainsData: Record<string, Record<number, Record<string, number | null>>> = {};
      
      if (!domains || domains.length === 0 || !llms || llms.length === 0) {
        return domainsData;
      }
      
      domains.forEach((domain) => {
        const rows: Record<number, Record<string, number | null>> = {};
        
        // Initialize rows
        parameters.forEach((_, paramIndex) => {
          rows[paramIndex] = {};
        });
        
        // Generate weights only for LLMs
        llms.forEach((llm) => {
          const weights = generateWeightsForColumn();
          weights.forEach((weight, paramIndex) => {
            if (rows[paramIndex]) {
              rows[paramIndex][llm] = weight;
            }
          });
        });
        
        // Participants columns are empty (null)
        if (participants && participants.length > 0) {
          participants.forEach((participant) => {
            parameters.forEach((_, paramIndex) => {
              if (rows[paramIndex]) {
                rows[paramIndex][participant.name] = null;
              }
            });
          });
        }
        
        domainsData[domain] = rows;
      });
      
      return domainsData;
    } catch (error) {
      console.error("Error generating initial domains data:", error);
      return {};
    }
  };
  
  const [allDomainsData, setAllDomainsData] = useState(() => generateInitialDomainsData());

  // User's custom weights for each domain - will be initialized in useEffect
  const [userWeights, setUserWeights] = useState<Record<string, Record<number, number | null>>>({});
  
  // Store initial weights (IIA defaults) for reset functionality
  const [initialUserWeights, setInitialUserWeights] = useState<Record<string, Record<number, number | null>>>({});
  
  // Category weights for user adjustment
  const [categoryWeights, setCategoryWeights] = useState<Record<string, Record<CategoryName, number>>>({});
  
  // LLM explanations for each LLM
  const [llmExplanations, setLlmExplanations] = useState<Record<string, string>>({});
  
  // Participant explanations
  const [participantExplanations, setParticipantExplanations] = useState<Record<string, string>>({});

  const currentDomain = (domains && domains.length > 0 && currentDomainIndex >= 0 && currentDomainIndex < domains.length) 
    ? domains[currentDomainIndex] 
    : (domains && domains.length > 0 ? domains[0] : "");
  const data = (currentDomain && allDomainsData && allDomainsData[currentDomain]) ? allDomainsData[currentDomain] : {};

  // Initialize or reset state when component mounts or formData changes
  useEffect(() => {
    const savedState = formData?.tableState;
    
    // Always ensure we have domain data
    if (savedState?.allDomainsData) {
      // Load saved state for this specific run
      setAllDomainsData(savedState.allDomainsData);
    } else {
      // Generate fresh data if not available
      setAllDomainsData(generateInitialDomainsData());
    }
    
    if (savedState) {
      
      if (savedState.userWeights) {
        setUserWeights(savedState.userWeights);
        // Save initial weights for IIA reset
        setInitialUserWeights(savedState.userWeights);
      } else {
        // Calculate initial userWeights using IIA defaults
        const initUserWeights = () => {
          const weights: Record<string, Record<number, number | null>> = {};
          const iiaDefaults = generateIIADefaultWeights();
          
          domains.forEach((domain) => {
            weights[domain] = {};
            // Initialize all to null first
            parameters.forEach((_, paramIndex) => {
              weights[domain][paramIndex] = null;
            });
            
            // Assign IIA default weights
            Object.keys(iiaDefaults).forEach((paramIndexStr) => {
              const paramIndex = parseInt(paramIndexStr);
              weights[domain][paramIndex] = iiaDefaults[paramIndex];
            });
          });
          
          return weights;
        };
        
        const initWeights = initUserWeights();
        setUserWeights(initWeights);
        // Save initial weights for IIA reset
        setInitialUserWeights(initWeights);
      }
      
      // Initialize category weights
      if (savedState.categoryWeights) {
        setCategoryWeights(savedState.categoryWeights);
      } else {
        const initCategoryWeights: Record<string, Record<CategoryName, number>> = {};
        domains.forEach((domain) => {
          initCategoryWeights[domain] = {} as Record<CategoryName, number>;
          Object.keys(CATEGORIES).forEach((categoryName) => {
            const category = categoryName as CategoryName;
            initCategoryWeights[domain][category] = CATEGORIES[category].defaultWeight;
          });
        });
        setCategoryWeights(initCategoryWeights);
      }
      
      // Initialize explanations
      if (savedState.llmExplanations) {
        setLlmExplanations(savedState.llmExplanations);
      } else {
        const explanations: Record<string, string> = {};
        llms.forEach((llm) => {
          explanations[llm] = generateLLMExplanation(llm);
        });
        setLlmExplanations(explanations);
      }
      
      if (savedState.participantExplanations) {
        setParticipantExplanations(savedState.participantExplanations);
      } else {
        const participantExpls: Record<string, string> = {};
        participants.forEach((p) => {
          participantExpls[p.name] = generateParticipantExplanation(p.name);
        });
        setParticipantExplanations(participantExpls);
      }
      
      if (savedState.resultData) {
        setResultData(savedState.resultData);
        setShowResultsTable(true);
      }
      if (savedState.llmWeight !== undefined) {
        setLlmWeight(savedState.llmWeight);
      } else {
        setLlmWeight(initialLlmWeight);
      }
      if (savedState.disabledLlms) {
        setDisabledLlms(new Set(savedState.disabledLlms));
      } else {
        setDisabledLlms(new Set());
      }
      if (savedState.disabledParticipants) {
        setDisabledParticipants(new Set(savedState.disabledParticipants));
      } else {
        setDisabledParticipants(new Set());
      }
      if (savedState.isMeDisabled !== undefined) {
        setIsMeDisabled(savedState.isMeDisabled);
      } else {
        setIsMeDisabled(false);
      }
      if (savedState.showResultsTable !== undefined) {
        setShowResultsTable(savedState.showResultsTable);
      } else {
        setShowResultsTable(false);
      }
      if (savedState.viewMode) {
        setViewMode(savedState.viewMode);
      } else {
        setViewMode('weights');
      }
    } else {
      // No saved state, but we already set allDomainsData above
      // Calculate initial userWeights using IIA defaults
      const initUserWeights = () => {
        const weights: Record<string, Record<number, number | null>> = {};
        const iiaDefaults = generateIIADefaultWeights();
        
        domains.forEach((domain) => {
          weights[domain] = {};
          // Initialize all to null first
          parameters.forEach((_, paramIndex) => {
            weights[domain][paramIndex] = null;
          });
          
          // Assign IIA default weights
          Object.keys(iiaDefaults).forEach((paramIndexStr) => {
            const paramIndex = parseInt(paramIndexStr);
            weights[domain][paramIndex] = iiaDefaults[paramIndex];
          });
        });
        
        return weights;
      };
      
      setUserWeights(initUserWeights());
      setLlmWeight(initialLlmWeight);
      setDisabledLlms(new Set());
      setDisabledParticipants(new Set());
      setIsMeDisabled(false);
      setShowResultsTable(false);
      setResultData({});
      setViewMode('weights');
      
      // Save initial weights for IIA reset
      setInitialUserWeights(initUserWeights());
      
      // Initialize category weights with defaults
      const initCategoryWeights: Record<string, Record<CategoryName, number>> = {};
      domains.forEach((domain) => {
        initCategoryWeights[domain] = {} as Record<CategoryName, number>;
        Object.keys(CATEGORIES).forEach((categoryName) => {
          const category = categoryName as CategoryName;
          initCategoryWeights[domain][category] = CATEGORIES[category].defaultWeight;
        });
      });
      setCategoryWeights(initCategoryWeights);
      
      // Generate explanations for LLMs
      const explanations: Record<string, string> = {};
      llms.forEach((llm) => {
        explanations[llm] = generateLLMExplanation(llm);
      });
      setLlmExplanations(explanations);
      
      // Generate explanations for participants
      const participantExpls: Record<string, string> = {};
      participants.forEach((p) => {
        participantExpls[p.name] = generateParticipantExplanation(p.name);
      });
      setParticipantExplanations(participantExpls);
    }
  }, [formData?.id, llms.length, participants.length, domains.length]); // Re-run when data structure changes

  // Function to set equal weights (Equal distribution)
  const handleEqualWeights = () => {
    // Calculate equal weight per parameter (with one decimal place)
    const paramCount = parameters.length;
    const equalWeightPerParam = parseFloat((100 / paramCount).toFixed(1));
    const totalFromEqual = equalWeightPerParam * paramCount;
    const remainder = parseFloat((100 - totalFromEqual).toFixed(1));
    
    setUserWeights((prevWeights) => {
      const newWeights = { ...prevWeights };
      
      domains.forEach((domain) => {
        newWeights[domain] = {};
        // Initialize all to null first
        parameters.forEach((_, paramIndex) => {
          newWeights[domain][paramIndex] = null;
        });
        
        // Set equal weights for all parameters
        parameters.forEach((_, paramIndex) => {
          // Last parameter gets the remainder to ensure sum is exactly 100.0
          if (paramIndex === parameters.length - 1) {
            const lastValue = parseFloat((equalWeightPerParam + remainder).toFixed(1));
            newWeights[domain][paramIndex] = Math.max(0, lastValue); // Ensure no negative
          } else {
            newWeights[domain][paramIndex] = Math.max(0, equalWeightPerParam); // Ensure no negative
          }
          // Ensure exactly 1 decimal place
          newWeights[domain][paramIndex] = parseFloat((newWeights[domain][paramIndex] || 0).toFixed(1));
        });
      });
      
      return newWeights;
    });
    
    // Update category weights to reflect equal distribution
    setCategoryWeights((prev) => {
      const newWeights = { ...prev };
      domains.forEach((domain) => {
        newWeights[domain] = {} as Record<CategoryName, number>;
        Object.keys(CATEGORIES).forEach((categoryName) => {
          const category = categoryName as CategoryName;
          const categoryParams = getParameterIndicesByCategory(category);
          const categoryWeight = parseFloat((equalWeightPerParam * categoryParams.length).toFixed(1));
          newWeights[domain][category] = Math.max(0, categoryWeight); // Ensure no negative
        });
      });
      return newWeights;
    });
  };

  // Function to update category weight and redistribute to parameters
  const handleCategoryWeightChange = (category: CategoryName, newWeight: number) => {
    // Ensure no negative values, clamp between 0 and 100, round to 1 decimal place
    const clampedWeight = Math.max(0, Math.min(100, newWeight));
    const roundedWeight = Math.round(clampedWeight * 10) / 10;
    const finalWeight = parseFloat(roundedWeight.toFixed(1));
    
    setCategoryWeights((prev) => {
      const newCategoryWeights = { ...prev };
      if (!newCategoryWeights[currentDomain]) {
        newCategoryWeights[currentDomain] = {} as Record<CategoryName, number>;
      }
      newCategoryWeights[currentDomain][category] = finalWeight;
      
      // Redistribute weight to all parameters in this category
      const categoryParams = getParameterIndicesByCategory(category);
      const paramCount = categoryParams.length;
      
      if (paramCount > 0) {
        const weightPerParam = parseFloat((finalWeight / paramCount).toFixed(1));
        
        setUserWeights((prevWeights) => {
          const newWeights = { ...prevWeights };
          if (!newWeights[currentDomain]) {
            newWeights[currentDomain] = {};
          }
          
          categoryParams.forEach((paramIndex, idx) => {
            // Last parameter gets the remainder to ensure sum equals category weight
            if (idx === categoryParams.length - 1) {
              const currentSum = categoryParams.slice(0, -1).reduce((sum, pIdx) => {
                return sum + (parseFloat((newWeights[currentDomain][pIdx] || 0).toFixed(1)));
              }, 0);
              const remainder = parseFloat((finalWeight - currentSum).toFixed(1));
              newWeights[currentDomain][paramIndex] = Math.max(0, remainder); // Ensure no negative
            } else {
              newWeights[currentDomain][paramIndex] = Math.max(0, weightPerParam); // Ensure no negative
            }
            // Ensure exactly 1 decimal place
            newWeights[currentDomain][paramIndex] = parseFloat((newWeights[currentDomain][paramIndex] || 0).toFixed(1));
          });
          
          return newWeights;
        });
      }
      
      return newCategoryWeights;
    });
  };

  // Function to reset to initial weights (IIA defaults)
  const handleResetToIIA = () => {
    const iiaDefaults = generateIIADefaultWeights();
    // Ensure all values have exactly 1 decimal place and no negatives
    Object.keys(iiaDefaults).forEach((key) => {
      const paramIndex = parseInt(key);
      iiaDefaults[paramIndex] = parseFloat(Math.max(0, iiaDefaults[paramIndex]).toFixed(1));
    });
    
    setUserWeights((prevWeights) => {
      const newWeights = { ...prevWeights };
      
      domains.forEach((domain) => {
        newWeights[domain] = {};
        // Initialize all to null first
        parameters.forEach((_, paramIndex) => {
          newWeights[domain][paramIndex] = null;
        });
        
        // Assign IIA default weights
        Object.keys(iiaDefaults).forEach((paramIndexStr) => {
          const paramIndex = parseInt(paramIndexStr);
          newWeights[domain][paramIndex] = iiaDefaults[paramIndex];
        });
      });
      
      return newWeights;
    });
    
    // Reset category weights to defaults
    setCategoryWeights((prev) => {
      const newWeights = { ...prev };
      domains.forEach((domain) => {
        newWeights[domain] = {} as Record<CategoryName, number>;
        Object.keys(CATEGORIES).forEach((categoryName) => {
          const category = categoryName as CategoryName;
          newWeights[domain][category] = CATEGORIES[category].defaultWeight;
        });
      });
      return newWeights;
    });
  };

  // Auto-save table state to localStorage whenever it changes
  useEffect(() => {
    const saveTableState = async () => {
      const session = getSession();
      if (session?.username && formData?.id && showResultsTable) {
        const tableState = {
          allDomainsData,
          userWeights,
          resultData,
          llmWeight,
          disabledLlms: Array.from(disabledLlms),
          disabledParticipants: Array.from(disabledParticipants),
          isMeDisabled,
          showResultsTable,
          viewMode: 'weights' as const, // Always save as weights to start there next time
          categoryWeights,
          llmExplanations,
          participantExplanations,
        };
        
        await updateRunTableState(session.username, formData.id, tableState);
      }
    };
    
    saveTableState();
  }, [
    allDomainsData,
    userWeights,
    resultData,
    llmWeight,
    disabledLlms,
    disabledParticipants,
    isMeDisabled,
    showResultsTable,
    formData,
    categoryWeights,
    llmExplanations,
    participantExplanations,
  ]);

  // Refresh participants data with new random weights (only for participants with no data)
  const handleRefreshParticipants = () => {
    if (participants.length === 0) return;
    
    setAllDomainsData((prevData) => {
      const newData = { ...prevData };
      
      // Update all domains
      domains.forEach((domain) => {
        const domainData = { ...newData[domain] };
        
        // Generate new weights only for participants without data
        participants.forEach((participant) => {
          // Check if this participant already has data
          const hasData = parameters.some((_, paramIndex) => {
            return domainData[paramIndex]?.[participant.name] !== null && 
                   domainData[paramIndex]?.[participant.name] !== undefined;
          });
          
          // Only generate new weights if participant has no data
          if (!hasData) {
            const weights = generateWeightsForColumn();
            weights.forEach((weight, paramIndex) => {
              if (!domainData[paramIndex]) {
                domainData[paramIndex] = {};
              }
              domainData[paramIndex] = {
                ...domainData[paramIndex],
                [participant.name]: weight,
              };
            });
          }
        });
        
        newData[domain] = domainData;
      });
      
      return newData;
    });
    
    toast.success("Participants data refreshed", {
      description: "New weights have been generated for participants without existing data.",
    });
  };

  const handleOpenEmailDialog = (participant: { name: string; email: string }) => {
    setSelectedParticipant(participant);
    setEmailSubject(`Reminder: Please complete your weights for the XRL research`);
    setEmailMessage(`Dear ${participant.name},

I hope this message finds you well.

We are currently conducting a research study using the XRL platform, and we would greatly appreciate your input by completing the weights table for the parameters we've identified.

Your expertise and insights are valuable to our analysis, and your contribution will help us generate more accurate results.

Please take a few moments to fill in your weights at your earliest convenience.

Thank you for your time and cooperation.

Best regards`);
    setShowEmailDialog(true);
  };

  const handleSendEmail = () => {
    // In the future, this will actually send an email
    // For now, just close the dialog and show success message
    console.log("Email would be sent to:", selectedParticipant?.email);
    console.log("Subject:", emailSubject);
    console.log("Message:", emailMessage);
    setShowEmailDialog(false);
    toast.success(`Email sent to ${selectedParticipant?.name}`, {
      description: "The reminder has been successfully sent.",
    });
  };

  // Handle user weight change
  const handleUserWeightChange = (paramIndex: number, value: string) => {
    // Parse as float to support decimals, clamp between 0 and 100, ensure no negatives
    let numValue: number | null = null;
    if (value !== "" && value !== "-" && value !== ".") {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        // Ensure no negative values, clamp between 0 and 100, round to 1 decimal place
        const clamped = Math.max(0, Math.min(100, parsed));
        numValue = Math.round(clamped * 10) / 10;
        // Ensure exactly 1 decimal place (fix floating point issues)
        numValue = parseFloat(numValue.toFixed(1));
      }
    }
    setUserWeights((prev) => ({
      ...prev,
      [currentDomain]: {
        ...prev[currentDomain],
        [paramIndex]: numValue,
      },
    }));
  };

  // Calculate user's total for validation (only active parameters)
  // Calculate total of user weights (sum all parameters)
  const calculateUserTotal = (): number => {
    if (!userWeights[currentDomain]) return 0;
    return parameters.reduce((sum, _, paramIndex) => {
      const value = userWeights[currentDomain][paramIndex];
      return sum + (value || 0);
    }, 0);
  };

  // Toggle column enabled/disabled state
  const toggleLlmColumn = (llm: string) => {
    setDisabledLlms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(llm)) {
        newSet.delete(llm);
      } else {
        newSet.add(llm);
      }
      return newSet;
    });
  };

  const toggleParticipantColumn = (participantName: string) => {
    setDisabledParticipants(prev => {
      const newSet = new Set(prev);
      if (newSet.has(participantName)) {
        newSet.delete(participantName);
      } else {
        newSet.add(participantName);
      }
      return newSet;
    });
  };

  // Calculate final weight for a parameter row
  const calculateFinalWeight = (paramIndex: number): number => {
    // Calculate average LLM weight (only enabled LLMs)
    let llmSum = 0;
    let llmCount = 0;
    llms.forEach((llm) => {
      if (!disabledLlms.has(llm)) {
        const value = data[paramIndex][llm];
        if (value !== null) {
          llmSum += value;
          llmCount++;
        }
      }
    });
    const llmAvg = llmCount > 0 ? llmSum / llmCount : 0;
    
    // Calculate combined human weight (Me + other participants, only enabled)
    let humanSum = 0;
    let humanCount = 0;
    
    // Add user's weight if enabled
    if (!isMeDisabled && userWeights[currentDomain]) {
      const meValue = userWeights[currentDomain][paramIndex];
      if (meValue !== null && meValue !== undefined) {
        humanSum += meValue;
        humanCount++;
      }
    }
    
    // Add other participants' weights (only enabled)
    participants.forEach((participant) => {
      if (!disabledParticipants.has(participant.name)) {
        const value = data[paramIndex][participant.name];
        if (value !== null) {
          humanSum += value;
          humanCount++;
        }
      }
    });
    
    const humanAvg = humanCount > 0 ? humanSum / humanCount : 0;
    
    // Weighted average: LLM vs Human (including Me)
    const llmWeightPercent = llmWeight / 100;
    const humanWeightPercent = (100 - llmWeight) / 100;
    
    return llmAvg * llmWeightPercent + humanAvg * humanWeightPercent;
  };

  const handlePreviousDomain = () => {
    if (currentDomainIndex > 0) {
      setCurrentDomainIndex(currentDomainIndex - 1);
    }
  };

  const handleNextDomain = () => {
    if (currentDomainIndex < domains.length - 1) {
      setCurrentDomainIndex(currentDomainIndex + 1);
    }
  };

  // Validate and confirm weights
  const handleConfirmWeights = () => {
    // Check if Me column sum is 100
    const meTotal = calculateUserTotal();
    if (Math.abs(meTotal - 100) > 0.05 && meTotal > 0) { // Allow small rounding differences
      toast.error("YOU column total must equal 100", {
        description: `Current total: ${meTotal.toFixed(1)}. Please adjust your weights.`,
      });
      return;
    }

    // Check if all participants have data
    if (participants.length > 0) {
      const missingParticipants: string[] = [];
      participants.forEach((participant) => {
        const hasData = parameters.some((_, paramIndex) => {
          const value = data[paramIndex][participant.name];
          return value !== null && value !== undefined;
        });
        if (!hasData) {
          missingParticipants.push(participant.name);
        }
      });

      if (missingParticipants.length > 0) {
        // Show warning dialog asking if user wants to continue
        setMissingParticipantsList(missingParticipants);
        setShowMissingDataDialog(true);
        return;
      }
    }

    // All checks passed - show confirmation dialog
    setShowConfirmDialog(true);
  };

  // Calculate final weight for a specific domain
  const calculateFinalWeightForDomain = (domainName: string, paramIndex: number): number => {
    const domainData = allDomainsData[domainName];
    
    // Calculate average LLM weight (only enabled LLMs)
    let llmSum = 0;
    let llmCount = 0;
    llms.forEach((llm) => {
      if (!disabledLlms.has(llm)) {
        const value = domainData[paramIndex][llm];
        if (value !== null) {
          llmSum += value;
          llmCount++;
        }
      }
    });
    const llmAvg = llmCount > 0 ? llmSum / llmCount : 0;
    
    // Calculate combined human weight (Me + other participants, only enabled)
    let humanSum = 0;
    let humanCount = 0;
    
    // Add user's weight if enabled
    if (!isMeDisabled) {
      const meValue = userWeights[domainName][paramIndex];
      if (meValue !== null && meValue !== undefined) {
        humanSum += meValue;
        humanCount++;
      }
    }
    
    // Add other participants' weights (only enabled)
    participants.forEach((participant) => {
      if (!disabledParticipants.has(participant.name)) {
        const value = domainData[paramIndex][participant.name];
        if (value !== null) {
          humanSum += value;
          humanCount++;
        }
      }
    });
    
    const humanAvg = humanCount > 0 ? humanSum / humanCount : 0;
    
    // Weighted average: LLM vs Human (including Me)
    const llmWeightPercent = llmWeight / 100;
    const humanWeightPercent = (100 - llmWeight) / 100;
    
    return llmAvg * llmWeightPercent + humanAvg * humanWeightPercent;
  };

  // Generate realistic result data for all domains based on parameter types
  // Function to generate dummy results (fallback)
  const generateDummyResults = (): Record<string, Record<number, number>> => {
    const results: Record<string, Record<number, number>> = {};
    
    domains.forEach((domain) => {
      results[domain] = {};
      
      // Domain seed for variation between sectors
      const domainSeed = domain.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const domainMultiplier = 0.8 + (domainSeed % 40) / 100; // 0.8 to 1.2
      
      // Generate results for all parameters
      parameters.forEach((_, paramIndex) => {
        // Get the final weight for this domain and parameter
        const finalWeight = calculateFinalWeightForDomain(domain, paramIndex);
        const weightInfluence = finalWeight / 10; // 0-10 range
        
        let result: number;
        
        switch (paramIndex) {
          case 0: // Number of IPOs (baseline: 15)
            result = Math.round((10 + weightInfluence * 3 + Math.random() * 10) * domainMultiplier);
            break;
          case 1: // Acquisitions/Mergers (baseline: 220)
            result = Math.round((150 + weightInfluence * 30 + Math.random() * 100) * domainMultiplier);
            break;
          case 2: // Active Companies (baseline: 3,200)
            result = Math.round((2500 + weightInfluence * 300 + Math.random() * 1000) * domainMultiplier);
            break;
          case 3: // New Companies (baseline: 900)
            result = Math.round((600 + weightInfluence * 100 + Math.random() * 400) * domainMultiplier);
            break;
          case 4: // Pre-Seed & Seed (baseline: 1,200)
            result = Math.round((800 + weightInfluence * 150 + Math.random() * 500) * domainMultiplier);
            break;
          case 5: // Series A (baseline: 650)
            result = Math.round((450 + weightInfluence * 80 + Math.random() * 300) * domainMultiplier);
            break;
          case 6: // Series B-C (baseline: 380)
            result = Math.round((250 + weightInfluence * 50 + Math.random() * 180) * domainMultiplier);
            break;
          case 8: // Series A/Seed Ratio (baseline: ~54%)
            result = parseFloat((45 + weightInfluence * 3 + Math.random() * 15).toFixed(1));
            break;
          case 10: // Average Company Age (baseline: ~7.5 years)
            result = parseFloat((6 + weightInfluence * 0.5 + Math.random() * 2.5).toFixed(1));
            break;
          default:
            // Should not happen for active parameters, but safety fallback
            result = 0;
        }
        
        results[domain][paramIndex] = result;
      });
    });
    
    return results;
  };

  const handleFinalConfirm = async () => {
    setShowConfirmDialog(false);
    
    // Try to fetch results from n8n
    const runId = formData?.id?.toString();
    let n8nData: Record<string, Record<number, number>> | null = null;
    
    if (runId) {
      try {
        // Fetch data from n8n (you may need to adjust this URL based on your n8n setup)
        const response = await fetch(`https://shooky5.app.n8n.cloud/webhook-test/XRL_DataToPlatform?runId=${runId}`);
        if (response.ok) {
          const data = await response.json();
          // Check if data has results structure
          if (data && data.results) {
            n8nData = data.results;
          } else if (data && typeof data === 'object') {
            // If data is already in the correct format
            n8nData = data;
          }
        }
      } catch (error) {
        console.error("Failed to fetch data from n8n:", error);
      }
    }
    
    // If no data from n8n, show warning and use dummy data
    if (!n8nData) {
      toast.warning("No data received from n8n", {
        description: "Displaying dummy data. Real data will be available once n8n processing is complete.",
        duration: 5000,
      });
      n8nData = generateDummyResults();
    } else {
      toast.success("Real data loaded from n8n", {
        description: "Displaying actual results from n8n processing.",
        duration: 3000,
      });
    }
    
    setResultData(n8nData);
    setShowResultsTable(true);
    setViewMode('results');
  };

  // Ensure userWeights is initialized for currentDomain
  useEffect(() => {
    if (currentDomain && !userWeights[currentDomain]) {
      // Initialize userWeights for current domain if not exists
      setUserWeights((prev) => {
        const newWeights = { ...prev };
        if (!newWeights[currentDomain]) {
          newWeights[currentDomain] = {};
          parameters.forEach((_, paramIndex) => {
            newWeights[currentDomain][paramIndex] = null;
          });
          // Set IIA defaults
          const iiaDefaults = generateIIADefaultWeights();
          Object.keys(iiaDefaults).forEach((paramIndexStr) => {
            const paramIndex = parseInt(paramIndexStr);
            newWeights[currentDomain][paramIndex] = iiaDefaults[paramIndex];
          });
        }
        return newWeights;
      });
    }
  }, [currentDomain]);

  // Don't render if essential data is not loaded yet
  if (domains.length === 0) {
    return (
      <Card className="mt-6 shadow-lg mx-auto w-full max-w-[95vw] p-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No domains available</p>
        </div>
      </Card>
    );
  }

  if (!currentDomain || Object.keys(data).length === 0) {
    return (
      <Card className="mt-6 shadow-lg mx-auto w-full max-w-[95vw] p-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading table data...</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="mt-6 shadow-lg mx-auto w-full max-w-[95vw]">
        <CardHeader>
          <div className="flex flex-row items-center justify-between">
            <CardTitle>Results</CardTitle>
            <div className="flex items-center gap-2">
              {formData && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowParametersDialog(true)}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        View Parameters
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View all form parameters</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {participants.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleRefreshParticipants}
                        className={getButtonClasses()}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Refresh
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Generate weights for participants without existing data</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {!showResultsTable && (
                <Button 
                  onClick={handleConfirmWeights}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Confirm
                </Button>
              )}
              {showResultsTable && (
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setViewMode('weights')}
                    variant={viewMode === 'weights' ? 'default' : 'outline'}
                    size="sm"
                  >
                    Weights
                  </Button>
                  <Button 
                    onClick={() => setViewMode('results')}
                    variant={viewMode === 'results' ? 'default' : 'outline'}
                    size="sm"
                  >
                    Results
                  </Button>
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {viewMode === 'weights' && domains.length > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousDomain}
                disabled={currentDomainIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Sector</p>
                <p className="text-lg font-semibold">{currentDomain}</p>
                <p className="text-xs text-muted-foreground">{currentDomainIndex + 1} of {domains.length}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextDomain}
                disabled={currentDomainIndex === domains.length - 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
          {viewMode === 'weights' && domains.length === 1 && (
            <div className="text-center mt-2 pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground">Sector</p>
              <p className="text-lg font-semibold">{currentDomain}</p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {viewMode === 'weights' && (
          <>
          <div className="overflow-x-auto">
            <table className="border-collapse mx-auto" style={{ width: '100%', maxWidth: '100%', tableLayout: 'auto' }}>
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-center p-2 font-semibold text-foreground bg-background whitespace-nowrap" style={{ width: 'auto', minWidth: '150px', maxWidth: '200px' }}>
                    Parameter
                  </th>
                  <th className={`text-center p-1.5 font-semibold whitespace-nowrap ${isMeDisabled ? 'text-muted-foreground bg-muted/30' : ''}`} style={{ 
                    width: 'auto', 
                    minWidth: '100px',
                    ...(isMeDisabled ? {} : {
                      color: `hsl(var(--primary))`,
                      backgroundColor: `var(--primary-ghost-hex)`,
                    })
                  }}>
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1">
                        <span className="font-bold">YOU</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={handleEqualWeights}>
                              <span className="text-sm">Equal</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleResetToIIA}>
                              <span className="text-sm">IIA</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => setIsMeDisabled(!isMeDisabled)}
                      >
                        {isMeDisabled ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                    </div>
                  </th>
                  {llms.map((llm, idx) => {
                    const isDisabled = disabledLlms.has(llm);
                    return (
                      <th key={idx} className={`text-center p-1.5 font-semibold whitespace-nowrap ${isDisabled ? 'text-muted-foreground bg-muted/30' : 'text-foreground'}`} style={{ width: 'auto', minWidth: '100px' }}>
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1">
                            <span>{llm}</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <HelpCircle className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-md">
                                  <p className="break-words whitespace-pre-line">{llmExplanations[llm] || "No explanation available."}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => toggleLlmColumn(llm)}
                          >
                            {isDisabled ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                        </div>
                      </th>
                    );
                  })}
                  {participants.map((participant, idx) => {
                    const isDisabled = disabledParticipants.has(participant.name);
                    // Check if participant has any values entered
                    const hasValues = parameters.some((_, paramIndex) => {
                      const value = data[paramIndex]?.[participant.name];
                      return value !== null && value !== undefined;
                    });
                    
                    return (
                      <th key={`participant-${idx}`} className={`text-center p-1.5 font-semibold whitespace-nowrap ${isDisabled ? 'text-muted-foreground bg-muted/30' : 'text-foreground'}`} style={{ width: 'auto', minWidth: '120px' }}>
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1">
                            <span>{participant.name}</span>
                            {hasValues && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-4 w-4"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <HelpCircle className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom" className="max-w-md">
                                    <p className="break-words whitespace-pre-line">{participantExplanations[participant.name] || "No explanation available."}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleOpenEmailDialog(participant)}
                            >
                              <Mail className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => toggleParticipantColumn(participant.name)}
                          >
                            {isDisabled ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                        </div>
                      </th>
                    );
                  })}
                  <th className="text-center p-1.5 font-semibold text-foreground bg-primary/10 whitespace-nowrap" style={{ width: 'auto', minWidth: '100px' }}>
                    Final Weight
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(CATEGORIES).map((categoryName) => {
                  const category = categoryName as CategoryName;
                  const categoryParams = getParameterIndicesByCategory(category);
                  const categoryWeight = categoryWeights[currentDomain]?.[category] || CATEGORIES[category].defaultWeight;
                  
                  return (
                    <Fragment key={category}>
                      {/* Category header row */}
                      <tr className="border-b-2 border-border bg-accent/60 hover:bg-accent/70 font-semibold cursor-pointer transition-colors shadow-sm" onClick={() => toggleCategory(category)}>
                        <td className="p-2 bg-background text-center whitespace-nowrap" style={{ width: 'auto', minWidth: '150px', maxWidth: '200px' }}>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCategory(category);
                              }}
                            >
                              {expandedCategories.has(category) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                            <span className="text-base font-bold">{category}</span>
                            <span className="text-xs text-muted-foreground font-normal">
                              ({categoryParams.length})
                            </span>
                          </div>
                        </td>
                        <td className={`p-1.5 ${isMeDisabled ? 'bg-muted/30' : ''}`} style={isMeDisabled ? {} : { backgroundColor: `var(--primary-ghost-hex)` }} onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-col items-center gap-1">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={categoryWeight.toFixed(1)}
                              onChange={(e) => handleCategoryWeightChange(category, parseFloat(e.target.value) || 0)}
                              className="w-18 h-7 text-center text-xs font-semibold"
                              style={isMeDisabled ? {} : { borderColor: `var(--primary-hex)` }}
                              disabled={isMeDisabled}
                            />
                          </div>
                        </td>
                        {/* LLM category totals */}
                        {llms.map((llm, llmIdx) => {
                          const isDisabled = disabledLlms.has(llm);
                          const categoryTotal = categoryParams.reduce((sum, paramIndex) => {
                            const value = data[paramIndex][llm];
                            return sum + (value !== null && value !== undefined ? value : 0);
                          }, 0);
                          return (
                            <td key={`llm-cat-${llmIdx}`} className={`text-center p-1.5 text-sm font-semibold ${isDisabled ? 'bg-muted/30 text-muted-foreground' : 'text-foreground'}`}>
                              {categoryTotal.toFixed(1)}
                            </td>
                          );
                        })}
                        {/* Participant category totals */}
                        {participants.map((participant, partIdx) => {
                          const isDisabled = disabledParticipants.has(participant.name);
                          const categoryTotal = categoryParams.reduce((sum, paramIndex) => {
                            const value = data[paramIndex][participant.name];
                            return sum + (value !== null && value !== undefined ? value : 0);
                          }, 0);
                          const hasData = categoryParams.some((paramIndex) => data[paramIndex][participant.name] !== null);
                          return (
                            <td key={`participant-cat-${partIdx}`} className={`text-center p-1.5 text-sm font-semibold ${isDisabled ? 'bg-muted/30 text-muted-foreground' : ''}`}>
                              {hasData ? categoryTotal.toFixed(1) : '-'}
                            </td>
                          );
                        })}
                        <td className="text-center p-1.5 text-foreground text-sm font-semibold bg-primary/5">
                          {categoryParams.reduce((sum, paramIndex) => sum + calculateFinalWeight(paramIndex), 0).toFixed(1)}
                        </td>
                      </tr>
                      {/* Parameters in this category - only show if expanded */}
                      {expandedCategories.has(category) && categoryParams.map((paramIndex) => {
                        const param = parameters[paramIndex];
                        return (
                          <tr key={paramIndex} className="border-b border-border hover:bg-accent/50 transition-colors">
                            <td className="p-2 bg-background text-center whitespace-nowrap" style={{ width: 'auto', minWidth: '150px', maxWidth: '200px' }}>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="font-medium text-foreground cursor-help text-sm">
                                      {param.short}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="max-w-md">
                                    <p className="break-words">{param.full}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </td>
                            <td className={`p-1.5 ${isMeDisabled ? 'bg-muted/30' : ''}`} style={isMeDisabled ? {} : { backgroundColor: `var(--primary-ghost-hex)` }}>
                              <div className="flex justify-center items-center">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  value={userWeights[currentDomain]?.[paramIndex] !== null && userWeights[currentDomain]?.[paramIndex] !== undefined ? userWeights[currentDomain][paramIndex]!.toFixed(1) : ""}
                                  onChange={(e) => handleUserWeightChange(paramIndex, e.target.value)}
                                  className={`w-16 h-7 text-center text-xs font-semibold ${isMeDisabled ? 'opacity-50' : ''}`}
                                  style={isMeDisabled ? {} : { borderColor: `var(--primary-hex)` }}
                                  placeholder="-"
                                  disabled={isMeDisabled}
                                />
                              </div>
                            </td>
                            {llms.map((llm, colIndex) => {
                              const isDisabled = disabledLlms.has(llm);
                              return (
                                <td key={colIndex} className={`text-center p-1.5 text-sm ${isDisabled ? 'bg-muted/30 text-muted-foreground' : 'text-foreground'}`}>
                                  {data[paramIndex][llm]}
                                </td>
                              );
                            })}
                            {participants.map((participant, colIndex) => {
                              const value = data[paramIndex][participant.name];
                              const isDisabled = disabledParticipants.has(participant.name);
                              return (
                                <td key={`participant-${colIndex}`} className={`text-center p-1.5 text-sm ${isDisabled ? 'bg-muted/30 text-muted-foreground' : ''}`}>
                                  {value !== null && value !== undefined ? (
                                    <span className={isDisabled ? 'text-muted-foreground' : 'text-foreground'}>{value}</span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="text-center p-1.5 text-foreground text-sm font-semibold bg-primary/5">
                              {calculateFinalWeight(paramIndex).toFixed(1)}
                            </td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  );
                })}
                <tr className="border-t-2 border-border font-semibold bg-accent/30">
                  <td className="p-1.5 bg-background text-center whitespace-nowrap">Total</td>
                  <td className={`text-center p-1.5 text-sm font-semibold ${
                    isMeDisabled 
                      ? 'bg-muted/30 text-muted-foreground' 
                      : ''
                  } ${
                    !isMeDisabled && Math.abs(calculateUserTotal() - 100) > 0.05 && calculateUserTotal() > 0
                      ? "text-red-600 dark:text-red-400"
                      : ""
                  }`}>
                    {calculateUserTotal().toFixed(1)}
                    {!isMeDisabled && Math.abs(calculateUserTotal() - 100) > 0.05 && calculateUserTotal() > 0 && (
                      <span className="text-xs ml-1">(!)</span>
                    )}
                  </td>
                  {llms.map((llm, idx) => {
                    const sum = parameters.reduce((acc, _, paramIndex) => {
                      const value = data[paramIndex][llm];
                      return acc + (value || 0);
                    }, 0);
                    const isDisabled = disabledLlms.has(llm);
                    return (
                      <td key={idx} className={`text-center p-1.5 text-sm ${isDisabled ? 'bg-muted/30 text-muted-foreground' : 'text-foreground'}`}>
                        {Math.round(sum)}
                      </td>
                    );
                  })}
                  {participants.map((participant, idx) => {
                    const sum = parameters.reduce((acc, _, paramIndex) => {
                      const value = data[paramIndex][participant.name];
                      return acc + (value || 0);
                    }, 0);
                    const hasData = parameters.some((_, paramIndex) => data[paramIndex][participant.name] !== null);
                    const isDisabled = disabledParticipants.has(participant.name);
                    return (
                      <td key={`participant-total-${idx}`} className={`text-center p-1.5 text-sm ${isDisabled ? 'bg-muted/30 text-muted-foreground' : ''}`}>
                        {hasData ? (
                          <span className={`font-semibold ${isDisabled ? 'text-muted-foreground' : 'text-foreground'}`}>{Math.round(sum)}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="text-center p-1.5 text-foreground text-sm font-semibold bg-primary/10">
                    {parameters.reduce((sum, _, paramIndex) => sum + calculateFinalWeight(paramIndex), 0).toFixed(1)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* Confirm button at bottom */}
          {!showResultsTable && (
            <div className="mt-6 pt-6 border-t border-border flex justify-end">
              <Button 
                onClick={handleConfirmWeights}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Confirm
              </Button>
            </div>
          )}
          
          {/* Weight Slider */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Adjust Weight Distribution</Label>
                <div className="text-sm text-muted-foreground">
                  LLM: <span className="font-semibold text-foreground">{llmWeight}%</span> | 
                  Human: <span className="font-semibold text-foreground">{100 - llmWeight}%</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground min-w-[80px] text-left">
                  100% Human<br/>
                  <span className="text-xs">(0% LLM)</span>
                </div>
                <Slider
                  value={[llmWeight]}
                  onValueChange={(value) => setLlmWeight(value[0])}
                  min={0}
                  max={100}
                  step={25}
                  className="flex-1"
                />
                <div className="text-sm text-muted-foreground min-w-[80px] text-right">
                  100% LLM<br/>
                  <span className="text-xs">(0% Human)</span>
                </div>
              </div>
              
              {/* Marks for slider positions */}
              <div className="flex justify-between px-[80px] text-xs text-muted-foreground">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
            </div>
          </div>
          </>
          )}

          {viewMode === 'results' && showResultsTable && (
            <div className="overflow-x-auto">
              <table className="border-collapse mx-auto" style={{ width: '100%', maxWidth: '100%', tableLayout: 'auto' }}>
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-center p-2 font-semibold text-foreground bg-background whitespace-nowrap" style={{ width: 'auto', minWidth: '150px', maxWidth: '200px' }}>
                      Parameter
                    </th>
                    {domains.map((domain, idx) => (
                      <th key={idx} className="text-center p-2 font-semibold text-foreground whitespace-nowrap" style={{ width: 'auto', minWidth: '150px' }}>
                        {domain}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(CATEGORIES).map((categoryName) => {
                    const category = categoryName as CategoryName;
                    const categoryParams = getParameterIndicesByCategory(category);
                    
                    return (
                      <Fragment key={category}>
                        {/* Category header row */}
                        <tr className="border-b-2 border-border bg-accent/60 hover:bg-accent/70 font-semibold cursor-pointer transition-colors shadow-sm" onClick={() => toggleCategory(category)}>
                          <td className="p-2 bg-background text-center whitespace-nowrap" style={{ width: 'auto', minWidth: '150px', maxWidth: '200px' }}>
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCategory(category);
                                }}
                              >
                                {expandedCategories.has(category) ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                              <span className="text-base font-bold text-foreground">{category}</span>
                              <span className="text-xs text-muted-foreground font-normal">
                                ({categoryParams.length})
                              </span>
                            </div>
                          </td>
                          {domains.map((domain, domainIdx) => {
                            // Check if category has any data
                            const hasData = categoryParams.some((paramIndex) => 
                              resultData[domain]?.[paramIndex] !== null && 
                              resultData[domain]?.[paramIndex] !== undefined
                            );
                            
                            return (
                              <td key={domainIdx} className="text-center p-2 text-foreground text-sm font-semibold bg-green-50 dark:bg-green-950/30">
                                {hasData ? (
                                  <span className="text-muted-foreground">—</span>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                        {/* Parameters in this category - only show if expanded */}
                        {expandedCategories.has(category) && categoryParams.map((paramIndex) => {
                          const param = parameters[paramIndex];
                          return (
                            <tr key={paramIndex} className="border-b border-border hover:bg-accent/50 transition-colors">
                              <td className="p-2 bg-background text-center whitespace-nowrap" style={{ width: 'auto', minWidth: '150px', maxWidth: '200px' }}>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="font-medium text-foreground cursor-help text-sm">
                                        {param.short}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="max-w-md">
                                      <p className="break-words">{param.full}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </td>
                              {domains.map((domain, domainIdx) => {
                                const value = resultData[domain]?.[paramIndex];
                                return (
                                  <td key={domainIdx} className="text-center p-2 text-foreground text-sm font-semibold bg-green-50 dark:bg-green-950/30">
                                    {(() => {
                                      if (value === undefined || value === null) return "-";
                                      
                                      // Format based on parameter type
                                      if (paramIndex === 8) return `${value}%`; // Ratio percentage
                                      if (paramIndex === 9) return value.toFixed(2); // New Blood Flow (decimal)
                                      if (paramIndex === 10) return `${value} yrs`; // Average age in years
                                      return Math.round(value).toString(); // Whole numbers for counts
                                    })()}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Send Reminder Email</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email-to">To</Label>
              <Input
                id="email-to"
                value={selectedParticipant?.email || ""}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email-message">Message</Label>
              <Textarea
                id="email-message"
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={12}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} className={getButtonClasses()}>
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showMissingDataDialog} onOpenChange={setShowMissingDataDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Missing Participant Data</AlertDialogTitle>
            <AlertDialogDescription>
              The following participants have not filled in their weights:
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md">
                <ul className="list-disc list-inside space-y-1">
                  {missingParticipantsList.map((name, idx) => (
                    <li key={idx} className="text-foreground font-medium">{name}</li>
                  ))}
                </ul>
              </div>
              <p className="mt-3">
                Do you want to continue anyway? Results will be calculated without their input.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMissingParticipantsList([])}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setShowMissingDataDialog(false);
                setMissingParticipantsList([]);
                setShowConfirmDialog(true);
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Continue Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Weights</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleFinalConfirm}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showParametersDialog} onOpenChange={setShowParametersDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-lg">Additional Parameters</DialogTitle>
          </DialogHeader>
          {formData && (
            <div className="space-y-4 py-2">
              {/* Secondary Category */}
              {formData.secondary_category && formData.secondary_category.length > 0 && (
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Secondary Categories</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.secondary_category.map((cat: string, idx: number) => (
                      <span key={idx} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-foreground rounded-full text-xs font-medium">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Goals */}
              {formData.goals && formData.goals.length > 0 && (
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Goals</Label>
                  <div className="space-y-1.5">
                    {formData.goals.map((goal: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-foreground mt-1">•</span>
                        <span className="text-sm text-foreground">{goal}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Users */}
              {formData.users && formData.users.length > 0 && (
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Target Users</Label>
                  <div className="space-y-1.5">
                    {formData.users.map((user: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-foreground mt-1">•</span>
                        <span className="text-sm text-foreground">{user}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Geography */}
              {formData.geography && formData.geography.length > 0 && (
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Geography</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.geography.map((geo: string, idx: number) => (
                      <span key={idx} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-foreground rounded-full text-xs font-medium">
                        {geo}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Compliance */}
              {formData.compliance && formData.compliance.length > 0 && (
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Compliance</Label>
                  <div className="space-y-1.5">
                    {formData.compliance.map((comp: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-foreground mt-1">•</span>
                        <span className="text-sm text-foreground">{comp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {/* Time Horizon */}
                {formData.time_horizon && (
                  <div className="rounded-lg border border-border p-3 space-y-2">
                    <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Time Horizon</Label>
                    <p className="text-sm text-foreground font-medium">{formData.time_horizon}</p>
                  </div>
                )}

                {/* Risk Posture */}
                {formData.risk_posture && (
                  <div className="rounded-lg border border-border p-3 space-y-2">
                    <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Risk Posture</Label>
                    <p className="text-sm text-foreground font-medium">{formData.risk_posture}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="mt-2">
            <Button onClick={() => setShowParametersDialog(false)} className={getButtonClasses()}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

