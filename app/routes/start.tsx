import { Link } from "react-router";
import { PaperStudy } from "../components/paper-study";
import { englishPath } from "../navigation";
import { pageTitle } from "../site";

export default function Start() {
  return (
    <section className="opening">
      <title>{pageTitle("Choose a language")}</title>
      <div className="hero-copy">
        <p className="eyebrow">Origami in Motion</p>
        <h1>Choose a language</h1>
        <p className="intro">
          Enter the paper studio to try your first fold and explore the crease guide.
        </p>
        <Link
          tabIndex={0}
          className="btn btn-primary"
          to={englishPath("foundation")}
          lang="en"
          hrefLang="en"
        >
          English
        </Link>
      </div>
      <PaperStudy />
    </section>
  );
}
