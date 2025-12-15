import { Form ,useNavigation } from "react-router";
import type { Route } from "../+types/root";
import { Field, FieldGroup, FieldLabel, FieldLegend } from "~/components/ui/field";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { List } from "lucide-react";
import React, { useState } from "react";
import { Input } from "~/components/ui/input";

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();

  const formvalues = Object.fromEntries(formData)
  console.log("formm---",formvalues)

  const response = await fetch("/api/identify-weed", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    return {
      error: "Failed to identify plant. Please try again.",
    };
  }

  return await response.json();
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
    // Convert object fields to "Key: value" lines
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

export default function IdentifyWeedForm({ actionData }: Route.ComponentProps) {

  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting" || navigation.state === "loading";
  const result =
  typeof actionData === "string"
    ? JSON.parse(actionData)
    : actionData;
const [concern, setConcern] = useState<string>("None");
const hasResult = Boolean(result && !(result as any).error);

const speciesName = hasResult ? (result as any).species_name ?? "" : "";
const lifecycleText = hasResult ? toReadableText((result as any).lifecycle_info ?? "") : "";
const controlMethodsText = hasResult ? toReadableText((result as any).control_methods ?? "") : "";

console.log("actionData:", actionData);
console.log("result:", result);
console.log("speciesName:", speciesName);
  return (
    <Form method="post" encType="multipart/form-data">
  <FieldGroup>
    <FieldLegend className="text-center mt-10">
      Identify Weed and Suggest Control Methods
    </FieldLegend>

    
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* LEFT: Ask question */}
      <div className="rounded-lg border bg-white p-4">
        <Field>
          <FieldLabel htmlFor="description">Ask your question</FieldLabel>
          <Textarea
            id="description"
            name="description"
            placeholder="Ask a question"
            required
          />
        </Field>
        <Field>
            <FieldLabel htmlFor="image">
              Upload Image(Optional)
            </FieldLabel>
            <Input
              id="image"
              name="image"
              type="file"
              
            />
          </Field>
        <Field className="mt-3">
        <FieldLabel htmlFor="concern">Select a concern(Optional)</FieldLabel>

        <select
            id="concern"
            name="concern"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            defaultValue="None"
            value={concern}
            onChange={(e) => setConcern(e.target.value)}
        >
            <option value="None">None</option>
            <option value="species_name">Identify species</option>
            <option value="lifecycle_info">Lifecycle info</option>
            <option value="control_methods">Control methods</option>
            {/* <option value="timing">Best timing window</option> */}
        </select>
        </Field>


        <div className="mt-4 flex justify-center">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Submitting..." : "Submit"}
          </Button>
        </div>

        
      </div>

      {/* RIGHT: Result / Error */}
      {(hasResult || isLoading) &&
      <div className="rounded-lg border bg-white p-4">
        {isLoading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
            <div className="h-4 w-4 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
            <span>Loading data...</span>
          </div>
        )}
        {hasResult && (result as any).error && (
          <div>
            <FieldLabel className="text-center">Error</FieldLabel>
            <p className="text-red-600 whitespace-pre-wrap">{actionData.error}</p>
          </div>
        )}

        {hasResult &&

        <FieldLabel className="text-center">Identification Result</FieldLabel>}
        <div className="space-y-4">
        {hasResult && (concern === "None" || concern === "species_name" ) && (
                
            <div>
              <FieldLabel>Species name</FieldLabel>
              <p className="text-sm whitespace-pre-wrap">{speciesName}</p>
            </div>
                )}
            {hasResult && (concern === "None" || concern === "lifecycle_info" ) && (
            <div>
              <FieldLabel>Lifecycle</FieldLabel>
              <Textarea readOnly rows={6} value={lifecycleText} className="text-sm w-full" />
            </div>
            )}

            {hasResult && (concern === "None" || concern === "control_methods" ) && (

            <div>
              <FieldLabel>Control methods</FieldLabel>
              <Textarea readOnly rows={8} value={controlMethodsText} className="text-sm w-full" />
            </div>   
        )}
        </div>
        {/* {!actionData?.error && !hasResult && !isLoading && (
          <p className="text-sm text-gray-500 text-center">
            Results will appear here after you submit.
          </p>
        )} */}
      </div>}
    </div>
  </FieldGroup>
</Form>

   );
}
