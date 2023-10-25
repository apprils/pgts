
import type { ViewColumn, MaterializedViewColumn } from "extract-pg-schema";

import { columnsIterator } from "./columns";

import {
  defaultViewNominator, defaultConstantNominator,
  defaultVarNominator, defaultModelNominator,
} from "./nominators";

import type { ResolvedConfig, ViewDeclaration, EnumDeclaration } from "./@types";

export function viewsMapper(
  config: ResolvedConfig,
  schema: string,
  enums: EnumDeclaration[],
) {

  const {
    viewFilter,
    viewNominator,
    constantNominator,
    varNominator,
    modelNominator,
    viewSuffix,
    constructorSuffix,
    queryBuilderSuffix,
  } = config

  return function(
    view: { name: string; columns: ViewColumn[] | MaterializedViewColumn[] },
  ): ViewDeclaration[] {

    const { name } = view
    const fullName = [ schema, name ].join(".")

    if (!viewFilter(name, { schema })) {
      []
    }

    const {
      columns,
      enumImports,
      typeImports,
    } = columnsIterator(
      config,
      fullName,
      view.columns,
      enums,
    )

    const declaredName = viewNominator(name, {
      schema,
      defaultNominator: defaultViewNominator,
    })

    const recordName = declaredName + viewSuffix
    const queryBuilder = declaredName + queryBuilderSuffix
    const constructorName = declaredName + constructorSuffix

    const constant = constantNominator(name, {
      schema,
      defaultNominator: defaultConstantNominator,
    })

    const varName = varNominator(name, {
      schema,
      defaultNominator: defaultVarNominator,
    })

    const modelName = modelNominator(name, {
      schema,
      defaultNominator: defaultModelNominator,
    })

    return [{
      schema,
      name,
      primaryKey: columns.find((e) => e.isPrimaryKey)?.name,
      declaredName,
      recordName,
      queryBuilder,
      constructorName,
      constant,
      varName,
      modelName,
      columns,
      enumImports,
      typeImports,
    }]

  }

}

