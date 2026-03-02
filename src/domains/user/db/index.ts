"use server";

import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signIn, auth } from "@/../auth";

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export async function signUpAction(
  username: string,
  password: string
): Promise<ActionResult> {
  try {
    if (!username || !password) {
      return { success: false, error: "Username and password are required" };
    }

    if (password.length < 6) {
      return {
        success: false,
        error: "Password must be at least 6 characters long",
      };
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return { success: false, error: "Username already exists" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user without organisation (will be created in step 2)
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });

    // Automatically sign in the user after registration
    const signInResult = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (signInResult?.error) {
      // User created but sign in failed - return success anyway
      // They can sign in manually
      return { success: true };
    }

    return { success: true };
  } catch (error) {
    console.error("Signup error:", error);
    return { success: false, error: "Internal server error" };
  }
}

export async function signInAction(
  username: string,
  password: string
): Promise<ActionResult> {
  try {
    if (!username || !password) {
      return { success: false, error: "Username and password are required" };
    }

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { success: false, error: "Invalid username or password" };
    }

    return { success: true };
  } catch (error) {
    console.error("Signin error:", error);
    return { success: false, error: "An error occurred. Please try again." };
  }
}


export async function getCurrentUser() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      select: {
        id: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}
