import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, ArrowRight, CheckCircle2, Zap, Target, Globe, Users, MapPin, FileCheck, Clock, TrendingUp, Brain, UserPlus, Scale, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { SecondaryCategorySelector } from "@/components/SecondaryCategorySelector";
import { InlineSheetViewer } from "@/components/InlineSheetViewer";
import { WeightsTable } from "@/components/WeightsTable";
import { getSession, saveDraft, commitRun } from "@/lib/storage";
import { useButtonColor } from "@/hooks/use-button-color";
import { sendToCrunchbase, sendToXRLDataToPlatformDirect } from "@/lib/api";
import { useResultsPolling } from "@/hooks/use-results-polling";

type XrlState = {
  sector: string;
  domains: string[];
  secondary_category: string[];
  goals: string[];
  users: string[];
  geography: string[];
  compliance: string[];
  time_horizon: string | null;
  risk_posture: string | null;
  llm: string[];
  participants_count: number;
  participants: { name: string; email: string }[];
  llm_weight_percent: number;
  isDraft: boolean;
};

type DomainSubmitStatus = {
  domain: string;
  status: "pending" | "sending" | "sent" | "failed";
  sheetUrl?: string;
};

const INITIAL_STATE: XrlState = {
  sector: "Energy",
  domains: [],
  secondary_category: [],
  goals: [],
  users: [],
  geography: [],
  compliance: [],
  time_horizon: null,
  risk_posture: null,
  llm: [],
  participants_count: 0,
  participants: [],
  llm_weight_percent: 50,
  isDraft: true,
};

const NewForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [state, setState] = useState<XrlState>(INITIAL_STATE);
  const [showWeightsTable, setShowWeightsTable] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [domainStatuses, setDomainStatuses] = useState<DomainSubmitStatus[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [shouldPollResults, setShouldPollResults] = useState(false);
  const navigate = useNavigate();
  const { getButtonClasses, getTextClass, getBgLightClass } = useButtonColor();

  // Polling for results from n8n
  useResultsPolling({
    enabled: shouldPollResults,
    interval: 5000, // Check every 5 seconds
    onOpenResults: () => {
      // Open results table in WeightsTable when results are ready
      setShowWeightsTable(true);
      setTimeout(() => {
        const tableElement = document.querySelector('[data-weights-table]');
        if (tableElement) {
          tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  });

  // Temporary state for textarea fields to allow Enter key
  const [textareaValues, setTextareaValues] = useState({
    goals: "",
    users: "",
    geography: "",
    compliance: "",
  });

  useEffect(() => {
    const username = getSession()?.username;
    if (!username) return;
    if (currentStep < 2) return; // Only save draft from step 2 onwards
    const timer = setTimeout(() => {
      if (state.isDraft) {
        saveDraft(username, state);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [state, currentStep]);

  useEffect(() => {
    (async () => {
      const username = getSession()?.username;
      if (!username) return;
      
      // Only load draft if explicitly requested (e.g., from history resume)
      // Check if we're coming from a draft resume
      const urlParams = new URLSearchParams(window.location.search);
      const loadDraft = urlParams.get('resume') === 'true';
      
      if (loadDraft) {
        const latest = await (await import("@/lib/storage")).loadLatestDraft(username);
        if (latest?.state) {
          const parsed = latest.state;
          if (parsed.domain && !parsed.domains) {
            parsed.domains = [parsed.domain];
            delete parsed.domain;
          }
          if (!parsed.domains) parsed.domains = [];
          setState(parsed);
          // Update textarea values when draft is loaded
          setTextareaValues({
            goals: (parsed.goals || []).join("\n"),
            users: (parsed.users || []).join("\n"),
            geography: (parsed.geography || []).join("\n"),
            compliance: (parsed.compliance || []).join("\n"),
          });
          toast.success("Draft restored");
        }
      } else {
        // Always start with clean form, clear any existing draft
        localStorage.removeItem("xrl:intake:draft");
      }
    })();
  }, []);

  // Listen for reset form event from sidebar
  useEffect(() => {
    const handleReset = () => {
      setState(INITIAL_STATE);
      setCurrentStep(1);
      setIsSubmitting(false);
      setSubmitSuccess(false);
      setShowWeightsTable(false);
      setSheetUrl(null);
      setTextareaValues({
        goals: "",
        users: "",
        geography: "",
        compliance: "",
      });
      toast.success("Form reset - starting fresh");
    };

    window.addEventListener("resetNewForm", handleReset);
    return () => window.removeEventListener("resetNewForm", handleReset);
  }, []);

  const progress = (currentStep / 9) * 100;

  const handleNext = () => {
    if (currentStep === 2 && state.domains.length === 0) {
      toast.error("Please select at least one domain");
      return;
    }
    if (currentStep === 2 && state.domains.length > 5) {
      toast.error("Maximum 5 domains allowed");
      return;
    }
    // Goals optional: allow empty goals
    if (currentStep === 7 && state.llm.length === 0) {
      toast.error("Please select at least one LLM");
      return;
    }
    if (currentStep === 9) {
      setShowReview(true);
      return;
    }
    if (currentStep < 9) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // Initialize textarea values from state when step changes or state is loaded
  useEffect(() => {
    // Only update if current step is 4 (Context & Details)
    if (currentStep === 4) {
      setTextareaValues({
        goals: state.goals.join("\n"),
        users: state.users.join("\n"),
        geography: state.geography.join("\n"),
        compliance: state.compliance.join("\n"),
      });
    }
  }, [currentStep]); // Only update when step changes

  const handleTextareaChange = (field: keyof XrlState, value: string) => {
    const lines = value.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
    const unique = Array.from(new Set(lines.map((l) => l.toLowerCase()))).map(
      (l) => lines.find((orig) => orig.toLowerCase() === l)!
    );
    setState({ ...state, [field]: unique });
  };

  // Handle textarea input without filtering empty lines immediately
  const handleTextareaInput = (field: "goals" | "users" | "geography" | "compliance", value: string) => {
    setTextareaValues((prev) => ({ ...prev, [field]: value }));
  };

  // Process textarea value when user leaves the field
  const handleTextareaBlur = (field: keyof XrlState, value: string) => {
    const lines = value.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
    const unique = Array.from(new Set(lines.map((l) => l.toLowerCase()))).map(
      (l) => lines.find((orig) => orig.toLowerCase() === l)!
    );
    setState({ ...state, [field]: unique });
    // Update textarea value to reflect processed state
    setTextareaValues((prev) => ({ ...prev, [field]: unique.join("\n") }));
  };

  const validateEmail = (email: string) => {
    const trimmed = email.trim();
    if (!trimmed) return false;
    if (trimmed.includes(" ") || trimmed.includes(",")) return false;
    const parts = trimmed.split("@");
    if (parts.length !== 2) return false;
    return parts[1].includes(".");
  };

  const handleSaveDraft = () => {
    localStorage.setItem("xrl:intake:draft", JSON.stringify(state));
    toast.success("Draft saved", { duration: 2000 });
    setShowReview(false);
  };

  const handleConfirmSubmit = async () => {
    if (state.domains.length === 0 || state.llm.length === 0) {
      toast.error("Please complete all required fields");
      return;
    }

    setShowReview(false);
    setIsSubmitting(true);

    // Track what was sent
    const submissionSummary = {
      domains: state.domains,
      destinations: [] as Array<{ name: string; url: string; data: any }>
    };

    // Send domains to Crunchbase webhook (fire and forget - runs in background)
    if (state.domains && state.domains.length > 0) {
      console.log("Preparing to send domains to Crunchbase:", state.domains)
      submissionSummary.destinations.push({
        name: "Crunchbase Input",
        url: "https://shooky5.app.n8n.cloud/webhook/xrl-crunchbase-input",
        data: { domains: state.domains }
      })
      sendToCrunchbase({
        domains: state.domains
      })
        .then(response => {
          console.log("Crunchbase webhook sent successfully:", response)
        })
        .catch(error => {
          console.error("Failed to send domains to Crunchbase webhook:", error)
        })
    } else {
      console.warn("No domains to send to Crunchbase")
    }

    // Send domains to XRL_DataToPlatform (fire and forget - runs in background)
    if (state.domains && state.domains.length > 0) {
      console.log("Preparing to send domains to XRL DataToPlatform:", state.domains)
      submissionSummary.destinations.push({
        name: "XRL DataToPlatform",
        url: "https://shooky5.app.n8n.cloud/webhook/XRL_DataToPlatform",
        data: { domains: state.domains }
      })
      sendToXRLDataToPlatformDirect({
        domains: state.domains
      })
        .then(response => {
          console.log("XRL DataToPlatform webhook sent successfully:", response)
        })
        .catch(error => {
          console.error("Failed to send domains to XRL_DataToPlatform webhook:", error)
        })
    } else {
      console.warn("No domains to send to XRL DataToPlatform")
    }

    // Store summary for display
    (window as any).__lastSubmissionSummary = submissionSummary;

    // Wait 3 seconds then continue regardless of webhook status
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Always continue as if successful
    const username = getSession()?.username || "anonymous";
    const finalSheetUrl = "https://docs.google.com/spreadsheets/d/1E73HW28r-7ddclj22OGNUNvo194FlLHX2zX50XY5I3w/edit?usp=sharing";
    
    const savedRun = await commitRun(username, {
      sector: state.sector,
      domains: state.domains,
      secondary_category: state.secondary_category,
      goals: state.goals,
      users: state.users,
      geography: state.geography,
      compliance: state.compliance,
      time_horizon: state.time_horizon,
      risk_posture: state.risk_posture,
      llm: state.llm,
      participants_count: state.participants_count,
      participants: state.participants,
      llm_weight_percent: state.llm_weight_percent,
      sheetUrl: finalSheetUrl,
    });

    setSheetUrl(finalSheetUrl);
    setSubmitSuccess(true);
    
    // Store the run ID for opening weights table from anywhere
    localStorage.setItem("xrl:lastSubmittedRunId", savedRun.id);
    
    // Clear the draft (but keep form state for viewing weights table)
    localStorage.removeItem("xrl:intake:draft");
    
    // Don't show success toast - will show when results are ready via polling
    // Start polling for results
    setShouldPollResults(true);
    
    setIsSubmitting(false);
  };

  const toggleDomain = (domain: string) => {
    const currentDomains = state.domains || [];
    if (currentDomains.includes(domain)) {
      setState({ ...state, domains: currentDomains.filter(d => d !== domain) });
    } else if (currentDomains.length < 5) {
      setState({ ...state, domains: [...currentDomains, domain] });
    } else {
      toast.error("Maximum 5 domains allowed");
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <p className="text-sm text-muted-foreground mb-4">
              Select the primary sector for your assessment
            </p>
            <div className="relative">
              <Input 
                value="Energy" 
                disabled 
                className="text-center font-semibold text-lg bg-gradient-to-r from-blue-50 to-purple-50 border-2 cursor-not-allowed"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg pointer-events-none"></div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-5 animate-in fade-in duration-500">
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                Choose up to 5 domains for analysis. Each will be submitted separately.
              </p>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{(state.domains || []).length} selected</span>
                </div>
                {(state.domains || []).length >= 5 && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">Maximum reached</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2">
              {[
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
                "Fusion"
              ].map(domain => {
                const isSelected = (state.domains || []).includes(domain);
                const isDisabled = !isSelected && (state.domains || []).length >= 5;
                return (
                  <div
                    key={domain}
                    className={`domain-option ${isSelected ? 'selected' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => !isDisabled && toggleDomain(domain)}
                  >
                    <Checkbox 
                      id={domain} 
                      checked={isSelected} 
                      onCheckedChange={() => !isDisabled && toggleDomain(domain)} 
                      disabled={isDisabled}
                      className="pointer-events-none"
                    />
                    <Label 
                      htmlFor={domain} 
                      className="text-[#111111] font-normal cursor-pointer flex-1 ml-2 pointer-events-none"
                    >
                      {domain}
                    </Label>
                  </div>
                );
              })}
            </div>
            {(state.domains || []).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <span className="text-xs font-medium text-blue-700">Selected:</span>
                {(state.domains || []).map(d => (
                  <span key={d} className="px-3 py-1 bg-white border border-blue-200 rounded-full text-sm font-medium text-blue-900 shadow-sm">
                    {d}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <div className="space-y-5 animate-in fade-in duration-500">
            <SecondaryCategorySelector value={state.secondary_category} onChange={(secondary_category) => setState({ ...state, secondary_category })} />
          </div>
        );
      case 4:
        return (
          <div className="space-y-5 animate-in fade-in duration-500">
            <p className="text-sm text-muted-foreground mb-4">
              Define your assessment context. All fields are optional but recommended for better results.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Goals Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-primary" />
                  <Label className="text-base font-semibold text-foreground">Goals & Objectives</Label>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Define your key objectives—enter one goal per line.
                </p>
                <Textarea 
                  placeholder="Reduce LCOE by 20%&#10;Reach MRL 7 in 18 months&#10;Secure Series B funding"
                  value={textareaValues.goals} 
                  onChange={(e) => handleTextareaInput("goals", e.target.value)} 
                  onBlur={(e) => handleTextareaBlur("goals", e.target.value)}
                  rows={6} 
                  className="modern-textarea font-mono text-sm"
                />
                {state.goals.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1.5 rounded">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{state.goals.length} goal{state.goals.length > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              {/* Users Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-primary" />
                  <Label className="text-base font-semibold text-foreground">Target Users</Label>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Who are the main users or beneficiaries? Enter one per line.
                </p>
                <Textarea 
                  placeholder="Utility grid planners&#10;IPPs (Independent Power Producers)&#10;Energy consultants"
                  value={textareaValues.users} 
                  onChange={(e) => handleTextareaInput("users", e.target.value)} 
                  onBlur={(e) => handleTextareaBlur("users", e.target.value)}
                  rows={6} 
                  className="modern-textarea"
                />
                {state.users.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-2 py-1.5 rounded">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{state.users.length} user type{state.users.length > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              {/* Geography Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <Label className="text-base font-semibold text-foreground">Geography</Label>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Target regions or markets. Enter one per line.
                </p>
                <Textarea 
                  placeholder="United States&#10;European Union&#10;Southeast Asia"
                  value={textareaValues.geography} 
                  onChange={(e) => handleTextareaInput("geography", e.target.value)} 
                  onBlur={(e) => handleTextareaBlur("geography", e.target.value)}
                  rows={6} 
                  className="modern-textarea"
                />
                {state.geography.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-purple-600 bg-purple-50 px-2 py-1.5 rounded">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{state.geography.length} region{state.geography.length > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              {/* Compliance Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileCheck className="w-5 h-5 text-primary" />
                  <Label className="text-base font-semibold text-foreground">Compliance</Label>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Regulatory requirements and standards. Enter one per line.
                </p>
                <Textarea 
                  placeholder="ISO 14040 LCA&#10;EPA permits&#10;DOE safety standards"
                  value={textareaValues.compliance} 
                  onChange={(e) => handleTextareaInput("compliance", e.target.value)} 
                  onBlur={(e) => handleTextareaBlur("compliance", e.target.value)}
                  rows={6} 
                  className="modern-textarea"
                />
                {state.compliance.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 px-2 py-1.5 rounded">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{state.compliance.length} standard{state.compliance.length > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-5 animate-in fade-in duration-500">
            <p className="text-sm text-muted-foreground">
              What is your project timeline or investment horizon?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {["0–6m", "6–12m", "1–3y", "3+y"].map((o) => (
                <button
                  key={o}
                  onClick={() => setState({ ...state, time_horizon: o })}
                  className={`selection-button h-20 text-base font-semibold ${state.time_horizon === o ? 'selected' : ''}`}
                >
                  <span className="relative z-10">{o}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-5 animate-in fade-in duration-500">
            <p className="text-sm text-muted-foreground">
              Define your risk tolerance and approach to innovation.
            </p>
            <div className="grid gap-3">
              {["Conservative", "Balanced", "Aggressive"].map((o) => (
                <button
                  key={o}
                  onClick={() => setState({ ...state, risk_posture: o })}
                  className={`selection-button h-20 text-lg font-semibold ${state.risk_posture === o ? 'selected' : ''}`}
                >
                  <span className="relative z-10">{o}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-5 animate-in fade-in duration-500">
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                Choose which AI models to include in your analysis.
              </p>
              <div className="flex items-center gap-2 text-sm font-medium text-primary mb-4">
                <CheckCircle2 className="w-4 h-4" />
                <span>{state.llm.length} model{state.llm.length !== 1 ? 's' : ''} selected</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {["ChatGPT", "Gemini", "GROK", "DeepSeek", "Claude", "Mistral"].map((llm) => {
                const isSelected = state.llm.includes(llm);
                return (
                  <div
                    key={llm}
                    className={`llm-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => setState({ ...state, llm: isSelected ? state.llm.filter((l) => l !== llm) : [...state.llm, llm] })}
                  >
                    <Checkbox 
                      id={llm} 
                      checked={isSelected} 
                      onCheckedChange={() => setState({ ...state, llm: isSelected ? state.llm.filter((l) => l !== llm) : [...state.llm, llm] })} 
                      className="pointer-events-none"
                    />
                    <Label 
                      htmlFor={llm} 
                      className="text-[#111111] font-medium cursor-pointer flex-1 pointer-events-none"
                    >
                      {llm}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-5 animate-in fade-in duration-500">
            <p className="text-sm text-muted-foreground mb-4">
              Add expert reviewers to provide human insight alongside AI analysis (up to 5).
            </p>
            
            <div className="flex items-center justify-center gap-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full shadow-md hover:shadow-lg transition-shadow disabled:opacity-30"
                onClick={() => {
                  if (state.participants_count > 0) {
                    const count = state.participants_count - 1;
                    const participants = state.participants.slice(0, count);
                    setState({ ...state, participants_count: count, participants });
                  }
                }}
                disabled={state.participants_count === 0}
              >
                <Minus className="h-5 w-5" />
              </Button>
              
              <div className="flex flex-col items-center gap-1">
                <div className="text-5xl font-bold text-primary">
                  {state.participants_count}
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                  {state.participants_count === 1 ? 'Participant' : 'Participants'}
                </div>
              </div>
              
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full shadow-md hover:shadow-lg transition-shadow disabled:opacity-30"
                onClick={() => {
                  if (state.participants_count < 5) {
                    const count = state.participants_count + 1;
                    const participants = [...state.participants, { name: "", email: "" }];
                    setState({ ...state, participants_count: count, participants });
                  }
                }}
                disabled={state.participants_count >= 5}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>

            {state.participants_count >= 5 && (
              <div className="text-center text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                Maximum number of participants reached
              </div>
            )}
            
            {state.participants_count > 0 && (
              <div className="space-y-3 mt-6">
                {state.participants.map((p, i) => (
                  <div key={i} className="participant-input-group">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {i + 1}
                      </div>
                      <Label className="text-sm font-semibold text-foreground">
                        Participant {i + 1}
                      </Label>
                    </div>
                    <div className="space-y-2">
                      <Input 
                        placeholder="Full Name" 
                        value={p.name} 
                        onChange={(e) => { 
                          const newP = [...state.participants]; 
                          newP[i] = { ...newP[i], name: e.target.value }; 
                          setState({ ...state, participants: newP }); 
                        }} 
                        className="bg-white"
                      />
                      <Input 
                        placeholder="Email" 
                        type="email"
                        value={p.email} 
                        onChange={(e) => { 
                          const newP = [...state.participants]; 
                          newP[i] = { ...newP[i], email: e.target.value }; 
                          setState({ ...state, participants: newP }); 
                        }} 
                        className="bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 9:
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground mb-4">
                Set the balance between AI model analysis and human expert input.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground min-w-[80px] text-left">
                    100% Human<br/>
                    <span className="text-xs">(0% LLM)</span>
                  </div>
                  <Slider
                    value={[state.llm_weight_percent]}
                    onValueChange={(value) => setState({ ...state, llm_weight_percent: value[0] })}
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
              <div className="grid grid-cols-2 gap-4">
                <div className="influence-card">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Brain className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">AI Models</span>
                  </div>
                  <p className="influence-value text-2xl">{state.llm_weight_percent}%</p>
                </div>
                <div className="influence-card">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">Human Experts</span>
                  </div>
                  <p className="influence-value text-2xl">{100 - state.llm_weight_percent}%</p>
                </div>
              </div>
            </div>
            {/* Actions for step 12 are standardized via the sticky footer below, so no top button here */}
          </div>
        );
      default:
        return null;
    }
  };

  if (showWeightsTable) {
    // Legacy inline panel replaced by InlineSheetViewer rendered in success UI
    // Keep route/content stable; do not return early
  }

  if (showReview) {
    return (
      <div className="step-card">
        <div className="card-header">
          <div className="step-title text-[#111111]">Review & Confirm</div>
          <div className="helper">Please review your assessment before submission</div>
        </div>
        <div className="card-body space-y-4">
          <div className="space-y-3 text-[14px] leading-[1.35]">
            <div className="review-grid">
                <div>
                  <p className="font-medium text-[#111111] text-[16px]">Sector</p>
                  <p className="text-muted-foreground">{state.sector}</p>
                </div>
                <div>
                  <p className="font-medium text-[#111111] text-[16px]">Domains ({state.domains.length})</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {state.domains.map(d => (
                      <span key={d} className="px-2 py-1 chip rounded text-xs">{d}</span>
                    ))}
                  </div>
                </div>
              </div>

              {state.secondary_category.length > 0 && (
                <div className="text-sm">
                  <p className="font-medium text-[#111111] text-[16px]">Secondary Categories</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {state.secondary_category.map(c => (
                      <span key={c} className="px-2 py-1 chip rounded text-xs">{c}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-sm">
                <p className="font-medium text-[#111111] text-[16px]">Goals ({state.goals.length})</p>
                {state.goals.length === 0 ? (
                  <p className="text-muted-foreground mt-1">No goals provided</p>
                ) : (
                  <ul className="list-disc list-inside text-muted-foreground mt-1">
                    {state.goals.map((g, i) => <li key={i}>{g}</li>)}
                  </ul>
                )}
              </div>

              {state.users.length > 0 && (
                <div className="text-sm">
                  <p className="font-medium text-[#111111] text-[16px]">Primary Users</p>
                  <p className="text-muted-foreground mt-1">{state.users.join(", ")}</p>
                </div>
              )}

              {state.geography.length > 0 && (
                <div className="text-sm">
                  <p className="font-medium text-[#111111] text-[16px]">Geography</p>
                  <p className="text-muted-foreground mt-1">{state.geography.join(", ")}</p>
                </div>
              )}

              {state.compliance.length > 0 && (
                <div className="text-sm">
                  <p className="font-medium text-[#111111] text-[16px]">Compliance</p>
                  <p className="text-muted-foreground mt-1">{state.compliance.join(", ")}</p>
                </div>
              )}

              <div className="review-grid text-sm">
                {state.time_horizon && (
                  <div>
                    <p className="font-medium text-[#111111] text-[16px]">Time Horizon</p>
                    <p className="text-muted-foreground">{state.time_horizon}</p>
                  </div>
                )}
                {state.risk_posture && (
                  <div>
                    <p className="font-medium text-[#111111] text-[16px]">Risk Posture</p>
                    <p className="text-muted-foreground">{state.risk_posture}</p>
                  </div>
                )}
                <div>
                  <p className="font-medium text-[#111111] text-[16px]">Participants</p>
                  <p className="text-muted-foreground">{state.participants_count} humans</p>
                </div>
              </div>

              <div className="text-sm">
                <p className="font-medium text-[#111111] text-[16px]">LLMs ({state.llm.length})</p>
                <p className="text-muted-foreground mt-1">{state.llm.join(", ")}</p>
              </div>

              <div className="influence-card">
                <p className="mb-2">Influence Balance</p>
                <p className="influence-value">LLM {state.llm_weight_percent}% / Human {100 - state.llm_weight_percent}%</p>
              </div>
            </div>
          </div>
          <div className="card-actions">
            <div className="actions-row">
              <Button variant="outline" onClick={() => setShowReview(false)} className="flex-1 transition-all duration-200 hover:shadow-md">
                Edit
              </Button>
              <Button variant="secondary" onClick={handleSaveDraft} className="flex-1 transition-all duration-200 hover:shadow-md">
                Save as Draft
              </Button>
              <Button onClick={handleConfirmSubmit} disabled={isSubmitting} className={`flex-1 transition-all duration-200 hover:shadow-lg ${getButtonClasses()}`}>
                {isSubmitting ? "Submitting..." : "Confirm & Send Data"}
              </Button>
            </div>
        </div>
      </div>
    );
  }

  if (isSubmitting || submitSuccess) {
    const defaultSheetUrl = "https://docs.google.com/spreadsheets/d/1E73HW28r-7ddclj22OGNUNvo194FlLHX2zX50XY5I3w/edit?usp=sharing";
    const displaySheetUrl = sheetUrl || defaultSheetUrl;

    return (
      <div className="max-w-[95vw] mx-auto">
        <div className="step-card">
          <div className="step-title text-[#111111]">
            {isSubmitting ? "Processing Submission..." : "Submission Complete"}
          </div>
          <div className="helper">
            {isSubmitting ? "Please wait while we process your data" : "Your submission has been processed successfully"}
          </div>
          <div className="card-body flex items-center justify-center min-h-[300px]">
            {isSubmitting ? (
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">Processing your submission...</p>
              </div>
            ) : (
              <div className="text-center space-y-6 w-full">
                <div className={`w-20 h-20 rounded-full ${getBgLightClass()} flex items-center justify-center mx-auto`}>
                  <CheckCircle2 className={`h-10 w-10 ${getTextClass()}`} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Success!</h3>
                  <p className="text-muted-foreground">Your submission has been completed</p>
                </div>
                
                <div className="flex gap-3 justify-center pt-4">
                  <Button 
                    onClick={() => setShowWeightsTable(true)} 
                    className={`${getButtonClasses()} transition-all duration-200 hover:shadow-lg`}
                    size="lg"
                  >
                    View Weights Table
                  </Button>
                  <Button 
                    variant="outline"
                    className="transition-all duration-200 hover:shadow-md"
                    size="lg"
                    onClick={() => {
                      // Clear any saved draft
                      localStorage.removeItem("xrl:intake:draft");
                      // Reset all form state
                      setState(INITIAL_STATE);
                      setCurrentStep(1);
                      setIsSubmitting(false);
                      setSubmitSuccess(false);
                      setShowWeightsTable(false);
                      setSheetUrl(null);
                    }}
                  >
                    New Form
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {showWeightsTable && submitSuccess && (
          <div data-weights-table>
            <WeightsTable
              llms={state.llm}
              participants={state.participants}
              domains={state.domains}
              initialLlmWeight={state.llm_weight_percent}
              formData={state}
              onClose={() => setShowWeightsTable(false)}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-[95vw] mx-auto relative">
      <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-border">
        <div className="flex justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 px-3 py-1 rounded-full">
              <p className="text-sm font-bold text-primary">Step {currentStep} of 9</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <p className="text-sm font-semibold text-foreground">{Math.round(progress)}% Complete</p>
          </div>
        </div>
        <Progress value={progress} className="h-3 shadow-inner" />
      </div>
      <div className="step-card">
        <div className="card-header">
          <div className="step-title text-[#111111] flex items-center gap-2">
            {currentStep === 1 && <Zap className="w-6 h-6 text-primary inline-block" />}
            {currentStep === 2 && <Target className="w-6 h-6 text-primary inline-block" />}
            {currentStep === 3 && <MapPin className="w-6 h-6 text-primary inline-block" />}
            {currentStep === 4 && <Target className="w-6 h-6 text-primary inline-block" />}
            {currentStep === 5 && <Clock className="w-6 h-6 text-primary inline-block" />}
            {currentStep === 6 && <TrendingUp className="w-6 h-6 text-primary inline-block" />}
            {currentStep === 7 && <Brain className="w-6 h-6 text-primary inline-block" />}
            {currentStep === 8 && <UserPlus className="w-6 h-6 text-primary inline-block" />}
            {currentStep === 9 && <Scale className="w-6 h-6 text-primary inline-block" />}
            <span>{["Sector", "Domain", "Secondary Category", "Context & Details", "Time Horizon", "Risk Posture", "LLM Selection", "Human Participants", "Influence Balance"][currentStep - 1]}</span>
          </div>
          <div className="field-hint" />
        </div>
        <div className="card-body">
          {renderStep()}
        </div>
        <div className="card-actions">
          <div className="actions-row">
            <Button 
              variant="outline" 
              onClick={handleBack} 
              disabled={currentStep === 1} 
              className={`flex-1 ${getTextClass()}`}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />Back
            </Button>
            <Button onClick={handleNext} className={`flex-1 ${getButtonClasses()}`}>
              {currentStep === 9 ? "Complete" : (
                <>
                  Next<ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewForm;
