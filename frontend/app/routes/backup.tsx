import { Form } from "react-router";
import type { Route } from "../+types/root";
import { Field, FieldGroup, FieldLabel, FieldLegend } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";


export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();

  // Call backend identify-weed API
  const response = await fetch("/api/identify-weed", {
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
    
    const species = actionData.species_name;
    console.log("data---",species)
  const formattedOutput =
    actionData && !actionData.error
      ? JSON.stringify(actionData, null, 2)
      : actionData?.error ?? "";

  return (
  <div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-full max-w-md p-6 bg-white shadow-md rounded-lg">
      <Form method="post">
        <FieldGroup>
          <FieldLegend className="text-center">Identify Weed and Suggest Control Methods</FieldLegend>

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
            <Button type="submit">Submit</Button>
          </div>

          {formattedOutput && (
            <div className="mt-6">
              <FieldLabel className="text-center">Identification Result</FieldLabel>
              <p>Species name : {actionData.species_name}</p> 
          
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
