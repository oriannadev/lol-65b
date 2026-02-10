"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createUserRecord } from "@/lib/auth";
import { loginSchema, signupSchema } from "@/lib/validations/auth";
import { prisma } from "@/lib/prisma";

/** Prevent open redirect attacks by only allowing internal paths */
function safeRedirect(redirectTo: string): string {
  if (redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
    return redirectTo;
  }
  return "/";
}

export async function login(formData: FormData) {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Invalid email or password" };
  }

  const redirectTo = safeRedirect(
    (formData.get("redirectTo") as string) || "/"
  );
  redirect(redirectTo);
}

export async function signup(formData: FormData) {
  const raw = {
    email: formData.get("email") as string,
    username: formData.get("username") as string,
    password: formData.get("password") as string,
  };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Check if username is already taken
  const existingUser = await prisma.user.findUnique({
    where: { username: parsed.data.username.toLowerCase() },
  });
  if (existingUser) {
    return { error: "Username is already taken" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { username: parsed.data.username.toLowerCase() },
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "An account with this email already exists" };
    }
    return { error: "Failed to create account. Please try again." };
  }

  if (data.user) {
    try {
      await createUserRecord(
        data.user.id,
        parsed.data.email,
        parsed.data.username
      );
    } catch (e: unknown) {
      const prismaError = e as { code?: string };
      if (prismaError.code === "P2002") {
        return { error: "Username is already taken" };
      }
      return { error: "Failed to create user profile. Please try again." };
    }
  }

  redirect("/");
}
