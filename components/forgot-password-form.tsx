"use client";

import Link from "next/link";
import { useReducer } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ForgotPasswordSchema } from "@/schemas/auth.schema";

type ForgotPasswordState = {
  email: string;
  error: string | null;
  fieldErrors: Record<string, string>;
  success: boolean;
  isLoading: boolean;
};

type ForgotPasswordAction =
  | { type: "SET_EMAIL"; payload: string }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_FIELD_ERRORS"; payload: Record<string, string> }
  | { type: "SET_SUCCESS"; payload: boolean }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "RESET_ERRORS" };

const initialState: ForgotPasswordState = {
  email: "",
  error: null,
  fieldErrors: {},
  success: false,
  isLoading: false,
};

function forgotPasswordReducer(
  state: ForgotPasswordState,
  action: ForgotPasswordAction
): ForgotPasswordState {
  switch (action.type) {
    case "SET_EMAIL":
      return { ...state, email: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_FIELD_ERRORS":
      return { ...state, fieldErrors: action.payload };
    case "SET_SUCCESS":
      return { ...state, success: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "RESET_ERRORS":
      return { ...state, error: null, fieldErrors: {} };
    default:
      return state;
  }
}

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const t = useTranslations("Auth.forgotPassword");
  const tCommon = useTranslations("Common");

  const [state, dispatch] = useReducer(forgotPasswordReducer, initialState);
  const { email, error, fieldErrors, success, isLoading } = state;

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: "RESET_ERRORS" });

    const result = ForgotPasswordSchema.safeParse({ email });

    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = String(issue.path[0]);
        if (!errors[field]) errors[field] = issue.message;
      }
      dispatch({ type: "SET_FIELD_ERRORS", payload: errors });
      return;
    }

    const supabase = createClient();
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (resetError) { throw resetError; }
      dispatch({ type: "SET_SUCCESS", payload: true });
    } catch (err: unknown) {
      dispatch({ type: "SET_ERROR", payload: err instanceof Error ? err.message : tCommon("error") });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {success ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t("successTitle")}</CardTitle>
            <CardDescription>{t("successDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t("successMessage")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} noValidate>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">{tCommon("email")}</Label>
                  <Input
                    id="email"
                    onChange={(e) => dispatch({ type: "SET_EMAIL", payload: e.target.value })}
                    placeholder={tCommon("emailPlaceholder")}
                    type="email"
                    value={email}
                    aria-invalid={!!fieldErrors.email}
                    aria-describedby="email-error"
                  />
                  {fieldErrors.email && (
                    <p id="email-error" className="text-destructive text-sm">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button className="w-full" disabled={isLoading} type="submit">
                  {isLoading ? t("submitting") : t("submitButton")}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                {t("alreadyHaveAccount")}{" "}
                <Link
                  className="underline underline-offset-4"
                  href="/auth/login"
                >
                  {t("loginLink")}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
