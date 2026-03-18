import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function PublicFooter() {
  const t = await getTranslations("HomePage");

  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between sm:px-6">
        <p className="text-sm text-muted-foreground">
          {t("footerCopyright", { year: new Date().getFullYear() })}
        </p>
        <nav className="flex gap-6">
          <Link
            href="/auth/login"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {t("signIn")}
          </Link>
          <Link
            href="/auth/sign-up"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {t("signUp")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
