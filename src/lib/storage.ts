function uuidv4(): string {
  if (typeof crypto !== "undefined" && (crypto as any).randomUUID) {
    return (crypto as any).randomUUID();
  }
  // Fallback minimal UUID v4 generator
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Fallback-safe storage wrapper (localStorage-based for now)
const USERS_KEY = "xrl:users";
const SESSION_KEY = "xrl:session";

type UserRecord = {
  username: string;
  email: string | null;
  passwordHash: string;
  createdAt: string;
  lastLoginAt: string;
};

export type RunRecord = {
  id: string;
  username: string;
  createdAt: string;
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
  sheetUrl: string | null;
  status: "sent";
  tableState?: {
    allDomainsData: any;
    userWeights: any;
    resultData: any;
    llmWeight: number;
    disabledLlms: string[];
    disabledParticipants: string[];
    isMeDisabled: boolean;
    showResultsTable: boolean;
    viewMode: 'weights' | 'results';
  };
};

export type DraftRecord = {
  id: string;
  username: string;
  updatedAt: string;
  state: any;
};

function getUsers(): UserRecord[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function setUsers(users: UserRecord[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export async function createUser(user: Omit<UserRecord, "createdAt" | "lastLoginAt"> & { passwordHash: string }): Promise<UserRecord> {
  const users = getUsers();
  if (users.find(u => u.username.toLowerCase() === user.username.toLowerCase())) {
    throw new Error("USERNAME_TAKEN");
  }
  const now = new Date().toISOString();
  const record: UserRecord = {
    username: user.username,
    email: user.email,
    passwordHash: user.passwordHash,
    createdAt: now,
    lastLoginAt: now,
  };
  users.push(record);
  setUsers(users);
  return record;
}

export async function getUser(username: string): Promise<UserRecord | undefined> {
  const users = getUsers();
  return users.find(u => u.username.toLowerCase() === username.toLowerCase());
}

export async function updateLastLogin(username: string): Promise<void> {
  const users = getUsers();
  const idx = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
  if (idx >= 0) {
    users[idx] = { ...users[idx], lastLoginAt: new Date().toISOString() };
    setUsers(users);
  }
}

export function setSession(username: string) {
  try {
    if (typeof window !== "undefined" && localStorage) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username, at: new Date().toISOString() }));
    }
  } catch (error) {
    console.warn("Failed to set session:", error);
  }
}

export function getSession(): { username: string } | null {
  try {
    if (typeof window === "undefined" || !localStorage) return null;
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.username === "string") return { username: parsed.username };
    return null;
  } catch (error) {
    console.warn("Failed to get session:", error);
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// History DB (localStorage namespace)
function runsKey(username: string) {
  return `xrl:${username}:runs`;
}
function draftsKey(username: string) {
  return `xrl:${username}:drafts`;
}

export async function saveDraft(username: string, snapshot: any): Promise<DraftRecord> {
  const key = draftsKey(username);
  const drafts: DraftRecord[] = JSON.parse(localStorage.getItem(key) || "[]");
  const now = new Date().toISOString();
  const latest = drafts[0];
  if (latest) {
    latest.updatedAt = now;
    latest.state = snapshot;
    drafts[0] = latest;
  } else {
    drafts.unshift({ id: uuidv4(), username, updatedAt: now, state: snapshot });
  }
  localStorage.setItem(key, JSON.stringify(drafts));
  return drafts[0];
}

export async function loadLatestDraft(username: string): Promise<DraftRecord | null> {
  const key = draftsKey(username);
  const drafts: DraftRecord[] = JSON.parse(localStorage.getItem(key) || "[]");
  return drafts[0] || null;
}

export async function commitRun(username: string, payload: Omit<RunRecord, "id" | "username" | "createdAt" | "status">): Promise<RunRecord> {
  const key = runsKey(username);
  const runs: RunRecord[] = JSON.parse(localStorage.getItem(key) || "[]");
  const now = new Date().toISOString();
  const record: RunRecord = {
    id: uuidv4(),
    username,
    createdAt: now,
    status: "sent",
    ...payload,
  } as RunRecord;
  runs.unshift(record);
  localStorage.setItem(key, JSON.stringify(runs));
  // clear drafts on commit
  localStorage.setItem(draftsKey(username), JSON.stringify([]));
  return record;
}

export async function listRuns(username: string, limit = 20): Promise<RunRecord[]> {
  const key = runsKey(username);
  const runs: RunRecord[] = JSON.parse(localStorage.getItem(key) || "[]");
  return runs.slice(0, limit);
}

export async function listDrafts(username: string, limit = 5): Promise<DraftRecord[]> {
  const key = draftsKey(username);
  const drafts: DraftRecord[] = JSON.parse(localStorage.getItem(key) || "[]");
  return drafts.slice(0, limit);
}

export async function clearAllHistory(username: string): Promise<void> {
  const runsKeyName = runsKey(username);
  const draftsKeyName = draftsKey(username);
  localStorage.removeItem(runsKeyName);
  localStorage.removeItem(draftsKeyName);
}

export async function deleteRun(username: string, runId: string): Promise<void> {
  const key = runsKey(username);
  const runs: RunRecord[] = JSON.parse(localStorage.getItem(key) || "[]");
  const filtered = runs.filter(r => r.id !== runId);
  localStorage.setItem(key, JSON.stringify(filtered));
}

export async function updateRunTableState(
  username: string, 
  runId: string, 
  tableState: RunRecord['tableState']
): Promise<void> {
  const key = runsKey(username);
  const runs: RunRecord[] = JSON.parse(localStorage.getItem(key) || "[]");
  const runIndex = runs.findIndex(r => r.id === runId);
  
  if (runIndex >= 0) {
    runs[runIndex] = {
      ...runs[runIndex],
      tableState,
    };
    localStorage.setItem(key, JSON.stringify(runs));
  }
}


