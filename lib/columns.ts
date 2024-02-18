import type {
  MaterializedViewColumn,
  TableColumn,
  ViewColumn,
} from "extract-pg-schema";

import type {
  ResolvedConfig,
  CustomType,
  ExplicitType,
  EnumDeclaration,
  ColumnDeclaration,
  ZodColumn,
  OnTypeImport,
  TypeImportBase,
} from "./@types";

import { defaultTypeMap, defaultZodTypeMap } from "./default-type-maps";

export function columnsIterator(
  config: ResolvedConfig,
  tableName: string,
  tableColumns: TableColumn[] | ViewColumn[] | MaterializedViewColumn[],
  enums: EnumDeclaration[],
  callbacks: {
    onTypeImport: OnTypeImport;
  },
): ColumnDeclaration[] {
  const columns: ColumnDeclaration[] = [];

  columns.push(
    ...tableColumns.flatMap(columnsMapper(config, tableName, enums, callbacks)),
  );

  return columns;
}

function columnsMapper(
  config: ResolvedConfig,
  tableName: string,
  enums: EnumDeclaration[],
  {
    onTypeImport,
  }: {
    onTypeImport: OnTypeImport;
  },
) {
  const { customTypes, zod: zodConfig } = config;

  const zodTypeMap = {
    ...defaultZodTypeMap,
    ...(zodConfig as Record<string, string>),
  };

  const tableCustomTypes: Record<string, CustomType> =
    typeof customTypes[tableName] === "object"
      ? { ...(customTypes[tableName] as object) }
      : {};

  return (
    entry: TableColumn | ViewColumn | MaterializedViewColumn,
  ): ColumnDeclaration[] => {
    const {
      name,
      isPrimaryKey,
      isIdentity,
      defaultValue,
      generated,
      maxLength,
      comment,
      ...column
    } = entry;

    const { fullName: type, kind } = column.type;

    let { isArray, isNullable } = column;
    let isGenerated = false;

    let declaredType = "unknown";
    let explicitType = false;

    const [schema] = type.split(".");
    const comments: string[] = [];

    // order does matter!
    // - check enums
    // - check default mappings
    // - check customTypes
    // - check tableCustomTypes

    if (kind === "enum") {
      const e = enums.find((e) => e.name === name && e.schema === schema);

      if (e) {
        declaredType = e.declaredName + e.enumUnionSuffix;
      }
    }

    if (defaultTypeMap[type]) {
      declaredType = defaultTypeMap[type];
    }

    for (const customDef of [
      customTypes[type],
      tableCustomTypes[name],
    ] satisfies (CustomType | Record<string, CustomType>)[]) {
      if (!customDef) {
        continue;
      }

      if (typeof customDef === "string") {
        declaredType = customDef as string;
      } else if ((customDef as TypeImportBase).import) {
        const typeImport = customDef as TypeImportBase;
        declaredType = typeImport.as || typeImport.import;
        if (typeImport.array) {
          isArray = true;
        }
        if (typeImport.nullable) {
          isNullable = true;
        }
        onTypeImport({ ...typeImport, declaredType }, schema);
      } else if ((customDef as ExplicitType).as) {
        declaredType = (customDef as ExplicitType).as;
        explicitType = true;
      }
    }

    if (isPrimaryKey) {
      comments.push("PrimaryKey");
    }

    if (defaultValue) {
      comments.push(`Default Value: ${defaultValue}`);
    }

    if (comment) {
      comments.push(`Comment: ${comment}`);
    }

    if (declaredType === "unknown") {
      comments.push(`Unknown Type: ${type}`);
    }

    if (generated !== "NEVER") {
      isGenerated = true;
      comments.push(`Generated: ${generated}`);
      comments.push(`${name}: ${declaredType};`);
    }

    if (!explicitType) {
      if (isArray) {
        declaredType = `${declaredType}[]`;
      }

      if (isNullable) {
        declaredType += " | null";
      }
    }

    const isOptional = isNullable || isIdentity || defaultValue;

    let zodSchema: string | undefined;

    if (zodConfig && zodConfig?.[tableName] !== false && !isGenerated) {
      zodSchema = zodTypeMap[type] || "z.any()";

      const zodColumns = {
        ...(zodConfig?.[tableName] as Record<string, ZodColumn>),
      };

      if (
        typeof zodColumns[name] === "string" ||
        name in zodColumns === false
      ) {
        // order does matter!

        if (maxLength) {
          zodSchema += `.max(${maxLength})`;
        }

        if (isNullable) {
          zodSchema += ".nullable()";
        }

        // array should always go last
        if (isArray) {
          zodSchema += ".array()";
        }

        if (isOptional) {
          // .optional().array() does not ssem to work with undefined values
          zodSchema = `z.optional(${zodSchema})`;
        }

        if (zodColumns[name]) {
          zodSchema = `((z) => ${zodColumns[name]})(${zodSchema})`;
        }
      } else if (typeof zodColumns[name] === "function") {
        zodSchema = `(${zodColumns[name].toString()})(z)`;
      }
    }

    return [
      {
        type,
        kind,
        name,
        isPrimaryKey,
        isOptional,
        isGenerated,
        isRegular: isPrimaryKey || isGenerated ? false : true,
        defaultValue,
        declaredType,
        comments,
        zodSchema,
      },
    ];
  };
}
