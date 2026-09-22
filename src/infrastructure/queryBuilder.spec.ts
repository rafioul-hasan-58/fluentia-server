import { PrismaModelDelegate, QueryBuilder } from './queryBuilder';

describe('QueryBuilder - sort()', () => {
  const mockModel = {
    findMany: jest.fn(),
    count: jest.fn(),
  } as unknown as PrismaModelDelegate<any>;

  it('should not treat sortBy="desc" as a field name and should apply it as sortOrder to defaultSort', () => {
    const qb = new QueryBuilder(mockModel, { sortBy: 'desc' });
    qb.sort('-createdAt');

    expect(qb.getQuery().orderBy).toEqual({ createdAt: 'desc' });
  });

  it('should not treat sortBy="asc" as a field name and should apply it as sortOrder to defaultSort', () => {
    const qb = new QueryBuilder(mockModel, { sortBy: 'asc' });
    qb.sort('-createdAt');

    expect(qb.getQuery().orderBy).toEqual({ createdAt: 'asc' });
  });

  it('should let explicit sortOrder win when sortBy="asc" and sortOrder="desc"', () => {
    const qb = new QueryBuilder(mockModel, {
      sortBy: 'asc',
      sortOrder: 'desc',
    });
    qb.sort('-createdAt');

    expect(qb.getQuery().orderBy).toEqual({ createdAt: 'desc' });
  });

  it('should handle case-insensitive sortBy="DESC" and sortBy="ASC"', () => {
    const qbDesc = new QueryBuilder(mockModel, { sortBy: 'DESC' });
    qbDesc.sort('-createdAt');
    expect(qbDesc.getQuery().orderBy).toEqual({ createdAt: 'desc' });

    const qbAsc = new QueryBuilder(mockModel, { sortBy: 'ASC' });
    qbAsc.sort('-createdAt');
    expect(qbAsc.getQuery().orderBy).toEqual({ createdAt: 'asc' });
  });

  it('should handle findBy alias when findBy="desc"', () => {
    const qb = new QueryBuilder(mockModel, { findBy: 'desc' });
    qb.sort('-createdAt');

    expect(qb.getQuery().orderBy).toEqual({ createdAt: 'desc' });
  });

  it('should handle normal field sorting with sortBy="createdAt" and sortOrder="desc"', () => {
    const qb = new QueryBuilder(mockModel, {
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    qb.sort('-createdAt');

    expect(qb.getQuery().orderBy).toEqual({ createdAt: 'desc' });
  });

  it('should handle real field sorting like sortBy="masteryLevel" without crashing or modifying field', () => {
    const qb = new QueryBuilder(mockModel, { sortBy: 'masteryLevel' });
    qb.sort('-createdAt');

    expect(qb.getQuery().orderBy).toEqual({ masteryLevel: 'asc' });
  });

  it('should handle nested relation sorting like sortBy="word.word" and sortOrder="asc"', () => {
    const qb = new QueryBuilder(mockModel, {
      sortBy: 'word.word',
      sortOrder: 'asc',
    });
    qb.sort('-createdAt');

    expect(qb.getQuery().orderBy).toEqual({ word: { word: 'asc' } });
  });

  it('should fall back to defaultSort when no sort params are given', () => {
    const qb = new QueryBuilder(mockModel, {});
    qb.sort('-createdAt');

    expect(qb.getQuery().orderBy).toEqual({ createdAt: 'desc' });
  });
});
