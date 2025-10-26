import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { SecondaryCategorySelector } from "@/components/SecondaryCategorySelector";
import { InlineSheetViewer } from "@/components/InlineSheetViewer";
import { getSession, saveDraft, commitRun } from "@/lib/storage";

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
  const navigate = useNavigate();

  useEffect(() => {
    const username = getSession()?.username;
    if (!username) return;
    const timer = setTimeout(() => {
      if (state.isDraft) {
        saveDraft(username, state);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    (async () => {
      const username = getSession()?.username;
      if (!username) return;
      const latest = await (await import("@/lib/storage")).loadLatestDraft(username);
      if (latest?.state) {
        const parsed = latest.state;
        if (parsed.domain && !parsed.domains) {
          parsed.domains = [parsed.domain];
          delete parsed.domain;
        }
        if (!parsed.domains) parsed.domains = [];
        setState(parsed);
        toast.success("Draft restored");
      }
    })();
  }, []);

  const progress = (currentStep / 12) * 100;

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
    if (currentStep === 10 && state.llm.length === 0) {
      toast.error("Please select at least one LLM");
      return;
    }
    if (currentStep === 12) {
      setShowReview(true);
      return;
    }
    if (currentStep < 12) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleTextareaChange = (field: keyof XrlState, value: string) => {
    const lines = value.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
    const unique = Array.from(new Set(lines.map((l) => l.toLowerCase()))).map(
      (l) => lines.find((orig) => orig.toLowerCase() === l)!
    );
    setState({ ...state, [field]: unique });
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

    setIsSubmitting(true);
    setShowReview(false);

    const workingStatuses: DomainSubmitStatus[] = state.domains.map(domain => ({
      domain,
      status: "pending" as const
    }));
    setDomainStatuses(workingStatuses);

    const user = JSON.parse(localStorage.getItem("xrl_user") || "{}");
    let firstSheetUrl: string | null = null;

    for (let i = 0; i < state.domains.length; i++) {
      const domain = state.domains[i];
      
      setDomainStatuses(prev => prev.map((s, idx) => 
        idx === i ? { ...s, status: "sending" } : s
      ));

      try {
        const payload = {
          sector: state.sector,
          domain: domain,
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
        };

        const response = await fetch("https://shooky5.app.n8n.cloud/webhook/xrl", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const result = await response.json().catch(() => ({}));
          const sheetUrlFromResponse = result?.sheetUrl;
          
          if (sheetUrlFromResponse && !firstSheetUrl) {
            firstSheetUrl = sheetUrlFromResponse;
          }

          // update local and state
          workingStatuses[i] = { ...workingStatuses[i], status: "sent", sheetUrl: sheetUrlFromResponse };
          setDomainStatuses([...workingStatuses]);
        } else {
          workingStatuses[i] = { ...workingStatuses[i], status: "failed" };
          setDomainStatuses([...workingStatuses]);
        }
      } catch {
        workingStatuses[i] = { ...workingStatuses[i], status: "failed" };
        setDomainStatuses([...workingStatuses]);
      }
    }

    const allSent = workingStatuses.every(s => s.status === "sent" || s.status === "failed");
    const anySent = workingStatuses.some(s => s.status === "sent");

    if (anySent) {
      const username = getSession()?.username || "anonymous";
      await commitRun(username, {
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
        sheetUrl: firstSheetUrl || "https://docs.google.com/spreadsheets/d/1E73HW28r-7ddclj22OGNUNvo194FlLHX2zX50XY5I3w/edit?usp=sharing",
      });

      setSheetUrl(firstSheetUrl || "https://docs.google.com/spreadsheets/d/1E73HW28r-7ddclj22OGNUNvo194FlLHX2zX50XY5I3w/edit?usp=sharing");
      setSubmitSuccess(true);
      
      toast.success("Submissions complete", { 
        duration: 4000,
        action: {
          label: "✕",
          onClick: () => {}
        }
      });
    } else {
      toast.error("All submissions failed");
    }

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
        return <div className="space-y-4"><Label className="text-[#111111]">Sector (locked to Energy)</Label><Input value="Energy" disabled /></div>;
      case 2:
        return (
          <div className="space-y-4">
            <Label className="text-[#111111]">Domain(s) - Select 1 to 5 *</Label>
            <p className="text-sm text-muted-foreground">You can select up to 5 domains. Each will be submitted separately.</p>
            <div className="space-y-2">
              {["Solar PV", "Wind", "Hydrogen", "Battery Storage", "Nuclear", "Geothermal", "Hydro", "Biomass"].map(domain => (
                <div key={domain} className="flex items-center space-x-2">
                  <Checkbox 
                    id={domain} 
                    checked={(state.domains || []).includes(domain)} 
                    onCheckedChange={() => toggleDomain(domain)} 
                  />
                  <Label htmlFor={domain} className="text-[#111111] font-normal">{domain}</Label>
                </div>
              ))}
            </div>
            {(state.domains || []).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {(state.domains || []).map(d => (
                  <span key={d} className="px-3 py-1 chip rounded-full text-sm">
                    {d}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      case 3:
        return <div className="space-y-4"><SecondaryCategorySelector value={state.secondary_category} onChange={(secondary_category) => setState({ ...state, secondary_category })} /></div>;
      case 4:
        return <div className="space-y-4"><Label className="text-[#111111]">Goals (one per line)</Label><p className="text-sm text-muted-foreground">Optional. Enter one per line.</p><Textarea placeholder="Reduce LCOE by 20%&#10;Reach MRL 7 in 18 months" value={state.goals.join("\n")} onChange={(e) => handleTextareaChange("goals", e.target.value)} rows={8} /></div>;
      case 5:
        return <div className="space-y-4"><Label className="text-[#111111]">Primary Users</Label><Textarea placeholder="Utility grid planners&#10;IPPs" value={state.users.join("\n")} onChange={(e) => handleTextareaChange("users", e.target.value)} rows={6} /></div>;
      case 6:
        return <div className="space-y-4"><Label className="text-[#111111]">Geography</Label><Textarea placeholder="United States&#10;EU" value={state.geography.join("\n")} onChange={(e) => handleTextareaChange("geography", e.target.value)} rows={6} /></div>;
      case 7:
        return <div className="space-y-4"><Label className="text-[#111111]">Compliance</Label><Textarea placeholder="ISO 14040 LCA&#10;EPA permits" value={state.compliance.join("\n")} onChange={(e) => handleTextareaChange("compliance", e.target.value)} rows={6} /></div>;
      case 8:
        return <div className="space-y-4"><Label className="text-[#111111]">Time Horizon</Label><div className="grid grid-cols-2 gap-3">{["0–6m", "6–12m", "1–3y", "3+y"].map((o) => <Button key={o} variant={state.time_horizon === o ? "default" : "outline"} onClick={() => setState({ ...state, time_horizon: o })} className="h-16">{o}</Button>)}</div></div>;
      case 9:
        return <div className="space-y-4"><Label className="text-[#111111]">Risk Posture</Label><div className="grid gap-3">{["Conservative", "Balanced", "Aggressive"].map((o) => <Button key={o} variant={state.risk_posture === o ? "default" : "outline"} onClick={() => setState({ ...state, risk_posture: o })} className="h-16">{o}</Button>)}</div></div>;
      case 10:
        return <div className="space-y-4"><Label className="text-[#111111]">LLM Selection *</Label><div className="space-y-3">{["ChatGPT", "Gemini", "GROK", "DeepSeek", "Claude", "Mistral"].map((llm) => <div key={llm} className="flex items-center space-x-2"><Checkbox id={llm} checked={state.llm.includes(llm)} onCheckedChange={(c) => setState({ ...state, llm: c ? [...state.llm, llm] : state.llm.filter((l) => l !== llm) })} /><Label htmlFor={llm} className="text-[#111111] font-normal">{llm}</Label></div>)}</div></div>;
      case 11:
        return <div className="space-y-4"><Label className="text-[#111111]">Human Participants (0-10)</Label><Input type="number" min={0} max={10} value={state.participants_count} onChange={(e) => { const count = Math.max(0, Math.min(10, parseInt(e.target.value) || 0)); const participants = Array.from({ length: count }, (_, i) => state.participants[i] || { name: "", email: "" }); setState({ ...state, participants_count: count, participants }); }} />{state.participants_count > 0 && <div className="space-y-3 mt-6">{state.participants.map((p, i) => <div key={i} className="grid grid-cols-2 gap-3"><Input placeholder="Full Name" value={p.name} onChange={(e) => { const newP = [...state.participants]; newP[i] = { ...newP[i], name: e.target.value }; setState({ ...state, participants: newP }); }} /><Input placeholder="Email" value={p.email} onChange={(e) => { const newP = [...state.participants]; newP[i] = { ...newP[i], email: e.target.value }; setState({ ...state, participants: newP }); }} /></div>)}</div>}</div>;
      case 12:
        return (
          <div className="space-y-6">
            <div className="space-y-6">
              <Label className="text-foreground text-lg font-medium">LLM ↔ Human Influence</Label>
              <p className="text-sm text-muted-foreground">
                Set the balance between AI model analysis and human expert input
              </p>
              <div className="space-y-4">
                <input 
                  type="range" 
                  min={0} 
                  max={100} 
                  step={25}
                  value={state.llm_weight_percent} 
                  onChange={(e) => setState({ ...state, llm_weight_percent: parseInt(e.target.value) })} 
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-[color:var(--primary-ghost-hex)] transition-all duration-200"
                />
                <div className="flex justify-between text-xs text-muted-foreground px-1">
                  {[0,25,50,75,100].map((t) => (
                    <span key={t}>{t}%</span>
                  ))}
                </div>
              </div>
              <div className="influence-card">
                <p className="influence-value">LLM {state.llm_weight_percent}% / Human {100 - state.llm_weight_percent}%</p>
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
              <Button onClick={handleConfirmSubmit} disabled={isSubmitting} className="flex-1 transition-all duration-200 hover:shadow-lg">
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
      <div className="max-w-3xl mx-auto">
        <div className="step-card">
          <div className="step-title text-[#111111]">Submission Status</div>
          <div className="helper">Sending assessments to n8n...</div>
          <div className="card-body space-y-3">
            {domainStatuses.map((ds, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                <span className="font-medium text-[#111111]">{ds.domain}</span>
                <span className={`text-sm px-3 py-1 rounded ${
                  ds.status === "pending" ? "bg-gray-100 text-gray-600" :
                  ds.status === "sending" ? "bg-blue-100 text-blue-600" :
                  ds.status === "sent" ? "bg-green-100 text-green-600" :
                  "bg-red-100 text-red-600"
                }`}>
                  {ds.status === "pending" ? "Pending" :
                   ds.status === "sending" ? "Sending..." :
                   ds.status === "sent" ? "Sent ✓" :
                   "Failed ✗"}
                </span>
              </div>
            ))}
          </div>
          {submitSuccess && (
            <div className="card-actions">
              <div className="actions-row">
                <Button 
                  onClick={() => setShowWeightsTable(true)} 
                  className="flex-1 transition-all duration-200 hover:shadow-lg"
                  size="lg"
                >
                  Weights Table
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1 transition-all duration-200 hover:shadow-md"
                  size="lg"
                  onClick={() => {}}
                >
                  Result
                </Button>
              </div>
            </div>
          )}
        </div>

        {showWeightsTable && submitSuccess && (
          <InlineSheetViewer 
            sheetUrl={displaySheetUrl}
            onClose={() => setShowWeightsTable(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto relative">
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <p className="text-sm font-medium text-[#111111]">Step {currentStep} of 12</p>
          <p className="text-sm text-muted-foreground">{Math.round(progress)}%</p>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      <div className="step-card">
        <div className="card-header">
          <div className="step-title text-[#111111]">
          {["Sector", "Domain", "Secondary Category", "Goals", "Primary Users", "Geography", "Compliance", "Time Horizon", "Risk Posture", "LLM Selection", "Human Participants", "Influence Balance"][currentStep - 1]}
          </div>
          <div className="field-hint" />
        </div>
        <div className="card-body">
          {renderStep()}
        </div>
        <div className="card-actions">
          <div className="actions-row">
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 1} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />Back
            </Button>
            <Button onClick={handleNext} className="flex-1 button-primary">
              {currentStep === 12 ? "Complete" : (
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
