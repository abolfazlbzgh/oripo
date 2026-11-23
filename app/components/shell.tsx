import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useMatch } from "react-router";
import { lessons } from "../lessons";
import { PlayerIcon } from "./player-icon";
import { englishPath } from "../navigation";

function Brand() {
  return (
    <Link tabIndex={0} className="wordmark" to={englishPath("foundation")}>
      <img src="/oripo.svg" width="36" height="36" alt="" />
      Oripo
    </Link>
  );
}

function Appearance() {
  const [theme, setTheme] = useState("system");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme ?? "system");
    setReady(true);
  }, []);
  function change(value: string) {
    if (value === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = value;
    setTheme(value);
    try {
      if (value === "system") localStorage.removeItem("oripo-appearance");
      else localStorage.setItem("oripo-appearance", value);
    } catch {
      // The current document still honors the selection in private storage contexts.
    }
  }
  return (
    <label className="appearance">
      <span className="sr-only">Appearance</span>
      <svg
        viewBox="0 0 24 24"
        width="19"
        height="19"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="8" />
        <path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor" />
      </svg>
      <select value={theme} onChange={(event) => change(event.target.value)} disabled={!ready}>
        <option value="system">System</option>
        <option value="oripo-light">Light</option>
        <option value="oripo-dark">Dark</option>
      </select>
    </label>
  );
}

export function Header() {
  const home = englishPath("foundation");
  const onHome = useMatch({ path: home, end: true });
  const match = useMatch("/en/lessons/:model");
  const model = lessons.find((item) => item.id === match?.params.model);
  return (
    <header className={model ? "masthead studio-masthead" : "masthead"}>
      <div className="frame masthead-inner">
        <Brand />
        <nav aria-label="Main navigation">
          <Link tabIndex={0} to={home} aria-current={onHome ? "page" : undefined}>
            Explore
          </Link>
          <NavLink tabIndex={0} to={englishPath("firstFold")}>
            3D studio
          </NavLink>
          <NavLink tabIndex={0} to={englishPath("creaseGuide")}>
            Crease guide
          </NavLink>
        </nav>
        {model && (
          <div className="model-picker" key={model.id}>
            <h1 aria-label={model.title}>
              <button
                type="button"
                tabIndex={0}
                popoverTarget="model-links"
                aria-label={`Choose model, ${model.title}`}
              >
                {model.title}
                <PlayerIcon name="down" />
              </button>
            </h1>
            <div id="model-links" popover="auto" className="model-links">
              <nav aria-label="Choose a lesson">
                {lessons.map((item) => (
                  <Link
                    tabIndex={0}
                    key={item.id}
                    to={item.href}
                    aria-current={item.id === model.id ? "page" : undefined}
                    onClick={(event) =>
                      event.currentTarget.closest<HTMLElement>("[popover]")?.hidePopover()
                    }
                  >
                    {item.title}
                  </Link>
                ))}
              </nav>
              <nav className="compact-navigation" aria-label="Explore Oripo">
                <Link tabIndex={0} to={home}>
                  Explore
                </Link>
                <Link tabIndex={0} to={englishPath("firstFold")}>
                  3D studio
                </Link>
                <Link tabIndex={0} to={englishPath("creaseGuide")}>
                  Crease guide
                </Link>
              </nav>
            </div>
          </div>
        )}
        <Appearance />
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="frame footer-inner">
      <Brand />
      <span>Origami in Motion</span>
      <Link tabIndex={0} to="/" hrefLang="en">
        Language · English
      </Link>
    </footer>
  );
}

export function RouteFocus() {
  const { pathname } = useLocation();
  const previous = useRef(pathname);
  useEffect(() => {
    if (previous.current !== pathname)
      document.getElementById("main")?.focus({ preventScroll: true });
    previous.current = pathname;
  }, [pathname]);
  return null;
}
