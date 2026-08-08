/** API konvensiyalari — TZ §12. Barcha applar shu shakllardan foydalanadi. */

/** Standart xato formati: { error: { code, message, details } }. */
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/** Sahifalangan javob — { data, meta }. */
export interface Paginated<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  [filter: string]: unknown;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
