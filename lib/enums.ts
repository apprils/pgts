
import type { ResolvedConfig, EnumDeclaration } from "./@types";

import { defaultEnumNominator } from "./nominators";

export function enumsMapper(
  config: ResolvedConfig,
  schema: string,
) {

  const {
    enumFilter,
    enumNominator,
    unionSuffix,
  } = config

  return function(
    { name, values }: { name: string, values: string[] },
  ): EnumDeclaration[] {


    if (!enumFilter(name, { schema })) {
      return []
    }

    const declaredName = enumNominator(name, {
      schema,
      defaultNominator: defaultEnumNominator,
    })

    return [{
      schema,
      name,
      declaredName,
      values,
      unionSuffix,
    }]


  }

}

