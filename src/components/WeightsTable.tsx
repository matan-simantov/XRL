import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Mail, ChevronLeft, ChevronRight, RefreshCw, Eye, EyeOff, FileText, CheckCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

const parameters = [
  { short: "Number of IPOs", full: "Number of IPOs in the sector worldwide in the past 5 years" },
  { short: "Acquisitions/Mergers", full: "Number of companies worldwide that were acquired or merged in the past 5 years" },
  { short: "Active Companies", full: "Number of active companies in the sector worldwide" },
  { short: "New Companies", full: "Number of new companies in the past 5 years" },
  { short: "Pre-Seed & Seed", full: "Number of companies in the sector worldwide that raised Pre-Seed & Seed rounds" },
  { short: "Series A", full: "Number of companies in the sector worldwide that raised a Series A round" },
  { short: "Series B–C", full: "Number of companies in the sector worldwide that raised Series B–C rounds" },
  { short: "Late-Stage Rounds", full: "Number of companies in the sector worldwide that raised late-stage rounds" },
  { short: "Series A/Seed Ratio", full: "Ratio of companies that raised a Series A round out of those that raised a Seed round in the past 5 years" },
  { short: "New Blood Flow", full: '"New blood" flow in the sector worldwide (new activities/active activities)' },
  { short: "Average Company Age", full: "Average age of an active company worldwide" },
];

// Generate weights that sum to 100 for a column with relatively close values
const generateWeightsForColumn = (): number[] => {
  // Generate 11 random numbers between 0.5 and 1.5 (more uniform distribution)
  const random = Array.from({ length: 11 }, () => 0.5 + Math.random());
  const sum = random.reduce((a, b) => a + b, 0);
  
  // Normalize to sum to 100 and round to integers
  const normalized = random.map(r => Math.round((r / sum) * 100));
  
  // Adjust the last value to ensure exact sum of 100
  const currentSum = normalized.slice(0, -1).reduce((a, b) => a + b, 0);
  normalized[10] = 100 - currentSum;
  
  return normalized;
};

export const WeightsTable = ({ llms, participants, domains, initialLlmWeight = 50, formData, onClose }: WeightsTableProps) => {
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
  
  // Generate data for all domains (must be before userWeights)
  const generateInitialDomainsData = () => {
    const domainsData: Record<string, Record<number, Record<string, number | null>>> = {};
    
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
          rows[paramIndex][llm] = weight;
        });
      });
      
      // Participants columns are empty (null)
      participants.forEach((participant) => {
        parameters.forEach((_, paramIndex) => {
          rows[paramIndex][participant.name] = null;
        });
      });
      
      domainsData[domain] = rows;
    });
    
    return domainsData;
  };
  
  const [allDomainsData, setAllDomainsData] = useState(generateInitialDomainsData);

  // User's custom weights for each domain - will be initialized in useEffect
  const [userWeights, setUserWeights] = useState<Record<string, Record<number, number | null>>>({});

  const currentDomain = domains[currentDomainIndex] || domains[0] || "";
  const data = allDomainsData[currentDomain] || {};

  // Initialize or reset state when component mounts or formData changes
  useEffect(() => {
    if (savedState) {
      // Load saved state for this specific run
      if (savedState.allDomainsData) {
        setAllDomainsData(savedState.allDomainsData);
      } else {
        setAllDomainsData(generateInitialDomainsData());
      }
      
      if (savedState.userWeights) {
        setUserWeights(savedState.userWeights);
      } else {
        // Calculate initial userWeights from allDomainsData
        const initUserWeights = () => {
          const weights: Record<string, Record<number, number | null>> = {};
          
          domains.forEach((domain) => {
            weights[domain] = {};
            
            // First pass: calculate all averages
            const averages: number[] = [];
            parameters.forEach((_, paramIndex) => {
              // Calculate average of LLMs for this parameter
              let llmSum = 0;
              let llmCount = 0;
              
              llms.forEach((llm) => {
                const value = (savedState.allDomainsData || allDomainsData)[domain]?.[paramIndex]?.[llm];
                if (value !== null && value !== undefined) {
                  llmSum += value;
                  llmCount++;
                }
              });
              
              const llmAvg = llmCount > 0 ? llmSum / llmCount : 0;
              averages.push(llmAvg);
            });
            
            // Second pass: normalize to sum to 100
            const sum = averages.reduce((a, b) => a + b, 0);
            if (sum > 0) {
              const normalized = averages.map(v => Math.round((v / sum) * 100));
              
              // Adjust the last value to ensure exact sum of 100
              const currentSum = normalized.slice(0, -1).reduce((a, b) => a + b, 0);
              normalized[normalized.length - 1] = 100 - currentSum;
              
              parameters.forEach((_, paramIndex) => {
                weights[domain][paramIndex] = normalized[paramIndex];
              });
            } else {
              parameters.forEach((_, paramIndex) => {
                weights[domain][paramIndex] = null;
              });
            }
          });
          
          return weights;
        };
        
        setUserWeights(initUserWeights());
      }
      
      if (savedState.resultData) {
        setResultData(savedState.resultData);
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
      setViewMode('weights');
    } else {
      // No saved state, initialize fresh
      const initDomainsData = generateInitialDomainsData();
      setAllDomainsData(initDomainsData);
      
      // Calculate initial userWeights
      const initUserWeights = () => {
        const weights: Record<string, Record<number, number | null>> = {};
        
        domains.forEach((domain) => {
          weights[domain] = {};
          
          const averages: number[] = [];
          parameters.forEach((_, paramIndex) => {
            let llmSum = 0;
            let llmCount = 0;
            
            llms.forEach((llm) => {
              const value = initDomainsData[domain]?.[paramIndex]?.[llm];
              if (value !== null && value !== undefined) {
                llmSum += value;
                llmCount++;
              }
            });
            
            const llmAvg = llmCount > 0 ? llmSum / llmCount : 0;
            averages.push(llmAvg);
          });
          
          const sum = averages.reduce((a, b) => a + b, 0);
          if (sum > 0) {
            const normalized = averages.map(v => Math.round((v / sum) * 100));
            const currentSum = normalized.slice(0, -1).reduce((a, b) => a + b, 0);
            normalized[normalized.length - 1] = 100 - currentSum;
            
            parameters.forEach((_, paramIndex) => {
              weights[domain][paramIndex] = normalized[paramIndex];
            });
          } else {
            parameters.forEach((_, paramIndex) => {
              weights[domain][paramIndex] = null;
            });
          }
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
    }
  }, [formData?.id, llms.length, participants.length, domains.length]); // Re-run when data structure changes

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
    formData
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
    const numValue = value === "" ? null : parseInt(value);
    setUserWeights((prev) => ({
      ...prev,
      [currentDomain]: {
        ...prev[currentDomain],
        [paramIndex]: numValue,
      },
    }));
  };

  // Calculate user's total for validation
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
    if (meTotal !== 100 && meTotal > 0) {
      toast.error("YOU column total must equal 100", {
        description: `Current total: ${Math.round(meTotal)}. Please adjust your weights.`,
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
  const handleFinalConfirm = () => {
    const results: Record<string, Record<number, number>> = {};
    
    domains.forEach((domain) => {
      results[domain] = {};
      
      // Domain seed for variation between sectors
      const domainSeed = domain.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const domainMultiplier = 0.8 + (domainSeed % 40) / 100; // 0.8 to 1.2
      
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
          case 7: // Late-Stage Rounds (baseline: 160)
            result = Math.round((100 + weightInfluence * 30 + Math.random() * 80) * domainMultiplier);
            break;
          case 8: // Series A/Seed Ratio (baseline: ~54%)
            result = parseFloat((45 + weightInfluence * 3 + Math.random() * 15).toFixed(1));
            break;
          case 9: // New Blood Flow (baseline: ~28%)
            result = parseFloat((0.20 + weightInfluence * 0.03 + Math.random() * 0.12).toFixed(2));
            break;
          case 10: // Average Company Age (baseline: ~7.5 years)
            result = parseFloat((6 + weightInfluence * 0.5 + Math.random() * 2.5).toFixed(1));
            break;
          default:
            result = 0;
        }
        
        results[domain][paramIndex] = result;
      });
    });
    
    setResultData(results);
    setShowResultsTable(true);
    setViewMode('results'); // Navigate to results view automatically
    setShowConfirmDialog(false);
    
    toast.success("Results generated successfully!", {
      description: "Viewing comparison results across all domains.",
    });
  };

  // Don't render if essential data is not loaded yet
  if (!currentDomain || Object.keys(data).length === 0 || Object.keys(userWeights).length === 0 || !userWeights[currentDomain]) {
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
          <div className="overflow-x-auto flex justify-center">
            <table className="border-collapse">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-center p-3 font-semibold text-foreground bg-background whitespace-nowrap">
                    Parameter
                  </th>
                  <th className={`text-center p-2 font-semibold whitespace-nowrap ${isMeDisabled ? 'text-muted-foreground bg-muted/30' : 'text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-950'}`}>
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-bold">YOU</span>
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
                      <th key={idx} className={`text-center p-2 font-semibold whitespace-nowrap ${isDisabled ? 'text-muted-foreground bg-muted/30' : 'text-foreground'}`}>
                        <div className="flex flex-col items-center gap-1">
                          <span>{llm}</span>
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
                    return (
                      <th key={`participant-${idx}`} className={`text-center p-2 font-semibold whitespace-nowrap ${isDisabled ? 'text-muted-foreground bg-muted/30' : 'text-foreground'}`}>
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-2">
                            <span>{participant.name}</span>
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
                  <th className="text-center p-2 font-semibold text-foreground bg-primary/10 whitespace-nowrap">
                    Final Weight
                  </th>
                </tr>
              </thead>
              <tbody>
                {parameters.map((param, paramIndex) => (
                  <tr key={paramIndex} className="border-b border-border hover:bg-accent/50 transition-colors">
                    <td className="p-2 bg-background text-center whitespace-nowrap">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="font-medium text-foreground cursor-help text-sm">
                              {param.short}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p>{param.full}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    <td className={`p-2 ${isMeDisabled ? 'bg-muted/30' : 'bg-blue-100/70 dark:bg-blue-950/70'}`}>
                      <div className="flex justify-center items-center">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={userWeights[currentDomain]?.[paramIndex] ?? ""}
                          onChange={(e) => handleUserWeightChange(paramIndex, e.target.value)}
                          className={`w-16 h-8 text-center text-sm font-semibold ${isMeDisabled ? 'opacity-50' : 'border-blue-300 dark:border-blue-700'}`}
                          placeholder="-"
                          disabled={isMeDisabled}
                        />
                      </div>
                    </td>
                    {llms.map((llm, colIndex) => {
                      const isDisabled = disabledLlms.has(llm);
                      return (
                        <td key={colIndex} className={`text-center p-2 text-sm ${isDisabled ? 'bg-muted/30 text-muted-foreground' : 'text-foreground'}`}>
                          {data[paramIndex][llm]}
                        </td>
                      );
                    })}
                    {participants.map((participant, colIndex) => {
                      const value = data[paramIndex][participant.name];
                      const isDisabled = disabledParticipants.has(participant.name);
                      return (
                        <td key={`participant-${colIndex}`} className={`text-center p-2 text-sm ${isDisabled ? 'bg-muted/30 text-muted-foreground' : ''}`}>
                          {value !== null && value !== undefined ? (
                            <span className={isDisabled ? 'text-muted-foreground' : 'text-foreground'}>{value}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="text-center p-2 text-foreground text-sm font-semibold bg-primary/5">
                      {calculateFinalWeight(paramIndex).toFixed(1)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-border font-semibold bg-accent/30">
                  <td className="p-2 bg-background text-center whitespace-nowrap">Total</td>
                  <td className={`text-center p-2 text-sm font-semibold ${
                    isMeDisabled 
                      ? 'bg-muted/30 text-muted-foreground' 
                      : 'bg-blue-100/70 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400'
                  } ${
                    !isMeDisabled && calculateUserTotal() !== 100 && calculateUserTotal() > 0
                      ? "text-red-600 dark:text-red-400"
                      : ""
                  }`}>
                    {Math.round(calculateUserTotal())}
                    {!isMeDisabled && calculateUserTotal() !== 100 && calculateUserTotal() > 0 && (
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
                      <td key={idx} className={`text-center p-2 text-sm ${isDisabled ? 'bg-muted/30 text-muted-foreground' : 'text-foreground'}`}>
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
                      <td key={`participant-total-${idx}`} className={`text-center p-2 text-sm ${isDisabled ? 'bg-muted/30 text-muted-foreground' : ''}`}>
                        {hasData ? (
                          <span className={`font-semibold ${isDisabled ? 'text-muted-foreground' : 'text-foreground'}`}>{Math.round(sum)}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="text-center p-2 text-foreground text-sm font-semibold bg-primary/10">
                    {parameters.reduce((sum, _, paramIndex) => sum + calculateFinalWeight(paramIndex), 0).toFixed(1)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
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
            <div className="overflow-x-auto flex justify-center">
              <table className="border-collapse">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-center p-3 font-semibold text-foreground bg-background whitespace-nowrap">
                      Parameter
                    </th>
                    {domains.map((domain, idx) => (
                      <th key={idx} className="text-center p-2 font-semibold text-foreground whitespace-nowrap">
                        {domain}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parameters.map((param, paramIndex) => (
                    <tr key={paramIndex} className="border-b border-border hover:bg-accent/50 transition-colors">
                      <td className="p-2 bg-background text-center whitespace-nowrap">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="font-medium text-foreground cursor-help text-sm">
                                {param.short}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              <p>{param.full}</p>
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
                  ))}
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

