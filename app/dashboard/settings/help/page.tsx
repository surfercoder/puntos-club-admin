import { Download, FileText } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

// Los manuales se sirven estaticos desde /public/manuals. Para sumar otro:
// copiar el archivo ahi, agregar la entrada aca y las traducciones en es/en.
const MANUALS = [
  { key: 'owner', file: '/manuals/Manual_PuntosClub_Owner_v1.docx', format: 'DOCX' },
] as const;

export default async function HelpPage() {
  const t = await getTranslations('Dashboard.help');

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        {MANUALS.map(({ key, file, format }) => (
          <article key={key} className="flex items-start gap-4 rounded-xl border bg-card p-5 shadow-sm">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-violet/10 text-brand-violet">
              <FileText className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold">{t(`manuals.${key}.title`)}</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {t(`manuals.${key}.description`)}
              </p>
              <a
                href={file}
                download
                className="brand-cta mt-4 inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium"
              >
                <Download className="size-4" />
                {t('download', { format })}
              </a>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
