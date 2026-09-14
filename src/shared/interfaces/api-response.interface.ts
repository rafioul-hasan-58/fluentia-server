export type TMeta = {
  limit: number;
  page: number;
  total: number;
  totalPages?: number;
  [key: string]: unknown;
};

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  meta?: TMeta;
  data: T;
  timestamp: string;
}
export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errorMessages?: any[];
  timestamp: string;
}
