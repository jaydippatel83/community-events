"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { ErrorState } from "@/components/states";

// Shown if a page crashes while rendering (API errors are handled on each page instead)
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorState message="This page failed to load. Please try again." onRetry={retry} />;
}
