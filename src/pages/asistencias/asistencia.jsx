import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/tailgrids/core/button";
import { Input } from "@/components/tailgrids/core/input";
import { Label } from "@/components/tailgrids/core/label";
import { useFavicon } from "@/hooks/useFavicon";
import { httpRequest } from "@/services/api";
import registroIcon from "@/assets/icons/registro.ico";

function getLocalDateString() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${today.getFullYear()}-${month}-${day}`;
}

function formatEventDate(fecha) {
  if (!fecha) return "Fecha por confirmar";

  const date = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Fecha por confirmar";

  return date.toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function Asistencia() {
  useFavicon(registroIcon);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Asistencia al evento";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  const [searchParams] = useSearchParams();
  const slugParam = searchParams.get("slug") ?? "";
  const [slugValue, toFromSlug] = slugParam.split("?to=");
  const slug = slugValue || null;
  const to = searchParams.get("to") ?? toFromSlug ?? null;
  const [numeroDni, setNumeroDni] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [eventInfo, setEventInfo] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(Boolean(slug));

  useEffect(() => {
    if (!slug) {
      setLoadingEvent(false);
      return;
    }

    let active = true;
    setLoadingEvent(true);

    httpRequest({
      method: "GET",
      url: `event-pnte-public/asistencia-info/${encodeURIComponent(slug)}`,
    })
      .then((response) => {
        if (active) setEventInfo(response.data ?? null);
      })
      .catch(() => {
        if (active) setEventInfo(null);
      })
      .finally(() => {
        if (active) setLoadingEvent(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  const fechaHoy = getLocalDateString();
  const fechasEvento = (eventInfo?.fechas ?? [])
    .filter((fecha) => typeof fecha === "string")
    .sort();
  const fechaMasProxima = fechasEvento.find((fecha) => fecha >= fechaHoy)
    ?? fechasEvento.at(-1)
    ?? null;

  const getRegistrationUrl = () => {
    if (!slug) return null;

    const paths = {
      reactiva: "/reactiva-sector/inscripciones",
      compras: "/compras-myperu/inscripciones",
    };
    const path = paths[to];
    if (!path) return null;

    const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    const baseUrl = isLocal
      ? "http://localhost:5174"
      : import.meta.env.VITE_APP_FRONTEND_URL || window.location.origin;
    const url = new URL(`${baseUrl.replace(/\/$/, "")}${path}`);
    url.searchParams.set("slug", slug);

    return url.toString();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setResult(null);

    if (!slug) {
      setResult({ type: "error", message: "No se pudo identificar la actividad." });
      return;
    }

    const dni = numeroDni.trim();
    if (!dni) {
      setResult({ type: "error", message: "Ingresa tu número de documento." });
      return;
    }

    setSubmitting(true);
    try {
      const response = await httpRequest({
        method: "POST",
        url: `event-pnte-public/marcar-mi-asistencia/${encodeURIComponent(slug)}`,
        data: { numero_dni: dni },
      });

      setResult({
        type: "success",
        message: response.message ?? "Asistencia marcada correctamente.",
        nombre: response.data?.nombre,
        fecha: response.data?.fecha_asistencia_marcada ?? response.data?.fecha_asistencia,
      });
    } catch (error) {
      const message = error?.response?.data?.message;
      if (error?.response?.data?.reason === "date_without_event") {
        setResult({
          type: "date-unavailable",
          message: message ?? "Hoy no hay una capacitación programada, por lo que no se tomará asistencia.",
          registrationUrl: getRegistrationUrl(),
        });
      } else if (error?.response?.status === 404) {
        setResult({
          type: "not-found",
          message: message ?? "No se encontró una inscripción para esos datos.",
          registrationUrl: getRegistrationUrl(),
        });
      } else {
        setResult({
          type: "error",
          message: message ?? "No se pudo marcar la asistencia. Inténtalo nuevamente.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Shantell+Sans:ital,wght@0,300..800;1,300..800&display=swap');`}</style>
      <main className="flex min-h-screen items-center justify-center bg-[#f7fdff] px-4 py-8">
        <section className="flex min-h-[380px] w-full max-w-[480px] flex-col justify-center rounded-2xl border border-[#dbe5eb] bg-white p-6 shadow-[0_12px_30px_rgba(18,78,120,0.10)] sm:min-h-[410px] sm:p-8">
          <div className="mb-7 text-center">
            <span className="inline-flex rounded-full bg-[#e6f4f9] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#2b8aa8]">
              Asistencia al evento
            </span>
            <h1 className="mt-3 text-xl font-bold text-[#124e78] sm:text-3xl" style={{ fontFamily: '"Shantell Sans", sans-serif' }}>
              {eventInfo?.tema || (loadingEvent ? "Cargando evento..." : "Registro de asistencia")}
            </h1>
            <div className="mt-3 space-y-1 text-sm text-[#3e647d]">
              <p>
                <span className="font-semibold text-[#124e78]">Fecha: </span>
                {formatEventDate(fechaMasProxima)}
              </p>
              <p>
                <span className="font-semibold text-[#124e78]">Asesor: </span>
                {eventInfo?.asesor || "Por confirmar"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-2">
            <Label htmlFor="numero-documento" className="text-[14px] font-medium text-[#124e78]">
              Número de documento
            </Label>
            <Input
              id="numero-documento"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={12}
              value={numeroDni}
              onChange={(event) => setNumeroDni(event.target.value.replace(/\D/g, ""))}
              placeholder="Ingrese su número de documento"
              className="h-[45px] border-[#a7a7a7] focus:border-[#2b8aa8] focus:ring-[#2b8aa8]/25"
            />
            <Button type="submit" disabled={submitting} className="mt-4 h-11 w-full bg-[#2b8aa8] font-bold hover:bg-[#20708a]">
              {submitting ? "MARCANDO..." : "Asistencia"}
            </Button>
          </form>

          {result && !["date-unavailable", "not-found"].includes(result.type) && (
            <div
              role={result.type === "success" ? "status" : "alert"}
              className={`mt-5 rounded-xl border p-4 text-sm ${result.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-900"
                }`}
            >
              <p className="font-semibold">{result.message}</p>
              {result.type === "success" && result.nombre && (
                <p className="mt-1">Participante: {result.nombre}</p>
              )}
              {result.type === "success" && result.fecha && (
                <p className="mt-1">Fecha y hora: {result.fecha}</p>
              )}
              {result.type === "not-found" && result.registrationUrl && (
                <a
                  href={result.registrationUrl}
                  className="mt-3 inline-flex font-semibold text-[#2b8aa8] underline underline-offset-2"
                >
                  Continuar
                </a>
              )}
            </div>
          )}
        </section>
      </main>

      {result?.type === "date-unavailable" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="fecha-asistencia-title"
          aria-describedby="fecha-asistencia-message"
        >
          <section className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl sm:p-8">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-7 w-7"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4m0 4h.01" />
              </svg>
            </span>
            <h2 id="fecha-asistencia-title" className="mt-4 text-xl font-bold text-[#124e78]">
              No hay evento programado para hoy
            </h2>
            <p id="fecha-asistencia-message" className="mt-2 text-sm leading-relaxed text-[#3e647d]">
              {result.message}
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              {result.registrationUrl && (
                <a
                  href={result.registrationUrl}
                  className="inline-flex justify-center rounded-lg bg-[#2b8aa8] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#20708a]"
                >
                  Ir a otras capacitaciones
                </a>
              )}
              <button
                type="button"
                onClick={() => setResult(null)}
                className="rounded-lg border border-[#c9d4dc] px-5 py-3 text-sm font-semibold text-[#124e78] transition-colors hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </section>
        </div>
      )}

      {result?.type === "not-found" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="inscripcion-no-encontrada-title"
          aria-describedby="inscripcion-no-encontrada-message"
        >
          <section className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl sm:p-8">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-7 w-7"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4m0 4h.01" />
              </svg>
            </span>
            <h2 id="inscripcion-no-encontrada-title" className="mt-4 text-xl font-bold text-[#124e78]">
              No se encontró tu inscripción
            </h2>
            <p id="inscripcion-no-encontrada-message" className="mt-2 text-sm leading-relaxed text-[#3e647d]">
              No se encontró una inscripción para esos datos. Debes registrarte para esta capacitación antes de marcar la asistencia.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              {result.registrationUrl && (
                <a
                  href={result.registrationUrl}
                  className="inline-flex justify-center rounded-lg bg-[#2b8aa8] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#20708a]"
                >
                  Registrarme
                </a>
              )}
              <button
                type="button"
                onClick={() => setResult(null)}
                className="rounded-lg border border-[#c9d4dc] px-5 py-3 text-sm font-semibold text-[#124e78] transition-colors hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
