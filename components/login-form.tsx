"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReducer, useRef } from "react";
import { useTranslations } from "next-intl";

import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

import { signInAdminPortal } from "@/actions/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AUTH_CARD_CLASS,
  AUTH_SUBMIT_CLASS,
  INPUT_CLASS,
  cn,
} from "@/lib/utils";
import { LoginSchema } from "@/schemas/auth.schema";
import { useFieldErrors, useErrorMessage } from '@/lib/use-validation-state';

type LoginFormState = {
  email: string;
  password: string;
  error: string | null;
  fieldErrors: Record<string, string>;
  isLoading: boolean;
  showPassword: boolean;
};

type LoginFormAction =
  | { type: "SET_EMAIL"; payload: string }
  | { type: "SET_PASSWORD"; payload: string }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_FIELD_ERRORS"; payload: Record<string, string> }
  | { type: "SET_IS_LOADING"; payload: boolean }
  | { type: "TOGGLE_SHOW_PASSWORD" }
  | { type: "CLEAR_ERRORS" };

const initialState: LoginFormState = {
  email: "",
  password: "",
  error: null,
  fieldErrors: {},
  isLoading: false,
  showPassword: false,
};

function loginFormReducer(
  state: LoginFormState,
  action: LoginFormAction
): LoginFormState {
  switch (action.type) {
    case "SET_EMAIL":
      return { ...state, email: action.payload };
    case "SET_PASSWORD":
      return { ...state, password: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_FIELD_ERRORS":
      return { ...state, fieldErrors: action.payload };
    case "SET_IS_LOADING":
      return { ...state, isLoading: action.payload };
    case "TOGGLE_SHOW_PASSWORD":
      return { ...state, showPassword: !state.showPassword };
    case "CLEAR_ERRORS":
      return { ...state, error: null, fieldErrors: {} };
    default:
      return state;
  }
}

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const t = useTranslations("Auth.login");
  const tCommon = useTranslations("Common");

  const toFieldErrors = useFieldErrors();
  const toErrorMessage = useErrorMessage();
  const [state, dispatch] = useReducer(loginFormReducer, initialState);
  const { email, password, error, fieldErrors, isLoading, showPassword } = state;
  const { push, refresh } = useRouter();
  // El disabled del botón llega recién en el próximo render: el ref corta un
  // segundo Enter o doble click que entre antes.
  const submittingRef = useRef(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    dispatch({ type: "CLEAR_ERRORS" });

    const result = LoginSchema.safeParse({ email, password });

    if (!result.success) {
      const errors = toFieldErrors(result.error);
      dispatch({ type: "SET_FIELD_ERRORS", payload: errors });
      return;
    }

    submittingRef.current = true;
    dispatch({ type: "SET_IS_LOADING", payload: true });

    const loginResult = await signInAdminPortal(email, password).then(
      (r) => ({ ok: true as const, result: r }),
      (err: unknown) => ({
        ok: false as const,
        error: toErrorMessage(err),
      }),
    );

    if (loginResult.ok && loginResult.result.success) {
      // Queda deshabilitado hasta que el dashboard reemplace la pantalla.
      push("/dashboard");
      refresh();
      return;
    }

    dispatch({
      type: "SET_ERROR",
      payload: loginResult.ok
        ? loginResult.result.error || t("noPermission")
        : loginResult.error,
    });
    submittingRef.current = false;
    dispatch({ type: "SET_IS_LOADING", payload: false });
  };

  return (
    <div
      className={cn(AUTH_CARD_CLASS, className)}
      {...props}
    >
      <h1 className="text-[2.25rem] leading-[1.15] font-bold tracking-[-0.02em] sm:text-[2.75rem]">
        {t("title")}
      </h1>
      <p className="mt-3 max-w-[25rem] text-lg leading-8 text-muted-foreground sm:text-[1.1875rem] sm:leading-9">
        {t("description")}
      </p>
      <form onSubmit={handleLogin} noValidate className="mt-10">
        <div className="grid gap-[0.875rem]">
          <Label htmlFor="email" className="text-lg font-semibold sm:text-[1.1875rem]">
            {tCommon("email")}
          </Label>
          <div className="relative">
            <Mail aria-hidden className="pointer-events-none absolute left-6 top-1/2 size-6 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              onChange={(e) => dispatch({ type: "SET_EMAIL", payload: e.target.value })}
              placeholder={t("emailPlaceholder")}
              type="email"
              value={email}
              aria-invalid={!!fieldErrors.email}
              aria-describedby="email-error"
              className={cn(INPUT_CLASS, "pl-16")}
            />
          </div>
          {fieldErrors.email && (
            <p id="email-error" className="text-destructive text-sm">
              {fieldErrors.email}
            </p>
          )}
        </div>
        <div className="mt-9 grid gap-[0.875rem]">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="password" className="text-lg font-semibold sm:text-[1.1875rem]">
              {tCommon("password")}
            </Label>
            <Link
              className="text-sm font-semibold text-brand-pink underline-offset-4 hover:underline sm:text-base"
              href="/auth/forgot-password"
            >
              {t("forgotPassword")}
            </Link>
          </div>
          <div className="relative">
            <LockKeyhole aria-hidden className="pointer-events-none absolute left-6 top-1/2 size-6 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              onChange={(e) => dispatch({ type: "SET_PASSWORD", payload: e.target.value })}
              type={showPassword ? "text" : "password"}
              value={password}
              aria-invalid={!!fieldErrors.password}
              aria-describedby="password-error"
              className={cn(INPUT_CLASS, "pl-16 pr-14")}
            />
            <button
              type="button"
              className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => dispatch({ type: "TOGGLE_SHOW_PASSWORD" })}
              aria-label={showPassword ? t("hidePassword") : t("showPassword")}
            >
              {showPassword ? <EyeOff className="size-6" /> : <Eye className="size-6" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p id="password-error" className="text-destructive text-sm">
              {fieldErrors.password}
            </p>
          )}
        </div>
        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        <Button
          className={cn("mt-8", AUTH_SUBMIT_CLASS, "rounded-full")}
          disabled={isLoading}
          aria-busy={isLoading}
          type="submit"
        >
          {isLoading ? t("submitting") : t("title")}
          {!isLoading && <ArrowRight className="size-6" />}
        </Button>
      </form>
      <p className="mt-9 flex flex-wrap items-center justify-center gap-x-11 gap-y-2 border-t pt-8 text-lg font-medium sm:text-[1.1875rem]">
        {t("noAccount")}
        <Link
          href="/owner/onboarding"
          className="font-bold text-brand-pink underline underline-offset-4"
        >
          {t("signUpLink")}
        </Link>
      </p>
    </div>
  );
}
