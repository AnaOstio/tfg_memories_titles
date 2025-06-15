import { Document } from 'mongoose';

export interface ISkillInput {
    name: string;
    description: string;
    type: string;
    generated_id?: string;
}

export interface ISkill extends ISkillInput {
    _id: string;
}

export interface ILearningOutcomeInput {
    name: string;
    description: string;
    skills_id: string[];
}

export interface ILearningOutcome extends ILearningOutcomeInput {
    _id: string;
}

export interface ITitleMemoryInput {
    titleCode: string;
    universities: string[];
    centers: string[];
    name: string;
    academicLevel: string;
    branch: string;
    academicField: string;
    status: string;
    yearDelivery: number;
    totalCredits: number;
    distributedCredits: Record<string, number>;
    existingSkills?: string[];
    skills?: ISkillInput[];
    existinglearningOutcomes?: Record<string, string[]>[];
    learningOutcomes?: ILearningOutcomeInput[];
    userId: string;
}

export interface ITitleMemory extends ITitleMemoryInput, Document {
    createdAt: Date;
    updatedAt: Date;
}

export interface ITitleMemoryFilter {
    titleCode?: string;
    universities?: string[];
    centers?: string[];
    name?: string;
    academicLevel?: string[];
    academicFields?: string[];
    branchAcademic?: string[];
    status?: string[];
    yearTo?: number;
    yearFrom?: number;
    userId?: string;
}

export interface ITitleMemorySearchParams {
    filters: {
        titleName?: string;
        academicLevel?: string[];
        academicFields?: string[];
        branchAcademic?: string[];
        universities?: string[];
        centers?: string[];
        year?: number[];
    };
    page: number;
    limit: number;
    fromUser?: boolean;
}