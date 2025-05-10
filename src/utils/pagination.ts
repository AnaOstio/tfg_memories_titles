import { Document, Query } from 'mongoose';
import { IPaginatedResult, IPaginationOptions } from '../interfaces/pagination.interface';

export async function paginate<T extends Document>(
    query: Query<T[], T>,
    options: IPaginationOptions
): Promise<IPaginatedResult<T>> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        query.skip(skip).limit(limit).exec(),
        query.model.countDocuments(query.getFilter())
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
        data,
        pagination: {
            total,
            page,
            limit,
            totalPages
        }
    };
}