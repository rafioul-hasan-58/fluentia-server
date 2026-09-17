export interface QueryPaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface QueryBuilderOptions {
  defaultLimit?: number;
  maxLimit?: number;
}

export interface PrismaModelDelegate<T = unknown> {
  findMany(args?: Record<string, unknown>): Promise<T[]>;
  count(args?: { where?: Record<string, unknown> }): Promise<number>;
}

export class QueryBuilder<T = any> {
  private readonly model: PrismaModelDelegate<T>;
  private readonly query: Record<string, unknown>;
  private prismaQuery: {
    where?: Record<string, unknown>;
    orderBy?: Record<string, unknown> | Array<Record<string, unknown>>;
    skip?: number;
    take?: number;
    select?: Record<string, boolean | object>;
    include?: Record<string, boolean | object>;
    [key: string]: unknown;
  } = {};

  constructor(model: PrismaModelDelegate<T>, query?: Record<string, unknown>) {
    this.model = model;
    this.query = query ? { ...query } : {};
  }

  // Search across top-level and nested fields using insensitive contains
  search(searchableFields: string[]): this {
    const rawSearch = (this.query.searchTerm ?? this.query.search) as
      string | undefined;
    const searchTerm =
      typeof rawSearch === 'string' ? rawSearch.trim() : undefined;

    if (searchTerm) {
      const orConditions = searchableFields.map((field) => {
        if (field.includes('.')) {
          const parts = field.split('.');
          return parts
            .slice()
            .reverse()
            .reduce<Record<string, unknown>>((acc, key, idx) => {
              if (idx === 0) {
                return { [key]: { contains: searchTerm, mode: 'insensitive' } };
              }
              return { [key]: acc };
            }, {});
        }

        return {
          [field]: { contains: searchTerm, mode: 'insensitive' },
        };
      });

      const existingWhere = this.prismaQuery.where || {};
      const existingOr = Array.isArray(existingWhere.OR)
        ? (existingWhere.OR as Array<Record<string, unknown>>)
        : [];

      this.prismaQuery.where = {
        ...existingWhere,
        OR: [...existingOr, ...orConditions],
      };
    }
    return this;
  }

  // Filter based on query parameters excluding reserved pagination/sort keys
  filter(excludeAdditionalFields: string[] = []): this {
    const queryObj = { ...this.query };
    const excludeFields = [
      'searchTerm',
      'search',
      'sort',
      'sortBy',
      'sortOrder',
      'limit',
      'page',
      'fields',
      ...excludeAdditionalFields,
    ];
    excludeFields.forEach((field) => delete queryObj[field]);

    const formattedFilters: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(queryObj)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }

      if (key.includes('.')) {
        const parts = key.split('.');
        const nestedFilter = parts
          .slice()
          .reverse()
          .reduce<Record<string, unknown>>((acc, k, idx) => {
            if (idx === 0) {
              return { [k]: value };
            }
            return { [k]: acc };
          }, {});

        this.deepMerge(formattedFilters, nestedFilter);
      } else if (typeof value === 'string' && value.includes('[')) {
        const [field, operator] = key.split('[');
        const op = operator.slice(0, -1);
        const parsedNumber = parseFloat(value);
        formattedFilters[field] = {
          [`${op}`]: isNaN(parsedNumber) ? value : parsedNumber,
        };
      } else {
        formattedFilters[key] = value;
      }
    }

    this.prismaQuery.where = {
      ...this.prismaQuery.where,
      ...formattedFilters,
    };

    return this;
  }

  // Merge custom / programmatic Prisma where filters
  rawFilter(filters: Record<string, unknown>): this {
    if (!filters || Object.keys(filters).length === 0) {
      return this;
    }

    this.prismaQuery.where = {
      ...this.prismaQuery.where,
      ...filters,
    };
    return this;
  }

  // Sorting with optional default sort order
  sort(defaultSort = '-createdAt'): this {
    const sortParam = (this.query.sort as string) || defaultSort;
    const sortList = sortParam
      .split(',')
      .map((field) => field.trim())
      .filter(Boolean);

    const orderBy = sortList.map((field) => {
      const isDesc = field.startsWith('-');
      const cleanField = isDesc ? field.slice(1) : field;

      if (cleanField.includes('.')) {
        const parts = cleanField.split('.');
        return parts
          .slice()
          .reverse()
          .reduce<Record<string, unknown>>((acc, k, idx) => {
            if (idx === 0) {
              return { [k]: isDesc ? 'desc' : 'asc' };
            }
            return { [k]: acc };
          }, {});
      }

      return { [cleanField]: isDesc ? 'desc' : 'asc' };
    });

    this.prismaQuery.orderBy = orderBy.length === 1 ? orderBy[0] : orderBy;
    return this;
  }

  // Pagination with default fallback and max limit protection
  paginate(options?: QueryBuilderOptions): this {
    const defaultLimit = options?.defaultLimit ?? 10;
    const maxLimit = options?.maxLimit ?? 100;

    const page = Math.max(1, Number(this.query.page) || 1);
    let limit = Number(this.query.limit) || defaultLimit;
    if (limit < 1) limit = defaultLimit;
    if (limit > maxLimit) limit = maxLimit;

    const skip = (page - 1) * limit;

    this.prismaQuery.skip = skip;
    this.prismaQuery.take = limit;

    return this;
  }

  // Fields Selection from comma-separated string
  fields(): this {
    const fields =
      (this.query.fields as string)
        ?.split(',')
        .map((f) => f.trim())
        .filter(Boolean) || [];

    if (fields.length > 0) {
      this.prismaQuery.select = fields.reduce(
        (acc: Record<string, boolean>, field) => {
          acc[field] = true;
          return acc;
        },
        {},
      );
    }
    return this;
  }

  // Programmatic select fields
  select(selectableFields: Record<string, boolean | object>): this {
    delete this.prismaQuery.include;
    this.prismaQuery.select = {
      ...this.prismaQuery.select,
      ...selectableFields,
    };
    return this;
  }

  // Include Related Models
  include(inculpableFields: Record<string, boolean | object>): this {
    this.prismaQuery.include = {
      ...this.prismaQuery.include,
      ...inculpableFields,
    };
    return this;
  }

  // Price range helper
  priceRange(minPrice?: number, maxPrice?: number): this {
    if (!this.prismaQuery.where) {
      this.prismaQuery.where = {};
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter: Record<string, number> = {};

      if (minPrice !== undefined) {
        priceFilter.gte = minPrice;
      }

      if (maxPrice !== undefined) {
        priceFilter.lte = maxPrice;
      }

      this.prismaQuery.where.price = priceFilter;
    }

    return this;
  }

  // Access current Prisma query object
  getQuery(): Record<string, unknown> {
    return this.prismaQuery;
  }

  // Execute findMany
  async execute(): Promise<T[]> {
    return await this.model.findMany(this.prismaQuery);
  }

  // Count Total and calculate pagination metadata
  async countTotal(): Promise<QueryPaginationResult> {
    const total = await this.model.count({
      where: this.prismaQuery.where,
    });
    const page = Math.max(1, Number(this.query.page) || 1);
    const limit = Math.max(1, Number(this.query.limit) || 10);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      page,
      limit,
      total,
      totalPages,
    };
  }

  // Alias for countTotal
  async count(): Promise<QueryPaginationResult> {
    return await this.countTotal();
  }

  // Helper to execute query and count total in parallel
  async executeWithPagination(): Promise<{
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const [items, meta] = await Promise.all([
      this.execute(),
      this.countTotal(),
    ]);

    return {
      items,
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages,
    };
  }

  private deepMerge(
    target: Record<string, unknown>,
    source: Record<string, unknown>,
  ): Record<string, unknown> {
    for (const key of Object.keys(source)) {
      const sourceVal = source[key];
      const targetVal = target[key];

      if (
        sourceVal instanceof Object &&
        key in target &&
        targetVal instanceof Object &&
        !Array.isArray(sourceVal)
      ) {
        Object.assign(
          sourceVal,
          this.deepMerge(
            targetVal as Record<string, unknown>,
            sourceVal as Record<string, unknown>,
          ),
        );
      }
      target[key] = sourceVal;
    }
    return target;
  }
}

export default QueryBuilder;
