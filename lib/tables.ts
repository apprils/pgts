
import type { TableColumn } from "extract-pg-schema";

import type { ResolvedConfig, TableDeclaration, EnumDeclaration } from "./@types";

import {
  defaultTableNominator, defaultConstantNominator,
  defaultVarNominator, defaultModelNominator,
} from "./nominators";

import { columnsIterator } from "./columns";

export function tablesMapper(
  config: ResolvedConfig,
  schema: string,
  enums: EnumDeclaration[],
) {

  const {
    tableFilter,
    tableNominator,
    constantNominator,
    varNominator,
    modelNominator,
    recordSuffix,
    insertSuffix,
    updateSuffix,
    queryBuilderSuffix,
    constructorSuffix,
  } = config

  return function(
    table: { name: string; columns: TableColumn[] },
  ): TableDeclaration[] {

    const { name } = table
    const fullName = [ schema, name ].join(".")

    if (!tableFilter(name, { schema })) {
      return []
    }

    const {
      columns,
      enumImports,
      typeImports,
    } = columnsIterator(
      config,
      fullName,
      table.columns,
      enums,
    )

    const declaredName = tableNominator(name, {
      schema,
      defaultNominator: defaultTableNominator,
    })

    const recordName = declaredName + recordSuffix
    const insertName = declaredName + insertSuffix
    const updateName = declaredName + updateSuffix
    const constructorName = declaredName + constructorSuffix
    const queryBuilder = declaredName + queryBuilderSuffix

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
      fullName,
      primaryKey: columns.find((e) => e.isPrimaryKey)?.name,
      declaredName,
      recordName,
      insertName,
      updateName,
      constant,
      varName,
      modelName,
      queryBuilder,
      constructorName,
      columns,
      regularColumns: columns.filter((e) => e.isRegular),
      enumImports,
      typeImports,
    }]

  }

}

