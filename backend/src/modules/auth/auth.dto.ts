import { z } from 'zod';

export const SignupSchema = z.object({
    username: z.string().min(3).max(20).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
});
export type SignupDTO = z.infer<typeof SignupSchema>;

export const LoginSchema = z.object({
    username: z.string().optional(),
    email: z.string().email().optional(),
    password: z.string().min(1),
});
export type LoginDTO = z.infer<typeof LoginSchema>;

export const RefreshSchema = z.object({
    refreshToken: z.string(),
});
export type RefreshDTO = z.infer<typeof RefreshSchema>;
