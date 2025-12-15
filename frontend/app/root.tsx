import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
// import { authMiddleware } from "./middleware";

// export const clientMiddleware : Route.ClientMiddlewareFunction[]=[authMiddleware];


export default function App() {
  return( <html>
    <head>
      <title>Weed Control</title>
    </head>
    <body>
      <Outlet></Outlet>
    </body>
  </html>);
}

