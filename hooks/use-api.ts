"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api-client";

type Result<T> = { key: string; data?: T; error?: string; status?: number };

// Loads `path` from our JSON API and re-loads whenever it changes. Pass null to skip loading.
// Keeps the previous data on screen while a new request is in flight, so lists don't flash empty
// when filters change.
export function useApi<T>(path: string | null) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);

  // Each request gets a key; when the latest result's key doesn't match, we're still loading
  const key = path === null ? null : `${path}#${attempt}`;

  useEffect(() => {
    if (key === null || path === null) return;
    let ignore = false; // a newer request has started, so drop this one's result

    api<T>(path)
      .then((data) => {
        if (!ignore) setResult({ key, data });
      })
      .catch((err: Error) => {
        if (!ignore) setResult({ key, error: err.message, status: (err as ApiError).status });
      });

    return () => {
      ignore = true;
    };
  }, [key, path]);

  const loading = key !== null && result?.key !== key;
  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  return {
    data: result?.data,
    error: loading ? undefined : result?.error,
    status: loading ? undefined : result?.status,
    loading,
    reload,
  };
}
