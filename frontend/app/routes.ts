import  { layout, route, type RouteConfig  } from "@react-router/dev/routes";
import type { ClientLoaderFunctionArgs } from "react-router";
import { userContext } from "./context";



export default [
   

    route("/identify-weed","routes/identify-weed.tsx"),
    
    

] satisfies RouteConfig;

