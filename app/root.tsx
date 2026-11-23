import type { ReactNode } from "react";
import {
  Link,
  Links,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router";
import { englishPath } from "./navigation";
import { site, pageTitle } from "./site";
import type { Route } from "./+types/root";
import "./styles.css";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang={site.defaultLocale}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={site.description} />
        <link rel="icon" href="data:," />
        <Links />
      </head>
      <body>
        <a className="skip-link btn btn-primary" href="#main">
          Skip to content
        </a>
        <header className="masthead">
          <div className="frame masthead-inner">
            <Link to={englishPath("foundation")} className="wordmark">
              <span className="paper-mark" aria-hidden="true" />
              {site.name}
            </Link>
            <label className="theme-control">
              Appearance
              <select
                className="select select-sm"
                defaultValue="system"
                onChange={(event) => {
                  const theme = event.currentTarget.value;
                  if (theme === "system") {
                    delete document.documentElement.dataset.theme;
                  } else {
                    document.documentElement.dataset.theme = theme;
                  }
                }}
              >
                <option value="system">System</option>
                <option value="oripo-light">Light</option>
                <option value="oripo-dark">Dark</option>
              </select>
            </label>
          </div>
        </header>
        <main id="main" className="frame content" tabIndex={-1}>
          {children}
        </main>
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
  const missing = isRouteErrorResponse(error) && error.status === 404;
  const heading = missing ? "Page not found" : "This page could not load";
  return (
    <>
      <title>{pageTitle(heading)}</title>
      <h1>{heading}</h1>
      <a className="btn btn-primary" href={englishPath("foundation")}>
        Return to foundation
      </a>
    </>
  );
}
