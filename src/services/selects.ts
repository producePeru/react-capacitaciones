import { httpRequest } from "./api";

export interface SelectOption {
  label: string;
  value: number | string;
}

interface SelectListResponse {
  data: SelectOption[];
}

const optionsCache = new Map<string, Promise<SelectOption[]>>();

function getOptions(
  path: string,
  params?: Record<string, unknown>
): Promise<SelectOption[]> {
  const key = params ? `${path}?${JSON.stringify(params)}` : path;
  const cached = optionsCache.get(key);
  if (cached) return cached;

  const request = httpRequest<SelectListResponse>({
    method: "GET",
    url: path,
    params,
  })
    .then((res) => res.data)
    .catch((error) => {
      optionsCache.delete(key);
      throw error;
    });

  optionsCache.set(key, request);
  return request;
}

/** Rol en la cooperativa (paso 1) */
export const getRoles = () => getOptions("select/roles");

/** Tipo de documento (paso 3) */
export const getDocumentTypes = () => getOptions("select/type-documents");

/** Género: [{ label: "MASCULINO", value: 1 }, ...] (paso 3) */
export const getGenders = () => getOptions("select/genders");

/** Sector económico (paso 2) */
export const getSectors = () => getOptions("select/economic-sectors");

/** Rubro (paso 2) */
export const getRubros = () => getOptions("select/rubros");

/** Región (paso 2) */
export const getRegions = () => getOptions("select/cities");

/** Provincia filtrada por región (paso 2) */
export const getProvinces = (regionId: number | string) =>
  getOptions(`select/provinces/${regionId}`);

/** Distrito filtrado por provincia (paso 2) */
export const getDistricts = (provinceId: number | string) =>
  getOptions(`select/districts/${provinceId}`);

/** País de nacimiento (paso 3) */
export const getCountries = () => getOptions("select/countries");
