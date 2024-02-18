import {
  defaultTableNominator,
  defaultEnumNominator,
  defaultViewNominator,
  defaultModelNominator,
} from "./nominators";

import type { DefaultConfig } from "./@types";

export const config: DefaultConfig = {
  customTypes: {},
  recordSuffix: "T",
  insertSuffix: "I",
  updateSuffix: "U",
  enumUnionSuffix: "E",
  viewSuffix: "V",
  queryBuilderSuffix: "Q",
  tableNominator: defaultTableNominator,
  tableFilter: () => true,
  enumNominator: defaultEnumNominator,
  enumFilter: () => true,
  viewNominator: defaultViewNominator,
  viewFilter: () => true,
  modelNominator: defaultModelNominator,
};

export default config;
