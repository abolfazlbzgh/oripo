import { useLayoutEffect, useRef } from "react";
import { Link, useLocation, useNavigation, type LinkProps } from "react-router";
import { useI18n } from "../i18n/context";
import { galleryPath, localPath } from "../navigation";

function focusGallery() {
  const heading = document.getElementById("models");
  heading?.focus({ preventScroll: true });
  heading?.scrollIntoView({ block: "start", behavior: "instant" });
}

export function ExploreLink({
  gallery = false,
  onClick,
  ...props
}: Omit<LinkProps, "to"> & { gallery?: boolean }) {
  const { locale } = useI18n();
  const { pathname, hash } = useLocation();
  const navigation = useNavigation();
  const to = gallery ? galleryPath(locale) : localPath(locale);
  return (
    <Link
      {...props}
      tabIndex={0}
      to={to}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          navigation.state !== "idle" ||
          pathname + hash !== to
        )
          return;
        event.preventDefault();
        if (gallery) focusGallery();
        else {
          document.getElementById("main")?.focus({ preventScroll: true });
          window.scrollTo({ top: 0, behavior: "instant" });
        }
      }}
    />
  );
}

export function RouteFocus() {
  const { pathname, hash, key } = useLocation();
  const previous = useRef({ pathname, hash });
  useLayoutEffect(() => {
    if (hash === "#models") focusGallery();
    else if (previous.current.pathname !== pathname || (!hash && previous.current.hash !== hash))
      document.getElementById("main")?.focus({ preventScroll: true });
    previous.current = { pathname, hash };
  }, [pathname, hash, key]);
  return null;
}
