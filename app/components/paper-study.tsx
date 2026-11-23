import { useI18n } from "../i18n/context";
export function PaperStudy() {
  const {
    common: { home },
  } = useI18n();
  return (
    <figure className="study">
      <div className="study-field">
        <div className="study-ring" aria-hidden="true" />
        <img src="/paper-crane.svg" loading="lazy" width="600" height="390" alt={home.alt} />
        <span className="register tl" aria-hidden="true" />
        <span className="register br" aria-hidden="true" />
      </div>
      <figcaption>
        <span>{home.study}</span>
        <i>{home.crane}</i>
      </figcaption>
    </figure>
  );
}
