import Ajv from "ajv";
import pkgSchema from "../models/lesson.schema.json";
import foldSchema from "../models/fold.schema.json";

// Only these trusted, local schemas are compiled. Package input is always plain data.
const validator = new Ajv({
  allErrors: true,
  jsonPointers: true,
  strictNumbers: true,
  ownProperties: true,
});
export const packageShape = validator.compile(pkgSchema);
export const foldShape = validator.compile(foldSchema);
function member(value: unknown, key: string): unknown {
  return value && typeof value === "object" && Object.hasOwn(value, key)
    ? (value as Record<string, unknown>)[key]
    : undefined;
}
export function checkShape(check: Ajv.ValidateFunction, value: unknown, label: string) {
  if (check(value)) return;
  const errors = check.errors ?? [];
  const firstStep = errors.find((e) => /^\/pattern\/steps\/\d+(?:\/|$)/.test(e.dataPath));
  if (firstStep) {
    const parts = firstStep.dataPath.split("/").slice(1);
    const step = parts.slice(0, 3).reduce<unknown>(member, value);
    const id = member(step, "id");
    if (typeof id === "string") label += " step " + id;
    const kindIndex = parts.indexOf("field");
    if (kindIndex >= 0) {
      const field = parts.slice(0, kindIndex + 1).reduce<unknown>(member, value);
      const kind = member(field, "kind");
      if (typeof kind === "string") {
        label += " field " + kind;
        const supported = pkgSchema.definitions.field.oneOf.map((s) => s.properties.kind.const);
        if (!supported.includes(kind))
          throw Error(
            label +
              " at /" +
              parts.slice(0, kindIndex + 1).join("/") +
              "/kind: unsupported motion. Supported fields are " +
              supported.join(", "),
          );
      }
    }
  }
  throw Error(
    label +
      " " +
      errors
        .slice(0, 12)
        .map((e) => (e.dataPath || "/") + " " + e.message + " " + JSON.stringify(e.params))
        .join(" | "),
  );
}
