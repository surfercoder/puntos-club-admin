"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReducer } from "react";
import { useTranslations } from "next-intl";

import { Eye, EyeOff } from "lucide-react";

import { signInAdminPortal } from "@/actions/auth/actions";
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
import { cn } from "@/lib/utils";
import { LoginSchema } from "@/schemas/auth.schema";

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

  const [state, dispatch] = useReducer(loginFormReducer, initialState);
  const { email, password, error, fieldErrors, isLoading, showPassword } = state;
  const { push, refresh } = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: "CLEAR_ERRORS" });

    const result = LoginSchema.safeParse({ email, password });

    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = String(issue.path[0]);
        if (!errors[field]) errors[field] = issue.message;
      }
      dispatch({ type: "SET_FIELD_ERRORS", payload: errors });
      return;
    }

    dispatch({ type: "SET_IS_LOADING", payload: true });

    try {
      const loginResult = await signInAdminPortal(email, password);

      if (!loginResult.success) {
        throw new Error(loginResult.error || t("noPermission"));
      }

      push("/dashboard");
      refresh();
    } catch (err: unknown) {
      dispatch({
        type: "SET_ERROR",
        payload: err instanceof Error ? err.message : tCommon("error"),
      });
    } finally {
      dispatch({ type: "SET_IS_LOADING", payload: false });
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} noValidate>
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
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">{tCommon("password")}</Label>
                  <Link
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    href="/auth/forgot-password"
                  >
                    {t("forgotPassword")}
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    onChange={(e) => dispatch({ type: "SET_PASSWORD", payload: e.target.value })}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    className="pr-10"
                    aria-invalid={!!fieldErrors.password}
                    aria-describedby="password-error"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => dispatch({ type: "TOGGLE_SHOW_PASSWORD" })}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p id="password-error" className="text-destructive text-sm">
                    {fieldErrors.password}
                  </p>
                )}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" disabled={isLoading} type="submit">
                {isLoading ? t("submitting") : t("title")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
