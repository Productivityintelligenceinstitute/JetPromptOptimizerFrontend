import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import contextJobsEntitlementsReducer from './contextJobsEntitlementsSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    contextJobsEntitlements: contextJobsEntitlementsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
