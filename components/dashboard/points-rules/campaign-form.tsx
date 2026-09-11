"use client";

import {
  Calendar,
  CircleCheck,
  Clock,
  Gift,
  Info,
  Lightbulb,
  Loader2,
  Search,
  Smile,
  Star,
  Store,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { createPointsRule, updatePointsRule } from "@/actions/dashboard/points-rules/actions";
import {
  ASSIGNMENT_TYPES,
  EMPTY_CAMPAIGN,
  type CampaignBranch,
  type CampaignFormValues,
} from "@/components/dashboard/points-rules/campaign-values";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const NAME_MAX = 60;
const DESCRIPTION_MAX = 120;

const EMOJI_OPTIONS = ["⭐", "🌙", "🎉", "💎", "🔥", "🍽️", "☀️", "🎁", "💰", "🏆", "😍", "🤑"];

/** Los `<input type="date">` siempre dan YYYY-MM-DD: se parte el string en vez
 *  de pasar por Date, que en UTC-3 mostraria el dia anterior. */
const formatDate = (iso: string) => iso.split("-").reverse().join("/");

/** El chip arranca el lunes, pero `days_of_week` usa el domingo como 0. */
const WEEK_DAYS = [1, 2, 3, 4, 5, 6, 0] as const;

const SECTION = "rounded-xl border bg-card p-5 shadow-sm";
const SECTION_TITLE = "text-base font-semibold text-brand-pink";

type Setter = (patch: Partial<CampaignFormValues>) => void;
type SectionProps = { set: Setter; values: CampaignFormValues };

/** El monto vigente depende del tipo de asignación elegido. */
const amountOf = (values: CampaignFormValues) =>
  Number(values.assignment === "percentage" ? values.percentage : values.points);

/** Agrega o saca un elemento de una lista tratada como conjunto. */
const toggled = <T,>(list: T[], item: T) => {
  const next = new Set(list);
  if (!next.delete(item)) next.add(item);
  return [...next];
};

/**
 * Las rutas de notificaciones devuelven el motivo en el cuerpo hasta cuando
 * fallan (sin créditos, límite del plan), así que se lee siempre; el status
 * está para no dar por buena una respuesta que ni siquiera llegó a la lógica.
 */
async function postNotification(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok || !payload.success) throw new Error(payload.error);
  return payload;
}

/** Manda la notificación push de estreno: primero se crea, después se envía. */
async function notifyCampaign(title: string, body: string) {
  const created = await postNotification("/api/notifications", { title, body });
  await postNotification("/api/notifications/send", { notificationId: created.data.id });
}

/**
 * Lo que la base no puede arreglar después: sin esto la campaña se guarda muda
 * (sin nombre visible) o sin condiciones y suma en todas las ventas. Devuelve
 * la clave del primer error, o null si está lista para guardarse.
 */
function firstError(values: CampaignFormValues, repeats: boolean, amount: number) {
  if (!values.name.trim() || !values.description.trim()) return "errors.basicInfo";
  if (!values.startDate || !values.endDate) return "errors.dates";
  if (values.endDate < values.startDate) return "errors.dateOrder";
  if (repeats && values.daysOfWeek.length === 0) return "errors.days";
  if (!Number.isFinite(amount) || amount <= 0) return "errors.amount";
  if (values.branchIds.length === 0) return "errors.branches";
  return null;
}

/** Traduce el formulario al input que espera la acción de points_rule. */
function toRuleInput(
  values: CampaignFormValues,
  options: { amount: number; branchCount: number; repeats: boolean; scheduled: boolean },
) {
  const name = values.name.trim();
  return {
    name,
    description: values.description.trim(),
    rule_type: values.assignment,
    config:
      values.assignment === "percentage"
        ? { percentage: options.amount }
        : { points_per_sale: options.amount },
    is_active: true,
    is_default: false,
    show_in_app: true,
    display_name: name,
    start_date: values.startDate,
    end_date: values.endDate,
    days_of_week: options.repeats ? values.daysOfWeek : undefined,
    time_start: options.scheduled ? values.timeStart || "00:00" : undefined,
    time_end: options.scheduled ? values.timeEnd || "23:59" : undefined,
    // Todas seleccionadas se guarda como "sin restricción": así la campaña
    // sigue apareciendo en la app aunque después se den de alta sucursales.
    branch_ids:
      values.branchIds.length === options.branchCount ? [] : values.branchIds.map(Number),
  };
}

function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  const t = useTranslations("PointsRules.campaignForm");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label={t("addEmoji")}
          className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          type="button"
        >
          <Smile className="size-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-2">
        <div className="grid grid-cols-6 gap-1">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              className="rounded-md p-1.5 text-lg transition-colors hover:bg-accent"
              key={emoji}
              onClick={() => onPick(emoji)}
              type="button"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function BasicSection({ set, values }: SectionProps) {
  const t = useTranslations("PointsRules.campaignForm");

  const append = (field: "description" | "name", emoji: string) => {
    const max = field === "name" ? NAME_MAX : DESCRIPTION_MAX;
    set({ [field]: `${values[field]}${emoji}`.slice(0, max) } as Partial<CampaignFormValues>);
  };

  return (
    <section className={SECTION}>
      <h2 className={SECTION_TITLE}>{t("basic.title")}</h2>

      <div className="mt-4">
        <Label htmlFor="campaign-name">
          {t("basic.name")} <span className="text-destructive">*</span>
        </Label>
        <div className="mt-1.5 flex items-center gap-1">
          <Input
            id="campaign-name"
            maxLength={NAME_MAX}
            onChange={(event) => set({ name: event.target.value })}
            placeholder={t("basic.namePlaceholder")}
            value={values.name}
          />
          <EmojiPicker onPick={(emoji) => append("name", emoji)} />
        </div>
        <p className="mt-1 text-right text-xs text-muted-foreground">
          {values.name.length}/{NAME_MAX}
        </p>
      </div>

      <div className="mt-3">
        <Label htmlFor="campaign-description">
          {t("basic.description")} <span className="text-destructive">*</span>
        </Label>
        <div className="mt-1.5 flex items-start gap-1">
          <Textarea
            id="campaign-description"
            maxLength={DESCRIPTION_MAX}
            onChange={(event) => set({ description: event.target.value })}
            placeholder={t("basic.descriptionPlaceholder")}
            rows={3}
            value={values.description}
          />
          <EmojiPicker onPick={(emoji) => append("description", emoji)} />
        </div>
        <p className="mt-1 text-right text-xs text-muted-foreground">
          {values.description.length}/{DESCRIPTION_MAX}
        </p>
      </div>
    </section>
  );
}

function WeekDayPicker({ set, values }: SectionProps) {
  const t = useTranslations("PointsRules.campaignForm");
  const chosen = new Set(values.daysOfWeek);

  return (
    <div className="mt-3">
      <Label>{t("validity.weekDays")}</Label>
      <div className="mt-2 flex flex-wrap gap-2">
        {WEEK_DAYS.map((day) => {
          const selected = chosen.has(day);
          return (
            <button
              aria-pressed={selected}
              className={`h-10 min-w-16 rounded-lg border px-3 text-xs font-semibold uppercase transition-colors ${
                selected ? "border-brand-pink bg-brand-pink text-white" : "hover:bg-accent"
              }`}
              key={day}
              onClick={() => set({ daysOfWeek: toggled(values.daysOfWeek, day).sort() })}
              type="button"
            >
              {t(`daysShort.${day}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ValiditySection({
  repeats,
  scheduled,
  set,
  setRepeats,
  setScheduled,
  values,
}: SectionProps & {
  repeats: boolean;
  scheduled: boolean;
  setRepeats: (on: boolean) => void;
  setScheduled: (on: boolean) => void;
}) {
  const t = useTranslations("PointsRules.campaignForm");

  return (
    <section className={SECTION}>
      <h2 className={SECTION_TITLE}>{t("validity.title")}</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="campaign-start">
            {t("validity.startDate")} <span className="text-destructive">*</span>
          </Label>
          <Input
            className="mt-1.5"
            id="campaign-start"
            onChange={(event) => set({ startDate: event.target.value })}
            type="date"
            value={values.startDate}
          />
        </div>
        <div>
          <Label htmlFor="campaign-end">
            {t("validity.endDate")} <span className="text-destructive">*</span>
          </Label>
          <Input
            className="mt-1.5"
            id="campaign-end"
            min={values.startDate || undefined}
            onChange={(event) => set({ endDate: event.target.value })}
            type="date"
            value={values.endDate}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">{t("validity.repeat")}</p>
          <p className="text-xs text-muted-foreground">{t("validity.repeatWeekly")}</p>
        </div>
        <Switch aria-label={t("validity.repeat")} checked={repeats} onCheckedChange={setRepeats} />
      </div>

      {repeats && <WeekDayPicker set={set} values={values} />}

      <div className="mt-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">{t("validity.schedule")}</p>
          <p className="text-xs text-muted-foreground">{t("validity.scheduleHelp")}</p>
        </div>
        <Switch
          aria-label={t("validity.schedule")}
          checked={scheduled}
          onCheckedChange={setScheduled}
        />
      </div>

      {scheduled && (
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="campaign-time-start">{t("validity.startTime")}</Label>
            <Input
              className="mt-1.5"
              id="campaign-time-start"
              onChange={(event) => set({ timeStart: event.target.value })}
              type="time"
              value={values.timeStart}
            />
          </div>
          <div>
            <Label htmlFor="campaign-time-end">{t("validity.endTime")}</Label>
            <Input
              className="mt-1.5"
              id="campaign-time-end"
              onChange={(event) => set({ timeEnd: event.target.value })}
              type="time"
              value={values.timeEnd}
            />
          </div>
        </div>
      )}
    </section>
  );
}

function PointsSection({ set, values }: SectionProps) {
  const t = useTranslations("PointsRules.campaignForm");

  return (
    <section className={SECTION}>
      <h2 className={SECTION_TITLE}>{t("points.title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("points.subtitle")}</p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {ASSIGNMENT_TYPES.map((type) => {
          const selected = values.assignment === type;
          const percentage = type === "percentage";
          return (
            // La tarjeta no puede ser un <label>: adentro va el <Label> del
            // input de valor, y un label anidado haría que tipear el monto
            // cambie de tipo de asignación.
            <div
              className={`rounded-xl border p-4 transition-colors ${
                selected ? "border-brand-pink bg-brand-pink/5" : "hover:bg-accent"
              }`}
              key={type}
            >
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  checked={selected}
                  className="mt-1 accent-[var(--brand-pink)]"
                  name="assignment"
                  onChange={() => set({ assignment: type })}
                  type="radio"
                  value={type}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{t(`points.${type}.title`)}</span>
                  <span className="block text-xs text-muted-foreground">
                    {t(`points.${type}.description`)}
                  </span>
                </span>
              </label>

              <div className="mt-3">
                <Label htmlFor={`campaign-${type}`}>
                  {t(`points.${type}.field`)} <span className="text-destructive">*</span>
                </Label>
                <div className="mt-1.5 flex">
                  <Input
                    className="rounded-r-none"
                    id={`campaign-${type}`}
                    min={0}
                    onChange={(event) =>
                      set(percentage
                        ? { percentage: event.target.value }
                        : { points: event.target.value })
                    }
                    placeholder="0"
                    step="1"
                    type="number"
                    value={percentage ? values.percentage : values.points}
                  />
                  <span className="grid place-items-center rounded-r-md border border-l-0 bg-muted px-3 text-sm text-muted-foreground">
                    {percentage ? "%" : t("points.unit")}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 flex items-start gap-2 rounded-lg bg-brand-pink/5 p-4 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-brand-pink" />
        {t("points.note")}
      </p>
    </section>
  );
}

function ScopeSection({ branches, set, values }: SectionProps & { branches: CampaignBranch[] }) {
  const t = useTranslations("PointsRules.campaignForm");
  const [query, setQuery] = useState("");

  const chosen = new Set(values.branchIds);
  const visible = branches.filter((branch) =>
    branch.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <section className={SECTION}>
      <h2 className={SECTION_TITLE}>{t("scope.title")}</h2>

      <Label className="mt-4 block">
        {t("scope.branches")} <span className="text-destructive">*</span>
      </Label>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button
          onClick={() => set({ branchIds: branches.map((branch) => branch.id) })}
          size="sm"
          type="button"
          variant="secondary"
        >
          <CircleCheck className="size-4" />
          {t("scope.selectAll")}
        </Button>
        <Button onClick={() => set({ branchIds: [] })} size="sm" type="button" variant="outline">
          <X className="size-4" />
          {t("scope.clear")}
        </Button>
        <div className="relative ml-auto min-w-48">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label={t("scope.search")}
            className="pl-8"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("scope.search")}
            value={query}
          />
        </div>
      </div>

      {visible.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {visible.map((branch) => (
            <div className="flex items-center gap-2" key={branch.id}>
              <Checkbox
                checked={chosen.has(branch.id)}
                id={`branch-${branch.id}`}
                onCheckedChange={() => set({ branchIds: toggled(values.branchIds, branch.id) })}
              />
              <Label className="font-normal" htmlFor={`branch-${branch.id}`}>
                {branch.name}
              </Label>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">{t("scope.noResults")}</p>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        {t("scope.selectedCount", { selected: values.branchIds.length, total: branches.length })}
      </p>
    </section>
  );
}

function CommunicationSection({
  notify,
  setNotify,
}: {
  notify: boolean;
  setNotify: (on: boolean) => void;
}) {
  const t = useTranslations("PointsRules.campaignForm");

  return (
    <section className={SECTION}>
      <h2 className={SECTION_TITLE}>
        {t("communication.title")}{" "}
        <span className="font-normal text-muted-foreground">{t("communication.optional")}</span>
      </h2>

      <div className="mt-4 flex items-start justify-between gap-4 rounded-lg bg-brand-pink/5 p-4">
        <div className="min-w-0">
          <p className="text-sm font-medium">{t("communication.notify")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("communication.notifyHelp")}</p>
        </div>
        <Switch
          aria-label={t("communication.notify")}
          checked={notify}
          onCheckedChange={setNotify}
        />
      </div>
      <p className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        {t("communication.credits")}
      </p>
    </section>
  );
}

function SummaryRow({ children, icon: Icon }: { children: React.ReactNode; icon: typeof Clock }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <dd>{children}</dd>
    </div>
  );
}

function CampaignSummary({ scheduled, values }: { scheduled: boolean; values: CampaignFormValues }) {
  const t = useTranslations("PointsRules.campaignForm");
  const chosen = new Set(values.daysOfWeek);
  const dayLabels = WEEK_DAYS.filter((day) => chosen.has(day)).map((day) => t(`days.${day}`));

  return (
    <section className="rounded-xl border bg-card p-5 text-center shadow-sm">
      <h2 className="text-sm font-semibold">{t("summary.title")}</h2>

      <span className="mx-auto mt-4 grid size-20 place-items-center rounded-full bg-brand-pink/10 text-brand-pink">
        <Gift className="size-9" />
      </span>

      <p className="mt-3 text-base font-semibold break-words">
        {values.name.trim() || t("summary.noName")}
      </p>
      <p className="mt-2">
        <span className="inline-block rounded-md bg-brand-green/10 px-2 py-0.5 text-xs font-medium text-brand-green">
          {t("summary.active")}
        </span>
      </p>

      <dl className="mt-4 space-y-3 border-t pt-4 text-left text-sm">
        <SummaryRow icon={Calendar}>
          {values.startDate && values.endDate
            ? t("summary.dates", {
                from: formatDate(values.startDate),
                to: formatDate(values.endDate),
              })
            : t("summary.noDates")}
        </SummaryRow>
        <SummaryRow icon={Clock}>
          <span className="block">
            {dayLabels.length > 0 ? dayLabels.join(", ") : t("summary.everyDay")}
          </span>
          <span className="block text-xs text-muted-foreground">
            {scheduled
              ? `${values.timeStart || "00:00"} - ${values.timeEnd || "23:59"}`
              : t("summary.allDay")}
          </span>
        </SummaryRow>
        <SummaryRow icon={Star}>
          {t(`summary.${values.assignment}`, { value: amountOf(values) || 0 })}
        </SummaryRow>
        <SummaryRow icon={Store}>
          {t("summary.branches", { count: values.branchIds.length })}
        </SummaryRow>
      </dl>
    </section>
  );
}

function HelpAsides() {
  const t = useTranslations("PointsRules.campaignForm");

  return (
    <>
      <section className="rounded-xl border bg-brand-blue/5 p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Lightbulb className="size-4 text-brand-blue" />
          {t("tips.title")}
        </h3>
        <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
          {["overlap", "sum", "edit"].map((tip) => (
            <li className="flex items-start gap-2" key={tip}>
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-blue" />
              {t(`tips.${tip}`)}
            </li>
          ))}
        </ul>
      </section>

      <section className={SECTION}>
        <h3 className="text-sm font-semibold">{t("communication.asideTitle")}</h3>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {t("communication.asideBody")}
        </p>
        <span className="mt-3 inline-block rounded-md bg-brand-pink/10 px-2 py-0.5 text-xs font-medium text-brand-pink">
          {t("communication.optionalBadge")}
        </span>
      </section>
    </>
  );
}

export function CampaignForm({
  branches,
  campaignId,
  initial = EMPTY_CAMPAIGN,
}: {
  branches: CampaignBranch[];
  campaignId?: number;
  initial?: CampaignFormValues;
}) {
  const t = useTranslations("PointsRules.campaignForm");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [values, setValues] = useState<CampaignFormValues>(initial);
  const [repeats, setRepeats] = useState(initial.daysOfWeek.length > 0);
  const [scheduled, setScheduled] = useState(Boolean(initial.timeStart || initial.timeEnd));
  const [notify, setNotify] = useState(false);

  const set: Setter = (patch) => setValues((current) => ({ ...current, ...patch }));

  const amount = amountOf(values);

  const submit = () => {
    const invalid = firstError(values, repeats, amount);
    if (invalid) {
      toast.error(t(invalid));
      return;
    }

    startTransition(async () => {
      const input = toRuleInput(values, {
        amount,
        branchCount: branches.length,
        repeats,
        scheduled,
      });

      const result = campaignId
        ? await updatePointsRule(campaignId, input)
        : await createPointsRule(input);

      if (!result.success) {
        toast.error(result.error || t("errors.save"));
        return;
      }

      // La campaña ya está guardada: si el push falla, se avisa pero no se
      // deshace nada, mandarla nunca fue condición para crearla.
      if (notify) {
        try {
          await notifyCampaign(values.name.trim(), values.description.trim());
        } catch (error) {
          const reason = error instanceof Error ? error.message : "";
          toast.error(reason || t("errors.notify"));
        }
      }

      toast.success(campaignId ? t("saved") : t("created"));
      router.push("/dashboard/points-rules");
      router.refresh();
    });
  };

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-4">
        <BasicSection set={set} values={values} />
        <ValiditySection
          repeats={repeats}
          scheduled={scheduled}
          set={set}
          setRepeats={setRepeats}
          setScheduled={setScheduled}
          values={values}
        />
        <PointsSection set={set} values={values} />
        <ScopeSection branches={branches} set={set} values={values} />
        <CommunicationSection notify={notify} setNotify={setNotify} />

        <div className="flex flex-wrap justify-end gap-3">
          <Button asChild type="button" variant="secondary">
            <Link href="/dashboard/points-rules">{tCommon("cancel")}</Link>
          </Button>
          <Button className="brand-cta" disabled={pending} onClick={submit} type="button">
            {pending && <Loader2 className="size-4 animate-spin" />}
            {campaignId ? t("submitEdit") : t("submitCreate")}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <CampaignSummary scheduled={scheduled} values={values} />
        <HelpAsides />
      </div>
    </div>
  );
}
