"use client";

import {
  Bell,
  Building2,
  MapPin,
  Check,
  Clock,
  Copy,
  Globe,
  Lock,
  Mail,
  Phone,
  Save,
  Settings,
  Sparkles,
  Star,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { updateClubProfile } from "@/actions/dashboard/organization/actions";
import {
  GoogleAddressAutocomplete,
  type GoogleAddressComponents,
} from "@/components/ui/google-address-autocomplete";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Organization } from "@/types/organization";

const INDUSTRIES = ["retail", "gastronomy", "services", "health", "beauty", "other"] as const;
const POINT_LABELS = ["puntos", "estrellas", "monedas"] as const;
const ADDRESS_FIELDS = [
  { key: "street", autoComplete: "address-line1" },
  { key: "number", autoComplete: "address-line2" },
  { key: "city", autoComplete: "address-level2" },
  { key: "state", autoComplete: "address-level1" },
  { key: "zip_code", autoComplete: "postal-code" },
] as const;
const TIMEZONES = [
  "America/Argentina/Buenos_Aires",
  "America/Santiago",
  "America/Montevideo",
  "America/Bogota",
  "America/Mexico_City",
] as const;

export type ClubProfileFormAddress = {
  street: string | null;
  number: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  place_id: string | null;
  latitude: number | null;
  longitude: number | null;
};

/** La dirección viene de la base con nulls; el form la trabaja siempre como texto. */
type AddressState = Record<(typeof ADDRESS_FIELDS)[number]["key"], string> & {
  country: string | null;
  place_id: string | null;
  latitude: number | null;
  longitude: number | null;
};

const toAddressState = (address?: ClubProfileFormAddress | null): AddressState => ({
  street: address?.street ?? "",
  number: address?.number ?? "",
  city: address?.city ?? "",
  state: address?.state ?? "",
  zip_code: address?.zip_code ?? "",
  country: address?.country ?? null,
  place_id: address?.place_id ?? null,
  latitude: address?.latitude ?? null,
  longitude: address?.longitude ?? null,
});

type Toggles = {
  is_public: boolean;
  show_in_explore: boolean;
  allow_new_members: boolean;
  requires_approval: boolean;
  email_notifications: boolean;
};

export function ClubProfileForm({
  organization,
  address,
}: {
  organization: Organization;
  address?: ClubProfileFormAddress | null;
}) {
  const t = useTranslations("Dashboard.clubProfile");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [logoUrl, setLogoUrl] = useState(organization.logo_url ?? null);
  const [toggles, setToggles] = useState<Toggles>({
    is_public: organization.is_public ?? true,
    show_in_explore: organization.show_in_explore ?? true,
    allow_new_members: organization.allow_new_members ?? true,
    requires_approval: organization.requires_approval ?? false,
    email_notifications: organization.email_notifications ?? true,
  });
  const [invitationCode, setInvitationCode] = useState(organization.invitation_code ?? "");
  const [pointsLabel, setPointsLabel] = useState(organization.points_label ?? "puntos");
  const [timezone, setTimezone] = useState(
    organization.timezone ?? "America/Argentina/Buenos_Aires",
  );
  const [industry, setIndustry] = useState(organization.industry ?? "");
  const [addressData, setAddressData] = useState<AddressState>(() => toAddressState(address));

  const setAddressField = (key: (typeof ADDRESS_FIELDS)[number]["key"], value: string) =>
    setAddressData((current) => ({ ...current, [key]: value }));

  const onPlaceSelected = (place: GoogleAddressComponents) =>
    setAddressData({
      street: place.street,
      number: place.number,
      city: place.city,
      state: place.state,
      zip_code: place.zip_code,
      country: place.country,
      place_id: place.place_id,
      latitude: place.latitude ?? null,
      longitude: place.longitude ?? null,
    });


  const toggle = (key: keyof Toggles, value: boolean) =>
    setToggles((current) => ({ ...current, [key]: value }));

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (key: string) => {
      const raw = data.get(key);
      /* c8 ignore next -- todos los campos existen en el form */
      return typeof raw === "string" ? raw.trim() : "";
    };
    const text = (key: string) => value(key) || null;

    startTransition(async () => {
      const street = addressData.street.trim();

      const result = await updateClubProfile(String(organization.id), {
        name: value("name"),
        business_name: text("business_name"),
        tax_id: text("tax_id"),
        description: text("description"),
        contact_email: text("contact_email"),
        contact_phone: text("contact_phone"),
        website: text("website"),
        industry: industry || null,
        logo_url: logoUrl,
        invitation_code: invitationCode.trim() || null,
        welcome_message: text("welcome_message"),
        points_label: pointsLabel,
        timezone,
        ...toggles,
        // Sin calle no hay dirección que guardar: evitamos crear filas vacías.
        ...(street
          ? {
              address: {
                street,
                number: addressData.number.trim(),
                city: addressData.city.trim(),
                state: addressData.state.trim(),
                zip_code: addressData.zip_code.trim(),
                country: addressData.country,
                place_id: addressData.place_id,
                latitude: addressData.latitude,
                longitude: addressData.longitude,
              },
            }
          : {}),
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(t("saved"));
      router.refresh();
    });
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-4">
          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <span className="grid size-8 place-items-center rounded-lg bg-brand-violet/10 text-brand-violet">
                <Globe className="size-4" />
              </span>
              {t("visibility.title")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("visibility.description")}</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[true, false].map((isPublic) => (
                <label
                  key={String(isPublic)}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                    toggles.is_public === isPublic
                      ? "border-brand-violet bg-brand-violet/5"
                      : "hover:bg-accent"
                  }`}
                >
                  <input
                    checked={toggles.is_public === isPublic}
                    className="mt-0.5 size-4 accent-[var(--brand-violet)]"
                    name="visibility"
                    onChange={() => toggle("is_public", isPublic)}
                    type="radio"
                  />
                  <span>
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      {isPublic ? <Globe className="size-4" /> : <Lock className="size-4" />}
                      {t(isPublic ? "visibility.public" : "visibility.private")}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {t(
                        isPublic
                          ? "visibility.publicDescription"
                          : "visibility.privateDescription",
                      )}
                    </span>
                  </span>
                </label>
              ))}
            </div>

            <p className="mt-4 rounded-lg bg-brand-blue/5 p-3 text-xs text-muted-foreground">
              {t("visibility.qrNote")}
            </p>
          </section>

          <GeneralSection
            industry={industry}
            logoUrl={logoUrl}
            onIndustryChange={setIndustry}
            onLogoChange={setLogoUrl}
            organization={organization}
          />

          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <span className="grid size-8 place-items-center rounded-lg bg-brand-violet/10 text-brand-violet">
                <MapPin className="size-4" />
              </span>
              {t("address.title")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("address.description")}</p>

            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="google-address">{t("address.search")}</Label>
                <GoogleAddressAutocomplete
                  className="mt-1.5"
                  id="google-address"
                  placeholder={t("address.searchPlaceholder")}
                  onPlaceSelected={onPlaceSelected}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {ADDRESS_FIELDS.map(({ key, autoComplete }) => (
                  <div key={key}>
                    <Label htmlFor={key}>{t(`address.${key}`)}</Label>
                    <Input
                      autoComplete={autoComplete}
                      className="mt-1.5"
                      id={key}
                      onChange={(event) => setAddressField(key, event.target.value)}
                      value={addressData[key]}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <SettingsSection
          invitationCode={invitationCode}
          onInvitationCodeChange={setInvitationCode}
          onPointsLabelChange={setPointsLabel}
          onTimezoneChange={setTimezone}
          onToggle={toggle}
          organization={organization}
          pointsLabel={pointsLabel}
          timezone={timezone}
          toggles={toggles}
        />
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <Button asChild type="button" variant="secondary">
          <Link href="/dashboard">{tCommon("cancel")}</Link>
        </Button>
        <Button className="brand-cta" disabled={pending} type="submit">
          <Save className="size-4" />
          {tCommon("saveChanges")}
        </Button>
      </div>
    </form>
  );
}

function SettingRow({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
      {children}
    </div>
  );
}

/** Datos generales del club: razón social, contacto, rubro y logo. */
function GeneralSection({
  industry,
  logoUrl,
  onIndustryChange,
  onLogoChange,
  organization,
}: {
  industry: string;
  logoUrl: string | null;
  onIndustryChange: (value: string) => void;
  onLogoChange: (value: string | null) => void;
  organization: Organization;
}) {
  const t = useTranslations("Dashboard.clubProfile");

  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <span className="grid size-8 place-items-center rounded-lg bg-brand-violet/10 text-brand-violet">
          <Building2 className="size-4" />
        </span>
        {t("general.title")}
      </h2>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="name">
            {t("general.name")} <span className="text-destructive">*</span>
          </Label>
          <Input className="mt-1.5" defaultValue={organization.name} id="name" name="name" required />
        </div>
        <div>
          <Label htmlFor="business_name">{t("general.businessName")}</Label>
          <Input
            className="mt-1.5"
            defaultValue={organization.business_name ?? ""}
            id="business_name"
            name="business_name"
          />
        </div>
        <div>
          <Label htmlFor="tax_id">{t("general.taxId")}</Label>
          <Input
            className="mt-1.5"
            defaultValue={organization.tax_id ?? ""}
            id="tax_id"
            name="tax_id"
          />
        </div>
        <div>
          <Label htmlFor="description">{t("general.description")}</Label>
          <Textarea
            className="mt-1.5"
            defaultValue={organization.description ?? ""}
            id="description"
            name="description"
            rows={2}
          />
        </div>
        <div>
          <Label htmlFor="contact_email">
            {t("general.email")} <span className="text-destructive">*</span>
          </Label>
          <div className="relative mt-1.5">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              defaultValue={organization.contact_email ?? ""}
              id="contact_email"
              name="contact_email"
              required
              type="email"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="contact_phone">{t("general.phone")}</Label>
          <div className="relative mt-1.5">
            <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              defaultValue={organization.contact_phone ?? ""}
              id="contact_phone"
              name="contact_phone"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="website">{t("general.website")}</Label>
          <div className="relative mt-1.5">
            <Globe className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              defaultValue={organization.website ?? ""}
              id="website"
              name="website"
              placeholder="https://"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="industry">{t("general.industry")}</Label>
          <Select onValueChange={onIndustryChange} value={industry}>
            <SelectTrigger className="mt-1.5 w-full" id="industry">
              <SelectValue placeholder={t("general.industryPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(`industries.${option}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4 border-t pt-5">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{t("general.logo")}</p>
          <p className="text-xs text-muted-foreground">{t("general.logoHint")}</p>
        </div>
        <div className="w-48 shrink-0">
          <ImageUpload
            aspectRatio="square"
            bucket="logos"
            maxHeight={96}
            onChange={onLogoChange}
            value={logoUrl}
          />
        </div>
      </div>
    </section>
  );
}

/** Columna lateral de ajustes del club: switches, código de invitación y preferencias. */
function SettingsSection({
  invitationCode,
  onInvitationCodeChange,
  onPointsLabelChange,
  onTimezoneChange,
  onToggle,
  organization,
  pointsLabel,
  timezone,
  toggles,
}: {
  invitationCode: string;
  onInvitationCodeChange: (value: string) => void;
  onPointsLabelChange: (value: string) => void;
  onTimezoneChange: (value: string) => void;
  onToggle: (key: keyof Toggles, value: boolean) => void;
  organization: Organization;
  pointsLabel: string;
  timezone: string;
  toggles: Toggles;
}) {
  const t = useTranslations("Dashboard.clubProfile");
  const tCommon = useTranslations("Common");
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    if (!invitationCode) return;
    try {
      await navigator.clipboard.writeText(invitationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // El navegador puede bloquear el portapapeles; el código sigue visible.
    }
  };

  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <span className="grid size-8 place-items-center rounded-lg bg-brand-violet/10 text-brand-violet">
          <Settings className="size-4" />
        </span>
        {t("settings.title")}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("settings.description")}</p>

      <div className="mt-5 space-y-4">
        <SettingRow
          description={t("settings.allowNewMembersHint")}
          icon={UserPlus}
          title={t("settings.allowNewMembers")}
        >
          <Switch
            aria-label={t("settings.allowNewMembers")}
            checked={toggles.allow_new_members}
            onCheckedChange={(value) => onToggle("allow_new_members", value)}
          />
        </SettingRow>

        <SettingRow
          description={t("settings.requiresApprovalHint")}
          icon={Users}
          title={t("settings.requiresApproval")}
        >
          <Switch
            aria-label={t("settings.requiresApproval")}
            checked={toggles.requires_approval}
            onCheckedChange={(value) => onToggle("requires_approval", value)}
          />
        </SettingRow>

        <SettingRow
          description={t("settings.invitationCodeHint")}
          icon={Sparkles}
          title={t("settings.invitationCode")}
        >
          <span className="flex items-center gap-1.5">
            <Input
              aria-label={t("settings.invitationCode")}
              className="h-8 w-28 text-center font-mono text-xs uppercase"
              onChange={(event) => onInvitationCodeChange(event.target.value)}
              value={invitationCode}
            />
            <button
              aria-label={tCommon("copy")}
              className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-md border text-muted-foreground transition-colors hover:bg-accent"
              onClick={copyCode}
              type="button"
            >
              {copied ? (
                <Check className="size-3.5 text-brand-green" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          </span>
        </SettingRow>

        <div>
          <Label htmlFor="welcome_message">{t("settings.welcomeMessage")}</Label>
          <p className="text-xs text-muted-foreground">{t("settings.welcomeMessageHint")}</p>
          <Textarea
            className="mt-1.5"
            defaultValue={organization.welcome_message ?? ""}
            id="welcome_message"
            name="welcome_message"
            rows={2}
          />
        </div>

        <SettingRow
          description={organization.creation_date}
          icon={Clock}
          title={t("settings.createdAt")}
        />

        <SettingRow
          description={t("settings.pointsLabelHint")}
          icon={Star}
          title={t("settings.pointsLabel")}
        >
          <Select onValueChange={onPointsLabelChange} value={pointsLabel}>
            <SelectTrigger className="h-8 w-32" aria-label={t("settings.pointsLabel")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {POINT_LABELS.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(`pointLabels.${option}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow
          description={t("settings.emailNotificationsHint")}
          icon={Bell}
          title={t("settings.emailNotifications")}
        >
          <Switch
            aria-label={t("settings.emailNotifications")}
            checked={toggles.email_notifications}
            onCheckedChange={(value) => onToggle("email_notifications", value)}
          />
        </SettingRow>

        <SettingRow
          description={t("settings.showInExploreHint")}
          icon={Globe}
          title={t("settings.showInExplore")}
        >
          <Switch
            aria-label={t("settings.showInExplore")}
            checked={toggles.show_in_explore}
            onCheckedChange={(value) => onToggle("show_in_explore", value)}
          />
        </SettingRow>

        <SettingRow
          description={t("settings.timezoneHint")}
          icon={Clock}
          title={t("settings.timezone")}
        >
          <Select onValueChange={onTimezoneChange} value={timezone}>
            <SelectTrigger className="h-8 w-44" aria-label={t("settings.timezone")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((zone) => (
                <SelectItem key={zone} value={zone}>{zone}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>
      </div>
    </section>
  );
}
