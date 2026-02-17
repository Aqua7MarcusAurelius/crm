import { z } from 'zod';

export const UpdateUserSchema = z.object({
  projectId: z.string().uuid().nullable().optional(),
  positionId: z.string().uuid().nullable().optional(),
  emailId: z.string().uuid().nullable().optional(),
  isAdmin: z.boolean().optional(),
}).strict(); // strict() отклоняет любые лишние поля

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
