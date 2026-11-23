import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { isFeriaEditContext, type FeriaEditContext } from "@/utils/feriasForm";

function readContext(key: string): FeriaEditContext | null {
  try {
    const cached: unknown = JSON.parse(sessionStorage.getItem(key) ?? "null");
    return isFeriaEditContext(cached) ? cached : null;
  } catch {
    return null;
  }
}

function getSettings(hash: string) {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const channel = params.get("canal");
  const origin = params.get("origen");
  if (!channel || !origin || channel.length > 100) return null;
  try {
    const url = new URL(origin);
    if (!["https:", "http:"].includes(url.protocol) || url.origin !== origin) return null;
    return { channel, origin, key: `feriante-editor:${channel}` };
  } catch {
    return null;
  }
}

export function useFerianteEditContext() {
  const { hash } = useLocation();
  const settings = getSettings(hash);
  const key = settings?.key ?? "";
  const channel = settings?.channel;
  const origin = settings?.origin;
  const [result, setResult] = useState<{ key: string; context: FeriaEditContext | null; error?: string }>(() => ({ key, context: key ? readContext(key) : null }));

  useEffect(() => {
    if (!key || !channel || !origin || readContext(key) || !window.opener) return;
    const opener = window.opener;
    let received = false;
    const handleMessage = (event: MessageEvent) => {
      if (received || event.source !== opener || event.origin !== origin || event.data?.channel !== channel || event.data?.type !== "feriante-editor:data") return;
      if (!isFeriaEditContext(event.data.context)) {
        setResult({ key, context: null, error: "El registro recibido no tiene los datos necesarios para editar al participante." });
        return;
      }
      received = true;
      const context = event.data.context;
      try { sessionStorage.setItem(key, JSON.stringify(context)); } catch { /* La edición funciona aunque el navegador no permita guardar la sesión. */ }
      setResult({ key, context });
      opener.postMessage({ type: "feriante-editor:received", channel }, origin);
    };
    window.addEventListener("message", handleMessage);
    opener.postMessage({ type: "feriante-editor:ready", channel }, origin);
    const timeout = window.setTimeout(() => {
      if (!received) setResult({ key, context: null, error: "No se recibieron los datos del participante. Vuelve a abrir Editar datos desde el listado de inscritos." });
    }, 30000);
    return () => { window.removeEventListener("message", handleMessage); window.clearTimeout(timeout); };
  }, [key, channel, origin]);

  const context = result.key === key ? result.context : null;
  const error = context ? null : !settings || !window.opener
    ? "Selecciona un participante y pulsa Editar datos desde el listado de inscritos en ferias."
    : result.key === key ? result.error : undefined;
  const updateContext = (next: FeriaEditContext) => {
    if (!key || !isFeriaEditContext(next)) return;
    try { sessionStorage.setItem(key, JSON.stringify(next)); } catch { /* La pantalla conserva los cambios aunque la sesión no esté disponible. */ }
    setResult({ key, context: next });
    if (origin && window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: "feriante-editor:saved", channel, id: next.record.id, slug: next.record.slug }, origin);
    }
  };
  return { context, error, loading: !context && !error, updateContext };
}
