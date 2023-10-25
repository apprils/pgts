
import type { ConnectionConfig } from "pg";

export type { ConnectionConfig }

export type ExplicitType = { as: string }

export type ImportedType = {
  import: string;
  from: string;
  array?: boolean;
  nullable?: boolean;
}

export type TypeImport = ImportedType & { as: string }

export type CustomType = string | ExplicitType | ImportedType

export type CustomTypes = {
  [key: string]: CustomType | Record<string, CustomType>;
}

export type NominatorContext = {
  schema: string;
  defaultNominator: (name: string) => string;
}

export type FilterContext = {
  schema: string;
}

export type TableNominator = (name: string, context: NominatorContext) => string
export type TableFilter = (name: string, context: FilterContext) => boolean

export type EnumNominator = (name: string, context: NominatorContext) => string
export type EnumFilter = (name: string, context: FilterContext) => boolean

export type ViewNominator = (name: string, context: NominatorContext) => string
export type ViewFilter = (name: string, context: FilterContext) => boolean

export type ConstantNominator = (name: string, context: NominatorContext) => string
export type VarNominator = (name: string, context: NominatorContext) => string

export type ModelNominator = (name: string, context: NominatorContext) => string

export type ImportedZod = { import: string; from: string }
export type ZodImport = ImportedZod & { as: string }

export type ZodColumn = boolean | string | ZodImport

export type ZodTable = boolean | Record<string, ZodColumn>

export type ZodConfig = Record<string, string | ZodTable>

export type Config = {
  schemas?: string[];
  customTypes?: CustomTypes;
  recordSuffix?: string;
  insertSuffix?: string;
  updateSuffix?: string;
  unionSuffix?: string;
  viewSuffix?: string;
  queryBuilderSuffix?: string,
  constructorSuffix?: string,
  tableNominator?: TableNominator;
  tableFilter?: TableFilter;
  enumNominator?: EnumNominator;
  enumFilter?: EnumFilter;
  viewNominator?: ViewNominator;
  viewFilter?: ViewFilter;
  constantNominator?: ConstantNominator;
  varNominator?: VarNominator;
  modelNominator?: ModelNominator;
  zod?: ZodConfig;
}

export type DefaultConfig = Required<
  Omit<
    Config,
    | "schemas"
    | "zod"
  >
>

export type ResolvedConfig = Required<Config>

export type EnumDeclaration = {
  schema: string;
  name: string;
  declaredName: string;
  values: string[];
  unionSuffix: string;
}

export type ColumnDeclaration = {
  type: string;
  kind: string;
  name: string;
  isPrimaryKey?: boolean;
  isOptional: boolean;
  isGenerated: boolean;
  defaultValue: any;
  declaredType: string;
  comments: string[];
  zodSchema?: string;
  zodSchemaRefine?: string;
}

export type TableDeclaration = {
  schema: string;
  name: string;
  primaryKey?: string;
  declaredName: string;
  recordName: string;
  insertName: string;
  updateName: string;
  constant: string;
  varName: string;
  queryBuilder: string;
  constructorName: string;
  modelName: string;
  columns: ColumnDeclaration[];
  enumImports: string[];
  typeImports: ImportedType[];
  zodImports: ZodImport[];
}

export type ViewDeclaration = {
  schema: string;
  name: string;
  primaryKey?: string;
  declaredName: string;
  recordName: string;
  constant: string;
  varName: string;
  queryBuilder: string;
  constructorName: string;
  modelName: string;
  columns: ColumnDeclaration[];
  enumImports: string[];
  typeImports: ImportedType[];
}

