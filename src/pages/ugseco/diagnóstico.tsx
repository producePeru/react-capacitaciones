import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import ugsecoIcon from "@/assets/icons/ugseco.ico";
import { Input, type InputProps } from "@/components/tailgrids/core/input";
import { Label } from "@/components/tailgrids/core/label";
import {
  NativeSelect,
  NativeSelectOption,
  type NativeSelectProps,
} from "@/components/tailgrids/core/native-select";
import { useFavicon } from "@/hooks/useFavicon";
import { httpRequest } from "@/services/api";
import {
  getDocumentTypes,
  type SelectOption,
} from "@/services/selects";

const brandFieldCls =
  "h-[45px] border-[#a7a7a7] pt-2 pb-3 focus:border-[#2b8aa8] focus:ring-[#2b8aa8]/25";

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

type DiagnosticoOption = {
  id: number;
  letra: string;
  texto: string;
};

type DiagnosticoPregunta = {
  id: number;
  componente: string;
  numero: number;
  pregunta: string;
  opciones: DiagnosticoOption[];
};

type ApiResponse<T> = {
  status: number;
  message?: string;
  data: T;
};

type FieldErrors = {
  tipoDocumento?: string;
  numeroDocumento?: string;
  ruc?: string;
};

type Step = "identificacion" | "preguntas" | "exito";

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

export default function DiagnosticoPage() {
  useFavicon(ugsecoIcon);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "diagnóstico | UGSECO";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  const [step, setStep] = useState<Step>("identificacion");
  const [documentTypes, setDocumentTypes] = useState<SelectOption[]>([]);
  const [preguntas, setPreguntas] = useState<DiagnosticoPregunta[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [tipoDocumento, setTipoDocumento] = useState("");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [ruc, setRuc] = useState("");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    Promise.all([
      getDocumentTypes(),
      httpRequest<ApiResponse<DiagnosticoPregunta[]>>({
        method: "GET",
        url: "event-pnte-public/diagnostico-preguntas",
      }),
    ])
      .then(([types, response]) => {
        if (!active) return;

        const data = response.data ?? [];

        setDocumentTypes(types);
        setPreguntas(data);

        if (data.length === 0) {
          setLoadError("El diagnóstico aún no tiene preguntas configuradas.");
        }
      })
      .catch(() => {
        if (active) {
          setLoadError(
            "No se pudo cargar el diagnóstico. Intenta nuevamente."
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [reloadToken]);

  const handleRetry = () => {
    setLoading(true);
    setLoadError(null);
    setReloadToken((token) => token + 1);
  };

  const documentRule = getDocumentRule(documentTypes, tipoDocumento);
  const answeredCount = preguntas.filter(
    (pregunta) => answers[pregunta.id] !== undefined
  ).length;
  const progress = preguntas.length
    ? Math.round((answeredCount / preguntas.length) * 100)
    : 0;

  const handleDocumentTypeChange = (value: string) => {
    setTipoDocumento(value);
    setFieldErrors((prev) => ({ ...prev, tipoDocumento: undefined }));

    const nextRule = getDocumentRule(documentTypes, value);
    if (nextRule) {
      setNumeroDocumento((prev) => prev.slice(0, nextRule.length));
    }
  };

  const handleStart = () => {
    const nextErrors: FieldErrors = {};
    const trimmedDocument = numeroDocumento.trim();

    if (!tipoDocumento) {
      nextErrors.tipoDocumento = "Selecciona el tipo de documento.";
    }

    if (!trimmedDocument) {
      nextErrors.numeroDocumento = "Ingresa el número de documento.";
    } else if (documentRule && trimmedDocument.length !== documentRule.length) {
      nextErrors.numeroDocumento = `El ${documentRule.name} debe tener ${documentRule.length} dígitos.`;
    } else if (trimmedDocument.length > 12) {
      nextErrors.numeroDocumento =
        "El número de documento no debe superar los 12 caracteres.";
    }

    if (ruc && ruc.length !== 11) {
      nextErrors.ruc = "El RUC debe tener 11 dígitos.";
    }

    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitError(null);
    setStep("preguntas");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = () => {
    const allAnswered = preguntas.every(
      (pregunta) => answers[pregunta.id] !== undefined
    );

    if (!allAnswered) {
      setSubmitError("Responde todas las preguntas antes de enviar.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    httpRequest<ApiResponse<{ id: number }>>({
      method: "POST",
      url: "event-pnte-public/diagnostico",
      data: {
        tipo_documento_id: Number(tipoDocumento),
        numero_documento: numeroDocumento.trim(),
        ruc: ruc || null,
        respuestas: preguntas.map((pregunta) => ({
          pregunta_id: pregunta.id,
          opcion_id: answers[pregunta.id],
        })),
      },
    })
      .then(() => {
        setStep("exito");
        window.scrollTo({ top: 0, behavior: "smooth" });
      })
      .catch((error: unknown) => {
        setSubmitError(
          getApiError(
            error,
            "No se pudo registrar el diagnóstico. Intenta nuevamente."
          )
        );
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const handleReset = () => {
    setStep("identificacion");
    setTipoDocumento("");
    setNumeroDocumento("");
    setRuc("");
    setAnswers({});
    setFieldErrors({});
    setSubmitError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen w-full bg-white py-6">
      <div className="mx-auto w-full max-w-[1080px] px-6">
        <section className="relative overflow-hidden rounded-md border border-[#cfe0ec] bg-white shadow-[0_12px_36px_rgba(18,86,125,0.18)]">
          <div className="px-8 py-10 md:px-14 md:py-12">
            <span className="inline-flex rounded-full bg-[#e9f1f7] px-3 py-1 text-[12px] font-semibold uppercase tracking-wide text-[#2b8aa8]">
              Diagnóstico UGSEco
            </span>
            <h1 className="mt-4 max-w-3xl text-[28px] font-extrabold leading-[1.15] md:text-[40px]">
              <span className="text-[#124e78]">Conoce el punto de partida de </span>
              <span className="text-[#2b8aa8]">tu negocio</span>
            </h1>
            <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-[#2f5670] md:text-[17px]">
              Responde cinco preguntas breves sobre la formalización, gestión,
              digitalización, financiamiento y desarrollo productivo de tu
              negocio.
            </p>
          </div>
          <div className="h-[8px] w-full bg-[#2b8aa8]" />
        </section>

        {step !== "exito" && (
          <div className="mt-6 flex items-center gap-3">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold ${
                step === "identificacion"
                  ? "bg-[#2b8aa8] text-white"
                  : "bg-[#2b8aa8]/20 text-[#2b8aa8]"
              }`}
            >
              {step === "preguntas" ? "✓" : "1"}
            </span>
            <span
              className={`text-[13.5px] ${
                step === "identificacion"
                  ? "font-bold text-[#2b8aa8]"
                  : "font-medium text-[#3e647d]"
              }`}
            >
              Identificación
            </span>
            <span className="mx-1 h-px flex-1 bg-[#dbe3e9]" />
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold ${
                step === "preguntas"
                  ? "bg-[#2b8aa8] text-white"
                  : "border border-[#c9d4dc] bg-white text-[#8a9aa6]"
              }`}
            >
              2
            </span>
            <span
              className={`text-[13.5px] ${
                step === "preguntas"
                  ? "font-bold text-[#2b8aa8]"
                  : "font-medium text-[#8a9aa6]"
              }`}
            >
              Diagnóstico
            </span>
          </div>
        )}

        {loading && (
          <div className="mt-6 rounded-lg border border-[#cfe0ec] bg-white p-8">
            <div className="flex items-center gap-3 text-[14px] text-[#3e647d]">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#2b8aa8]/30 border-t-[#2b8aa8]" />
              Cargando el diagnóstico...
            </div>
          </div>
        )}

        {!loading && loadError && (
          <div className="mt-6 rounded-lg border border-[#f2c7c3] bg-[#fff8f7] p-8">
            <p className="text-[14px] text-[#b42318]">{loadError}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-4 rounded-md border border-[#b42318] px-5 py-2 text-[13px] font-semibold text-[#b42318] transition-colors hover:bg-[#b42318] hover:text-white"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !loadError && step === "identificacion" && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleStart();
            }}
            className="mt-6 rounded-lg border border-[#cfe0ec] bg-white p-6 shadow-sm md:p-8"
          >
            <h2 className="text-[18px] font-bold text-[#124e78]">
              Identifícate
            </h2>
            <p className="mt-1 text-[14px] text-[#3e647d]">
              Ingresa tus datos para asociar el diagnóstico a tu negocio.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="tipo-documento">Tipo de documento</Label>
                <BrandSelect
                  id="tipo-documento"
                  value={tipoDocumento}
                  variant={fieldErrors.tipoDocumento ? "error" : "default"}
                  onChange={(event) =>
                    handleDocumentTypeChange(event.target.value)
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
                {fieldErrors.tipoDocumento && (
                  <p className="text-xs text-input-error">
                    {fieldErrors.tipoDocumento}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
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
                  maxLength={12}
                  value={numeroDocumento}
                  onChange={(event) =>
                    setNumeroDocumento(
                      event.target.value.replace(/\D/g, "").slice(0, 12)
                    )
                  }
                  state={fieldErrors.numeroDocumento ? "error" : "default"}
                  aria-invalid={
                    fieldErrors.numeroDocumento ? true : undefined
                  }
                />
                {fieldErrors.numeroDocumento && (
                  <p className="text-xs text-input-error">
                    {fieldErrors.numeroDocumento}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="ruc">RUC (opcional)</Label>
                <BrandInput
                  id="ruc"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Ingrese los 11 dígitos"
                  maxLength={11}
                  value={ruc}
                  onChange={(event) =>
                    setRuc(
                      event.target.value.replace(/\D/g, "").slice(0, 11)
                    )
                  }
                  state={fieldErrors.ruc ? "error" : "default"}
                  aria-invalid={fieldErrors.ruc ? true : undefined}
                />
                {fieldErrors.ruc ? (
                  <p className="text-xs text-input-error">{fieldErrors.ruc}</p>
                ) : (
                  <p className="text-xs text-[#6b7f8c]">
                    Si aún no cuentas con RUC, puedes dejarlo en blanco.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                className="rounded-md bg-[#2b8aa8] px-8 py-2.5 text-[14px] font-bold tracking-[0.12em] text-white transition-colors hover:bg-[#20708a]"
              >
                COMENZAR DIAGNÓSTICO
              </button>
            </div>
          </form>
        )}

        {!loading && !loadError && step === "preguntas" && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmit();
            }}
            className="mt-6"
          >
            <div className="rounded-lg border border-[#cfe0ec] bg-white p-5 shadow-sm md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-[#2b8aa8]">
                    Diagnóstico de tu negocio
                  </p>
                  <p className="mt-1 text-[13px] text-[#3e647d]">
                    Documento: {numeroDocumento}
                    {ruc ? ` · RUC: ${ruc}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep("identificacion")}
                  className="text-[13px] font-semibold text-[#2b8aa8] hover:underline"
                >
                  Editar datos
                </button>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e3edf3]">
                  <div
                    className="h-2 rounded-full bg-[#2b8aa8] transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="shrink-0 text-[12px] font-medium text-[#3e647d]">
                  {answeredCount} de {preguntas.length}
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-5">
              {preguntas.map((pregunta) => (
                <fieldset
                  key={pregunta.id}
                  className="rounded-lg border border-[#cfe0ec] bg-white p-6 shadow-sm md:p-7"
                >
                  <legend className="sr-only">
                    {pregunta.componente}: {pregunta.pregunta}
                  </legend>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#e9f1f7] px-3 py-1 text-[12px] font-semibold text-[#2b8aa8]">
                      {pregunta.componente}
                    </span>
                    <span className="text-[12px] text-[#8a9aa6]">
                      Pregunta {pregunta.numero} de {preguntas.length}
                    </span>
                  </div>

                  <h2 className="mt-3 text-[16px] font-bold leading-snug text-[#124e78] md:text-[18px]">
                    {pregunta.pregunta}
                  </h2>

                  <div className="mt-5 grid gap-3">
                    {pregunta.opciones.map((opcion) => {
                      const selected = answers[pregunta.id] === opcion.id;

                      return (
                        <label
                          key={opcion.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                            selected
                              ? "border-[#2b8aa8] bg-[#f0f9fc]"
                              : "border-[#dbe3e9] bg-white hover:border-[#9cc7d7] hover:bg-[#f7fbfd]"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`pregunta-${pregunta.id}`}
                            value={opcion.id}
                            checked={selected}
                            onChange={() =>
                              setAnswers((prev) => ({
                                ...prev,
                                [pregunta.id]: opcion.id,
                              }))
                            }
                            className="mt-0.5 h-4 w-4 shrink-0 accent-[#2b8aa8]"
                          />
                          <span className="text-[13.5px] leading-relaxed text-[#2f5670] md:text-[14px]">
                            <strong className="mr-2 text-[#124e78]">
                              {opcion.letra})
                            </strong>
                            {opcion.texto}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>

            {submitError && (
              <p className="mt-4 text-[13px] text-[#b42318]">{submitError}</p>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep("identificacion")}
                className="rounded-md border border-[#2b8aa8] px-6 py-2.5 text-[13.5px] font-semibold text-[#2b8aa8] transition-colors hover:bg-[#2b8aa8]/10"
              >
                ← Atrás
              </button>
              <button
                type="submit"
                disabled={submitting || answeredCount !== preguntas.length}
                className="rounded-md bg-[#2b8aa8] px-8 py-2.5 text-[14px] font-bold tracking-[0.12em] text-white transition-colors hover:bg-[#20708a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "ENVIANDO..." : "ENVIAR DIAGNÓSTICO"}
              </button>
            </div>
          </form>
        )}

        {!loading && !loadError && step === "exito" && (
          <section className="mt-6 rounded-lg border border-[#cfe0ec] bg-white p-8 text-center shadow-sm md:p-12">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e9f1f7] text-[#2b8aa8]">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <h2 className="mt-5 text-[24px] font-extrabold text-[#124e78]">
              ¡Diagnóstico registrado!
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[14.5px] leading-relaxed text-[#3e647d]">
              Gracias por completar el diagnóstico de tu negocio. Tu información
              fue registrada correctamente.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/ugseco/capacitaciones"
                className="inline-flex rounded-md bg-[#2b8aa8] px-6 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-[#20708a]"
              >
                Ver capacitaciones
              </Link>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex rounded-md border border-[#2b8aa8] px-6 py-2.5 text-[14px] font-semibold text-[#2b8aa8] transition-colors hover:bg-[#2b8aa8]/10"
              >
                Realizar otro diagnóstico
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
