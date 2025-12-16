import { useContext } from "react"
import { redirect, type ClientLoaderFunctionArgs } from "react-router"
import { userContext } from "~/context"
import { useSearchParams } from "react-router";

export async function clientLoader({params, context}: ClientLoaderFunctionArgs) {

  
  console.log(params)
  await fetch(`/api/logout`, {
    method: 'POST',
    
  })
  context.set(userContext,null)
  return redirect("/home")
}


export default function Logout(){
    return <p>You have Logged out!</p>
}
