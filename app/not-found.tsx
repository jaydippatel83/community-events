import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/states";

export default function NotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="Page not found"
      message="The page you're looking for doesn't exist or has moved."
      action={
        <Button asChild size="lg">
          <Link href="/">Browse events</Link>
        </Button>
      }
    />
  );
}
