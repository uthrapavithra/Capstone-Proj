import { Form, Link, redirect } from "react-router";
import type { Route } from "../+types/root";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  await fetch("/api/sign-up", {
    method: "POST",
    body: formData,
  });
  return redirect("/home");
}

export default function SignupForm(_: Route.ComponentProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            Create an Account
          </h1>
          
        </div>

        <Form method="post" encType="multipart/form-data">
          <FieldGroup className="space-y-1">
            <Field>
              <FieldLabel htmlFor="fullname">Full Name</FieldLabel>
              <Input
                id="fullname"
                name="fullname"
                placeholder="John Doe"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Email Address</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@example.com"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <Input
                id="username"
                name="username"
                minLength={6}
                maxLength={20}
                placeholder="6–20 characters"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
              />
            </Field>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4">
              <Link
                to="/home"
                className="text-sm text-gray-500 hover:text-gray-700 transition"
              >
                Cancel
              </Link>

              <Button type="submit" className="px-6">
                Sign Up
              </Button>
            </div>
          </FieldGroup>
        </Form>

        {/* Footer */}
        <p className="text-xs text-center text-gray-500 mt-6">
          Already have an account?
          <Link
            to="/login"
            className="ml-1 text-blue-600 hover:text-blue-700 font-medium"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
