import type { ReactNode } from "react";
import {
  Links,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useRouteLoaderData,
  isRouteErrorResponse,
  type ShouldRevalidateFunction,
} from "react-router";
import { Footer, Header } from "./components/shell";
import { RouteFocus } from "./components/explore-link";
import { SiteContext } from "./i18n/context";
import { readCommon, readTranscript } from "./i18n/catalog.server";
import { locales, localeCodes } from "./i18n/locales";
import { type SiteData } from "./i18n/messages";
import { identifyPath, localPath } from "./navigation";
import { siteOrigin, pageTitle } from "./site";
import type { Route } from "./+types/root";
import "./styles.css";

export async function loader({ url }: Route.LoaderArgs): Promise<SiteData> {
  const match = identifyPath(url.pathname);
  if (!match) throw new Response(null, { status: 404 });
  const { locale, page } = match;
  const [common, transcript] = await Promise.all([
    readCommon(locale),
    page === "foundation" || page === "creaseGuide" || page === "firstFold"
      ? null
      : readTranscript(locale, page),
  ]);
  return { locale, common, transcript, origin: siteOrigin(process.env.ORIPO_SITE_URL) };
}
export const shouldRevalidate: ShouldRevalidateFunction = ({ currentUrl, nextUrl }) =>
  currentUrl.pathname !== nextUrl.pathname;

function PageHead({ data }: { data: SiteData }) {
  const { pathname } = useLocation();
  const page = identifyPath(pathname)?.page;
  const { common, locale, origin } = data;
  if (!page || page === "firstFold") return <meta name="robots" content="noindex" />;
  const [title, description] =
    page === "foundation"
      ? [common.home.tagline, common.seo.home]
      : page === "creaseGuide"
        ? [common.guide.title, common.guide.intro]
        : [common.models[page].title, common.models[page].summary];
  return (
    <>
      <title>{pageTitle(title)}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={origin + localPath(locale, page)} />
      {localeCodes.map((code) => (
        <link key={code} rel="alternate" hrefLang={code} href={origin + localPath(code, page)} />
      ))}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={origin + (page === "foundation" ? "/" : localPath("en", page))}
      />
    </>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const data = useRouteLoaderData<typeof loader>("root");
  const code = data?.locale ?? "en";
  return (
    <html
      lang={code}
      dir={locales[code].dir}
      className={"font-" + locales[code].font}
      suppressHydrationWarning
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {data && <PageHead data={data} />}
        <link rel="icon" type="image/svg+xml" href="/oripo.svg" />
        <script src="/appearance.js"></script>
        <link rel="stylesheet" href={`/fonts/${locales[code].font}.css`} />
        <Links />
      </head>
      <body>
        {data ? (
          <SiteContext.Provider value={data}>
            <a tabIndex={0} className="skip-link btn btn-primary" href="#main">
              {data.common.nav.skip}
            </a>
            <Header />
            <main className="frame content" id="main" tabIndex={-1}>
              {children}
            </main>
            <Footer />
            <ScrollRestoration />
            <RouteFocus />
          </SiteContext.Provider>
        ) : (
          children
        )}
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const data = useRouteLoaderData<typeof loader>("root");
  const code = data?.locale ?? "en";
  const heading =
    isRouteErrorResponse(error) && error.status === 404
      ? (data?.common.error.title ?? "Page not found")
      : (data?.common.error.failed ?? "This page could not load");
  return (
    <section className="frame article-head">
      <h1>{heading}</h1>
      <a href={localPath(code)}>{data?.common.home.tagline ?? "Oripo"}</a>
    </section>
  );
}
