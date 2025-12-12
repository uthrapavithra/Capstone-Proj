import { NavLink, Outlet  ,Link, type ClientLoaderFunctionArgs} from "react-router";
import "./DefaultLayout.css";
import { userContext } from "~/context";



export async function clientLoader({context}:ClientLoaderFunctionArgs) {

  const me = context.get(userContext)
  const isAdmin = me && me.is_admin
  
  return {isAdmin}
}

export default function DefaultLayout({loaderData}:any) {
  const navLinkClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  return (
    <main className="layout-container">
      
      <nav className="navbar">
        <img src="uploads/job.jpg" width="50" height = "50" ></img>
        <NavLink to="/" className={navLinkClass}>Home</NavLink>
        <NavLink to="/job-boards" className={navLinkClass}>JobBoards</NavLink>
        {loaderData.isAdmin?
        <NavLink to="/admin-logout" className={navLinkClass}>Logout</NavLink>
        : <NavLink to="/admin-login" className={navLinkClass}>Login</NavLink>}
      </nav>
      <Outlet/>
    </main>
  );
}