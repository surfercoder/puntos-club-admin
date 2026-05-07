"use client";

import { useRouter } from "next/navigation";
import { useReducer } from "react";
import { useTranslations } from "next-intl";

import { Eye, EyeOff } from "lucide-react";

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
import { PasswordStrengthChecklist, allRulesPass } from "@/components/onboarding/password-strength-checklist";

interface FormState {
  password: string;
  showPassword: boolean;
  error: string | null;
  submitted: boolean;
  isLoading: boolean;
}

type FormAction =
  | { type: 'SET_PASSWORD'; payload: string }
  | { type: 'TOGGLE_PASSWORD_VISIBILITY' }
  | { type: 'SUBMIT' }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: FormState = {
  password: '',
  showPassword: false,
  error: null,
  submitted: false,
  isLoading: false,
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_PASSWORD':
      return { ...state, password: action.payload };
    case 'TOGGLE_PASSWORD_VISIBILITY':
      return { ...state, showPassword: !state.showPassword };
    case 'SUBMIT':
      return { ...state, submitted: true, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const t = useTranslations("Auth.updatePassword");
  const tCommon = useTranslations("Common");

  const [state, dispatch] = useReducer(formReducer, initialState);
  const { password, showPassword, error, submitted, isLoading } = state;
  const { push } = useRouter();

  const passwordValid = allRulesPass(password);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'SUBMIT' });

    if (!passwordValid) return;

    const supabase = createClient();
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) { throw updateError; }
      push("/dashboard");
    } catch (err: unknown) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : tCommon("error") });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
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
          <form onSubmit={handleUpdatePassword} noValidate>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="password">{t("newPassword")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    onChange={(e) => dispatch({ type: 'SET_PASSWORD', payload: e.target.value })}
                    placeholder={t("newPasswordPlaceholder")}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => dispatch({ type: 'TOGGLE_PASSWORD_VISIBILITY' })}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <PasswordStrengthChecklist password={password} />
                {submitted && !passwordValid && (
                  <p className="text-destructive text-sm">
                    {tCommon("passwordWeak")}
                  </p>
                )}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" disabled={isLoading} type="submit">
                {isLoading ? t("submitting") : t("submitButton")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
