"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReducer } from "react";
import { useTranslations } from "next-intl";

import { signUpAdmin } from "@/actions/auth/actions";
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
import { SignUpSchema } from "@/schemas/auth.schema";

interface SignUpFormState {
  email: string;
  password: string;
  repeatPassword: string;
  firstName: string;
  lastName: string;
  error: string | null;
  fieldErrors: Record<string, string>;
  isLoading: boolean;
}

type SignUpFormAction =
  | { type: "SET_FIELD"; field: keyof SignUpFormState; value: string }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_FIELD_ERRORS"; fieldErrors: Record<string, string> }
  | { type: "SET_LOADING"; isLoading: boolean }
  | { type: "CLEAR_ERRORS" };

const initialState: SignUpFormState = {
  email: "",
  password: "",
  repeatPassword: "",
  firstName: "",
  lastName: "",
  error: null,
  fieldErrors: {},
  isLoading: false,
};

function signUpFormReducer(
  state: SignUpFormState,
  action: SignUpFormAction
): SignUpFormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "SET_FIELD_ERRORS":
      return { ...state, fieldErrors: action.fieldErrors };
    case "SET_LOADING":
      return { ...state, isLoading: action.isLoading };
    case "CLEAR_ERRORS":
      return { ...state, error: null, fieldErrors: {} };
    default:
      return state;
  }
}

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const t = useTranslations("Auth.signUp");
  const tCommon = useTranslations("Common");

  const [state, dispatch] = useReducer(signUpFormReducer, initialState);
  const { email, password, repeatPassword, firstName, lastName, error, fieldErrors, isLoading } = state;
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: "CLEAR_ERRORS" });

    const result = SignUpSchema.safeParse({
      firstName,
      lastName,
      email,
      password,
      repeatPassword,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = String(issue.path[0]);
        if (!errors[field]) errors[field] = issue.message;
      }
      dispatch({ type: "SET_FIELD_ERRORS", fieldErrors: errors });
      return;
    }

    dispatch({ type: "SET_LOADING", isLoading: true });

    try {
      const signUpResult = await signUpAdmin({
        email,
        password,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      });

      if (!signUpResult.success) {
        dispatch({ type: "SET_ERROR", error: signUpResult.error || tCommon("error") });
        return;
      }

      router.push("/auth/sign-up-success");
    } catch (err: unknown) {
      dispatch({ type: "SET_ERROR", error: err instanceof Error ? err.message : tCommon("error") });
    } finally {
      dispatch({ type: "SET_LOADING", isLoading: false });
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
          <form onSubmit={handleSignUp} noValidate>
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">{tCommon("name")}</Label>
                  <Input
                    id="firstName"
                    onChange={(e) => dispatch({ type: "SET_FIELD", field: "firstName", value: e.target.value })}
                    placeholder={t("firstNamePlaceholder")}
                    type="text"
                    value={firstName}
                    aria-invalid={!!fieldErrors.firstName}
                    aria-describedby="firstName-error"
                  />
                  {fieldErrors.firstName && (
                    <p id="firstName-error" className="text-destructive text-sm">
                      {fieldErrors.firstName}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">{tCommon("lastName")}</Label>
                  <Input
                    id="lastName"
                    onChange={(e) => dispatch({ type: "SET_FIELD", field: "lastName", value: e.target.value })}
                    placeholder={t("lastNamePlaceholder")}
                    type="text"
                    value={lastName}
                    aria-invalid={!!fieldErrors.lastName}
                    aria-describedby="lastName-error"
                  />
                  {fieldErrors.lastName && (
                    <p id="lastName-error" className="text-destructive text-sm">
                      {fieldErrors.lastName}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">{tCommon("email")}</Label>
                <Input
                  id="email"
                  onChange={(e) => dispatch({ type: "SET_FIELD", field: "email", value: e.target.value })}
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
                <Label htmlFor="password">{tCommon("password")}</Label>
                <Input
                  id="password"
                  onChange={(e) => dispatch({ type: "SET_FIELD", field: "password", value: e.target.value })}
                  type="password"
                  value={password}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby="password-error"
                />
                {fieldErrors.password && (
                  <p id="password-error" className="text-destructive text-sm">
                    {fieldErrors.password}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="repeat-password">{t("repeatPassword")}</Label>
                <Input
                  id="repeat-password"
                  onChange={(e) => dispatch({ type: "SET_FIELD", field: "repeatPassword", value: e.target.value })}
                  type="password"
                  value={repeatPassword}
                  aria-invalid={!!fieldErrors.repeatPassword}
                  aria-describedby="repeatPassword-error"
                />
                {fieldErrors.repeatPassword && (
                  <p id="repeatPassword-error" className="text-destructive text-sm">
                    {fieldErrors.repeatPassword}
                  </p>
                )}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" disabled={isLoading} type="submit">
                {isLoading ? t("submitting") : t("title")}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              {t("alreadyHaveAccount")}{" "}
              <Link className="underline underline-offset-4" href="/auth/login">
                {t("loginLink")}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
