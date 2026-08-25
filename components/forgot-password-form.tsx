"use client";

import Link from "next/link";
import { useReducer } from "react";
import { useTranslations } from "next-intl";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import {
  AUTH_CARD_CLASS,
  AUTH_SUBMIT_CLASS,
  INPUT_CLASS,
  cn,
} from "@/lib/utils";
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

    const errorMessage = await supabase.auth
      .resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })
      .then(
        (r) => (r.error ? r.error.message : null),
        () => tCommon("error"),
      );

    if (errorMessage) {
      dispatch({ type: "SET_ERROR", payload: errorMessage });
    } else {
      dispatch({ type: "SET_SUCCESS", payload: true });
    }
    dispatch({ type: "SET_LOADING", payload: false });
  };

  return (
    <div className={cn(AUTH_CARD_CLASS, "sm:px-16", className)} {...props}>
      <Link
        href="/auth/login"
        className="inline-flex items-center gap-3 text-base font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline sm:text-[1.0625rem]"
      >
        <ArrowLeft className="size-5 shrink-0" aria-hidden />
        {t("backToLogin")}
      </Link>
      <h1 className="mt-8 text-[1.875rem] leading-[1.15] font-bold tracking-[-0.02em] sm:text-[2.1875rem]">
        {success ? t("successTitle") : t("title")}
      </h1>
      <p className="mt-4 max-w-[26.25rem] text-lg leading-8 text-muted-foreground sm:text-[1.1875rem] sm:leading-9">
        {success ? t("successMessage") : t("description")}
      </p>
      {!success && (
        <form onSubmit={handleForgotPassword} noValidate className="mt-9">
          <div className="grid gap-[0.875rem]">
            <Label htmlFor="email" className="text-lg font-semibold sm:text-[1.1875rem]">
              {tCommon("email")}
            </Label>
            <Input
              id="email"
              onChange={(e) => dispatch({ type: "SET_EMAIL", payload: e.target.value })}
              placeholder={tCommon("emailPlaceholder")}
              type="email"
              value={email}
              aria-invalid={!!fieldErrors.email}
              aria-describedby="email-error"
              className={INPUT_CLASS}
            />
            {fieldErrors.email && (
              <p id="email-error" className="text-destructive text-sm">
                {fieldErrors.email}
              </p>
            )}
          </div>
          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
          <Button
            className={cn("mt-8", AUTH_SUBMIT_CLASS)}
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? t("submitting") : t("submitButton")}
          </Button>
        </form>
      )}
      <p className="mt-9 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-lg font-medium sm:text-[1.1875rem]">
        {t("alreadyHaveAccount")}
        <Link
          href="/auth/login"
          className="font-bold text-brand-pink underline-offset-4 hover:underline"
        >
          {t("loginLink")}
        </Link>
      </p>
    </div>
  );
}
