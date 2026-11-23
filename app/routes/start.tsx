import { Link } from "react-router";
import { englishPath } from "../navigation";
import { pageTitle, site } from "../site";

export default function Start() {
  return (
    <>
      <title>{pageTitle("Choose a language")}</title>
      <p className="eyebrow">Development foundation</p>
      <h1>Choose a language</h1>
      <p className="intro">Explore the first pages of {site.name} in English.</p>
      <Link className="btn btn-primary" to={englishPath("foundation")} lang="en" hrefLang="en">
        English
      </Link>
    </>
  );
}
