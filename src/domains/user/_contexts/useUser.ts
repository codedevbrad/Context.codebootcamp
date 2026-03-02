"use client";

import useSWR from "swr";
import { getCurrentUser } from "../db";

const fetcher = () => getCurrentUser();

export function useUser() {
  const { data, error, isLoading, mutate } = useSWR("user", fetcher);
  return { data, error, isLoading, mutate };
}
