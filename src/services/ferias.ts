import axios from "axios";
import { httpRequest } from "./api";
import { normalizeBirthday, serializeFeriaEditPayload, type FeriaEditPayload, type FeriaEditResult, type FeriaFiles, type FeriaTextKey } from "@/utils/feriasForm";

export type FeriaResponse<T> = { status?: number; message?: string; data?: T };
type LookupData = Record<string, string | number | null | undefined>;
export type FeriaEvent = {
  slug?: string;
  tema?: string;
  title?: string;
  message?: string;
  status?: number;
  especial?: string | null;
  descripcion?: string | null;
};

export function feriaApiError(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(error)) {
    const data = error.response?.data;
    return (data?.errors ? Object.values(data.errors).flat()[0] : undefined) ?? data?.message ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

async function lookupStored(url: string) {
  try {
    return await httpRequest<FeriaResponse<LookupData>>({ method: "GET", url });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return { status: 404 };
    throw error;
  }
}

const text = (value: string | number | null | undefined) => value == null ? "" : String(value);

export async function lookupFeriaCompany(ruc: string): Promise<Partial<Record<FeriaTextKey, string>>> {
  const stored = await lookupStored(`sed/ruc-company/${encodeURIComponent(ruc)}`);
  const response = stored.status === 404
    ? await httpRequest<FeriaResponse<LookupData>>({ method: "POST", url: `api/consult-company-ruc/${encodeURIComponent(ruc)}` })
    : stored;
  if (response.status !== 200 || !response.data) throw new Error(response.message || "No se encontró información del RUC. Puedes completar los datos manualmente.");
  const data = response.data;
  return {
    razonSocial: text(data.razon_social ?? data.socialReason), comercialName: text(data.nombre_comercial ?? data.comercialName),
    economicsector_id: text(data.sector_economico_id ?? data.economicsector_id), rubro_id: text(data.rubro_id ?? data.category_id),
    comercialactivity_id: text(data.actividad_comercial_id ?? data.comercialactivity_id), city_id: text(data.region_id ?? data.city_id),
    province_id: text(data.provincia_id), district_id: text(data.distrito_id), address: text(data.direccion ?? data.address),
  };
}

export async function lookupFeriaParticipant(document: string, isDni: boolean): Promise<Partial<Record<FeriaTextKey, string>>> {
  const stored = await lookupStored(`sed/dni-busimess-man/${encodeURIComponent(document)}`);
  const response = stored.status === 404 && isDni
    ? await httpRequest<FeriaResponse<LookupData>>({ method: "POST", url: `api/consult-businessman-dni/${encodeURIComponent(document)}` })
    : stored;
  if (response.status !== 200 || !response.data) throw new Error(response.message || "No se encontró información del documento. Puedes completar los datos manualmente.");
  const data = response.data;
  return {
    lastname: text(data.apellido_paterno ?? data.lastname), middlename: text(data.apellido_materno ?? data.middlename),
    name: text(data.nombres ?? data.name), gender_id: text(data.genero_id ?? data.gender_id), sick: text(data.discapacidad ?? data.sick),
    phone: text(data.celular ?? data.phone), email: text(data.correo_electronico ?? data.email), role_company_id: text(data.cargo_empresa_id),
    birthday: normalizeBirthday(text(data.fecha_nacimiento ?? data.birthday)),
  };
}

export async function getFeriaEvent(slug: string, mode: string | null) {
  const response = await httpRequest<FeriaResponse<FeriaEvent>>({
    method: "GET", url: `public/event-sed-details/${encodeURIComponent(slug)}`,
    params: mode ? { mode } : undefined,
  });
  if (!response.data) throw new Error(response.message || "No se pudo cargar la información de la feria.");
  return response.data;
}

export async function updateFeriaParticipant(payload: FeriaEditPayload, files: FeriaFiles): Promise<FeriaEditResult> {
  const data = serializeFeriaEditPayload(payload, files);
  const multipart = data instanceof FormData;
  // PHP recibe los archivos por POST; Laravel resuelve la ruta PUT con _method.
  if (multipart) data.append("_method", "PUT");
  const response = await httpRequest<FeriaResponse<FeriaEditResult>>({
    method: multipart ? "POST" : "PUT", url: "public/editar-datos-feriante", data,
  });
  if (response.status !== 200 || !response.data) throw new Error(response.message || "No se pudieron guardar los cambios del feriante.");
  return response.data;
}
