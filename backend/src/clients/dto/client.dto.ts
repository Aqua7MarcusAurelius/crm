import { z } from 'zod';

const clientFields = {
  firstName: z.string().min(1, 'Имя обязательно'),
  lastName: z.string().min(1, 'Фамилия обязательна'),
  status: z.string().nullable().optional(),
  dob: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  mobile: z.string().nullable().optional(),
  instagram: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  zoom: z.string().nullable().optional(),
  tgUsername: z.string().nullable().optional(),
  tgUserId: z.string().nullable().optional(),
  tgBio: z.string().nullable().optional(),
  tgLastVisitStatus: z.string().nullable().optional(),
  tgPremiumAccount: z.boolean().optional(),
  tgGifts: z.string().nullable().optional(),
  tgAccountTechStatus: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  addInfo: z.string().nullable().optional(),
};

export const CreateClientSchema = z.object(clientFields).strict();

export const UpdateClientSchema = z.object({
  ...Object.fromEntries(
    Object.entries(clientFields).map(([key, schema]) => [key, schema.optional()]),
  ),
}).strict();

export type CreateClientDto = z.infer<typeof CreateClientSchema>;
export type UpdateClientDto = z.infer<typeof UpdateClientSchema>;
