// Resolve the palette before styles paint. The checkbox and the page read the same state.
(() => {
  const win = globalThis;
  const key = "oripo-appearance";
  const system = win.matchMedia("(prefers-color-scheme: dark)");
  const valid = (value) => value === "oripo-dark" || value === "oripo-light";
  let saved;
  try {
    saved = win.localStorage.getItem(key);
  } catch {
    /* Storage is optional. */
  }

  function apply() {
    const theme = valid(saved) ? saved : system.matches ? "oripo-dark" : "oripo-light";
    win.document.documentElement.dataset.theme = theme;
    win.dispatchEvent(new win.Event("oripo-appearance-change"));
  }
  win.oripoAppearance = (dark) => {
    saved = dark ? "oripo-dark" : "oripo-light";
    try {
      win.localStorage.setItem(key, saved);
    } catch {
      /* Keep the choice in this document. */
    }
    apply();
  };
  system.addEventListener("change", apply);
  win.addEventListener("storage", (event) => {
    if (event.key === key || event.key === null) {
      saved = event.newValue;
      apply();
    }
  });
  apply();
})();
