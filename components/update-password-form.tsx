"use client";

import { useRouter } from "next/navigation";
import { useEffect, useReducer, useRef, useState } from "react";
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
import { PasswordStrengthChecklist } from "@/components/onboarding/password-strength-checklist";
import { allRulesPass } from "@/components/onboarding/password-rules";

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

  // Las apps moviles usan el flujo implicit: Supabase vuelve con los tokens en
  // el hash y este cliente (PKCE) no los levanta solo. Sin esto la pantalla
  // abre bien pero updateUser falla por falta de sesion.
  const fromApp = useRef(false);
  // Cuando hay desenlace se oculta el form: con el link vencido no hay sesion de
  // recuperacion, y dejarlo enviable cambiaria la clave de la sesion del browser.
  const [outcome, setOutcome] = useState<"backToApp" | "linkExpired" | null>(null);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hash.get('access_token');
    const refreshToken = hash.get('refresh_token');
    // Hash vacio = flujo normal de la web (PKCE, sesion en cookie). Cualquier
    // marca de recovery en el hash, aunque venga incompleta, es un link de app.
    if (!accessToken && !refreshToken && hash.get('type') !== 'recovery' && !hash.get('error_description')) return;

    window.history.replaceState(null, '', window.location.pathname);
    if (!accessToken || !refreshToken) {
      setOutcome("linkExpired");
      return;
    }
    fromApp.current = true;
    dispatch({ type: 'SET_LOADING', payload: true });
    createClient()
      .auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) setOutcome("linkExpired");
        dispatch({ type: 'SET_LOADING', payload: false });
      });
  }, []);

  const passwordValid = allRulesPass(password);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'SUBMIT' });

    if (!passwordValid) return;

    const supabase = createClient();
    dispatch({ type: 'SET_LOADING', payload: true });

    const errorMessage = await supabase.auth.updateUser({ password }).then(
      (r) => (r.error ? r.error.message : null),
      () => tCommon("error"),
    );

    if (errorMessage) {
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } else if (fromApp.current) {
      // Vino de la app: no tiene nada que hacer en el dashboard y la sesion de
      // recuperacion no deberia quedar viva en el browser.
      await supabase.auth.signOut({ scope: 'local' });
      setOutcome("backToApp");
    } else {
      push("/dashboard");
    }
    dispatch({ type: 'SET_LOADING', payload: false });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          <CardDescription>{outcome ? t(outcome) : t("description")}</CardDescription>
        </CardHeader>
        {!outcome && (
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
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
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
        )}
      </Card>
    </div>
  );
}
