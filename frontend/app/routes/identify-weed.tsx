import { Form, Link, redirect, useNavigation, type ClientLoaderFunctionArgs } from "react-router";
import type { Route } from "./+types/root";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
} from "~/components/ui/field";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Leaf, List, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Input } from "~/components/ui/input";
import { userContext } from "~/context";

export async function clientLoader({context}:ClientLoaderFunctionArgs) {
  const me = context.get(userContext)
  const isAdmin = me && me.is_admin
  if (!isAdmin){
    throw redirect("/home");
  }
}

export async function clientAction({ request ,params }: Route.ClientActionArgs) {
  const incoming = await request.formData();

  const description = String(incoming.get("description") ?? "");
  const concern = String(incoming.get("concern") ?? "");
  const image = incoming.get("image"); // File | null

  const formData = new FormData();
  formData.append("description", description);
  formData.append("concern", concern);

  // Only append if a real file is selected
  if (image instanceof File && image.name && image.size > 0) {
    formData.append("image", image);
  }
  

  const response = await fetch("/api/identify-weed", {
    method: "POST",
    body: formData,
  });
  const raw = await response.json();      
  const result = typeof raw === "string" ? JSON.parse(raw) : raw;
  console.log("type:", typeof result);
  console.log("res====",result.summary)
  if (!response.ok) {
    return {
      error: "Failed to identify plant. Please try again.",
    };
  }

  if (response.ok) {

    
    if (result?.confidence_score != null) {
      formData.append("confidence_score", String(result.confidence_score));
    }

    if (result?.summary != null) {
      formData.append("summary", String(result.summary));
    }
    const formvalues = Object.fromEntries(formData);
    console.log("formm---",formvalues);
    const res = await fetch(`/api/add-query/${params.username}`, {
    method: "POST",
    body: formData,
  });
  }

  return result;
}

// Helper: turn string/object/array into readable text (not raw JSON blob in the UI)
function toReadableText(value: unknown): string {
  if (value == null) return "";

  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    return value
      .map((item) => toReadableText(item))
      .filter(Boolean)
      .join("\n");
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => {
        const prettyKey = k.replace(/_/g, " ");
        const text = toReadableText(v);
        return text ? `${prettyKey}: ${text}` : `${prettyKey}:`;
      })
      .join("\n");
  }

  return String(value);
}

function MenuDropdown({ username }: { username: string }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/70 shadow-sm backdrop-blur hover:bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
      >
        {open ? <X className="h-5 w-5" /> : <List className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl">
          <div className="px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-black/50">
              Quick Links
            </p>
          </div>

          <div className="h-px bg-black/5" />

          <nav className="p-2">
            <Link
              to={`/past-queries/${username}`}
              className="block rounded-xl px-3 py-2 text-sm text-black/80 hover:bg-black/5"
              onClick={() => setOpen(false)}
            >
              Past Queries
            </Link>
            <Link
              to={`/logout`}
              className="mt-1 block rounded-xl px-3 py-2 text-sm text-black/80 hover:bg-black/5"
              onClick={() => setOpen(false)}
            >
              Logout
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}

export default function IdentifyWeedForm({params, actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isLoading =
    navigation.state === "submitting" || navigation.state === "loading";

  const result = typeof actionData === "string" ? JSON.parse(actionData) : actionData;

  const [concern, setConcern] = useState<string>("None");

  const isError = Boolean(result && (result as any).error);
  const hasData = Boolean(result && !isError);

  const speciesName = hasData ? (result as any).species_name ?? "" : "";
  const confidenceScore = hasData ? (result as any).confidence_score ?? "" : "";

  const scoreNum =
  typeof confidenceScore === "number"
    ? confidenceScore
    : Number(confidenceScore);

  const lowConfidence = scoreNum !== null && scoreNum < 70;



  const lifecycleText = hasData
    ? toReadableText((result as any).lifecycle_info ?? "")
    : "";
  const controlMethodsText = hasData
    ? toReadableText((result as any).control_methods ?? "")
    : "";

  return (
    <div className="min-h-[calc(100vh-0px)] bg-gradient-to-b from-neutral-50 via-white to-neutral-50">
  {/* Top Pane */}
  <header className="w-full bg-white shadow-sm">
    <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">


      {/* Page Content */}
  <div className="px-4 pt-1">
    <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
      Weed Identification And Control
    </h1>
  </div>

      {/* Top Right: Menu */}
      <MenuDropdown username={params.username} />
    </div>
  </header>

  


      {/* Main content */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Form method="post" encType="multipart/form-data">
          <FieldGroup>
           

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* LEFT: Form */}
              <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  
                  {/* {isLoading && (
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-neutral-300 border-t-transparent" />
                      Processing…
                    </div>
                  )} */}
                </div>

                <div className="mt-5 space-y-5">
                  <Field>
                    <FieldLabel htmlFor="description">Your question</FieldLabel>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="e.g., What weed is this, and how do I control it?"
                      required
                      className="min-h-[120px] rounded-2xl border-black/10 bg-neutral-50 focus:bg-white"
                    />
                    <p className="mt-2 text-xs text-neutral-500">
                      Tip: add location, weed type, and growth stage for better results.
                    </p>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="image">Upload image (optional)</FieldLabel>
                    <Input
                      id="image"
                      name="image"
                      type="file"
                      className="rounded-2xl border-black/10 bg-white"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="concern">Select your concern (optional)</FieldLabel>
                    <select
                      id="concern"
                      name="concern"
                      className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                      value={concern}
                      onChange={(e) => setConcern(e.target.value)}
                    >
                      <option value="None">Everything</option>
                      <option value="species_name">Identify species</option>
                      <option value="lifecycle_info">Lifecycle info</option>
                      <option value="control_methods">Control methods</option>
                    </select>
                  </Field>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full rounded-2xl"
                    >
                      {isLoading ? "Submitting…" : "Submit"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* RIGHT: Results */}
              <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-neutral-900">
                  Identification Results
                </p>
                {/* <p className="mt-1 text-sm text-neutral-600">
                  Your identification output will appear here.
                </p> */}

                <div className="mt-5">
                  {isLoading && (
                    <div className="rounded-2xl border border-black/5 bg-neutral-50 p-4 text-sm text-neutral-600">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-transparent" />
                        <span>Analyzing and preparing sugesstions..</span>
                      </div>
                    </div>
                  )}

                  {isError && !isLoading &&(
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                      <p className="text-sm font-medium text-red-700">Error</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-red-700">
                        {(result as any)?.error ?? "Something went wrong."}
                      </p>
                    </div>
                  )}

                  
                  {hasData && (
                    <div className="mt-4 space-y-5">
                      <div className="rounded-2xl border border-black/5 bg-neutral-50 p-4">
                          <FieldLabel>Confidence Score of Answer</FieldLabel>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-800">
                            {confidenceScore+"%" || "—"}
                          </p>
                          {lowConfidence && (
                            <p className="mt-2 text-sm font-medium text-red-600">
                              Try again (Please provide a clearer description or upload an image).
                            </p>
                          )}
                        </div>


                      {(concern === "None" || concern === "species_name") && (
                        <div className="rounded-2xl border border-black/5 bg-neutral-50 p-4">
                          <FieldLabel>Species name</FieldLabel>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-800">
                            {speciesName || "—"}
                          </p>
                        </div>
                      )}

                      {(concern === "None" || concern === "lifecycle_info") && (
                        <div className="rounded-2xl border border-black/5 bg-neutral-50 p-4">
                          <FieldLabel>Lifecycle</FieldLabel>
                          <Textarea
                            readOnly
                            rows={6}
                            value={lifecycleText}
                            className="mt-2 w-full rounded-2xl border-black/10 bg-white text-sm"
                          />
                        </div>
                      )}

                      {(concern === "None" || concern === "control_methods") && (
                        <div className="rounded-2xl border border-black/5 bg-neutral-50 p-4">
                          <FieldLabel>Control methods</FieldLabel>
                          <Textarea
                            readOnly
                            rows={8}
                            value={controlMethodsText}
                            className="mt-2 w-full rounded-2xl border-black/10 bg-white text-sm"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {!isLoading && !isError && !hasData && (
                    <div className="mt-4 rounded-2xl border border-black/5 bg-neutral-50 p-6 text-center">
                      <p className="text-sm text-neutral-600">
                        No results yet. Submit a query to see the response here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </FieldGroup>
        </Form>
      </div>
    </div>
  );
}
