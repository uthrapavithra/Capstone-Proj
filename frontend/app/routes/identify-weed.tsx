import { Form ,useNavigation } from "react-router";
import type { Route } from "../+types/root";
import { Field, FieldGroup, FieldLabel, FieldLegend } from "~/components/ui/field";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();

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

const hasResult = Boolean(result && !(result as any).error);

const speciesName = hasResult ? (result as any).species_name ?? "" : "";
const lifecycleText = hasResult ? toReadableText((result as any).lifecycle_info ?? "") : "";
const controlMethodsText = hasResult ? toReadableText((result as any).control_methods ?? "") : "";

console.log("actionData:", actionData);
console.log("result:", result);
console.log("speciesName:", speciesName);
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white shadow-md rounded-lg">
        <Form method="post">
          <FieldGroup>
            <FieldLegend className="text-center">
              Identify Weed and Suggest Control Methods
            </FieldLegend>

            <Field>
              <FieldLabel htmlFor="description">Ask your question</FieldLabel>
              <Textarea
                id="description"
                name="description"
                placeholder="Ask a question"
                required
              />
            </Field>

            <div className="mt-4 flex justify-center">
            <Button type="submit" disabled={isLoading}>
            {isLoading ? "Submitting..." : "Submit"}
            </Button>
            </div>

            {isLoading && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
                <div className="h-4 w-4 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
                <span>Loading data...</span>
            </div>
            )}

            {actionData?.error && (
              <div className="mt-6">
                <FieldLabel className="text-center">Error</FieldLabel>
                <p className="text-red-600">{actionData.error}</p>
              </div>
            )}

            {hasResult && (
              <div className="mt-6 space-y-4">
                <FieldLabel className="text-center">Identification Result</FieldLabel>

                <div>
                  <FieldLabel>Species name</FieldLabel>
                  <p className="text-sm">{speciesName}</p>
                </div>

                <div>
                  <FieldLabel>Lifecycle</FieldLabel>
                  <Textarea
                    readOnly
                    rows={6}
                    value={lifecycleText}
                    className="text-sm w-full"
                  />
                </div>

                <div>
                  <FieldLabel>Control methods</FieldLabel>
                  <Textarea
                    readOnly
                    rows={8}
                    value={controlMethodsText}
                    className="text-sm w-full"
                  />
                </div>
              </div>
            )}
          </FieldGroup>
        </Form>
      </div>
    </div>
  );
}
