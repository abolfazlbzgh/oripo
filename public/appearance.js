// Apply a saved daisyUI theme before styles paint. System mode uses the CSS media query.
try {
  const theme = globalThis.localStorage.getItem("oripo-appearance");
  if (theme === "oripo-light" || theme === "oripo-dark") {
    globalThis.document.documentElement.dataset.theme = theme;
  }
} catch {
  // The system theme also works when the browser disallows storage.
}
