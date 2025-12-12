import { Form } from "react-router";
import type { Route } from "../+types/root";
import { Field, FieldGroup, FieldLabel, FieldLegend } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();

  // Call backend identify-plants API
  const response = await fetch("/api/identify-plants", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    return {
      error: "Failed to identify plant. Please try again.",
    };
  }

  // Expected to return:
  // {
  //   "species_found": "Saltcedar",
  //   "lifecycle_info": { ... },
  //   "control_methods": { ... }
  // }
  return await response.json();
}

export default function IdentifyWeedForm({ actionData }: Route.ComponentProps) {
  const formattedOutput =
    actionData && !actionData.error
      ? JSON.stringify(actionData, null, 2)
      : actionData?.error ?? "";

  return (
  <div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-full max-w-md p-6 bg-white shadow-md rounded-lg">
      <Form method="post">
        <FieldGroup>
          <FieldLegend className="text-center">Identify Weed</FieldLegend>

          <Field>
            <FieldLabel htmlFor="flower_color">Flower Color</FieldLabel>
            <Input
              id="flower_color"
              name="flower_color"
              defaultValue="pink to white"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="flower_posture">Flower Posture</FieldLabel>
            <Input
              id="flower_posture"
              name="flower_posture"
              defaultValue="upright spikes"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="bract_type">Bract Type</FieldLabel>
            <Input
              id="bract_type"
              name="bract_type"
              defaultValue="small scale-like floral bracts along spikes"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="rosette_present">Rosette Present</FieldLabel>
            <Input
              id="rosette_present"
              name="rosette_present"
              defaultValue="false"
              required
            />
          </Field>

          <div className="mt-4 flex justify-center">
            <Button type="submit">Submit</Button>
          </div>

          {formattedOutput && (
            <div className="mt-6">
              <FieldLabel className="text-center">Identification Result</FieldLabel>
              <Textarea
                readOnly
                rows={10}
                value={formattedOutput}
                className="font-mono text-sm w-full"
              />
            </div>
          )}
        </FieldGroup>
      </Form>
    </div>
  </div>
);
}
