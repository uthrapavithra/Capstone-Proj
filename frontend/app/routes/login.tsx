import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { Form, Link, redirect } from "react-router"
import type { Route } from "../+types/root"

export async function clientAction({request}: Route.ClientActionArgs) {
  const formData = await request.formData()
  const formValues = Object.fromEntries(formData)
  const response =await fetch(`/api/login`, {
    method: 'POST',
    body: formData,
  })

  
  //console.log("res---",response.json())

  if (response.ok){
    return redirect(`/identify-weed/${formValues.username}`)

  }

  //console.log("res---",response)

  return {ok: response.ok}
  
}

export default function LoginForm({actionData}: React.ComponentProps) {

    
    const showError = actionData?.ok === false;


  return (
  
    <div className="flex flex-col gap-6 w-1/3 mx-auto mt-4 " >
        {showError  &&(
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600">
                 Wrong username or password</p>
        )
        }
      <Card>
        <CardHeader>
          <CardTitle>User Login</CardTitle>
        </CardHeader>
        <CardContent>
          <Form method="post">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                </div>
                <Input id="password" name="password" type="password" required />
              </Field>
              <Field>
                <Button type="submit">Login</Button>
              </Field>
            <p className="justify-center text-xs tracking-wide text-black/50">
              Not a user already? 
              <Link className="ml-1 text-blue-600 hover:text-blue-700 font-medium" to="/signup"> SignUp here</Link></p>
            </FieldGroup>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
 