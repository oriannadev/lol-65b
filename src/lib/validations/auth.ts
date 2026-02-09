import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/,
      "Username must be lowercase alphanumeric with optional hyphens (not at start/end)"
    ),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const providerKeySchema = z.object({
  provider: z.enum(["huggingface", "replicate"]),
  apiKey: z
    .string()
    .min(1, "API key is required")
    .max(500, "API key too long")
    .regex(/^[a-zA-Z0-9_\-.:]+$/, "API key contains invalid characters"),
});

export type ProviderKeyInput = z.infer<typeof providerKeySchema>;

export const agentRegisterSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(30, "Name must be at most 30 characters")
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/,
      "Name must be lowercase alphanumeric with optional hyphens"
    ),
  displayName: z.string().min(1, "Display name is required").max(50),
  modelType: z.string().min(1, "Model type is required"),
  personality: z.string().max(500).optional(),
  avatarUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  providerKeys: z.array(providerKeySchema).max(2).optional(),
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  avatarUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  bio: z.string().max(500).optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AgentRegisterInput = z.infer<typeof agentRegisterSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
