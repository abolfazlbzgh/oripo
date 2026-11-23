import { Link } from "react-router";
import { PaperStudy } from "../components/paper-study";
import { ExploreLink } from "../components/explore-link";
import { useI18n } from "../i18n/context";
import { lessons, groupByDifficulty } from "../lessons";
import { localPath } from "../navigation";

export default function Foundation() {
  const {
    locale,
    common: { home, models },
    format,
  } = useI18n();
  return (
    <>
      <section className="opening" aria-labelledby="home-title">
        <div className="hero-copy">
          <p className="eyebrow">{home.tagline}</p>
          <h1 id="home-title">
            {home.title} <em>{home.emphasis}</em>
          </h1>
          <p className="intro">{home.intro}</p>
          <div className="hero-actions">
            <ExploreLink gallery className="btn btn-primary">
              {home.browse}
            </ExploreLink>
            <Link tabIndex={0} className="btn btn-outline" to={localPath(locale, "creaseGuide")}>
              {home.read}
            </Link>
          </div>
        </div>
        <PaperStudy />
      </section>
      <section className="library" aria-labelledby="models">
        <div className="section-heading">
          <h2 id="models" tabIndex={-1}>
            {home.gallery}
          </h2>
        </div>
        {groupByDifficulty(lessons).map(({ difficulty, entries }) => (
          <section className="library-tier" key={difficulty} aria-labelledby={"tier-" + difficulty}>
            <h3 className="tier-heading" id={"tier-" + difficulty}>
              {home[difficulty]}{" "}
              <span className="badge badge-soft">{format("{n}", { n: entries.length })}</span>
            </h3>
            <div className="library-grid">
              {entries.map((lesson) => (
                <article key={lesson.id} className="resource" data-model={lesson.id}>
                  <div className="diagram-field" dir="ltr">
                    <img
                      className="fold-diagram"
                      src={"/previews/" + lesson.id + ".png"}
                      width="440"
                      height="312"
                      loading="lazy"
                      alt=""
                    />
                  </div>
                  <div className="card-copy">
                    <p className="category">{home.lesson}</p>
                    <h4>
                      <Link tabIndex={0} to={localPath(locale, lesson.id)}>
                        {models[lesson.id].title}
                      </Link>
                    </h4>
                    <p className="lesson-facts">
                      {home[lesson.difficulty]} · {format(home.count, { n: lesson.stepCount })} ·{" "}
                      {home[lesson.paper]}
                    </p>
                    <p>{models[lesson.id].summary}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </section>
    </>
  );
}
