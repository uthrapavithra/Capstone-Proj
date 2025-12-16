import { NavLink, Outlet  ,Link, type ClientLoaderFunctionArgs} from "react-router";
import "./DefaultLayout.css";
import { userContext } from "~/context";
import { Button } from "~/components/ui/button";



export async function clientLoader({params,context}:ClientLoaderFunctionArgs) {

  const me = context.get(userContext)
  const isAdmin = me && me.is_admin
  
  return {isAdmin}
}

export default function DefaultLayout({params,loaderData}:any) {
 

  return (
    <main className="layout-container">
      {/* Top Pane */}
      
      <header className="fixed top-0 left-0 w-full z-50
      flex justify-end items-center
      px-10 py-4
      bg-white/100 shadow-md backdrop-blur">
         
           {/* { !loaderData.isAdmin && (
            <div className="flex gap-3">
            <Button variant="outline" type="button">
            <Link to="/login">Log In</Link>
          </Button>
          <Button variant="outline" type="button">
            <Link to="/signup">Sign Up</Link>
          </Button>
          </div>
            
          )}  */}
          {loaderData.isAdmin &&(
            <div className="flex gap-3">
            <Button variant="outline" type="button">
            <Link to={`/identify-weed/${params.username}`}>Ask the Query</Link>
          </Button>
          <Button variant="outline" type="button">
            <Link to="/signup">Get Past Data</Link>
          </Button>
          </div>
          )}
          
        
      </header>
      
      
      <Outlet/>
    </main>
  );
}