import { useState, useEffect, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Mail, ChevronLeft, ChevronRight, RefreshCw, Eye, EyeOff, FileText, CheckCircle, MoreVertical, HelpCircle, ChevronDown, ChevronUp, Info, Building2 } from "lucide-react";
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
import { fetchResultsFromN8n, fetchLatestResults } from "@/lib/api";

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
  format?: "percentage" | "currency" | "count";
}

// Organized parameters by category
const parameters: Parameter[] = [
  // Competition (9 parameters - only those that appear in results: 0-8)
  { short: "IPOs Worldwide", full: "Number of IPOs in the sector worldwide in the past 5 years (2020–2025)", category: "Competition", format: "count" },
  { short: "M&A Worldwide", full: "Number of companies worldwide that were acquired or merged in the past 5 years (2020–2025)", category: "Competition", format: "count" },
  { short: "Active Companies Worldwide", full: "Number of active companies in the sector worldwide", category: "Competition", format: "count" },
  { short: "New Companies Worldwide", full: "Number of new companies in the past 5 years (2020–2025)", category: "Competition", format: "count" },
  { short: "Pre-Seed & Seed Worldwide", full: "Number of companies in the sector worldwide that raised Pre-Seed & Seed rounds (2020–2025)", category: "Competition", format: "count" },
  { short: "Series A Worldwide", full: "Number of companies in the sector worldwide that raised a Series A round (2020–2025)", category: "Competition", format: "count" },
  { short: "Series B–C Worldwide", full: "Number of companies in the sector worldwide that raised Series B–C rounds (2020–2025)", category: "Competition", format: "count" },
  { short: "Series A/Seed Ratio Worldwide", full: "Ratio of companies that raised a Series A round out of those that raised a Seed round in the past 5 years (2020–2025)", category: "Competition", format: "percentage" },
  { short: "Avg Company Age Worldwide", full: "Average age of an active company worldwide", category: "Competition" },
  
  // Global Funding / Financing (5 parameters - indices 9-13, but n8n sends as 10-14)
  // Note: These are displayed at indices 9-13 in the array, but n8n will send them as parameters 10-14
  { short: "Total Capital Raised", full: "Total capital raised ($) (2020–2025)", category: "Global Funding / Financing", format: "currency" },
  { short: "Capital: Series A", full: "Total capital raised in Series A rounds ($) (2020–2025)", category: "Global Funding / Financing", format: "currency" },
  { short: "Capital: Series B–C", full: "Total capital raised in Series B–C rounds ($) (2020–2025)", category: "Global Funding / Financing", format: "currency" },
  { short: "Capital: Series D–J", full: "Total capital raised in Series D–J rounds ($) (2020–2025)", category: "Global Funding / Financing", format: "currency" },
  { short: "Avg IPO Amount", full: "Average IPO amount ($) for companies that went public between 2020–2025", category: "Global Funding / Financing", format: "currency" },
  
  // Human Capital (5 parameters)
  { short: "Employees in Sector", full: "Number of employees in the sector", category: "Human Capital", format: "count" },
  { short: "Incubators", full: "Number of incubators in the sector", category: "Human Capital" },
  { short: "Private Accelerators", full: "Number of private accelerators in the sector", category: "Human Capital" },
  { short: "Communities", full: "Number of communities in the sector", category: "Human Capital" },
  { short: "Training Programs", full: "Number of professional non-academic training programs and entrepreneurship support frameworks", category: "Human Capital" },
  
  // Companies / Firms (15 parameters)
  { short: "Active Companies Israel", full: "Number of active companies in the sector in Israel", category: "Companies / Firms", format: "count" },
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
  { short: "Total Capital Raised Israel", full: "Total capital raised ($) (2019–2025)", category: "Israeli Funding / Financing", format: "currency" },
  { short: "Capital: Seed Israel", full: "Total capital raised in Seed rounds ($) (2019–2025)", category: "Israeli Funding / Financing", format: "currency" },
  { short: "Capital: Series A Israel", full: "Total capital raised in Series A rounds ($) (2019–2025)", category: "Israeli Funding / Financing", format: "currency" },
  { short: "Capital: Series B–C Israel", full: "Total capital raised in Series B–C rounds ($) (2019–2025)", category: "Israeli Funding / Financing", format: "currency" },
  { short: "Capital: Series D–J Israel", full: "Total capital raised in Series D–J rounds ($) (2019–2025)", category: "Israeli Funding / Financing", format: "currency" },
  { short: "Foreign Investors", full: "Number of foreign investors", category: "Israeli Funding / Financing" },
  { short: "% Change Total Capital", full: "% change in total capital raised in the past 6 years (2019–2025 compared to 2014–2018)", category: "Israeli Funding / Financing", format: "percentage" },
  { short: "% Change Seed Capital", full: "% change in total capital raised in Seed rounds in the past 6 years (2019–2025 compared to 2014–2018)", category: "Israeli Funding / Financing", format: "percentage" },
  { short: "% Change Series A Capital", full: "% change in total capital raised in Series A rounds in the past 6 years (2019–2025 compared to 2014–2018)", category: "Israeli Funding / Financing", format: "percentage" },
  { short: "% Change Series B–C Capital", full: "% change in total capital raised in Series B–C rounds in the past 6 years (2019–2025 compared to 2014–2018)", category: "Israeli Funding / Financing", format: "percentage" },
  { short: "% Change Late-Stage Capital", full: "% change in total capital raised in late-stage rounds in the past 5 years (2019–2025 compared to 2014–2018)", category: "Israeli Funding / Financing", format: "percentage" },
  { short: "Avg IPO Amount Israel", full: "Average IPO amount ($) for companies that went public between 2019–2025", category: "Israeli Funding / Financing", format: "currency" },
  
  // Knowledge and Infrastructure (10 parameters)
  { short: "Market Size 2030", full: "Market size estimate for 2030", category: "Knowledge and Infrastructure" },
  { short: "Leading Researchers Worldwide", full: "Number of leading researchers worldwide", category: "Knowledge and Infrastructure" },
  { short: "Patents Worldwide", full: "Number of patents worldwide", category: "Knowledge and Infrastructure" },
  { short: "Top 50 Publications Worldwide", full: "Number of publications by the top 50 researchers published in the past 10 years worldwide", category: "Knowledge and Infrastructure" },
  { short: "Leading Researchers Israel", full: "Number of leading researchers in Israel", category: "Knowledge and Infrastructure" },
  { short: "Top 50 Publications Israel", full: "Number of publications by the top 50 researchers published in the past 10 years in Israel", category: "Knowledge and Infrastructure" },
  { short: "Patent Share Israel", full: "Share of patents registered in Israel relative to patents worldwide", category: "Knowledge and Infrastructure", format: "percentage" },
  { short: "Patents Registered Israel", full: "Number of patents registered in Israel", category: "Knowledge and Infrastructure" },
  { short: "ERC Projects", full: "Number of ERC projects in the field in the past 5 years", category: "Knowledge and Infrastructure" },
  { short: "Total ERC Grants", full: "Total ERC grants in the field (€) in the past 5 years", category: "Knowledge and Infrastructure", format: "currency" },
  
  // Academia (8 parameters - keeping existing)
  { short: "Academic Programs", full: "Number of academic programs related to the sector", category: "Academia" },
  { short: "Students Enrolled", full: "Number of students enrolled in sector-related programs", category: "Academia" },
  { short: "Faculty Members", full: "Number of faculty members teaching in sector-related programs", category: "Academia" },
  { short: "Research Labs", full: "Number of research labs focusing on the sector", category: "Academia" },
  { short: "Annual Graduates", full: "Number of graduates per year from sector-related programs", category: "Academia" },
  { short: "Industry Partnerships", full: "Number of industry-academia partnerships", category: "Academia" },
  { short: "Scholarships", full: "Number of scholarships dedicated to the sector", category: "Academia" },
  { short: "Exchange Programs", full: "Number of international exchange programs", category: "Academia" },
];

const EMPLOYEES_PARAM_INDEX = parameters.findIndex(p => p.short === "Employees in Sector");
const ACTIVE_COMPANIES_ISRAEL_INDEX = parameters.findIndex(p => p.short === "Active Companies Israel");
const ACTIVE_COMPANIES_WORLDWIDE_INDEX = parameters.findIndex(p => p.short === "Active Companies Worldwide");

// Parameters that have company lists
const SERIES_A_PARAM_INDEX = parameters.findIndex(p => p.short === "Series A Worldwide");
const SERIES_BC_PARAM_INDEX = parameters.findIndex(p => p.short === "Series B–C Worldwide");
const COMPANY_LIST_PARAMS = new Set([SERIES_A_PARAM_INDEX, SERIES_BC_PARAM_INDEX]);

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
  const [hasRealData, setHasRealData] = useState(false);
  
  // Company lists for Series A and Series B-C parameters
  const [companyLists, setCompanyLists] = useState<Record<number, Record<string, string[]>>>({});
  const [companyDialog, setCompanyDialog] = useState<{
    open: boolean;
    title: string;
    companies: string[];
  }>({
    open: false,
    title: "",
    companies: []
  });
  
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
      
      if (savedState.companyLists) {
        setCompanyLists(savedState.companyLists);
      } else {
        setCompanyLists({});
      }
      
      if (savedState.resultData) {
        const savedData = savedState.resultData;
        // Only restore if there's actual data
        const hasAnyData = Object.keys(savedData).some(domain => {
          const domainData = savedData[domain];
          return domainData && typeof domainData === 'object' && Object.keys(domainData).length > 0;
        });
        if (hasAnyData) {
          setResultData(savedData);
          setShowResultsTable(true);
          setHasRealData(true);
        }
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
          companyLists,
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
    companyLists,
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

  const formatNumberWithOneDecimal = (value: number, forceDecimal = false): string => {
    if (!Number.isFinite(value)) {
      return "-";
    }
    const options: Intl.NumberFormatOptions = forceDecimal
      ? { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: true }
      : { maximumFractionDigits: 1, useGrouping: true };
    return new Intl.NumberFormat(undefined, options).format(value);
  };

  const formatCount = (value: number): string => {
    if (!Number.isFinite(value)) {
      return "-";
    }
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0, useGrouping: true }).format(value);
  };

  const formatResultValue = (value: number, paramIndex: number): string => {
    if (!Number.isFinite(value)) {
      return "-";
    }
    const formatType = parameters[paramIndex]?.format;
    switch (formatType) {
      case "percentage":
        return `${formatNumberWithOneDecimal(value * 100, true)}%`;
      case "currency":
        return `${formatCount(value)} $`;
      case "count":
        return formatCount(value);
      default:
        return formatNumberWithOneDecimal(value);
    }
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
    
    if (humanCount > 0 && llmCount === 0) {
      return humanAvg;
    }
    if (llmCount > 0 && humanCount === 0) {
      return llmAvg;
    }
    if (llmCount === 0 && humanCount === 0) {
      return 0;
    }
    
    // Weighted average: LLM vs Human (including Me), normalized based on active columns
    const rawLlmWeight = llmWeight / 100;
    const rawHumanWeight = (100 - llmWeight) / 100;
    const totalWeight = rawLlmWeight + rawHumanWeight;
    if (totalWeight === 0) {
      return 0;
    }
    const normalizedLlmWeight = rawLlmWeight / totalWeight;
    const normalizedHumanWeight = rawHumanWeight / totalWeight;
    
    return llmAvg * normalizedLlmWeight + humanAvg * normalizedHumanWeight;
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
    
    if (humanCount > 0 && llmCount === 0) {
      return humanAvg;
    }
    if (llmCount > 0 && humanCount === 0) {
      return llmAvg;
    }
    if (llmCount === 0 && humanCount === 0) {
      return 0;
    }
    
    // Weighted average: LLM vs Human (including Me), normalized based on active columns
    const rawLlmWeight = llmWeight / 100;
    const rawHumanWeight = (100 - llmWeight) / 100;
    const totalWeight = rawLlmWeight + rawHumanWeight;
    if (totalWeight === 0) {
      return 0;
    }
    const normalizedLlmWeight = rawLlmWeight / totalWeight;
    const normalizedHumanWeight = rawHumanWeight / totalWeight;
    
    return llmAvg * normalizedLlmWeight + humanAvg * normalizedHumanWeight;
  };

  // Removed dummy results generation - only real data from n8n

  const handleFinalConfirm = async () => {
    setShowConfirmDialog(false);
    
    try {
      const data = await fetchLatestResults();
      
      if (data && data.matrix && Array.isArray(data.matrix) && data.matrix.length > 0) {
        // Convert matrix format to resultData format
        // matrix[paramIndex][domainIndex] = value
        const convertedData: Record<string, Record<number, number>> = {};
        
        console.log("Raw matrix data:", data.matrix);
        console.log("Matrix length (params):", data.matrix.length);
        console.log("First row length (domains):", data.matrix[0]?.length);
        
        domains.forEach((domain, domainIndex) => {
          // Start with existing data if available, don't overwrite with null
          convertedData[domain] = resultData[domain] ? { ...resultData[domain] } : {};
          data.matrix.forEach((row, paramIndex) => {
            const value = row[domainIndex];
            // Only update if value is not null/undefined/NaN
            if (value !== null && value !== undefined && !Number.isNaN(value)) {
              const actualParamIndex = RESULT_PARAMETER_INDEX_MAP[paramIndex] ?? paramIndex;
              if (parameters[actualParamIndex]) {
                convertedData[domain][actualParamIndex] = value;
              }
            }
            // If value is null, keep existing data (don't overwrite)
          });
        });
        
        console.log("Converted resultData - all domains:", Object.keys(convertedData));
        console.log("Parameters in first domain:", Object.keys(convertedData[domains[0]] || {}));
        console.log("Value for param 8 in first domain:", convertedData[domains[0]]?.[8]);
        console.log("Value for param 9 (n8n 10) in first domain:", convertedData[domains[0]]?.[9]);
        
        // Process company lists if available
        if (data.companyLists && typeof data.companyLists === 'object') {
          processCompanyLists(data.companyLists);
        }
        
        const filledData = applyFallbacksToResults(convertedData);
        setResultData(filledData);
        setShowResultsTable(true);
        setViewMode('results');
        setHasRealData(true);
        toast.success("Results loaded from n8n", {
          description: "Displaying actual results from n8n processing.",
          duration: 3000,
        });
      } else {
        // No data received - don't show results table
        setResultData({});
        setShowResultsTable(false);
        setHasRealData(false);
        toast.info("Results not ready yet", {
          description: "Data from n8n is still being processed. Results will appear automatically when ready.",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Failed to fetch data from n8n:", error);
      setResultData({});
      setShowResultsTable(false);
      setHasRealData(false);
      toast.info("Results not ready yet", {
        description: "Data from n8n is still being processed. Results will appear automatically when ready.",
        duration: 5000,
      });
    }
  };

  const processCompanyLists = (companyListsData: any) => {
    // Expected format: array of { index, domain, companies }
    if (!Array.isArray(companyListsData)) return;
    
    const newCompanyLists: Record<number, Record<string, string[]>> = {};
    
    companyListsData.forEach((item: any) => {
      if (!item || typeof item !== 'object') return;
      
      const { index, domain, companies } = item;
      if (typeof index !== 'number' || typeof domain !== 'string' || !Array.isArray(companies)) return;
      
      // Map domain name to actual domain from props
      const actualDomain = domains.find(d => d.toLowerCase() === domain.toLowerCase()) || domain;
      
      if (!newCompanyLists[index]) {
        newCompanyLists[index] = {};
      }
      
      newCompanyLists[index][actualDomain] = companies.filter(c => typeof c === 'string' && c.trim().length > 0);
    });
    
    setCompanyLists(prev => {
      const merged = { ...prev };
      Object.entries(newCompanyLists).forEach(([paramIndexStr, domainMap]) => {
        const paramIndex = parseInt(paramIndexStr);
        if (!merged[paramIndex]) {
          merged[paramIndex] = {};
        }
        Object.entries(domainMap).forEach(([domain, companies]) => {
          merged[paramIndex][domain] = companies;
        });
      });
      return merged;
    });
  };
  
  const handleOpenCompanyList = (paramIndex: number, domain: string) => {
    const companies = companyLists[paramIndex]?.[domain] || [];
    if (companies.length === 0) return;
    
    const param = parameters[paramIndex];
    const title = `${param?.full || param?.short || 'Companies'} — ${domain}`;
    
    setCompanyDialog({
      open: true,
      title,
      companies
    });
  };

  const handleShowResults = async () => {
    try {
      const data = await fetchLatestResults();
      
      if (data && data.matrix && Array.isArray(data.matrix) && data.matrix.length > 0) {
        // Convert matrix format to resultData format
        // matrix[paramIndex][domainIndex] = value
        const convertedData: Record<string, Record<number, number>> = {};
        
        console.log("Raw matrix data in handleShowResults:", data.matrix);
        console.log("Matrix length (params):", data.matrix.length);
        
        domains.forEach((domain, domainIndex) => {
          // Start with existing data if available, don't overwrite with null
          convertedData[domain] = resultData[domain] ? { ...resultData[domain] } : {};
          data.matrix.forEach((row, paramIndex) => {
            const value = row[domainIndex];
            // Only update if value is not null/undefined/NaN
            if (value !== null && value !== undefined && !Number.isNaN(value)) {
              const actualParamIndex = RESULT_PARAMETER_INDEX_MAP[paramIndex] ?? paramIndex;
              if (parameters[actualParamIndex]) {
                convertedData[domain][actualParamIndex] = value;
              }
            }
            // If value is null, keep existing data (don't overwrite)
          });
        });
        
        // Process company lists if available
        if (data.companyLists && typeof data.companyLists === 'object') {
          processCompanyLists(data.companyLists);
        }
        
        console.log("Converted resultData - all domains:", Object.keys(convertedData));
        console.log("Parameters in first domain:", Object.keys(convertedData[domains[0]] || {}));
        console.log("Value for param 8 in first domain:", convertedData[domains[0]]?.[8]);
        console.log("Value for param 9 (n8n 10) in first domain:", convertedData[domains[0]]?.[9]);
        
        const filledData = applyFallbacksToResults(convertedData);
        setResultData(filledData);
        setShowResultsTable(true);
        setViewMode('results');
        setHasRealData(true);
        toast.success("Results loaded from n8n");
      } else {
        toast.info("Results not ready yet", {
          description: "Data from n8n is still being processed. Please try again later.",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Failed to fetch results:", error);
      toast.error("Failed to load results", {
        description: "Could not retrieve results from n8n. Please try again later.",
        duration: 5000,
      });
    }
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

  const RESULT_PARAMETER_INDEX_MAP: Record<number, number> = {
    ...(ACTIVE_COMPANIES_WORLDWIDE_INDEX !== -1 ? { 14: ACTIVE_COMPANIES_WORLDWIDE_INDEX } : {}),
    ...(ACTIVE_COMPANIES_ISRAEL_INDEX !== -1 ? { 15: ACTIVE_COMPANIES_ISRAEL_INDEX } : {}),
    ...(EMPLOYEES_PARAM_INDEX !== -1 ? { 16: EMPLOYEES_PARAM_INDEX } : {}),
  }

  const RESULT_PARAMETER_SOURCES: Record<number, string> = (() => {
    const sources: Record<number, string> = {};
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].forEach((idx) => {
      sources[idx] = "Crunchbase";
    });
    if (EMPLOYEES_PARAM_INDEX !== -1) {
      sources[EMPLOYEES_PARAM_INDEX] = "IVC";
    }
    if (ACTIVE_COMPANIES_ISRAEL_INDEX !== -1) {
      sources[ACTIVE_COMPANIES_ISRAEL_INDEX] = "IVC";
    }
    if (ACTIVE_COMPANIES_WORLDWIDE_INDEX !== -1) {
      sources[ACTIVE_COMPANIES_WORLDWIDE_INDEX] = "IVC";
    }
    return sources;
  })();
  
  const RESULTS_ACTIVE_PARAMETER_INDICES = [
    0, 1, 2, 3, 4, 5, 6, 7, 8,
    9, 10, 11, 12, 13,
    ...(EMPLOYEES_PARAM_INDEX !== -1 ? [EMPLOYEES_PARAM_INDEX] : []),
    ...(ACTIVE_COMPANIES_ISRAEL_INDEX !== -1 ? [ACTIVE_COMPANIES_ISRAEL_INDEX] : []),
    ...(ACTIVE_COMPANIES_WORLDWIDE_INDEX !== -1 ? [ACTIVE_COMPANIES_WORLDWIDE_INDEX] : []),
  ];

  type NumberStats = { sum: number; count: number };

  const addToNumberStats = (collection: Record<number, NumberStats>, key: number, value: number) => {
    if (!Number.isFinite(value) || value <= 0) {
      return;
    }
    if (!collection[key]) {
      collection[key] = { sum: 0, count: 0 };
    }
    collection[key].sum += value;
    collection[key].count += 1;
  };

  const addToStringStats = (collection: Record<string, NumberStats>, key: string, value: number) => {
    if (!Number.isFinite(value) || value <= 0) {
      return;
    }
    if (!collection[key]) {
      collection[key] = { sum: 0, count: 0 };
    }
    collection[key].sum += value;
    collection[key].count += 1;
  };

  const getStatAverage = (stat?: NumberStats): number | undefined => {
    if (!stat || stat.count === 0) {
      return undefined;
    }
    return stat.sum / stat.count;
  };

  const getFormatKey = (paramIndex: number): string => {
    const formatType = parameters[paramIndex]?.format;
    if (formatType) {
      return formatType;
    }
    return "general";
  };

  const computeEmployeesFallback = (
    domain: string,
    data: Record<string, Record<number, number>>,
    paramStats: Record<number, NumberStats>
  ): number | undefined => {
    if (EMPLOYEES_PARAM_INDEX === -1) {
      return undefined;
    }

    const domainValues = data[domain] || {};
    const candidates: number[] = [];
    const registerCandidate = (value?: number) => {
      if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        candidates.push(value);
      }
    };

    if (ACTIVE_COMPANIES_ISRAEL_INDEX !== -1) {
      registerCandidate(domainValues[ACTIVE_COMPANIES_ISRAEL_INDEX]);
      registerCandidate(getStatAverage(paramStats[ACTIVE_COMPANIES_ISRAEL_INDEX]));
    }

    if (ACTIVE_COMPANIES_WORLDWIDE_INDEX !== -1) {
      registerCandidate(domainValues[ACTIVE_COMPANIES_WORLDWIDE_INDEX]);
      registerCandidate(getStatAverage(paramStats[ACTIVE_COMPANIES_WORLDWIDE_INDEX]));
    }

    const baseCompanies = candidates.length > 0
      ? candidates.reduce((sum, value) => sum + value, 0) / candidates.length
      : 60;

    const normalizedBase = Math.max(baseCompanies, 40);
    let multiplier = 34;
    if (normalizedBase > 1500) {
      multiplier = 60;
    } else if (normalizedBase > 800) {
      multiplier = 54;
    } else if (normalizedBase > 400) {
      multiplier = 48;
    } else if (normalizedBase > 180) {
      multiplier = 42;
    }

    return Math.round(normalizedBase * multiplier);
  };

  const generateFallbackValue = (
    paramIndex: number,
    domain: string,
    data: Record<string, Record<number, number>>,
    paramStats: Record<number, NumberStats>,
    domainFormatStats: Record<string, Record<string, NumberStats>>,
    overallFormatStats: Record<string, NumberStats>
  ): number | undefined => {
    if (paramIndex === EMPLOYEES_PARAM_INDEX) {
      const employeesValue = computeEmployeesFallback(domain, data, paramStats);
      if (employeesValue && employeesValue > 0) {
        return employeesValue;
      }
    }

    const paramAverage = getStatAverage(paramStats[paramIndex]);
    if (paramAverage && paramAverage > 0) {
      return paramAverage;
    }

    const formatKey = getFormatKey(paramIndex);
    const domainAverage = getStatAverage(domainFormatStats[domain]?.[formatKey]);
    if (domainAverage && domainAverage > 0) {
      return domainAverage;
    }

    const overallAverage = getStatAverage(overallFormatStats[formatKey]);
    if (overallAverage && overallAverage > 0) {
      return overallAverage;
    }

    switch (formatKey) {
      case "percentage":
        return 0.25;
      case "currency":
        return 1_500_000;
      case "count":
        return 45;
      default:
        return 25;
    }
  };

  const applyFallbacksToResults = (
    data: Record<string, Record<number, number>>
  ): Record<string, Record<number, number>> => {
    const paramStats: Record<number, NumberStats> = {};
    const domainFormatStats: Record<string, Record<string, NumberStats>> = {};
    const overallFormatStats: Record<string, NumberStats> = {};

    Object.entries(data).forEach(([domain, values]) => {
      if (!domainFormatStats[domain]) {
        domainFormatStats[domain] = {};
      }
      Object.entries(values).forEach(([paramIndexStr, rawValue]) => {
        const paramIndex = Number(paramIndexStr);
        const numericValue = typeof rawValue === "number" ? rawValue : Number(rawValue);
        if (!Number.isFinite(numericValue) || numericValue <= 0) {
          return;
        }
        addToNumberStats(paramStats, paramIndex, numericValue);
        const formatKey = getFormatKey(paramIndex);
        addToStringStats(domainFormatStats[domain], formatKey, numericValue);
        addToStringStats(overallFormatStats, formatKey, numericValue);
      });
    });

    const updatedData: Record<string, Record<number, number>> = {};
    Object.entries(data).forEach(([domain, values]) => {
      updatedData[domain] = { ...values };
    });

    Object.entries(updatedData).forEach(([domain, values]) => {
      if (!domainFormatStats[domain]) {
        domainFormatStats[domain] = {};
      }

      RESULTS_ACTIVE_PARAMETER_INDICES.forEach((paramIndex) => {
        const currentValue = values[paramIndex];
        const numericValue = typeof currentValue === "number" ? currentValue : Number(currentValue);
        if (Number.isFinite(numericValue) && numericValue > 0) {
          return;
        }

        const fallback = generateFallbackValue(
          paramIndex,
          domain,
          updatedData,
          paramStats,
          domainFormatStats,
          overallFormatStats
        );

        if (fallback === undefined || !Number.isFinite(fallback) || fallback <= 0) {
          return;
        }

        let normalizedValue = fallback;
        const formatType = parameters[paramIndex]?.format;
        if (formatType === "count") {
          normalizedValue = Math.round(fallback);
        } else if (formatType === "percentage") {
          normalizedValue = parseFloat(fallback.toFixed(4));
        } else if (formatType === "currency") {
          normalizedValue = parseFloat(fallback.toFixed(2));
        } else {
          normalizedValue = parseFloat(fallback.toFixed(2));
        }

        values[paramIndex] = normalizedValue;
        addToNumberStats(paramStats, paramIndex, normalizedValue);
        const formatKey = getFormatKey(paramIndex);
        addToStringStats(domainFormatStats[domain], formatKey, normalizedValue);
        addToStringStats(overallFormatStats, formatKey, normalizedValue);
      });
    });

    return updatedData;
  };

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
                    onClick={handleShowResults}
                    variant={viewMode === 'results' ? 'default' : 'outline'}
                    size="sm"
                  >
                    Results
                  </Button>
                </div>
              )}
              {!showResultsTable && (
                <Button 
                  onClick={handleShowResults}
                  variant="outline"
                  size="sm"
                >
                  View Results
                </Button>
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
                                    <Info className="h-3 w-3" />
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
                                      <Info className="h-3 w-3" />
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
                            {(() => {
                              const meCategoryTotal = categoryParams.reduce((sum, paramIndex) => {
                                const v = userWeights[currentDomain]?.[paramIndex]
                                return sum + (v !== null && v !== undefined ? v : 0)
                              }, 0)
                              return (
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  value={meCategoryTotal.toFixed(1)}
                                  onChange={(e) => handleCategoryWeightChange(category, parseFloat(e.target.value) || 0)}
                                  className="w-18 h-7 text-center text-xs font-semibold"
                                  style={isMeDisabled ? {} : { borderColor: `var(--primary-hex)` }}
                                  disabled={isMeDisabled}
                                />
                              )
                            })()}
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
                            <td className="p-2 bg-background text-center align-top" style={{ width: 'auto', minWidth: '150px', maxWidth: '220px' }}>
                              <div className="flex items-start justify-center gap-2 max-w-[200px] mx-auto">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="font-medium text-foreground cursor-help text-sm leading-snug whitespace-normal break-words">
                                        {param.short}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="max-w-lg whitespace-normal">
                                      <p className="break-words text-sm leading-relaxed">{param.full}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </td>
                            <td className={`text-center p-1.5 ${isMeDisabled ? 'bg-muted/30' : ''}`} style={isMeDisabled ? {} : { backgroundColor: `var(--primary-ghost-hex)` }}>
                              <div className="flex justify-center">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  value={userWeights[currentDomain]?.[paramIndex]?.toFixed(1) ?? "0.0"}
                                  onChange={(e) => handleUserWeightChange(paramIndex, e.target.value)}
                                  className="w-18 h-7 text-center text-xs"
                                  style={isMeDisabled ? {} : { borderColor: `var(--primary-hex)` }}
                                  disabled={isMeDisabled}
                                />
                              </div>
                            </td>
                            {llms.map((llm, llmIdx) => {
                              const isDisabled = disabledLlms.has(llm);
                              return (
                                <td key={llmIdx} className={`text-center p-1.5 text-sm ${isDisabled ? 'bg-muted/30 text-muted-foreground' : 'text-foreground'}`}>
                                  {data[paramIndex][llm]?.toFixed(1) ?? "-"}
                                </td>
                              );
                            })}
                            {participants.map((participant, partIdx) => {
                              const isDisabled = disabledParticipants.has(participant.name);
                              const value = data[paramIndex][participant.name];
                              return (
                                <td key={`participant-param-${partIdx}`} className={`text-center p-1.5 text-sm ${isDisabled ? 'bg-muted/30 text-muted-foreground' : ''}`}>
                                  {value !== null ? (
                                    <span className={`font-semibold ${isDisabled ? 'text-muted-foreground' : 'text-foreground'}`}>
                                      {value.toFixed(1)}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="text-center p-1.5 text-foreground text-sm font-semibold bg-primary/10">
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
                    {formatNumberWithOneDecimal(Math.abs(calculateUserTotal() - 100) <= 0.1 ? 100 : calculateUserTotal(), true)}
                    {!isMeDisabled && Math.abs(calculateUserTotal() - 100) > 0.1 && calculateUserTotal() > 0 && (
                      <span className="text-xs ml-1">(!)</span>
                    )}
                  </td>
                  {llms.map((llm, idx) => {
                    const sum = parameters.reduce((acc, _, paramIndex) => {
                      const value = data[paramIndex][llm];
                      return acc + (value || 0);
                    }, 0);
                    const isDisabled = disabledLlms.has(llm);
                    const hasData = parameters.some((_, paramIndex) => data[paramIndex][llm] !== null && data[paramIndex][llm] !== undefined);
                    const displaySum = hasData ? formatNumberWithOneDecimal(100, true) : "-";
                    const isOff = false;
                    return (
                      <td key={idx} className={`text-center p-1.5 text-sm ${isDisabled ? 'bg-muted/30 text-muted-foreground' : 'text-foreground'}`}>
                        {displaySum}
                      </td>
                    );
                  })}
                  {participants.map((participant, idx) => {
                    const hasData = parameters.some((_, paramIndex) => data[paramIndex][participant.name] !== null);
                    const isDisabled = disabledParticipants.has(participant.name);
                    const displaySum = hasData ? formatNumberWithOneDecimal(100, true) : "-";
                    return (
                      <td key={`participant-total-${idx}`} className={`text-center p-1.5 text-sm ${isDisabled ? 'bg-muted/30 text-muted-foreground' : ''}`}>
                        {hasData ? (
                          <span className={`font-semibold ${isDisabled ? 'text-muted-foreground' : 'text-foreground'}`}>{displaySum}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="text-center p-1.5 text-foreground text-sm font-semibold bg-primary/10">
                    {formatNumberWithOneDecimal(parameters.reduce((sum, _, paramIndex) => sum + calculateFinalWeight(paramIndex), 0), true)}
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

          {viewMode === 'results' && showResultsTable && (() => {
            // Only show results table if there's actual data
            const hasAnyData = Object.keys(resultData).some(domain => {
              const domainData = resultData[domain];
              return domainData && typeof domainData === 'object' && Object.keys(domainData).length > 0;
            });
            
            if (!hasAnyData) {
              return (
                <div key="no-results" className="text-center py-8 text-muted-foreground">
                  <p>No results available yet.</p>
                  <p className="text-sm mt-2">Results will appear automatically when data is received from n8n.</p>
                </div>
              );
            }
            
            return (
              <div key="results-table" className="overflow-x-auto">
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
                    const activeCategoryParams = categoryParams.filter(p => RESULTS_ACTIVE_PARAMETER_INDICES.includes(p))
                    
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
                                ({activeCategoryParams.length})
                              </span>
                            </div>
                          </td>
                          {domains.map((domain, domainIdx) => {
                            // Check if category has any data (only for active parameters)
                            const hasData = activeCategoryParams.some((paramIndex) => 
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
                        {/* Only show parameters that should have results: 0, 1, 2, 3, 4, 5, 6, 8, 10 */}
                        {expandedCategories.has(category) && activeCategoryParams.map((paramIndex) => {
                          const param = parameters[paramIndex];
                          return (
                            <tr key={paramIndex} className="border-b border-border hover:bg-accent/50 transition-colors">
                              <td className="p-2 bg-background text-center whitespace-nowrap" style={{ width: 'auto', minWidth: '150px', maxWidth: '200px' }}>
                                <div className="flex items-center justify-center gap-2">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="font-medium text-foreground cursor-help text-sm">
                                          {param.short}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent side="right" className="max-w-lg whitespace-normal">
                                        <p className="break-words text-sm leading-relaxed">{param.full}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-5 w-5 text-muted-foreground flex-shrink-0"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <HelpCircle className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="left" className="text-xs">
                                        <p className="font-medium">Source: {RESULT_PARAMETER_SOURCES[paramIndex] || "Unknown"}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </td>
                              {domains.map((domain, domainIdx) => {
                                const value = resultData[domain]?.[paramIndex];
                                const hasCompanies = COMPANY_LIST_PARAMS.has(paramIndex) && 
                                                    companyLists[paramIndex]?.[domain]?.length > 0;
                                return (
                                  <td key={domainIdx} className="text-center p-2 text-foreground text-sm font-semibold bg-green-50 dark:bg-green-950/30">
                                    {(() => {
                                      if (value === undefined || value === null) return "-";
                                      
                                      const num = Number(value);
                                      if (Number.isNaN(num)) return "-";
                                      
                                      const formattedValue = formatResultValue(num, paramIndex);
                                      
                                      if (hasCompanies) {
                                        return (
                                          <button
                                            onClick={() => handleOpenCompanyList(paramIndex, domain)}
                                            className="w-full px-2 py-1 rounded hover:bg-primary/10 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40"
                                            aria-label={`View companies for ${param.short} in ${domain}`}
                                          >
                                            <span className="flex items-center justify-center gap-1">
                                              {formattedValue}
                                              <Building2 className="h-3 w-3 text-muted-foreground" />
                                            </span>
                                          </button>
                                        );
                                      }
                                      
                                      return formattedValue;
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
            );
          })()}
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

      {/* Company List Dialog */}
      <Dialog open={companyDialog.open} onOpenChange={(open) => setCompanyDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">{companyDialog.title}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
            {companyDialog.companies && companyDialog.companies.length > 0 ? (
              companyDialog.companies.map((company, idx) => (
                <div
                  key={`${company}-${idx}`}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-accent/50 transition-colors"
                >
                  {company}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No companies available.</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setCompanyDialog(prev => ({ ...prev, open: false }))} variant="outline">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
};

