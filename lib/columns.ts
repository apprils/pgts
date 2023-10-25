
import type { MaterializedViewColumn, TableColumn, ViewColumn } from "extract-pg-schema";

import type {
  ResolvedConfig, CustomType,
  EnumDeclaration, ColumnDeclaration,
  ImportedType, TypeImport,
  ZodColumn, ImportedZod, ZodImport, ExplicitType,
} from "./@types";

import { defaultTypeMap, defaultZodTypeMap } from "./default-type-maps";

export function columnsIterator(
  config: ResolvedConfig,
  tableName: string,
  tableColumns: TableColumn[] | ViewColumn[] | MaterializedViewColumn[],
  enums: EnumDeclaration[],
): {
  columns: ColumnDeclaration[];
  enumImports: string[];
  typeImports: TypeImport[];
  zodImports: ZodImport[];
} {

  const columns: ColumnDeclaration[] = []
  const enumImports: Record<string, boolean> = {}
  const typeImports: Record<string, TypeImport> = {}
  const zodImports: Record<string, TypeImport> = {}

  // avoiding name collisions by importing same type only once per table + path.
  // for cases when multiple tables importing same type,
  // import path and table name appended to import name (see @importAs)
  const onEnumImport = (enumImport: string) => enumImports[enumImport] = true
  const onTypeImport = (typeImport: TypeImport) => typeImports[typeImport.as] = typeImport
  const onZodImport = (zodImport: TypeImport) => zodImports[zodImport.as] = zodImport

  columns.push(
    ...tableColumns.flatMap(
      columnsMapper(
        config,
        tableName,
        enums,
        { onEnumImport, onTypeImport, onZodImport }
      )
    )
  )

  return {
    columns,
    enumImports: Object.keys(enumImports),
    typeImports: Object.values(typeImports),
    zodImports: Object.values(zodImports),
  }

}

function columnsMapper(
  config: ResolvedConfig,
  tableName: string,
  enums: EnumDeclaration[],
  { onEnumImport, onTypeImport, onZodImport }: {
    onEnumImport: (e: string) => void;
    onTypeImport: (e: TypeImport) => void;
    onZodImport: (e: TypeImport) => void;
  },
) {

  const {
    customTypes,
    zod: zodConfig,
  } = config

  const zodTypeMap = {
    ...defaultZodTypeMap,
    ...zodConfig as Record<string, string>,
  }

  const tableCustomTypes: Record<string, CustomType> = typeof customTypes[tableName] === "object"
    ? { ...customTypes[tableName] as {} }
    : {}

  return function(
    {
      name,
      isPrimaryKey,
      isIdentity,
      defaultValue,
      generated,
      maxLength,
      comment,
      ...column
    }: TableColumn | ViewColumn | MaterializedViewColumn,
  ): ColumnDeclaration[] {

    const { fullName: type, kind } = column.type

    let { isArray, isNullable } = column
    let isGenerated = false

    let declaredType = "unknown"
    let explicitType = false

    const comments: string[] = []

    // augmenting import name to avoid name collisions,
    // eg. when bundling all tables in a single file
    // and multiple tables imoprting same type.
    // so appending import path and table name to import name.
    const importAs = (imported: ImportedType | ImportedZod) => [
      imported.import,
      imported.from.replace(/\W/g, "_"),
      tableName.split(".")[1] || tableName,
    ].join("_")

    // order does matter!
    // - check enums
    // - check default mappings
    // - check customTypes
    // - check tableCustomTypes

    if (kind === "enum") {

      const [ schema, name ] = type.split(".")

      const e = enums.find((e) =>  e.name === name && e.schema === schema)

      if (e) {
        declaredType = e.declaredName + e.unionSuffix
        onEnumImport(declaredType)
      }

    }

    if (defaultTypeMap[type]) {
      declaredType = defaultTypeMap[type]
    }

    for (const customDef of [
      customTypes[type],
      tableCustomTypes[name],
    ] satisfies (CustomType | Record<string, CustomType>)[]) {

      if (!customDef) {
        continue
      }

      if (typeof customDef === "string") {
        declaredType = customDef as string
      }
      else if ((customDef as ImportedType).import) {
        const typeImport = { ...customDef as ImportedType, as: importAs(customDef as ImportedType) }
        declaredType = typeImport.as
        if (typeImport.array) {
          isArray = true
        }
        if (typeImport.nullable) {
          isNullable = true
        }
        onTypeImport(typeImport)
      }
      else if ((customDef as ExplicitType).as) {
        declaredType = (customDef as ExplicitType).as
        explicitType = true
      }

    }

    if (isPrimaryKey) {
      comments.push("PrimaryKey")
    }

    if (defaultValue) {
      comments.push(`Default Value: ${ defaultValue }`)
    }

    if (comment) {
      comments.push(`Comment: ${ comment }`)
    }

    if (declaredType === "unknown") {
      comments.push(`Unknown Type: ${ type }`)
    }

    if (generated !== "NEVER") {
      isGenerated = true
      comments.push(`Generated: ${ generated }`)
      comments.push(`${ name }: ${ declaredType };`)
    }

    if (!explicitType) {

      if (isArray) {
        declaredType = `${ declaredType }[]`
      }

      if (isNullable) {
        declaredType += " | null"
      }

    }

    const isOptional = isNullable || isIdentity || defaultValue

    let zodSchema: string | undefined
    let zodSchemaRefine = "z"
    let zodImport: ZodImport | undefined

    if (zodConfig && zodConfig?.[tableName] !== false && !isGenerated) {

      zodSchema = zodTypeMap[type] || "z.any()"

      if (typeof zodConfig?.[tableName] === "object") {

        const zodColumns = { ...zodConfig?.[tableName] as Record<string, ZodColumn> }

        if (zodColumns[name] === false) {
          zodSchema = undefined
        }
        else if (typeof zodColumns[name] === "string") {
          zodSchemaRefine = zodColumns[name] as string
        }
        else if ((zodColumns[name] as ImportedZod)?.import) {
          zodSchema = undefined
          zodImport = { ...zodColumns[name] as ImportedZod, as: importAs(zodColumns[name] as ImportedZod) }
          onZodImport(zodImport)
        }

      }

    }

    if (zodSchema) {

      // order does matter!

      if (maxLength) {
        zodSchema += `.max(${ maxLength })`
      }

      if (isOptional) {
        zodSchema += ".optional()"
      }

      if (isNullable) {
        zodSchema += ".nullable()"
      }

      // array should always go last
      if (isArray) {
        zodSchema += ".array()"
      }

    }

    return [{
      type,
      kind,
      name,
      isPrimaryKey,
      isOptional,
      isGenerated,
      defaultValue,
      declaredType,
      comments,
      zodSchema: zodImport?.as || zodSchema,
      zodSchemaRefine,
    }]

  }

}

