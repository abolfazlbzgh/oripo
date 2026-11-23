import { Link } from "react-router";
import { englishPath } from "../navigation";
import { pageTitle } from "../site";

export default function CreaseGuide() {
  return (
    <article className="guide">
      <title>{pageTitle("Crease notation")}</title>
      <header className="article-head">
        <p className="eyebrow">Field guide</p>
        <h1>Crease notation</h1>
        <p className="intro">
          Read a fold from the side of the paper facing you. The crease line tells you which way the
          paper bends.
        </p>
      </header>
      <dl className="notation">
        <div>
          <dt>
            <span className="sample valley" aria-hidden="true" />
            Valley fold
          </dt>
          <dd>
            A dashed line marks a valley. Bring the two sides toward you so the crease sits at the
            bottom of a V.
          </dd>
        </div>
        <div>
          <dt>
            <span className="sample mountain" aria-hidden="true" />
            Mountain fold
          </dt>
          <dd>
            A dash-dot line marks a mountain. Fold the sides away from you so the crease rises into
            a ridge.
          </dd>
        </div>
      </dl>
      <Link className="btn btn-primary" to={englishPath("firstFold")}>
        Try the valley fold
      </Link>
      <Link className="text-link" to={englishPath("foundation")}>
        Back to Explore
      </Link>
    </article>
  );
}
