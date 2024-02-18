import { camelCase, upperFirst } from "lodash";
import { singular } from "pluralize";

export function defaultNominator(name: string) {
  return upperFirst(camelCase(name));
}

export function defaultTableNominator(name: string) {
  return defaultNominator(name);
}

export function defaultEnumNominator(name: string) {
  return defaultNominator(name);
}

export function defaultViewNominator(name: string) {
  return defaultNominator(name);
}

export function defaultModelNominator(name: string) {
  return upperFirst(camelCase(singular(name)));
}
