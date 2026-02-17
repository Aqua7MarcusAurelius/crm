import { z } from 'zod';

export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
}).strict();

export const CreatePositionSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  projectId: z.string().uuid('Некорректный ID проекта'),
}).strict();

export const AddEmailsSchema = z.object({
  emails: z.array(z.string().email('Некорректный email')).min(1, 'Минимум 1 email'),
}).strict();

export type CreateProjectDto = z.infer<typeof CreateProjectSchema>;
export type CreatePositionDto = z.infer<typeof CreatePositionSchema>;
export type AddEmailsDto = z.infer<typeof AddEmailsSchema>;
