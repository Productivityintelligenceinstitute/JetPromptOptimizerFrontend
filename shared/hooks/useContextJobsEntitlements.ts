"use client";

import { useAppSelector } from "@/shared/store/hooks";

export const useContextJobsEntitlements = () => {
  return useAppSelector((state) => state.contextJobsEntitlements);
};
