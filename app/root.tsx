import type { ReactNode } from "react";
import {
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router";
import { Footer, Header, RouteFocus } from "./components/shell";
import { englishPath } from "./navigation";
import { site, pageTitle } from "./site";
import type { Route } from "./+types/root";
import "./styles.css";

export const meta = () => [{ name: "description", content: site.description }];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang={site.defaultLocale} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <link rel="icon" type="image/svg+xml" href="/oripo.svg" />
        <script src="/appearance.js"></script>
        <Links />
      </head>
      <body>
        <a tabIndex={0} className="skip-link btn btn-primary" href="#main">
          Skip to content
        </a>
        <Header />
        <main className="frame content" id="main" tabIndex={-1}>
          {children}
        </main>
        <Footer />
        <RouteFocus />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const heading =
    isRouteErrorResponse(error) && error.status === 404
      ? "Page not found"
      : "This page could not load";
  return (
    <section className="article-head">
      <title>{pageTitle(heading)}</title>
      <h1>{heading}</h1>
      <Link tabIndex={0} className="btn btn-primary" to={englishPath("foundation")}>
        Return to Oripo
      </Link>
    </section>
  );
}
