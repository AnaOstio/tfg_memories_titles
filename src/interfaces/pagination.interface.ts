export interface IPaginationOptions {
    page: number;
    limit: number;
}

export interface IPaginatedResult<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}