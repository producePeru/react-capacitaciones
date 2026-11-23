export const initialFeriaTextValues = {
  ruc: "", razonSocial: "", comercialName: "", economicsector_id: "", rubro_id: "",
  comercialactivity_id: "", city_id: "", province_id: "", district_id: "", address: "",
  facebook: "", instagram: "", tiktok: "", web: "",
  typedocument_id: "", documentnumber: "", lastname: "", middlename: "", name: "",
  gender_id: "", sick: "", phone: "", email: "", role_company_id: "", birthday: "",
  pertenece_gremio: "", nombre_gremio: "", cap_prod_mensual: "", porc_prod_planta: "",
  porc_prod_maquila: "", tiene_puntos_venta: "", num_puntos_ventas: "", desc_negocio: "",
  pos: "", yape_plim: "", tiene_tiendas: "", nombre_tienda: "", tiene_delivery: "",
  factura_electronica: "", participado_produce: "", nombre_servicio: "", participado_feria: "",
  nombre_feria: "", formalizado_produce: "", indecopi: "", logros_empresa: "",
  feria_principal: "", feria_opcional: "",
};

export type FeriaTextKey = keyof typeof initialFeriaTextValues;
export type FeriaValues = typeof initialFeriaTextValues & { terminos_condiciones: boolean };
export type FeriaStep = "prioridades" | "empresa" | "participante" | "emprendimiento";
export type FeriaErrorKey = FeriaTextKey | "socials" | "reporte_tributario" | "imagenes_papa" | "terminos_condiciones";
export type FeriaErrors = Partial<Record<FeriaErrorKey, string>>;
export type FeriaFiles = { reporte: File | null; imagenes: File[] };
export type FeriaParticipantRecord = Record<string, unknown> & {
  id: string | number;
  slug: string;
  actividad_id?: string | number | null;
  emprendimiento?: Record<string, unknown> | null;
  feria_papa?: {
    prioridad_1?: string | number | null;
    prioridad_2?: string | number | null;
    imagenes?: { id: string | number; nombre?: string; name?: string }[];
  } | null;
  reporte_tributario?: { archivo_id?: string | number; nombre_original?: string } | null;
};
export type FeriaEditContext = {
  record: FeriaParticipantRecord;
  event?: { tema?: string; especial?: string | null; descripcion?: string | null } | null;
  isPapa?: boolean;
};
export type FeriaEditResult = {
  id: string | number;
  actividad_id: string | number;
  slug: string;
  empresario_id: string | number;
  empresario: Record<string, unknown>;
  emprendimiento: FeriaParticipantRecord["emprendimiento"];
  archivo: FeriaParticipantRecord["reporte_tributario"];
  feria_papa: FeriaParticipantRecord["feria_papa"];
};
export type FeriaEditPayload = Record<string, unknown> & { id: string | number; slug: string };

const editFieldNames: Partial<Record<keyof FeriaValues, string>> = {
  razonSocial: "razon_social", comercialName: "nombre_comercial", economicsector_id: "sector_economico_id",
  comercialactivity_id: "actividad_comercial_id", city_id: "region_id", province_id: "provincia_id",
  district_id: "distrito_id", address: "direccion", typedocument_id: "tipo_documento_id", documentnumber: "numero_dni",
  lastname: "apellido_paterno", middlename: "apellido_materno", name: "nombres", gender_id: "genero_id",
  sick: "discapacidad", phone: "celular", email: "correo_electronico", role_company_id: "cargo_empresa_id", birthday: "fecha_nacimiento",
};
export type FeriaField = {
  model: FeriaTextKey;
  label: string;
  type?: "select" | "search" | "number" | "date" | "textarea" | "radio";
  other?: boolean;
  full?: boolean;
  placeholder?: string;
};

export const feriaSteps: { id: FeriaStep; title: string }[] = [
  { id: "prioridades", title: "Ferias de interés" },
  { id: "empresa", title: "Datos de la Empresa" },
  { id: "participante", title: "Datos del Participante" },
  { id: "emprendimiento", title: "Datos sobre el Emprendimiento" },
];

export const feriaPriorities = [
  { label: "Perú Produce Lima (10 al 15 de noviembre)", value: "1" },
  { label: "Perú Produce Lambayeque (12 al 14 de noviembre)", value: "2" },
  { label: "Perú Produce Ucayali (14 y 15 de noviembre)", value: "3" },
  { label: "Perú Produce Cusco (14 y 15 de noviembre)", value: "4" },
];

export const companyFields: FeriaField[] = [
  { model: "ruc", label: "Número de RUC", type: "search" },
  { model: "razonSocial", label: "Razón Social" },
  { model: "comercialName", label: "Nombre Comercial (marca)" },
  { model: "economicsector_id", label: "Sector Económico", type: "select" },
  { model: "rubro_id", label: "Rubro", type: "select" },
  { model: "comercialactivity_id", label: "Actividad Comercial", type: "select" },
  { model: "city_id", label: "Región", type: "select" },
  { model: "province_id", label: "Provincia", type: "select" },
  { model: "district_id", label: "Distrito", type: "select" },
  { model: "address", label: "Dirección de la empresa" },
];

export const participantFields: FeriaField[] = [
  { model: "typedocument_id", label: "Tipo de documento", type: "select" },
  { model: "documentnumber", label: "Número de Documento", type: "search" },
  { model: "lastname", label: "Apellido Paterno" },
  { model: "middlename", label: "Apellido Materno" },
  { model: "name", label: "Nombres" },
  { model: "gender_id", label: "Género", type: "select" },
  { model: "sick", label: "¿Tiene alguna discapacidad?", type: "select" },
  { model: "phone", label: "Número de celular", type: "number" },
  { model: "email", label: "Correo electrónico" },
  { model: "role_company_id", label: "Cargo en la empresa", type: "select" },
  { model: "birthday", label: "Fecha de nacimiento", type: "date" },
];

export const conditionalFields = [
  { parent: "pertenece_gremio", value: "1", model: "nombre_gremio", label: "Nombre del gremio" },
  { parent: "tiene_puntos_venta", value: "1", model: "num_puntos_ventas", label: "¿Cuántos puntos de venta propios tiene?", type: "number" },
  { parent: "tiene_tiendas", value: "3", model: "nombre_tienda", label: "Nombre de la tienda virtual o página web" },
  { parent: "participado_produce", value: "3", model: "nombre_servicio", label: "Nombre del servicio" },
  { parent: "participado_feria", value: "3", model: "nombre_feria", label: "Mencionar el evento en el que participó" },
] satisfies (FeriaField & { parent: FeriaTextKey; value: string })[];

const businessFields: FeriaField[] = [
  { model: "pertenece_gremio", label: "¿Pertenece a algún gremio empresarial?", type: "radio" },
  { model: "cap_prod_mensual", label: "¿Cuál es su capacidad de producción mensual?" },
  { model: "porc_prod_planta", label: "Qué porcentaje de su producción lo realiza en: Planta propia" },
  { model: "porc_prod_maquila", label: "Qué porcentaje de su producción lo realiza en: Maquila" },
  { model: "tiene_puntos_venta", label: "¿Cuenta con puntos de venta?", type: "radio" },
  { model: "desc_negocio", label: "Breve explicación del negocio (aspectos resaltantes, productos, valor diferencial)", type: "textarea" },
  { model: "pos", label: "¿Cuenta con el servicio de pagos electrónicos mediante POS (tarjeta de crédito y/o débito)?", type: "radio" },
  { model: "yape_plim", label: "¿Su negocio cuenta con el servicio de pagos por medio de monederos electrónicos (Yape, PLIN, etc.)?", type: "radio" },
  { model: "tiene_tiendas", label: "¿Su negocio realiza ventas a través de tiendas virtuales, página web (Mercado Libre, Amazon, etc.), redes sociales o WhatsApp?", type: "radio", other: true },
  { model: "tiene_delivery", label: "¿Su negocio realiza entregas a domicilio (delivery)?", type: "radio" },
  { model: "factura_electronica", label: "¿Su negocio emite factura electrónica?", type: "radio" },
  { model: "participado_produce", label: "¿Ha participado en algún servicio que ofrece PRODUCE (taller, capacitación o asistencia técnica)?", type: "radio", other: true },
  { model: "participado_feria", label: "¿Ha participado en alguna feria virtual/presencial y/o rueda de negocios en los últimos años?", type: "radio", other: true },
  { model: "formalizado_produce", label: "¿Se ha formalizado a través del Programa Nacional Tu Empresa?", type: "radio" },
  { model: "indecopi", label: "¿Su marca se encuentra registrada en INDECOPI?", type: "radio" },
  { model: "logros_empresa", label: "Comente los logros que ha obtenido con su empresa", type: "textarea", placeholder: "Certificaciones, reconocimientos y experiencia en exportación" },
];

export const socialFields = [
  { model: "facebook", name: "Facebook" },
  { model: "instagram", name: "Instagram" },
  { model: "tiktok", name: "TikTok" },
  { model: "web", name: "Web" },
] as const;

export function getFeriaFields(step: FeriaStep, values: FeriaValues): FeriaField[] {
  if (step === "empresa") return companyFields;
  if (step === "participante") return participantFields;
  if (step === "prioridades") return [
    { model: "feria_principal", label: "Feria donde deseas participar (Prioridad 1)", type: "select", full: true },
    { model: "feria_opcional", label: "Feria donde deseas participar (Prioridad 2) (opcional)", type: "select", full: true },
  ];
  return businessFields.flatMap((field) => {
    const conditional = conditionalFields.find((item) => item.parent === field.model && values[item.parent] === item.value);
    return [{ ...field, full: true }, ...(conditional ? [{ ...conditional, full: true }] : [])];
  });
}

export function documentRules(label: string) {
  const normalized = label.trim().toUpperCase();
  const dni = normalized.startsWith("DNI") || normalized.startsWith("DOCUMENTO NACIONAL");
  const passport = normalized.startsWith("PASAPORTE");
  return { dni, passport, length: dni ? 8 : passport ? 12 : 9 };
}

export function normalizeBirthday(value: string | null | undefined): string {
  if (!value) return "";
  const date = value.trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) return date.split("/").reverse().join("-");
  return /^\d{4}-\d{2}-\d{2}/.test(date) ? date.slice(0, 10) : "";
}

export function normalizeFeriaAnswer(value: unknown): string {
  if (value === null || value === undefined) return "";
  const answer = String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
  if (["SI", "1", "TRUE"].includes(answer)) return "1";
  if (["NO", "0", "FALSE"].includes(answer)) return "0";
  if (["OTRO", "3"].includes(answer)) return "3";
  return String(value);
}

export function isFeriaEditContext(value: unknown): value is FeriaEditContext {
  if (!value || typeof value !== "object") return false;
  const record = (value as { record?: unknown }).record;
  if (!record || typeof record !== "object") return false;
  const { id, slug } = record as Record<string, unknown>;
  return (typeof id === "number" || typeof id === "string") && String(id).trim() !== "" && typeof slug === "string" && slug.trim() !== "";
}

export function mapFeriaParticipantToValues(record: FeriaParticipantRecord): FeriaValues {
  const text = (value: unknown) => value === null || value === undefined ? "" : String(value);
  const values: FeriaValues = { ...initialFeriaTextValues, terminos_condiciones: false };
  const mapping = {
    ruc: "ruc", razonSocial: "razon_social", comercialName: "nombre_comercial", economicsector_id: "sector_economico_id",
    rubro_id: "rubro_id", comercialactivity_id: "actividad_comercial_id", city_id: "region_id", province_id: "provincia_id",
    district_id: "distrito_id", address: "direccion", typedocument_id: "tipo_documento_id", lastname: "apellido_paterno",
    middlename: "apellido_materno", name: "nombres", gender_id: "genero_id", phone: "celular", email: "correo_electronico",
    role_company_id: "cargo_empresa_id",
  } satisfies Partial<Record<FeriaTextKey, string>>;
  for (const [key, source] of Object.entries(mapping)) values[key as FeriaTextKey] = text(record[source]);
  values.documentnumber = text(record.numero_dni_empresario ?? record.numero_dni);
  values.birthday = normalizeBirthday(text(record.fecha_nacimiento));
  values.sick = normalizeFeriaAnswer(record.discapacidad);
  const business = record.emprendimiento ?? {};
  for (const field of [...businessFields, ...conditionalFields]) {
    values[field.model] = field.type === "radio" ? normalizeFeriaAnswer(business[field.model]) : text(business[field.model]);
  }
  values.terminos_condiciones = normalizeFeriaAnswer(business.terminos_condiciones) === "1";
  const socials = Array.isArray(business.redes_sociales) ? business.redes_sociales : [];
  for (const social of socials) {
    if (!social || typeof social !== "object") continue;
    const name = text(social.name).trim().toLowerCase().replace(/\s+/g, "");
    const field = socialFields.find((item) => item.model === name);
    if (field) values[field.model] = text(social.link);
  }
  values.feria_principal = text(record.feria_papa?.prioridad_1);
  values.feria_opcional = text(record.feria_papa?.prioridad_2);
  return values;
}

export function getFeriaParticipantOptions(record: FeriaParticipantRecord): Partial<Record<FeriaTextKey, { value: string; label: string }>> {
  const values = mapFeriaParticipantToValues(record);
  const names: Partial<Record<FeriaTextKey, unknown>> = {
    economicsector_id: record.sector_economico_nombre, rubro_id: record.rubro_nombre,
    comercialactivity_id: record.actividad_comercial_nombre, city_id: record.region_nombre,
    province_id: record.provincia_nombre, district_id: record.distrito_nombre,
    typedocument_id: record.tipo_documento_nombre, role_company_id: record.cargo_empresa_nombre,
    gender_id: record.genero_nombre ?? (record.genero_avr === "M" ? "MASCULINO" : record.genero_avr === "F" ? "FEMENINO" : record.genero_avr),
  };
  return Object.fromEntries(Object.entries(names).filter(([key]) => values[key as FeriaTextKey] !== "").map(([key, label]) => {
    const value = values[key as FeriaTextKey];
    return [key, { value, label: label == null || label === "" ? `Opción ${value}` : String(label) }];
  }));
}

export function getAge(birthday: string, today = new Date()): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday)) return null;
  const [year, month, day] = birthday.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day || date > today) return null;
  let age = today.getFullYear() - year;
  if (today.getMonth() < month - 1 || (today.getMonth() === month - 1 && today.getDate() < day)) age--;
  return age;
}

export function validateFeriaFile(file: File, kind: "pdf" | "image"): string | null {
  const limit = kind === "pdf" ? 10 : 5;
  const allowed = kind === "pdf"
    ? /\.pdf$/i.test(file.name) && (!file.type || file.type === "application/pdf")
    : /\.(jpe?g|png|webp)$/i.test(file.name) && ["image/jpeg", "image/png", "image/webp"].includes(file.type);
  if (!allowed) return kind === "pdf" ? "Adjunta un archivo PDF válido." : "Solo se permiten imágenes JPG, PNG o WEBP.";
  if (file.size === 0 || file.size > limit * 1024 * 1024) return `El archivo debe tener contenido y no superar los ${limit} MB.`;
  return null;
}

export function validateFeriaSocialUrls(values: FeriaValues): FeriaErrors {
  const errors: FeriaErrors = {};
  const examples = {
    facebook: "https://www.facebook.com/tuempresa",
    instagram: "https://www.instagram.com/tuempresa",
    tiktok: "https://www.tiktok.com/@tuempresa",
    web: "https://www.tuempresa.com",
  };
  for (const { model, name } of socialFields) {
    const value = values[model].trim();
    if (!value) continue;
    try {
      const url = new URL(value);
      const validHost = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(url.hostname);
      if (!/^https?:\/\/[^/]/i.test(value) || /\s/.test(value) || !["https:", "http:"].includes(url.protocol) || !validHost) throw new Error();
    } catch {
      errors[model] = `Corrige el Link de ${name}. Ingresa una URL completa con http:// o https://, por ejemplo ${examples[model]}.`;
    }
  }
  return errors;
}

export function validateFeriaStep(step: FeriaStep, values: FeriaValues, files: FeriaFiles, documentLabel: string): FeriaErrors {
  const errors: FeriaErrors = {};
  for (const field of getFeriaFields(step, values)) {
    if (field.model !== "feria_opcional" && !values[field.model].trim()) errors[field.model] = `Completa el campo: ${field.label}.`;
  }
  if (step === "empresa") {
    if (!/^(10|15|17|20)\d{9}$/.test(values.ruc)) errors.ruc = "Ingresa un RUC de 11 dígitos que inicie con 10, 15, 17 o 20.";
    if (!socialFields.some(({ model }) => values[model].trim())) errors.socials = "Completa al menos una red social o página web.";
    Object.assign(errors, validateFeriaSocialUrls(values));
  }
  if (step === "participante") {
    const rule = documentRules(documentLabel);
    const pattern = rule.passport ? /^[a-zA-Z0-9]+$/ : /^\d+$/;
    if (!pattern.test(values.documentnumber) || values.documentnumber.length !== rule.length) errors.documentnumber = `El documento debe tener ${rule.length} ${rule.passport ? "caracteres" : "dígitos"}.`;
    if (!/^9\d{8}$/.test(values.phone)) errors.phone = "El celular debe tener 9 dígitos y empezar con 9.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = "Ingresa un correo electrónico válido.";
    const age = getAge(values.birthday);
    if (age === null) errors.birthday = "Ingresa una fecha de nacimiento válida que no sea futura.";
    else if (age < 18 || age > 100) errors.birthday = "La edad debe estar entre 18 y 100 años.";
  }
  if (step === "prioridades") {
    if (!feriaPriorities.some(({ value }) => value === values.feria_principal)) errors.feria_principal = "Selecciona la feria de primera prioridad.";
    if (values.feria_opcional && (!feriaPriorities.some(({ value }) => value === values.feria_opcional) || values.feria_opcional === values.feria_principal)) errors.feria_opcional = "La segunda opción debe ser una feria diferente a la primera.";
    if (!files.imagenes.length || files.imagenes.length > 2) errors.imagenes_papa = "Adjunta entre 1 y 2 imágenes reales de tus productos alusivos al Papa.";
    for (const file of files.imagenes) {
      const error = validateFeriaFile(file, "image");
      if (error) errors.imagenes_papa = error;
    }
  }
  if (step === "emprendimiento") {
    if (values.tiene_puntos_venta === "1" && !/^[1-9]\d*$/.test(values.num_puntos_ventas)) errors.num_puntos_ventas = "Ingresa la cantidad de puntos de venta propios (mayor a cero).";
    if (!values.terminos_condiciones) errors.terminos_condiciones = "Debes aceptar los Términos y Condiciones.";
    if (files.reporte) {
      const error = validateFeriaFile(files.reporte, "pdf");
      if (error) errors.reporte_tributario = error;
    }
  }
  return errors;
}

export function buildFeriaPayload(values: FeriaValues, slug: string, isPapa: boolean, countryId: string | null) {
  const payload = {
    slug, ruc: values.ruc, razon_social: values.razonSocial.trim(), nombre_comercial: values.comercialName.trim(),
    sector_economico_id: values.economicsector_id, rubro_id: values.rubro_id, actividad_comercial_id: values.comercialactivity_id,
    region_id: values.city_id, provincia_id: values.province_id, distrito_id: values.district_id, direccion: values.address.trim(),
    tipo_documento_id: values.typedocument_id, numero_dni: values.documentnumber, apellido_paterno: values.lastname.trim(),
    apellido_materno: values.middlename.trim(), nombres: values.name.trim(), genero_id: values.gender_id, discapacidad: values.sick,
    celular: values.phone, correo_electronico: values.email.trim(), cargo_empresa_id: values.role_company_id,
    fecha_nacimiento: values.birthday.split("-").reverse().join("/"), edad: getAge(values.birthday), pais_nacimiento_id: countryId,
    redes_sociales: socialFields.filter(({ model }) => values[model].trim()).map(({ model, name }) => ({ name, link: values[model].trim() })),
    pertenece_gremio: values.pertenece_gremio, nombre_gremio: values.pertenece_gremio === "1" ? values.nombre_gremio.trim() : null,
    cap_prod_mensual: values.cap_prod_mensual.trim(), porc_prod_planta: values.porc_prod_planta.trim(), porc_prod_maquila: values.porc_prod_maquila.trim(),
    tiene_puntos_venta: values.tiene_puntos_venta, num_puntos_ventas: values.tiene_puntos_venta === "1" ? values.num_puntos_ventas : null,
    desc_negocio: values.desc_negocio.trim(), pos: values.pos, yape_plim: values.yape_plim, tiene_tiendas: values.tiene_tiendas,
    nombre_tienda: values.tiene_tiendas === "3" ? values.nombre_tienda.trim() : null, tiene_delivery: values.tiene_delivery,
    factura_electronica: values.factura_electronica, participado_produce: values.participado_produce,
    nombre_servicio: values.participado_produce === "3" ? values.nombre_servicio.trim() : null,
    participado_feria: values.participado_feria, nombre_feria: values.participado_feria === "3" ? values.nombre_feria.trim() : null,
    formalizado_produce: values.formalizado_produce, indecopi: values.indecopi, logros_empresa: values.logros_empresa.trim(),
    terminos_condiciones: values.terminos_condiciones,
  };
  return isPapa ? { ...payload, feria_principal: values.feria_principal, feria_opcional: values.feria_opcional } : payload;
}

export function serializeFeriaPayload(payload: ReturnType<typeof buildFeriaPayload>, files: FeriaFiles, isPapa: boolean) {
  if (!files.reporte && !files.imagenes.length && !isPapa) return payload;
  const data = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    data.append(key, typeof value === "boolean" ? (value ? "1" : "0") : typeof value === "object" ? JSON.stringify(value) : String(value));
  });
  if (files.reporte) data.append("reporte_tributario", files.reporte);
  if (isPapa) files.imagenes.forEach((file) => data.append("imagenes_papa[]", file));
  return data;
}

export function buildFeriaEditPayload(values: FeriaValues, record: FeriaParticipantRecord, isPapa: boolean): FeriaEditPayload {
  const original = mapFeriaParticipantToValues(record);
  const full = buildFeriaPayload(values, record.slug, isPapa, record.pais_id == null ? null : String(record.pais_id)) as Record<string, unknown>;
  const payload: FeriaEditPayload = { id: record.id, slug: record.slug };
  if (record.actividad_id != null) payload.actividad_id = record.actividad_id;
  const empresarioId = record.empresario_id ?? record.emprendimiento?.empresario_id;
  if (empresarioId != null) payload.empresario_id = empresarioId;
  for (const key of Object.keys(values) as (keyof FeriaValues)[]) {
    if (values[key] === original[key] || socialFields.some(({ model }) => model === key)) continue;
    if (!isPapa && (key === "feria_principal" || key === "feria_opcional")) continue;
    const name = editFieldNames[key] ?? key;
    payload[name] = full[name] === "" ? null : full[name];
  }
  for (const conditional of conditionalFields) {
    if (conditional.parent in payload) payload[conditional.model] = full[conditional.model] === "" ? null : full[conditional.model];
  }
  if (socialFields.some(({ model }) => values[model] !== original[model])) {
    const previous = record.emprendimiento?.redes_sociales;
    const otherSocials = Array.isArray(previous) ? previous.filter((social) => social && typeof social === "object"
      && typeof social.name === "string" && typeof social.link === "string"
      && !socialFields.some(({ model }) => model === social.name.trim().toLowerCase().replace(/\s+/g, ""))) : [];
    payload.redes_sociales = [...full.redes_sociales as { name: string; link: string }[], ...otherSocials];
  }
  return payload;
}

export function hasFeriaEdits(payload: FeriaEditPayload, files: FeriaFiles) {
  return Object.keys(payload).some((key) => !["id", "slug", "actividad_id", "empresario_id"].includes(key)) || Boolean(files.reporte) || files.imagenes.length > 0;
}

export function serializeFeriaEditPayload(payload: FeriaEditPayload, files: FeriaFiles) {
  if (!files.reporte && !files.imagenes.length) return payload;
  const data = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    data.append(key, value == null ? "" : typeof value === "boolean" ? (value ? "1" : "0") : typeof value === "object" ? JSON.stringify(value) : String(value));
  }
  if (files.reporte) data.append("reporte_tributario", files.reporte);
  files.imagenes.forEach((file) => data.append("imagenes_papa[]", file));
  return data;
}

export function validateFeriaEdit(values: FeriaValues, record: FeriaParticipantRecord, files: FeriaFiles, isPapa: boolean, documentLabel: string): FeriaErrors {
  const original = mapFeriaParticipantToValues(record);
  const changed = new Set((Object.keys(values) as (keyof FeriaValues)[]).filter((key) => values[key] !== original[key]));
  // Los enlaces se revisan siempre, incluidos los valores precargados del registro.
  const errors: FeriaErrors = validateFeriaSocialUrls(values);
  for (const step of feriaSteps.filter((item) => isPapa || item.id !== "prioridades")) {
    const result = validateFeriaStep(step.id, values, files, documentLabel);
    for (const [key, message] of Object.entries(result)) {
      if (key === "socials" || key === "terminos_condiciones" || socialFields.some(({ model }) => model === key)) continue;
      if (key === "imagenes_papa" && !files.imagenes.length) continue;
      const relevant = changed.has(key as keyof FeriaValues)
        || conditionalFields.some((field) => field.model === key && changed.has(field.parent))
        || (key === "documentnumber" && changed.has("typedocument_id"))
        || (key === "feria_opcional" && changed.has("feria_principal"))
        || (key === "imagenes_papa" && files.imagenes.length > 0)
        || (key === "reporte_tributario" && Boolean(files.reporte));
      if (relevant) errors[key as FeriaErrorKey] = message;
    }
  }
  return errors;
}

export function mapFeriaApiErrors(errors: Record<string, string[]>): FeriaErrors {
  const mapped: FeriaErrors = {};
  for (const [apiName, messages] of Object.entries(errors)) {
    const key = apiName.split(".")[0];
    const model = key === "redes_sociales" ? "socials" : Object.entries(editFieldNames).find(([, name]) => name === key)?.[0] ?? key;
    mapped[model as FeriaErrorKey] = messages[0];
  }
  return mapped;
}

export function mergeFeriaEditResult(context: FeriaEditContext, result: FeriaEditResult, labels: Record<string, string> = {}): FeriaEditContext {
  const person = { ...result.empresario };
  delete person.id;
  delete person.created_at;
  delete person.updated_at;
  const record: FeriaParticipantRecord = {
    ...context.record, ...person, ...labels,
    id: context.record.id, actividad_id: result.actividad_id, slug: result.slug, empresario_id: result.empresario_id,
    numero_dni: person.numero_dni ?? context.record.numero_dni,
    numero_dni_empresario: person.numero_dni ?? context.record.numero_dni_empresario,
    nombre_completo: [person.apellido_paterno, person.apellido_materno, person.nombres].filter(Boolean).join(" "),
    emprendimiento: result.emprendimiento, reporte_tributario: result.archivo, feria_papa: result.feria_papa,
  };
  return { ...context, record };
}
