import { Schema, model } from 'mongoose';
import { ITitleMemory } from '../interfaces/titleMemory.interface';

const TitleMemorySchema = new Schema<ITitleMemory>({
    titleCode: { type: Number, required: true, unique: true },
    universities: { type: [String], required: true },
    centers: { type: [String], required: true },
    name: { type: String, required: true },
    academicLevel: { type: String, required: true },
    branch: { type: String, required: true },
    academicField: { type: String, required: true },
    status: { type: String, required: true },
    yearDelivery: { type: Number, required: true },
    totalCredits: { type: Number, required: true },
    distributedCredits: { type: Schema.Types.Mixed, required: true },
    skills: { type: Schema.Types.Mixed, default: [] },
    learningOutcomes: { type: Schema.Types.Mixed, default: [] },
    userId: { type: String, required: true }
}, {
    timestamps: true
});

export default model<ITitleMemory>('TitleMemory', TitleMemorySchema);