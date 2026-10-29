import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import ugsecoIcon from "@/assets/icons/ugseco.ico";
import cooperativaMype from "@/assets/images/cooperativa-mype.png";
import { Button } from "@/components/tailgrids/core/button";
import { Input, type InputProps } from "@/components/tailgrids/core/input";
import { Label } from "@/components/tailgrids/core/label";
import {
  NativeSelect,
  NativeSelectOption,
  type NativeSelectProps,
} from "@/components/tailgrids/core/native-select";
import { useFavicon } from "@/hooks/useFavicon";
import { httpRequest } from "@/services/api";
import { getDocumentTypes, type SelectOption } from "@/services/selects";

const brandFieldCls =
  "h-[45px] border-[#a7a7a7] focus:border-[#2b8aa8] focus:ring-[#2b8aa8]/25";

function BrandInput(props: InputProps) {
  const { className, ...rest } = props;
  return <Input {...rest} className={`${brandFieldCls} ${className ?? ""}`} />;
}

function BrandSelect(props: NativeSelectProps) {
  const { children, className, ...rest } = props;
  return (
    <NativeSelect {...rest} className={`${brandFieldCls} ${className ?? ""}`}>
      {children}
    </NativeSelect>
  );
}

type EventState = "proximo" | "disponible" | "finalizado" | "sin_fechas";

type CourseDetail = {
  slug: string;
  tema: string | null;
  fechas: string[] | null;
  horario: unknown;
  modalidad: string | null;
  asesor: string | null;
  link?: string | null;
  direccion?: string | null;
  estado?: EventState;
  fecha_hoy?: string | null;
  proxima_fecha?: string | null;
  asistencias_habilitadas?: boolean;
};

type EventInfoResponse = {
  status: number;
  message?: string;
  data?: CourseDetail;
};

type Enrollment = {
  slug: string;
  tema: string | null;
  fechas: string[] | null;
  horario: unknown;
  modalidad: string | null;
  link: string | null;
  participante?: {
    nombres?: string | null;
    apellido_paterno?: string | null;
    apellido_materno?: string | null;
  } | null;
  asistencia?: {
    marcada?: boolean;
    habilitada?: boolean;
    fecha?: string | null;
    fecha_hora?: string | null;
  } | null;
};

type EnrollmentResponse = {
  status: number;
  message?: string;
  data?: Enrollment;
};

type AsistenciaForm = {
  documentType: string;
  documentNumber: string;
  ruc: string;
};

const emptyAsistenciaForm: AsistenciaForm = {
  documentType: "",
  documentNumber: "",
  ruc: "",
};

const DOCUMENT_RULES = [
  { match: "DNI", length: 8, name: "DNI" },
  { match: "CARNET DE EXTRANJER", length: 9, name: "Carnet de Extranjería" },
  { match: "PASAPORTE", length: 12, name: "Pasaporte" },
  {
    match: "PERMISO TEMPORAL DE PERMANENCIA",
    length: 9,
    name: "PTP",
  },
] as const;

function normalizeOptionLabel(label: string) {
  return label.trim().toUpperCase();
}

function getDocumentRule(documentTypes: SelectOption[], value: string) {
  return DOCUMENT_RULES.find((rule) =>
    documentTypes.some(
      (option) =>
        String(option.value) === value &&
        normalizeOptionLabel(option.label).startsWith(rule.match)
    )
  );
}

const RUC_PREFIXES = ["10", "15", "17", "20"];

function isValidRucPrefix(value: string) {
  if (value.length === 0) return true;
  const prefix = value.slice(0, 2);
  return RUC_PREFIXES.some((prefixValue) => prefixValue.startsWith(prefix));
}

function getApiError(error: unknown, fallback: string) {
  if (
    axios.isAxiosError<{
      message?: string;
      errors?: Record<string, string[]>;
    }>(error)
  ) {
    const data = error.response?.data;
    const firstValidationError = data?.errors
      ? Object.values(data.errors).flat()[0]
      : undefined;

    return firstValidationError ?? data?.message ?? fallback;
  }

  return fallback;
}

function formatFechaLarga(fecha?: string | null) {
  if (!fecha) return "Por confirmar";

  const date = new Date(`${fecha}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "Por confirmar";

  return date.toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatHora(horario: unknown) {
  if (Array.isArray(horario)) {
    const rangos = horario.flatMap((item) => {
      if (typeof item === "string" && item.trim() !== "") {
        return [item.trim()];
      }

      if (item && typeof item === "object") {
        const sesion = item as { horaInicio?: unknown; horaFin?: unknown };
        const inicio =
          typeof sesion.horaInicio === "string" ? sesion.horaInicio.trim() : "";
        const fin =
          typeof sesion.horaFin === "string" ? sesion.horaFin.trim() : "";

        if (inicio && fin) return [`${inicio} - ${fin}`];
        if (inicio) return [inicio];
      }

      return [];
    });

    return [...new Set(rangos)].join(" / ") || "Por confirmar";
  }

  if (typeof horario === "string" && horario.trim() !== "") {
    return horario;
  }

  return "Por confirmar";
}

function formatModalidad(modalidad: string | null | undefined) {
  const value = modalidad?.trim().toUpperCase();

  if (!value) return "Por confirmar";

  return value.charAt(0) + value.slice(1).toLowerCase();
}

function ScheduleList({
  fechas,
  horario,
}: {
  fechas: string[];
  horario: unknown;
}) {
  const hora = formatHora(horario);
  const items: (string | null)[] = fechas.length ? fechas : [null];

  return (
    <div className="mt-5">
      <p className="text-[13px] font-bold uppercase tracking-wide text-[#124e78]">
        Horarios
      </p>
      <ul className="mt-2 space-y-2">
        {items.map((fecha, index) => (
          <li
            key={`${fecha ?? "sin-fecha"}-${index}`}
            className="flex items-center gap-2 text-[14px] text-[#3e647d]"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2b8aa8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span className="font-semibold text-[#124e78]">
              {formatFechaLarga(fecha)}
            </span>
            <span>{hora}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RucField({
  id,
  label,
  placeholder,
  value,
  onChange,
  showErrors,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  showErrors: boolean;
}) {
  const [touched, setTouched] = useState(false);

  const prefixValid = isValidRucPrefix(value);
  const complete = value.length === 11;
  const error = !prefixValid
    ? "El RUC debe iniciar con 10, 15, 17 o 20."
    : (touched || showErrors) && !complete
      ? "El RUC debe tener exactamente 11 dígitos numéricos."
      : null;
  const errorId = `${id}-error`;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <BrandInput
        id={id}
        placeholder={placeholder}
        inputMode="numeric"
        autoComplete="off"
        maxLength={11}
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(event.target.value.replace(/\D/g, "").slice(0, 11))
        }
        onBlur={() => setTouched(true)}
        state={error ? "error" : "default"}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <p id={errorId} className="text-xs text-input-error">
          {error}
        </p>
      )}
    </div>
  );
}

function HeroBanner({ course }: { course: CourseDetail | null }) {
  const fecha = course?.proxima_fecha ?? course?.fechas?.[0] ?? null;
  const esVirtual =
    (course?.modalidad ?? "").trim().toUpperCase() === "VIRTUAL";

  return (
    <div className="grid bg-[#f7fdff] md:grid-cols-[1fr_380px]">
      <div className="relative px-8 py-8 md:px-14 md:py-12">
        <h1 className="mb-2 max-w-3xl text-[16px] leading-[1.15] md:text-[16px]">
          <span className="text-[#124e78]">
            Capacitaciones a las cooperativas
          </span>
        </h1>

        <h2 className="max-w-3xl text-[24px] font-extrabold leading-[1.15] md:text-[30px]">
          <span className="text-[#2b8aa8]">
            {course?.tema ?? "En el crecimiento de tu empresa"}
          </span>
        </h2>

        <div className="mt-4 space-y-1.5 text-[14.5px] leading-relaxed">
          <p className="flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2b8aa8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <span className="font-semibold text-[#124e78]">Fecha: </span>
            <span className="text-[#3e647d]">{formatFechaLarga(fecha)}</span>
          </p>
          <p className="flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2b8aa8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span className="font-semibold text-[#124e78]">Hora: </span>
            <span className="text-[#3e647d]">{formatHora(course?.horario)}</span>
          </p>
          <p className="flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2b8aa8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 7l-7 5 7 5V7z" />
              <rect x="1" y="5" width="15" height="14" rx="2" />
            </svg>
            <span className="font-semibold text-[#124e78]">Modalidad: </span>
            <span className="text-[#3e647d]">
              {formatModalidad(course?.modalidad)}
            </span>
          </p>
          {!esVirtual && course?.direccion && (
            <p className="flex items-start gap-2">
              <svg className="mt-0.5 shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2b8aa8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="min-w-0 break-words text-[#3e647d]">
                <span className="font-semibold text-[#124e78]">
                  Dirección:{" "}
                </span>
                {course.direccion}
              </span>
            </p>
          )}
          <p className="flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2b8aa8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span className="font-semibold text-[#124e78]">Capacitador: </span>
            <span className="text-[#3e647d]">
              {course?.asesor ?? "Por confirmar"}
            </span>
          </p>
        </div>
      </div>

      <div className="relative m-0 hidden h-auto items-center justify-center overflow-hidden bg-[#f7fdff] p-0 md:flex">
        <img
          src={cooperativaMype}
          alt="Cooperativa MYPE"
          className="m-0 block h-[210px] w-auto max-w-full object-contain object-center p-0 md:h-[280px]"
        />
      </div>
    </div>
  );
}

function PageLoading() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#f7fdff] px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="h-12 w-12 animate-spin rounded-full border-4 border-[#2b8aa8]/25 border-t-[#2b8aa8]" />
        <p className="text-[15px] font-semibold text-[#124e78]">
          Cargando capacitación...
        </p>
        <p className="text-[13px] text-[#3e647d]">
          Un momento, estamos preparando la información.
        </p>
      </div>
    </div>
  );
}

function WelcomePanel({
  enrollment,
  course,
}: {
  enrollment: Enrollment;
  course: CourseDetail | null;
}) {
  const fechas = enrollment.fechas ?? course?.fechas ?? [];
  const link = enrollment.link || course?.link || null;
  const participante = enrollment.participante;
  const nombre = [
    participante?.nombres,
    participante?.apellido_paterno,
    participante?.apellido_materno,
  ]
    .filter(Boolean)
    .join(" ");
  const tema = enrollment.tema ?? course?.tema ?? "la capacitación";
  const primeraFecha = fechas[0] ?? null;
  const fechaAsistencia = enrollment.asistencia?.fecha ?? null;

  return (
    <div className="rounded-xl border border-[#cfe0ec] p-6 md:p-8">
      <span className="inline-flex rounded-full bg-[#e9f1f7] px-3 py-1 text-[12px] font-semibold uppercase tracking-wide text-[#2b8aa8]">
        Inscripción confirmada
      </span>

      <h3 className="mt-4 text-[22px] font-bold leading-tight text-[#124e78] md:text-[26px]">
        ¡Bienvenido(a) a la capacitación{nombre ? `, ${nombre}` : ""}!
      </h3>

      <p className="mt-3 text-[14px] leading-relaxed text-[#3e647d]">
        Estás inscrito en <strong className="text-[#124e78]">{tema}</strong>.{" "}
        {fechaAsistencia &&
          primeraFecha &&
          fechaAsistencia !== primeraFecha ? (
          <>
            Hoy es la sesión del{" "}
            <strong className="text-[#124e78]">
              {formatFechaLarga(fechaAsistencia)}
            </strong>
            .
          </>
        ) : (
          <>
            La capacitación empieza el{" "}
            <strong className="text-[#124e78]">
              {formatFechaLarga(primeraFecha)}
            </strong>
            .
          </>
        )}
      </p>

      <ScheduleList
        fechas={fechas}
        horario={enrollment.horario ?? course?.horario}
      />

      {enrollment.asistencia?.marcada && (
        <p className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#e9f7ef] px-4 py-3 text-sm font-semibold text-[#1e7a46]">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
          Asistencia registrada para el{" "}
          {formatFechaLarga(enrollment.asistencia.fecha)}.
        </p>
      )}

      {enrollment.asistencia && !enrollment.asistencia.habilitada && (
        <p className="mt-5 rounded-lg border border-[#f0c27b]/40 bg-[#fff8ec] px-4 py-3 text-sm text-[#8a5a00]">
          La marcación de asistencia está deshabilitada para este evento.
        </p>
      )}

      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 block w-fit items-center justify-center rounded-md bg-[#2b8aa8] px-10 py-3 text-[14px] font-bold tracking-[0.12em] text-white transition-colors hover:bg-[#20708a]"
        >
          Únete
        </a>
      ) : (
        <p className="mt-6 rounded-lg border border-[#f0c27b]/40 bg-[#fff8ec] px-4 py-3 text-sm text-[#8a5a00]">
          El enlace de la sala se habilitará pronto.
        </p>
      )}
    </div>
  );
}

function UnavailablePanel({
  course,
  slug,
}: {
  course: CourseDetail;
  slug: string | null;
}) {
  const fechas = course.fechas ?? [];
  const primeraFecha = fechas[0] ?? null;
  const proximaFecha = course.proxima_fecha ?? null;
  const estado = course.estado ?? "sin_fechas";
  const inicioPendiente = Boolean(
    course.fecha_hoy && primeraFecha && course.fecha_hoy < primeraFecha
  );

  let titulo = "La asistencia no está disponible";
  let detalle = "El formulario de asistencia solo está disponible en las fechas programadas del evento.";
  let mensajeEnlace = "Si aún no estás inscrito, puedes registrarte aquí:";

  if (estado === "proximo") {
    titulo = inicioPendiente
      ? `Este evento empieza el ${formatFechaLarga(primeraFecha)}`
      : `La asistencia se habilita el ${formatFechaLarga(proximaFecha)}`;
    detalle = inicioPendiente
      ? "El formulario de asistencia se habilitará ese día."
      : "El formulario solo está disponible en las fechas programadas del evento.";
  } else if (estado === "finalizado") {
    titulo = "Este evento ya finalizó";
    detalle = "El formulario de asistencia ya no está disponible.";
    mensajeEnlace = "Puedes revisar las próximas capacitaciones aquí:";
  } else if (estado === "sin_fechas") {
    titulo = "Este evento aún no tiene fechas programadas";
    detalle = "Vuelve a consultar más adelante para conocer las fechas de la capacitación.";
    mensajeEnlace = "Mientras tanto, puedes revisar las capacitaciones disponibles:";
  }

  const registrationUrl = slug
    ? `/ugseco/inscripciones?slug=${encodeURIComponent(slug)}`
    : "/ugseco/inscripciones";
  const actionUrl = estado === "finalizado" ? "/ugseco/capacitaciones" : registrationUrl;
  const actionLabel =
    estado === "finalizado"
      ? "Ver otras capacitaciones"
      : "Ir al formulario de inscripción";

  return (
    <div className="rounded-xl border border-[#f0c27b]/40 bg-[#fff8ec] p-6 md:p-8">
      <span className="inline-flex rounded-full bg-[#f7ecd2] px-3 py-1 text-[12px] font-semibold uppercase tracking-wide text-[#8a5a00]">
        Asistencia no disponible
      </span>

      <h3 className="mt-4 text-[22px] font-bold leading-tight text-[#124e78] md:text-[26px]">
        {titulo}
      </h3>

      <p className="mt-3 text-[14px] leading-relaxed text-[#3e647d]">
        {detalle}
      </p>

      {fechas.length > 0 && (
        <ScheduleList fechas={fechas} horario={course.horario} />
      )}

      <p className="mt-6 text-[13px] text-[#3e647d]">{mensajeEnlace}</p>

      <Link
        to={actionUrl}
        className="mt-3 inline-flex items-center justify-center rounded-md bg-[#2b8aa8] px-8 py-3 text-[14px] font-bold tracking-[0.12em] text-white transition-colors hover:bg-[#20708a]"
      >
        {actionLabel}
      </Link>
    </div>
  );
}

function LoadErrorPanel({ hasSlug }: { hasSlug: boolean }) {
  return (
    <div className="rounded-xl border border-input-error/30 bg-input-error/5 p-6 text-sm text-input-error">
      {hasSlug
        ? "No se pudo cargar la información de la capacitación. Vuelva a seleccionarla desde el listado."
        : "No se indicó la capacitación. Vuelva a seleccionarla desde el listado."}
      <div className="mt-4">
        <Link
          to="/ugseco/capacitaciones"
          className="inline-flex items-center justify-center rounded-md bg-[#2b8aa8] px-6 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-[#20708a]"
        >
          Ver capacitaciones
        </Link>
      </div>
    </div>
  );
}

export default function Asistencia() {
  useFavicon(ugsecoIcon);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "asistencia | UGSECO";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const slug = searchParams.get("slug");
  const [loadedCourse, setLoadedCourse] = useState<{
    slug: string;
    course: CourseDetail | null;
  } | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [infoRefreshKey, setInfoRefreshKey] = useState(0);

  useEffect(() => {
    if (!slug) return;

    let active = true;

    httpRequest<EventInfoResponse>({
      method: "GET",
      url: `event-pnte-public/asistencia-info/${encodeURIComponent(slug)}`,
    })
      .then((response) => {
        if (!active) return;

        setLoadedCourse({ slug, course: response.data ?? null });
      })
      .catch(() => {
        if (active) setLoadedCourse({ slug, course: null });
      });

    return () => {
      active = false;
    };
  }, [slug, infoRefreshKey]);

  useEffect(() => {
    if (!redirecting || !slug) return;

    const timer = window.setTimeout(() => {
      navigate(`/ugseco/inscripciones?slug=${encodeURIComponent(slug)}`);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [redirecting, navigate, slug]);

  const [documentTypes, setDocumentTypes] = useState<SelectOption[]>([]);

  useEffect(() => {
    let active = true;

    getDocumentTypes()
      .then((options) => {
        if (active) setDocumentTypes(options);
      })
      .catch(() => {
        if (active) setDocumentTypes([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const [form, setForm] = useState<AsistenciaForm>(emptyAsistenciaForm);
  const [showErrors, setShowErrors] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isLoadingCourse = Boolean(slug) && loadedCourse?.slug !== slug;
  const course = loadedCourse?.slug === slug ? loadedCourse.course : null;

  const documentRule = getDocumentRule(documentTypes, form.documentType);

  const update = (patch: Partial<AsistenciaForm>) => {
    setForm((current) => ({ ...current, ...patch }));
    setAccessError(null);
    setRedirecting(false);
  };

  const handleDocumentTypeChange = (value: string) => {
    const nextRule = getDocumentRule(documentTypes, value);

    setForm((current) => ({
      ...current,
      documentType: value,
      documentNumber: nextRule
        ? current.documentNumber.slice(0, nextRule.length)
        : current.documentNumber,
    }));
    setAccessError(null);
    setRedirecting(false);
  };

  const documentTypeError =
    showErrors && form.documentType === ""
      ? "Selecciona el tipo de documento."
      : null;

  const documentNumberError =
    showErrors && form.documentNumber.trim() === ""
      ? "Ingresa el número de documento."
      : showErrors &&
        documentRule &&
        form.documentNumber.length !== documentRule.length
        ? `El ${documentRule.name} debe tener ${documentRule.length} dígitos.`
        : null;

  const documentNumberValid =
    form.documentNumber.trim() !== "" &&
    (!documentRule || form.documentNumber.length === documentRule.length);

  const rucValid = isValidRucPrefix(form.ruc) && form.ruc.length === 11;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowErrors(true);
    setAccessError(null);
    setRedirecting(false);

    if (!form.documentType || !documentNumberValid || !rucValid) return;

    if (!slug) {
      setAccessError(
        "No se pudo identificar la capacitación. Vuelva a seleccionarla desde el listado."
      );
      return;
    }

    setSubmitting(true);

    httpRequest<EnrollmentResponse>({
      method: "POST",
      url: "event-pnte-public/validar-inscripcion-cooperativa",
      data: {
        slug,
        tipo_documento_id: Number(form.documentType),
        numero_dni: form.documentNumber.trim(),
        ruc: form.ruc,
      },
    })
      .then((response) => {
        if (response.status === 200 && response.data) {
          setEnrollment(response.data);
          return;
        }

        setAccessError(
          response.message ??
          "No encontramos tu inscripción a esta capacitación."
        );
      })
      .catch((error: unknown) => {
        if (
          axios.isAxiosError<{ message?: string; reason?: string }>(error)
        ) {
          const data = error.response?.data;

          if (
            error.response?.status === 404 &&
            data?.reason === "not_registered"
          ) {
            setAccessError(
              data.message ??
              "No encontramos tu inscripción. Te llevaremos al formulario de inscripción."
            );
            setRedirecting(true);
            return;
          }

          if (data?.reason === "fecha_no_disponible") {
            setAccessError(
              data.message ??
              "La asistencia solo está disponible en las fechas programadas del evento."
            );
            setInfoRefreshKey((key) => key + 1);
            return;
          }
        }

        setAccessError(
          getApiError(
            error,
            "No encontramos tu inscripción a esta capacitación. Verifica tus datos."
          )
        );
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  if (isLoadingCourse) {
    return <PageLoading />;
  }

  return (
    <div className="min-h-screen w-full bg-[#fff] py-6">
      <div className="mx-auto w-full max-w-[1000px] px-4 md:px-8">
        <section className="relative min-h-[94vh] overflow-hidden rounded-md border border-[#e0e0e0] bg-white shadow-[0_12px_24px_rgba(0,0,0,0.08)]">
          <HeroBanner course={course} />

          <div className="h-[8px] w-full bg-[#2b8aa8]" />

          <div className="px-8 py-6 md:px-14 md:py-10">
            {enrollment ? (
              <WelcomePanel enrollment={enrollment} course={course} />
            ) : !course ? (
              <LoadErrorPanel hasSlug={Boolean(slug)} />
            ) : course.estado && course.estado !== "disponible" ? (
              <UnavailablePanel course={course} slug={slug} />
            ) : (
              <form
                noValidate
                onSubmit={handleSubmit}
                className="[&_label]:text-[14px] [&_label]:font-normal"
              >
                <h3 className="mb-4 text-[15px] font-bold text-[#2b8aa8]">
                  Asistencia de hoy
                </h3>
                <p className="mb-6 text-[14px] text-[#3e647d]">
                  Ingresa tus datos para registrar tu asistencia del{" "}
                  {formatFechaLarga(course.fecha_hoy)}.
                </p>

                <div className="grid grid-cols-1 items-start gap-x-6 gap-y-5 md:grid-cols-3">
                  <div className="flex min-w-0 flex-col gap-2">
                    <Label htmlFor="tipo-documento">Tipo de documento</Label>
                    <BrandSelect
                      id="tipo-documento"
                      value={form.documentType}
                      variant={documentTypeError ? "error" : "default"}
                      onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                        handleDocumentTypeChange(event.target.value)
                      }
                      aria-invalid={documentTypeError ? true : undefined}
                      aria-describedby={
                        documentTypeError
                          ? "tipo-documento-error"
                          : undefined
                      }
                    >
                      <NativeSelectOption value="">
                        Seleccione el tipo
                      </NativeSelectOption>
                      {documentTypes.map((option) => (
                        <NativeSelectOption
                          key={String(option.value)}
                          value={String(option.value)}
                        >
                          {option.label}
                        </NativeSelectOption>
                      ))}
                    </BrandSelect>
                    {documentTypeError && (
                      <p
                        id="tipo-documento-error"
                        className="text-xs text-input-error"
                      >
                        {documentTypeError}
                      </p>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-2">
                    <Label htmlFor="numero-documento">
                      Número de documento
                    </Label>
                    <BrandInput
                      id="numero-documento"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder={
                        documentRule
                          ? `Ingrese los ${documentRule.length} dígitos`
                          : "Ingrese el número de documento"
                      }
                      maxLength={documentRule?.length ?? 12}
                      value={form.documentNumber}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        update({
                          documentNumber: event.target.value
                            .replace(/\D/g, "")
                            .slice(0, documentRule?.length ?? 12),
                        })
                      }
                      state={documentNumberError ? "error" : "default"}
                      aria-invalid={documentNumberError ? true : undefined}
                      aria-describedby={
                        documentNumberError
                          ? "numero-documento-error"
                          : undefined
                      }
                    />
                    {documentNumberError && (
                      <p
                        id="numero-documento-error"
                        className="text-xs text-input-error"
                      >
                        {documentNumberError}
                      </p>
                    )}
                  </div>

                  <RucField
                    id="ruc-mype"
                    label="Número de RUC"
                    placeholder="Ingrese el número de RUC"
                    value={form.ruc}
                    onChange={(value) => update({ ruc: value })}
                    showErrors={showErrors}
                  />
                </div>

                {accessError && (
                  <p className="mt-6 rounded-lg border border-input-error/30 bg-input-error/5 px-4 py-3 text-sm text-input-error">
                    {accessError}
                  </p>
                )}

                {redirecting && (
                  <p className="mt-2 text-sm font-semibold text-[#2b8aa8]">
                    Redirigiendo al formulario de inscripción...
                  </p>
                )}

                <div className="mt-8 flex justify-end">
                  <Button
                    type="submit"
                    disabled={submitting || redirecting}
                    className="bg-[#2b8aa8] px-8 hover:bg-[#20708a] focus:ring-[#2b8aa8]/30"
                  >
                    {submitting ? "VALIDANDO..." : "Continuar"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
