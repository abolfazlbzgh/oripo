import { useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { useI18n } from "../i18n/context";
import { localeCodes, locales } from "../i18n/locales";
import { identifyPath, localPath, galleryPath, type PublicPage } from "../navigation";
import { type ModelId, lessons } from "../lessons";
import { ExploreLink } from "./explore-link";
import { Appearance } from "./appearance";
import { PlayerIcon } from "./player-icon";

function Brand() {
  return (
    <ExploreLink className="wordmark" dir="ltr">
      <img src="/oripo.svg" alt="" width="36" height="36" />
      <span>Oripo</span>
    </ExploreLink>
  );
}

function dismiss(event: MouseEvent<HTMLAnchorElement>) {
  if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  for (const panel of Array.from(
    document.querySelectorAll<HTMLElement>(".masthead [popover]:popover-open"),
  ).reverse())
    panel.hidePopover();
}

function PageLinks({ footer = false }: { footer?: boolean }) {
  const {
    common: { nav },
    locale,
  } = useI18n();
  const page = identifyPath(useLocation().pathname)?.page;
  return (
    <nav
      dir={locales[locale].dir}
      aria-label={footer ? nav.footer : nav.main}
      className="page-links"
    >
      <ExploreLink
        gallery
        onClick={dismiss}
        aria-current={page === "foundation" ? "page" : undefined}
      >
        {nav.explore}
      </ExploreLink>
      <Link
        tabIndex={0}
        onClick={dismiss}
        aria-current={page === "creaseGuide" ? "page" : undefined}
        to={localPath(locale, "creaseGuide")}
      >
        {nav.guide}
      </Link>
    </nav>
  );
}

// A native non-modal popover handles light dismissal, Escape and no-JS activation.
// The items are ordinary links. Arrow keys provide an additional way through the list.
function Popup({
  id,
  label,
  labelNode,
  children,
  className = "",
}: {
  id: string;
  label: string;
  labelNode: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const { locale } = useI18n();
  const trigger = useRef<HTMLButtonElement>(null),
    panel = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<boolean>();
  function arrows(event: KeyboardEvent, fromTrigger = false) {
    if (
      event.target instanceof Element &&
      event.target.closest("[popover]") !== panel.current &&
      !fromTrigger
    )
      return;
    if (event.key === "Escape" && panel.current?.matches(":popover-open")) {
      event.preventDefault();
      event.stopPropagation();
      panel.current.hidePopover();
      trigger.current?.focus();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const menu = panel.current;
    if (!menu) return;
    if (!menu.matches(":popover-open")) menu.showPopover();
    const items = Array.from(
      menu.querySelectorAll<HTMLElement>("a[href],button,input:enabled"),
    ).filter((item) => item.closest("[popover]") === menu);
    if (!items.length) return;
    event.preventDefault();
    event.stopPropagation();
    const i = items.indexOf(document.activeElement as HTMLElement);
    const to =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.length - 1
          : event.key === "ArrowDown"
            ? (i + 1) % items.length
            : i < 0
              ? items.length - 1
              : (i + items.length - 1) % items.length;
    items[to]?.focus();
  }
  return (
    <div className={"shell-popup dropdown " + className}>
      <button
        ref={trigger}
        type="button"
        tabIndex={0}
        className="btn btn-ghost shell-trigger"
        popoverTarget={id}
        aria-controls={id}
        aria-expanded={expanded}
        aria-label={label}
        onKeyDown={(e) => arrows(e, true)}
      >
        {labelNode}
      </button>
      <div
        ref={panel}
        onToggle={(e) => setExpanded(e.currentTarget.matches(":popover-open"))}
        onBlur={(e) => {
          const next = e.relatedTarget;
          if (
            next instanceof Node &&
            next !== trigger.current &&
            !e.currentTarget.contains(next) &&
            e.currentTarget.matches(":popover-open")
          )
            e.currentTarget.hidePopover();
        }}
        dir={locales[locale].dir}
        popover="auto"
        id={id}
        className="shell-panel"
        onKeyDown={(e) => arrows(e)}
      >
        {children}
      </div>
    </div>
  );
}

function Language({ page, mobile = false }: { page: PublicPage; mobile?: boolean }) {
  const { locale, common } = useI18n();
  const { hash } = useLocation();
  const codeLabel = locale.toUpperCase();
  return (
    <Popup
      id={mobile ? "mobile-languages" : "languages"}
      className={mobile ? "mobile-language" : "wide-control language-choice"}
      label={common.nav.language}
      labelNode={
        <>
          <PlayerIcon name="globe" />
          <span dir="ltr">{mobile ? <bdi>{common.nav.language}</bdi> : codeLabel}</span>
          {!mobile && (
            <span className="locale-native" dir={locales[locale].dir}>
              {locales[locale].name}
            </span>
          )}
          <PlayerIcon name="down" />
        </>
      }
    >
      <nav aria-label={common.nav.language}>
        <ul className="menu shell-list">
          {localeCodes.map((code) => (
            <li key={code}>
              <Link
                tabIndex={0}
                lang={code}
                hrefLang={code}
                aria-current={locale === code ? "true" : undefined}
                onClick={dismiss}
                to={
                  page === "foundation" && hash === "#models"
                    ? galleryPath(code)
                    : localPath(code, page)
                }
              >
                <bdi dir={locales[code].dir}>{locales[code].name}</bdi>
                <small dir="ltr">{code}</small>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </Popup>
  );
}

function ModelPicker({ model }: { model: ModelId }) {
  const { common, locale, format } = useI18n();
  const { title, short } = common.models[model];
  return (
    <div className="model-picker">
      <h1 className="sr-only">{title}</h1>
      <Popup
        id="model-links"
        label={format(common.nav.choose, { model: title })}
        labelNode={
          <>
            <span dir="auto" className="model-full">
              {title}
            </span>
            <span dir="auto" className="model-short">
              {short}
            </span>
            <PlayerIcon name="down" />
          </>
        }
      >
        <nav aria-label={common.nav.models}>
          <ul className="menu shell-list">
            {lessons.map(({ id }) => (
              <li key={id}>
                <Link
                  tabIndex={0}
                  to={localPath(locale, id)}
                  onClick={dismiss}
                  aria-current={id === model ? "page" : undefined}
                >
                  {common.models[id].title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Popup>
    </div>
  );
}
export function Header() {
  const { common } = useI18n();
  const page = identifyPath(useLocation().pathname)?.page;
  const model = lessons.find(({ id }) => id === page);
  return (
    <header className={model ? "masthead studio-masthead" : "masthead"}>
      <div className="frame navbar masthead-inner" dir="ltr">
        <Brand />
        <div className="wide-nav">
          <PageLinks />
        </div>
        <div className="header-tools">
          {model && <ModelPicker model={model.id} />}
          {page && page !== "firstFold" && <Language page={page} />}
          <Appearance />
          <Popup
            id="site-menu"
            className="mobile-control"
            label={common.nav.menu}
            labelNode={<PlayerIcon name="menu" />}
          >
            <PageLinks />
            {page && page !== "firstFold" && <Language page={page} mobile />}
            <Appearance withText />
          </Popup>
        </div>
      </div>
    </header>
  );
}
export function Footer() {
  const { common } = useI18n();
  return (
    <footer className="frame footer-inner">
      <div className="footer-identity">
        <Brand />
        <span>{common.home.tagline}</span>
      </div>
      <PageLinks footer />
      <small dir="ltr">© Abolfazl Bazghandi</small>
    </footer>
  );
}
