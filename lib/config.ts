
import {
  defaultTableNominator,
  defaultEnumNominator,
  defaultViewNominator,
  defaultConstantNominator,
  defaultVarNominator,
  defaultModelNominator,
} from "./nominators";

import type { DefaultConfig } from "./@types";

export const config: DefaultConfig = {
  customTypes: {},
  recordSuffix: "T",
  insertSuffix: "I",
  updateSuffix: "U",
  unionSuffix: "U",
  viewSuffix: "V",
  queryBuilderSuffix: "Q",
  constructorSuffix: "C",
  tableNominator: defaultTableNominator,
  tableFilter: () => true,
  enumNominator: defaultEnumNominator,
  enumFilter: () => true,
  viewNominator: defaultViewNominator,
  viewFilter: () => true,
  constantNominator: defaultConstantNominator,
  varNominator: defaultVarNominator,
  modelNominator: defaultModelNominator,
}

export default config

