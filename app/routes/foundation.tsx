import { Link } from "react-router";
import { PaperStudy } from "../components/paper-study";
import { FoldDiagram } from "../components/fold-diagram";
import { lessons } from "../lessons";
import { englishPath } from "../navigation";
import { pageTitle } from "../site";

export default function Foundation() {
  return (
    <>
      <title>{pageTitle("Origami in Motion")}</title>
      <section className="opening" aria-labelledby="home-title">
        <div className="hero-copy">
          <p className="eyebrow">Interactive paper studio</p>
          <h1 id="home-title">
            Origami <em>in motion.</em>
          </h1>
          <p className="intro">
            Discover how a single sheet takes shape. Follow a fold in 3D, turn it in your hands, and
            trace it back to the beginning.
          </p>
          <Link tabIndex={0} className="btn btn-primary" to={englishPath("firstFold")}>
            <span className="play-icon" aria-hidden="true" />
            Open the 3D studio
          </Link>
        </div>
        <PaperStudy />
      </section>
      <section className="library" aria-labelledby="collection">
        <div className="section-heading">
          <h2 id="collection">On the worktable</h2>
        </div>
        <div className="library-grid">
          {lessons.map((lesson) => (
            <article key={lesson.id} className="resource">
              <div className="diagram-field">
                <FoldDiagram airplane={lesson.id === "paper-airplane"} />
              </div>
              <div>
                <p className="category">{lesson.format}</p>
                <h3>
                  <Link tabIndex={0} to={lesson.href}>
                    {lesson.title}
                  </Link>
                </h3>
                <p>{lesson.summary}</p>
              </div>
            </article>
          ))}
          <article className="resource">
            <div className="diagram-field notation-field">
              <FoldDiagram guide />
            </div>
            <div>
              <p className="category">Field guide</p>
              <h3>
                <Link tabIndex={0} to={englishPath("creaseGuide")}>
                  Crease notation
                </Link>
              </h3>
              <p>Read the lines on the page. See how a valley differs from a mountain fold.</p>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
