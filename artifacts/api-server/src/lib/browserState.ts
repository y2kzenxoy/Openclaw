export interface BrowserState {
  active: boolean;
  currentUrl?: string;
  currentTitle?: string;
  lastAction?: string;
  source?: string;
  lastScreenshot?: string;
  pendingAction?: {
    action: string;
    selector?: string;
    value?: string;
    script?: string;
  };
}

let state: BrowserState = { active: false };

export function getBrowserState(): BrowserState {
  return { ...state };
}

export function updateBrowserState(updates: Partial<BrowserState>): void {
  state = { ...state, ...updates };
}

export function setPendingAction(action: BrowserState["pendingAction"]): void {
  state.pendingAction = action;
}

export function consumePendingAction(): BrowserState["pendingAction"] {
  const a = state.pendingAction;
  state.pendingAction = undefined;
  return a;
}
