import { useEffect, useState, type ChangeEvent, type ComponentProps, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import registroIcon from "@/assets/icons/registro.ico";
import bannerImg from "@/assets/images/cooperativa-team.png";
import { Input } from "@/components/tailgrids/core/input";
import { Label } from "@/components/tailgrids/core/label";
import { NativeSelect, NativeSelectOption } from "@/components/tailgrids/core/native-select";
import { useFavicon } from "@/hooks/useFavicon";
import { httpRequest } from "@/services/api";
import { getDistricts, getDocumentTypes, getProvinces, getRegions, type SelectOption } from "@/services/selects";

const fieldClass = "h-[45px] border-[#a7a7a7] focus:border-[#2b8aa8] focus:ring-[#2b8aa8]/25";
const actionClass = "rounded-md bg-[#2b8aa8] px-12 py-2.5 text-[14px] font-bold tracking-[0.15em] text-white transition-colors hover:bg-[#20708a] disabled:opacity-60";
const rucPrefixes = ["10", "15", "17", "20"];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const documentRules = [
  { prefix: "DNI", name: "DNI", length: 8 },
  { prefix: "CARNET DE EXTRANJER", name: "Carnet de Extranjería", length: 9 },
  { prefix: "PASAPORTE", name: "Pasaporte", length: 12 },
  { prefix: "PERMISO TEMPORAL DE PERMANENCIA", name: "PTP", length: 9 },
];
const otherRole = "Otros";
const institutionRoles = {
  options: [
    "PRESIDENTE DEL CONSEJO DE ADMINISTRACION",
    "SECRETARIO(A) DEL CONSEJO DE ADMINISTRACION",
    "GERENTE GENERAL",
    "PRESIDENTE DEL COMITÉ DE EDUCACIÓN",
    "SECRETARIO(A) DEL COMITÉ DE EDUCACIÓN",
    "PRESIDENTE DEL COMITÉ ELECTORAL",
    "SECRETARIO DEL COMITÉ ELECTORAL",
    "PRESIDENTE DEL CONSEJO DE VIGILANCIA",
    "SECRETARIO(A) DEL CONSEJO DE VIGILANCIA",
    "SOCIO(A)",
    "DIRECTOR/A",
    "JEFE/A",
    "ESPECIALISTA",
    "ANALISTA",
    "CONTADOR",
    "ASESOR",
    otherRole,
  ].map((label) => ({ label, value: label })),
};
const maxRoleLength = 255;

type CourseDetail = {
  tema?: string | null;
  fechas?: string[] | null;
  horario?: unknown;
  modalidad?: string | null;
  asesor?: string | null;
  formulario_disponible?: boolean;
  link?: string | null;
  direccion?: string | null;
};

type ApiResponse<T> = { status: number; message?: string; data?: T | null };

const initialValues = {
  tipo_documento_id: "", numero_dni: "", apellido_paterno: "", apellido_materno: "",
  nombres: "", region_id: "", provincia_id: "", distrito_id: "", direccion: "",
  ruc: "", coop_nombre_institucion: "", coop_rol_institucion: "", otro_cargo: "", celular: "", correo_electronico: "",
};
type Values = typeof initialValues;
type PersonLookup = Partial<Record<"apellido_paterno" | "apellido_materno" | "nombres" | "celular" | "correo_electronico", string | null>> & {
  discapacidad?: number | null;
};
type CompanyLookup = Partial<Record<"region_id" | "provincia_id" | "distrito_id", number | null>> & { direccion?: string | null };

function useOptions(loader: (parent: string) => Promise<SelectOption[]>, parent?: string) {
  const [result, setResult] = useState<{ parent?: string; options: SelectOption[]; failed?: boolean } | null>(null);
  useEffect(() => {
    if (parent === "") return;

    let active = true;
    loader(parent ?? "").then((options) => {
      if (active) setResult({ parent, options });
    }).catch(() => {
      if (active) setResult({ parent, options: [], failed: true });
    });

    return () => { active = false; };
  }, [loader, parent]);

  return result && result.parent === parent ? result : null;
}

function FieldLabel({ id, label }: { id: string; label: string }) {
  return <Label htmlFor={id}>{label} <span className="text-red-600" aria-hidden="true">*</span></Label>;
}

function FieldError({ id, error }: { id: string; error?: string }) {
  return error ? <p id={`${id}-error`} className="text-xs text-input-error">{error}</p> : null;
}

function TextField({ id, label, error, ...props }: ComponentProps<typeof Input> & { id: string; label: string; error?: string }) {
  return (
    <div className="grid gap-2">
      <FieldLabel id={id} label={label} />
      <Input type="text" {...props} id={id} name={id} required className={fieldClass}
        state={error ? "error" : "default"} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} />
      <FieldError id={id} error={error} />
    </div>
  );
}

function hasOption(catalog: ReturnType<typeof useOptions>, value: string) {
  return Boolean(value && catalog?.options.some((option) => String(option.value) === value));
}

function SelectField({ id, label, catalog, value, onChange, waitingFor, error }: {
  id: string; label: string; catalog: ReturnType<typeof useOptions>; value: string;
  onChange: (value: string) => void; waitingFor?: string; error?: string;
}) {
  const options = catalog?.options ?? [];
  const selected = hasOption(catalog, value) ? value : "";

  return (
    <div className="grid gap-2">
      <FieldLabel id={id} label={label} />
      <NativeSelect id={id} name={id} required disabled={Boolean(waitingFor)} value={selected}
        placeholder={waitingFor ?? (catalog ? `Seleccione: ${label}` : "Cargando...")}
        variant={error ? "error" : "default"} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)} className={fieldClass}>
        {options.map((option) => <NativeSelectOption key={option.value} value={option.value}>{option.label}</NativeSelectOption>)}
      </NativeSelect>
      <FieldError id={id} error={error} />
      {catalog?.failed && <p className="text-xs text-red-600" role="alert">No se pudieron cargar las opciones. Recarga la página para reintentar.</p>}
    </div>
  );
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" });
}

function scheduleText(schedule: unknown) {
  return Array.isArray(schedule) ? schedule.filter(Boolean).join(" - ") : typeof schedule === "string" ? schedule.trim() : "";
}

function calendarUrl(course: CourseDetail | null, date: string) {
  const params = new URLSearchParams({ action: "TEMPLATE", text: course?.tema || "Capacitación", ctz: "America/Lima" });
  const location = course?.link || course?.direccion;
  if (location) params.set("location", location);
  if (course?.asesor) params.set("details", `Capacitador: ${course.asesor}`);
  if (date) {
    const times = [...scheduleText(course?.horario).matchAll(/(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/gi)]
      .map(([, hours, minutes = "0", meridiem]) => {
        const hour = Number(hours);
        const minute = Number(minutes);
        const period = meridiem?.toLowerCase().replace(/\./g, "");
        return { hour: period === "pm" && hour < 12 ? hour + 12 : period === "am" && hour === 12 ? 0 : hour, minute };
      }).filter(({ hour, minute }) => hour <= 23 && minute <= 59);
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(start);
    const pad = (value: number) => String(value).padStart(2, "0");
    const day = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    const dateTime = (d: Date) => `${day(d)}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    if (times[0]) {
      start.setHours(times[0].hour, times[0].minute);
      end.setHours(times[1]?.hour ?? times[0].hour + 1, times[1]?.minute ?? times[0].minute);
      if (end <= start) end.setDate(end.getDate() + 1);
      params.set("dates", `${dateTime(start)}/${dateTime(end)}`);
    } else {
      end.setDate(end.getDate() + 1);
      params.set("dates", `${day(start)}/${day(end)}`);
    }
  }
  return `https://calendar.google.com/calendar/render?${params}`;
}

function RegistrationForm({ slug, course, selectedDate }: { slug: string; course: CourseDetail | null; selectedDate: string }) {
  const [values, setValues] = useState(initialValues);
  const [person, setPerson] = useState<{ document: string; type: string; data: PersonLookup } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<keyof Values, boolean>>>({});
  const [confirmation, setConfirmation] = useState<{ date: string } | null>(null);
  const documents = useOptions(getDocumentTypes);
  const regions = useOptions(getRegions);
  const provinces = useOptions(getProvinces, values.region_id);
  const districts = useOptions(getDistricts, values.provincia_id);
  const isOtherRole = values.coop_rol_institucion === otherRole;
  const customRole = values.otro_cargo.trim();

  const documentLabel = documents?.options.find((option) => String(option.value) === values.tipo_documento_id)?.label.toUpperCase().trim() ?? "";
  const documentRule = documentRules.find(({ prefix }) => documentLabel.startsWith(prefix));
  const documentLength = documentRule?.length;
  const update = (patch: Partial<Values>) => setValues((current) => ({ ...current, ...patch }));
  const { tipo_documento_id: type, numero_dni: document, ruc } = values;
  const phone = values.celular;
  const email = values.correo_electronico.trim();
  const badRucPrefix = !rucPrefixes.some((prefix) => prefix.startsWith(ruc.slice(0, 2)));
  const badPhonePrefix = Boolean(phone && !phone.startsWith("9"));
  const errors: Record<keyof Values, string | undefined> = {
    tipo_documento_id: hasOption(documents, type) ? undefined : "El tipo de documento es obligatorio.",
    numero_dni: !document ? "El número de documento es obligatorio." : documentRule && document.length !== documentRule.length
      ? `El ${documentRule.name} debe tener exactamente ${documentRule.length} dígitos numéricos.` : undefined,
    apellido_paterno: values.apellido_paterno.trim() ? undefined : "El apellido paterno es obligatorio.",
    apellido_materno: values.apellido_materno.trim() ? undefined : "El apellido materno es obligatorio.",
    nombres: values.nombres.trim() ? undefined : "Los nombres son obligatorios.",
    region_id: hasOption(regions, values.region_id) ? undefined : "La región es obligatoria.",
    provincia_id: hasOption(provinces, values.provincia_id) ? undefined : "La provincia es obligatoria.",
    distrito_id: hasOption(districts, values.distrito_id) ? undefined : "El distrito es obligatorio.",
    direccion: values.direccion.trim() ? undefined : "La dirección es obligatoria.",
    ruc: badRucPrefix ? "El RUC debe iniciar con 10, 15, 17 o 20."
      : ruc.length !== 11 ? "El RUC debe tener exactamente 11 dígitos numéricos." : undefined,
    coop_nombre_institucion: values.coop_nombre_institucion.trim() ? undefined : "El nombre de la cooperativa/institución es obligatorio.",
    coop_rol_institucion: hasOption(institutionRoles, values.coop_rol_institucion) ? undefined : "El cargo es obligatorio.",
    otro_cargo: !isOtherRole ? undefined : !customRole ? "Especifique el cargo."
      : customRole.length > maxRoleLength ? `El cargo no puede superar los ${maxRoleLength} caracteres.` : undefined,
    celular: badPhonePrefix ? "El número de celular debe empezar con 9."
      : !phone ? "El número de celular es obligatorio." : phone.length !== 9 ? "El número de celular debe tener exactamente 9 dígitos numéricos." : undefined,
    correo_electronico: !email ? "El correo electrónico es obligatorio."
      : !emailPattern.test(email) ? "Ingrese un correo electrónico válido." : undefined,
  };
  const visibleError = (key: keyof Values) => attemptedSubmit || touched[key]
    || (key === "ruc" && badRucPrefix) || (key === "celular" && badPhonePrefix) ? errors[key] : undefined;
  const touch = (key: keyof Values) => setTouched((current) => ({ ...current, [key]: true }));
  const textValue = (key: keyof Values, digits?: number) => ({
    value: values[key],
    error: visibleError(key),
    onChange: (event: ChangeEvent<HTMLInputElement>) => update({
      [key]: digits ? event.target.value.replace(/\D/g, "").slice(0, digits) : event.target.value,
    }),
  });

  useEffect(() => {
    if (!type || !documentLength || document.length !== documentLength) return;

    let active = true;
    httpRequest<ApiResponse<PersonLookup>>({ method: "GET", url: `event-pnte-public/empresario/${document}` })
      .then(({ data }) => {
        if (!active || !data) return;
        setPerson({ document, type, data });
        setValues((current) => current.numero_dni === document && current.tipo_documento_id === type ? {
          ...current,
          apellido_paterno: current.apellido_paterno || data.apellido_paterno?.trim() || "",
          apellido_materno: current.apellido_materno || data.apellido_materno?.trim() || "",
          nombres: current.nombres || data.nombres?.trim() || "",
          celular: current.celular || data.celular?.replace(/\D/g, "").slice(0, 9) || "",
          correo_electronico: current.correo_electronico || data.correo_electronico?.trim() || "",
        } : current);
      }).catch(() => { /* Los datos se pueden completar manualmente. */ });

    return () => { active = false; };
  }, [documentLength, type, document]);

  useEffect(() => {
    if (!/^(10|15|17|20)\d{9}$/.test(ruc)) return;

    let active = true;
    httpRequest<ApiResponse<CompanyLookup>>({ method: "GET", url: `event-pnte-public/empresa/${ruc}` })
      .then(({ data }) => {
        if (!active || !data) return;
        setValues((current) => {
          if (current.ruc !== ruc) return current;
          const useLocation = !current.region_id && Boolean(data.region_id);
          return {
            ...current,
            region_id: useLocation ? String(data.region_id) : current.region_id,
            provincia_id: useLocation ? String(data.provincia_id ?? "") : current.provincia_id,
            distrito_id: useLocation && data.provincia_id ? String(data.distrito_id ?? "") : current.distrito_id,
            direccion: current.direccion || data.direccion?.trim() || "",
          };
        });
      }).catch(() => { /* Los datos se pueden completar manualmente. */ });

    return () => { active = false; };
  }, [ruc]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || confirmation) return;
    setError("");
    setAttemptedSubmit(true);
    if (Object.values(errors).some(Boolean)) return;
    setSubmitting(true);
    try {
      const data = new FormData(event.currentTarget);
      const text = (field: keyof Values) => String(data.get(field) ?? "").trim();
      const knownDisability = person?.document === values.numero_dni && person.type === values.tipo_documento_id ? person.data.discapacidad : null;
      await httpRequest({
        method: "POST",
        url: "event-pnte-public/registro-empresario-compras-myperu",
        data: {
          slug, fecha_seleccionada: selectedDate || null,
          tipo_documento_id: Number(text("tipo_documento_id")), numero_dni: text("numero_dni"),
          apellido_paterno: text("apellido_paterno"), apellido_materno: text("apellido_materno"), nombres: text("nombres"),
          region_id: Number(text("region_id")), provincia_id: Number(text("provincia_id")), distrito_id: Number(text("distrito_id")), direccion: text("direccion"),
          ruc: text("ruc"), coop_nombre_institucion: text("coop_nombre_institucion"),
          coop_rol_institucion: isOtherRole ? customRole : text("coop_rol_institucion"),
          celular: text("celular"), correo_electronico: text("correo_electronico"),
          // El endpoint compartido exige 0 o 1 aunque este formulario no solicite el dato.
          discapacidad: Number(knownDisability) === 1 ? 1 : 0,
        },
      });
      setConfirmation({ date: selectedDate });
    } catch (error: unknown) {
      const message = axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message : undefined;
      setError(message ?? "No se pudo completar el registro. Intenta nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmation) {
    return (
      <div className="space-y-4 text-center" role="status">
        <h2 className="text-xl font-bold text-[#124e78]">¡Gracias por registrarte!</h2>
        <p>Tu registro se completó correctamente{confirmation.date ? ` para el ${formatDate(confirmation.date)}` : ""}.</p>
        <a href={calendarUrl(course, confirmation.date || course?.fechas?.[0] || "")} target="_blank" rel="noopener noreferrer" className="inline-block font-semibold text-[#2b8aa8] underline">Agendar en Google Calendar</a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="[&_label]:text-[14px] [&_label]:font-normal">
      <fieldset disabled={submitting} className="grid min-w-0 grid-cols-1 items-start gap-6 md:grid-cols-2">
        <SelectField id="tipo_documento_id" label="Tipo de documento" catalog={documents} value={values.tipo_documento_id} error={visibleError("tipo_documento_id")} onChange={(value) => { setPerson(null); setTouched((current) => ({ ...current, numero_dni: false })); update({ tipo_documento_id: value, numero_dni: "" }); }} />
        <TextField id="numero_dni" label="Número de Documento" inputMode="numeric" autoComplete="off" value={values.numero_dni}
          maxLength={documentLength ?? 12} error={visibleError("numero_dni")} onBlur={() => touch("numero_dni")}
          onChange={(event) => { setPerson(null); update({ numero_dni: event.target.value.replace(/\D/g, "").slice(0, documentLength ?? 12) }); }} />
        <TextField id="apellido_paterno" label="Apellido Paterno" {...textValue("apellido_paterno")} />
        <TextField id="apellido_materno" label="Apellido Materno" {...textValue("apellido_materno")} />
        <TextField id="nombres" label="Nombres" autoComplete="given-name" {...textValue("nombres")} />
        <SelectField id="region_id" label="Región" catalog={regions} value={values.region_id} error={visibleError("region_id")} onChange={(value) => update({ region_id: value, provincia_id: "", distrito_id: "" })} />
        <SelectField id="provincia_id" label="Provincia" catalog={provinces} value={values.provincia_id} error={values.region_id ? visibleError("provincia_id") : undefined} waitingFor={values.region_id ? undefined : "Selecciona primero la región"} onChange={(value) => update({ provincia_id: value, distrito_id: "" })} />
        <SelectField id="distrito_id" label="Distrito" catalog={districts} value={values.distrito_id} error={values.provincia_id ? visibleError("distrito_id") : undefined} waitingFor={values.provincia_id ? undefined : "Selecciona primero la provincia"} onChange={(value) => update({ distrito_id: value })} />
        <TextField id="direccion" label="Dirección" autoComplete="street-address" {...textValue("direccion")} />
        <TextField id="ruc" label="Número de RUC" inputMode="numeric" maxLength={11} onBlur={() => touch("ruc")} {...textValue("ruc", 11)} />
        <TextField id="coop_nombre_institucion" label="Nombre de la Cooperativa/Institución" autoComplete="organization" {...textValue("coop_nombre_institucion")} />
        <SelectField id="coop_rol_institucion" label="CARGO" catalog={institutionRoles} value={values.coop_rol_institucion}
          error={visibleError("coop_rol_institucion")} onChange={(value) => update({ coop_rol_institucion: value, otro_cargo: "" })} />
        {isOtherRole && (
          <TextField id="otro_cargo" label="Especifique el cargo" maxLength={maxRoleLength} {...textValue("otro_cargo")} />
        )}
        <TextField id="celular" label="Número de celular" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={9} onBlur={() => touch("celular")} {...textValue("celular", 9)} />
        <TextField id="correo_electronico" label="Correo electrónico" type="email" autoComplete="email" onBlur={() => touch("correo_electronico")} {...textValue("correo_electronico")} />
      </fieldset>
      {error && <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
      <div className="mt-8 flex justify-end">
        <button className={actionClass} type="submit" disabled={submitting}>{submitting ? "REGISTRANDO..." : "REGISTRAR"}</button>
      </div>
    </form>
  );
}

function BannerDetail({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2">
      <svg className="mt-0.5 shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2b8aa8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icon}</svg>
      <span className="min-w-0 break-words text-[#3e647d]"><span className="font-semibold text-[#124e78]">{label}: </span>{value}</span>
    </p>
  );
}

function CourseRegistration({ slug, course }: { slug: string; course: CourseDetail | null }) {
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Lima" }).format(new Date());
  const dates = (course?.fechas ?? []).filter((date) => date >= today);
  const [selectedDate, setSelectedDate] = useState(dates[0] ?? "");
  const [showDates, setShowDates] = useState(dates.length > 1);
  const date = selectedDate || course?.fechas?.[0];
  const modality = course?.modalidad?.trim().toLowerCase() ?? "";

  return (
    <section className="relative mx-auto min-h-screen w-full max-w-[1000px] overflow-hidden rounded-md border border-[#e0e0e0] bg-white shadow-[0_12px_24px_rgba(0,0,0,0.08)]">
      <header className="grid bg-[#f7fdff] md:grid-cols-[1fr_380px]">
        <div className="relative px-8 py-8 md:px-14 md:py-12">
          <p className="mb-2 leading-[1.15]"><span className="inline-flex w-fit items-center rounded-full bg-[#e6f4f9] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#124e78]">Registro</span></p>
          <h1 className="max-w-3xl text-[24px] font-extrabold leading-[1.15] text-[#2b8aa8] md:text-[30px]">{course?.tema ?? "Registro de instituciones"}</h1>
          <div className="mt-4 space-y-1.5 text-[14.5px] leading-relaxed">
            <BannerDetail label="Fecha" value={date ? formatDate(date) : "Por confirmar"} icon={<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>} />
            <BannerDetail label="Hora" value={scheduleText(course?.horario) || "Por confirmar"} icon={<><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>} />
            <BannerDetail label="Modalidad" value={modality ? modality.charAt(0).toUpperCase() + modality.slice(1) : "Por confirmar"} icon={<><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" /></>} />
            {course?.direccion && modality !== "virtual" && <BannerDetail label="Dirección" value={course.direccion} icon={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z" /><circle cx="12" cy="10" r="3" /></>} />}
            <BannerDetail label="Capacitador" value={course?.asesor || "Por confirmar"} icon={<><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></>} />
          </div>
          {dates.length > 1 && <button type="button" className="mt-3 text-sm font-semibold text-[#124e78] underline" onClick={() => setShowDates(true)}>Cambiar fecha</button>}
        </div>
        <div className="relative hidden items-center justify-center overflow-hidden md:flex">
          <img src={bannerImg} alt="Cooperativa MYPE" className="block h-[270px] w-auto max-w-full object-contain object-center" />
        </div>
      </header>
      <div className="h-[8px] w-full bg-[#2b8aa8]" />
      <div className="px-8 py-6 md:px-14 md:py-10">
        <RegistrationForm slug={slug} course={course} selectedDate={selectedDate} />
      </div>
      {showDates && dates.length > 1 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="fecha-registro-title">
          <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="fecha-registro-title" className="mb-4 text-lg font-bold text-[#124e78]">Selecciona la fecha de asistencia</h2>
            <div className="grid gap-3">
              {dates.map((option) => (
                <button key={option} type="button" onClick={() => { setSelectedDate(option); setShowDates(false); }}
                  className="rounded-lg border border-[#c9d4dc] px-4 py-3 text-left text-[#124e78] hover:bg-[#e6f4f9]">
                  {formatDate(option)}
                </button>
              ))}
              <button type="button" className="mt-2 justify-self-end text-sm font-semibold text-[#124e78] underline" onClick={() => setShowDates(false)}>Cerrar</button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

export default function RegistroSoloInstituciones() {
  useFavicon(registroIcon);
  const [searchParams] = useSearchParams();
  const slug = searchParams.get("slug")?.trim();
  const [loaded, setLoaded] = useState<{ slug: string; course: CourseDetail | null; error?: string } | null>(null);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Registro de instituciones";
    return () => { document.title = previousTitle; };
  }, []);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    const unavailable = "El formulario de inscripción ya no está disponible.";

    httpRequest<ApiResponse<CourseDetail>>({ method: "GET", url: `event-pnte-public/curso-detalle-general/${encodeURIComponent(slug)}` })
      .then(({ status, data, message }) => {
        if (!active) return;
        setLoaded({ slug, course: data ?? null, error: status === 410 || data?.formulario_disponible === false ? message ?? unavailable : undefined });
      }).catch((error: unknown) => {
        if (!active) return;
        const response = axios.isAxiosError<ApiResponse<CourseDetail>>(error) ? error.response : undefined;
        setLoaded({ slug, course: response?.data?.data ?? null, error: response?.data?.message ?? (response?.status === 410 ? unavailable : "No se pudo cargar la capacitación.") });
      });

    return () => { active = false; };
  }, [slug]);

  const current = loaded && loaded.slug === slug ? loaded : null;
  const error = !slug ? "No se pudo identificar la capacitación. Verifica el enlace de registro." : current?.error;
  return (
    <main className="min-h-screen bg-white px-4 py-6 font-sans md:px-8">
      {error ? (
        <section className="mx-auto max-w-xl rounded-xl border border-[#d8e5ec] bg-white p-8 text-center text-[#124e78]" role="alert">
          <h1 className="text-xl font-bold">Formulario de inscripción no disponible</h1>
          {current?.course?.tema && <p className="mt-2 font-semibold">{current.course.tema}</p>}
          <p className="mt-2">{error}</p>
        </section>
      ) : slug && current ? <CourseRegistration key={slug} slug={slug} course={current.course} /> : (
        <p role="status" className="py-20 text-center font-semibold text-[#124e78]">Cargando capacitación...</p>
      )}
    </main>
  );
}
