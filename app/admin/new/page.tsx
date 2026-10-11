"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { EventImage } from "@/components/event-card";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api-client";
import { CATEGORIES } from "@/lib/constants";
import { formatPrice } from "@/lib/format";

export default function NewEventPage() {
  const router = useRouter();
  const cities = useApi<{ cities: string[] }>("/events/cities");
  const [category, setCategory] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    if (!category) return setError("Pick a category");

    setSubmitting(true);
    setError(null);
    try {
      await api("/admin/events", {
        method: "POST",
        json: {
          title: form.get("title"),
          category,
          city: form.get("city"),
          // The picker gives local time with no zone ("2026-10-18T18:30"); events are in India, so treat it as IST
          startsAt: `${form.get("startsAt")}:00+05:30`,
          pricePaise: Math.round(Number(price) * 100), // money is stored in paise
          description: form.get("description"),
          imageUrl,
          isActive,
        },
      });
      toast.success("Event added");
      // Next.js keeps this page alive after we leave, so clear it for the next event
      formEl.reset();
      setCategory("");
      setImageUrl("");
      setPrice("");
      setIsActive(true);
      router.push("/admin");
    } catch (err) {
      setError((err as Error).message);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl">
      <Button asChild variant="ghost" size="lg" className="-ml-2.5 mb-4 text-muted-foreground">
        <Link href="/admin">
          <ArrowLeft aria-hidden /> All events
        </Link>
      </Button>
      <h1 className="text-2xl font-bold sm:text-3xl">Add an event</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-2xl border bg-card p-4 sm:p-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle aria-hidden />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Field label="Title" htmlFor="title">
          <Input id="title" name="title" required minLength={3} maxLength={120} className="h-10" />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Category" htmlFor="category">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" className="h-10 w-full">
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="City" htmlFor="city">
            <Input id="city" name="city" required minLength={2} maxLength={60} list="city-options" className="h-10" />
            {/* Suggests cities already in use, but any city can be typed */}
            <datalist id="city-options">
              {cities.data?.cities.map((c) => <option key={c} value={c} />)}
            </datalist>
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Date and time (IST)" htmlFor="startsAt">
            <Input id="startsAt" name="startsAt" type="datetime-local" required className="h-10" />
          </Field>

          <Field label="Price (₹)" htmlFor="price" hint={price ? `Shown as ${formatPrice(Math.round(Number(price) * 100))}` : "Enter 0 for a free event"}>
            <Input
              id="price"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="h-10"
            />
          </Field>
        </div>

        <Field label="Description" htmlFor="description">
          <Textarea id="description" name="description" required minLength={10} maxLength={2000} rows={5} />
        </Field>

        <Field label="Image URL" htmlFor="imageUrl">
          <Input
            id="imageUrl"
            type="url"
            required
            placeholder="https://…"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="h-10"
          />
          {/^https?:\/\/.+/.test(imageUrl) && (
            <EventImage src={imageUrl} alt="Image preview" className="mt-3 aspect-[16/9] w-full rounded-xl border" />
          )}
        </Field>

        <label className="flex items-center justify-between gap-4 rounded-xl bg-muted p-3">
          <span>
            <span className="block text-sm font-medium">Active</span>
            <span className="text-xs text-muted-foreground">Visible to visitors as soon as it&apos;s saved.</span>
          </span>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </label>

        <Button type="submit" size="lg" className="h-10 w-full" disabled={submitting}>
          {submitting && <Spinner />}
          Add event
        </Button>
      </form>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
