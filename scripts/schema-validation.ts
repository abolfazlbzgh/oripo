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
export function checkShape(check: Ajv.ValidateFunction, value: unknown, label: string) {
  if (check(value)) return;
  const errors = check.errors ?? [];
  throw Error(
    label +
      " " +
      errors
        .slice(0, 12)
        .map((e) => (e.dataPath || "/") + " " + e.message + " " + JSON.stringify(e.params))
        .join(" | "),
  );
}
