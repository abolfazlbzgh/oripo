import { Link } from "react-router";
import { englishPath } from "../navigation";
import { pageTitle, site } from "../site";

export default function Foundation() {
  return (
    <div className="opening">
      <div>
        <title>{pageTitle("Development foundation")}</title>
        <p className="eyebrow">Development foundation</p>
        <h1>
          A guide to
          <br />
          paper folds
        </h1>
        <p className="intro">
          {site.name} is building a step-by-step 3D origami tutorial. While the first lesson is in
          development, explore the lines used to describe a fold.
        </p>
        <Link className="btn btn-primary" to={englishPath("creaseGuide")}>
          Read the crease guide
        </Link>
      </div>
      <figure className="swatch">
        <div className="paper-field" aria-hidden="true">
          <div className="paper-square" />
        </div>
        <figcaption>A diagonal valley crease</figcaption>
      </figure>
    </div>
  );
}
