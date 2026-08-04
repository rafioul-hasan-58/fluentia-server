export interface IBaseRepository<T, CreateDto = any, UpdateDto = any> {
  create(data: CreateDto): Promise<T>;
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  update(id: string, data: UpdateDto): Promise<T>;
  delete(id: string): Promise<T>;
}
