import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { ContextJobsEntitlements } from "@/shared/api/contextJobs";

type ContextJobsEntitlementsState = ContextJobsEntitlements & {
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
};

const createEmptyEntitlements = (): ContextJobsEntitlementsState => ({
  userId: "",
  plan: null,
  contextJobsEnabled: false,
  message: null,
  upgradeRequired: null,
  keyMode: null,
  canManageKeys: false,
  limits: null,
  usage: null,
  canCreateJob: false,
  canCreateRun: false,
  providers: [],
  status: "idle",
  error: null,
});

const initialState: ContextJobsEntitlementsState = createEmptyEntitlements();

const contextJobsEntitlementsSlice = createSlice({
  name: "contextJobsEntitlements",
  initialState,
  reducers: {
    setEntitlementsLoading: (state) => {
      state.status = "loading";
      state.error = null;
    },
    setEntitlements: (state, action: PayloadAction<ContextJobsEntitlements>) => {
      state.userId = action.payload.userId;
      state.plan = action.payload.plan;
      state.contextJobsEnabled = action.payload.contextJobsEnabled;
      state.message = action.payload.message;
      state.upgradeRequired = action.payload.upgradeRequired;
      state.keyMode = action.payload.keyMode;
      state.canManageKeys = action.payload.canManageKeys ?? false;
      state.limits = action.payload.limits;
      state.usage = action.payload.usage;
      state.canCreateJob = action.payload.canCreateJob;
      state.canCreateRun = action.payload.canCreateRun;
      state.providers = action.payload.providers;
      state.status = "succeeded";
      state.error = null;
    },
    setEntitlementsError: (state, action: PayloadAction<string>) => {
      state.status = "failed";
      state.error = action.payload;
    },
    clearEntitlements: () => createEmptyEntitlements(),
  },
});

export const {
  setEntitlementsLoading,
  setEntitlements,
  setEntitlementsError,
  clearEntitlements,
} = contextJobsEntitlementsSlice.actions;

export default contextJobsEntitlementsSlice.reducer;
