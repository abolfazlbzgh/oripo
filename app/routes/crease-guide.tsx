import { ExploreLink } from "../components/explore-link";
import { useI18n } from "../i18n/context";

export default function CreaseGuide() {
  const {
    common: { guide, nav },
  } = useI18n();
  return (
    <article className="guide">
      <header className="article-head">
        <p className="eyebrow">{nav.guide}</p>
        <h1>{guide.title}</h1>
        <p className="intro">{guide.intro}</p>
      </header>
      <dl className="notation">
        <div>
          <dt>
            <span className="sample valley" dir="ltr" aria-hidden="true" />
            {guide.valley}
          </dt>
          <dd>{guide.valleyText}</dd>
        </div>
        <div>
          <dt>
            <span className="sample mountain" dir="ltr" aria-hidden="true" />
            {guide.mountain}
          </dt>
          <dd>{guide.mountainText}</dd>
        </div>
      </dl>
      <ExploreLink gallery className="btn btn-primary">
        {guide.back}
      </ExploreLink>
    </article>
  );
}
