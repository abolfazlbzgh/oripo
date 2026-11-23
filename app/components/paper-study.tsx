export function PaperStudy() {
  return (
    <figure className="study">
      <div className="study-field">
        <div className="study-ring" aria-hidden="true" />
        <img
          src="/paper-crane.svg"
          width="600"
          height="390"
          alt="A sage paper crane, with long pointed wings and a folded beak."
        />
        <span className="register tl" aria-hidden="true" />
        <span className="register br" aria-hidden="true" />
      </div>
      <figcaption>
        <span>Paper study</span>
        <i>The crane</i>
      </figcaption>
    </figure>
  );
}
