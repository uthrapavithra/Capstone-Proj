import  { layout, route, type RouteConfig  } from "@react-router/dev/routes";
import type { ClientLoaderFunctionArgs } from "react-router";
import { userContext } from "./context";



export default [

    route("/logout","routes/logout.tsx"),
    route("/signup","routes/signup.tsx"),
    route("/login","routes/login.tsx"),
    route("/home","routes/home.tsx"),
   
    
    route("/identify-weed/:username","routes/identify-weed.tsx"),
    route("/past-queries/:username","routes/past-queries.tsx"),
    
   
    
    

] satisfies RouteConfig;

