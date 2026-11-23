import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import axios from "axios";
import { Dialog, Modal, ModalOverlay } from "react-aria-components";
import { Button } from "@/components/tailgrids/core/button";
import { Input } from "@/components/tailgrids/core/input";
import { Label } from "@/components/tailgrids/core/label";
import { NativeSelect, NativeSelectOption } from "@/components/tailgrids/core/native-select";
import { useFerianteEditContext } from "@/hooks/useFerianteEditContext";
import { feriaApiError, lookupFeriaCompany, lookupFeriaParticipant, updateFeriaParticipant } from "@/services/ferias";
import {
  getActivitiesByRubro, getCompanyRoles, getDistricts, getDocumentTypes,
  getGenders, getProvinces, getRegions, getRubros, getSectors, type SelectOption,
} from "@/services/selects";
import {
  buildFeriaEditPayload, companyFields, conditionalFields, documentRules, feriaPriorities, feriaSteps,
  getFeriaFields, getFeriaParticipantOptions, hasFeriaEdits, mapFeriaApiErrors, mapFeriaParticipantToValues,
  mergeFeriaEditResult, participantFields, socialFields, validateFeriaEdit,
  validateFeriaFile, type FeriaEditContext, type FeriaErrorKey, type FeriaErrors, type FeriaField,
  type FeriaFiles, type FeriaTextKey, type FeriaValues,
} from "@/utils/feriasForm";

const fieldClassName = "h-[45px] border-[#a7a7a7] focus:border-[#2b8aa8] focus:ring-[#2b8aa8]/25";
const textareaClassName = "w-full resize-y rounded-lg border border-[#a7a7a7] bg-input-background px-4 py-2.5 text-sm text-[#124e78] outline-none transition placeholder:text-input-placeholder-text focus:border-[#2b8aa8] focus:ring-2 focus:ring-[#2b8aa8]/25";
const yesNoOptions: SelectOption[] = [{ label: "Sí", value: "1" }, { label: "No", value: "0" }];

function ErrorText({ id, message }: { id: string; message?: string }) {
  return message ? <p id={`${id}-error`} className="text-xs text-input-error">{message}</p> : null;
}

function SocialIcon({ platform }: { platform: typeof socialFields[number]["model"] }) {
  if (platform === "facebook") return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#1877f2" /><path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.6 1.6-1.6h1.7V4.8a21 21 0 0 0-2.5-.2c-2.5 0-4.1 1.5-4.1 4.2V11H7.5v3h2.7v8" fill="white" /></svg>;
  if (platform === "instagram") return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="6" stroke="#e1306c" strokeWidth="2.5" /><circle cx="12" cy="12" r="4.5" stroke="#e1306c" strokeWidth="2.5" /><circle cx="18" cy="6" r="1.4" fill="#f77737" /></svg>;
  if (platform === "tiktok") return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#111827" /><path d="M13 6v9a2.5 2.5 0 1 1-2.5-2.5M13 6c.5 2 1.5 3 4 3" stroke="#25f4ee" strokeWidth="2.5" strokeLinecap="round" /><path d="M14 6v9a2.5 2.5 0 1 1-2.5-2.5M14 6c.5 2 1.5 3 4 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>;
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34a853" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><ellipse cx="12" cy="12" rx="4" ry="10" /><path d="M2 12h20M4 6h16M4 18h16" /></svg>;
}

function useOptions(loader: () => Promise<SelectOption[]>, enabled = true) {
  const [result, setResult] = useState<{ loader: typeof loader; options: SelectOption[]; error?: string } | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    loader().then((options) => {
      if (active) setResult({ loader, options });
    }).catch(() => {
      if (active) setResult({ loader, options: [], error: "No se pudieron cargar las opciones. Actualiza la página para reintentar." });
    });
    return () => { active = false; };
  }, [loader, enabled]);
  return {
    options: enabled && result?.loader === loader ? result.options : [],
    loading: enabled && result?.loader !== loader,
    error: enabled && result?.loader === loader ? result.error : undefined,
  };
}

function ImagePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const imageRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    if (imageRef.current) imageRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return (
    <div className="relative w-36 overflow-hidden rounded-lg border border-[#c9d4dc] bg-white">
      <img ref={imageRef} alt={file.name} className="h-28 w-full object-cover" />
      <button type="button" onClick={onRemove} aria-label={`Quitar ${file.name}`} className="absolute right-1 top-1 rounded-full bg-white px-2 py-0.5 text-red-600 shadow">×</button>
      <p className="truncate px-2 py-2 text-xs text-[#3e647d]" title={file.name}>{file.name}</p>
    </div>
  );
}

function FeriaEditForm({ context, onSaved }: { context: FeriaEditContext; onSaved: (next: FeriaEditContext) => void }) {
  const { record, event } = context;
  const isPapa = context.isPapa || Boolean(record.feria_papa) || event?.especial === "feria_papa" || event?.descripcion === "feria_papa";
  const steps = feriaSteps.filter((step) => isPapa || step.id !== "prioridades");
  const [values, setValues] = useState(() => mapFeriaParticipantToValues(record));
  const [files, setFiles] = useState<FeriaFiles>({ reporte: null, imagenes: [] });
  const [errors, setErrors] = useState<FeriaErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<{ type: "error" | "info"; text: string } | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [socialErrorsModalOpen, setSocialErrorsModalOpen] = useState(false);
  const [loadingLookup, setLoadingLookup] = useState<"ruc" | "documentnumber" | null>(null);
  const [lookupNotice, setLookupNotice] = useState<{ field: string; message: string } | null>(null);
  const rucRequest = useRef(0);
  const documentRequest = useRef(0);
  const saveLock = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  const sectors = useOptions(getSectors);
  const rubros = useOptions(getRubros);
  const regions = useOptions(getRegions);
  const documentTypes = useOptions(getDocumentTypes);
  const genders = useOptions(getGenders);
  const roles = useOptions(getCompanyRoles);
  const loadActivities = useCallback(() => getActivitiesByRubro(values.rubro_id), [values.rubro_id]);
  const loadProvinces = useCallback(() => getProvinces(values.city_id), [values.city_id]);
  const loadDistricts = useCallback(() => getDistricts(values.province_id), [values.province_id]);
  const activities = useOptions(loadActivities, Boolean(values.rubro_id));
  const provinces = useOptions(loadProvinces, Boolean(values.city_id));
  const districts = useOptions(loadDistricts, Boolean(values.province_id));
  const originalOptions = getFeriaParticipantOptions(record);
  const documentLabel = documentTypes.options.find((option) => String(option.value) === values.typedocument_id)?.label ?? originalOptions.typedocument_id?.label ?? "";
  const documentRule = documentRules(documentLabel);

  useEffect(() => () => { rucRequest.current++; documentRequest.current++; }, []);

  const update = (patch: Partial<FeriaValues>) => {
    const next = { ...patch };
    if ("rubro_id" in next && !("comercialactivity_id" in next)) next.comercialactivity_id = "";
    if ("city_id" in next && !("province_id" in next)) { next.province_id = ""; next.district_id = ""; }
    if ("province_id" in next && !("district_id" in next)) next.district_id = "";
    for (const field of conditionalFields) {
      if (field.parent in next && next[field.parent] !== field.value) next[field.model] = "";
    }
    if ("feria_principal" in next && next.feria_principal === values.feria_opcional) next.feria_opcional = "";
    if ("ruc" in next) { rucRequest.current++; setLoadingLookup(null); setLookupNotice(null); }
    if ("documentnumber" in next || "typedocument_id" in next) { documentRequest.current++; setLoadingLookup(null); setLookupNotice(null); }
    setValues((previous) => ({ ...previous, ...next }));
    setErrors((previous) => {
      const remaining = { ...previous };
      for (const key of Object.keys(next) as (keyof FeriaValues)[]) delete remaining[key];
      if (socialFields.some(({ model }) => model in next)) delete remaining.socials;
      return remaining;
    });
    setSaveNotice(null);
  };

  const changeText = (field: FeriaField, value: string) => {
    if (field.model === "ruc") value = value.replace(/\D/g, "").slice(0, 11);
    if (field.model === "phone") value = value.replace(/\D/g, "").slice(0, 9);
    if (field.model === "documentnumber") value = (documentRule.passport ? value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() : value.replace(/\D/g, "")).slice(0, documentRule.length);
    if (field.model === "num_puntos_ventas") value = value.replace(/\D/g, "");
    if (field.model === "typedocument_id") {
      const cleared = Object.fromEntries(participantFields.filter((item) => item.model !== "typedocument_id").map((item) => [item.model, ""]));
      update({ ...cleared, typedocument_id: value });
    } else update({ [field.model]: value });
  };

  const clearLookup = (model: "ruc" | "documentnumber") => {
    const fields = model === "ruc" ? companyFields : participantFields.filter((field) => field.model !== "typedocument_id");
    update(Object.fromEntries(fields.map((field) => [field.model, ""])));
  };

  const search = async (model: "ruc" | "documentnumber") => {
    if (loadingLookup) return;
    const value = values[model];
    const valid = model === "ruc" ? /^(10|15|17|20)\d{9}$/.test(value) : Boolean(values.typedocument_id) && value.length === documentRule.length;
    if (!valid) {
      setErrors((previous) => ({ ...previous, [model]: model === "ruc" ? "Ingresa un RUC válido de 11 dígitos." : "Selecciona el tipo e ingresa un documento completo." }));
      return;
    }
    const request = model === "ruc" ? rucRequest : documentRequest;
    const requestId = ++request.current;
    setLoadingLookup(model);
    setLookupNotice(null);
    try {
      const data = model === "ruc" ? await lookupFeriaCompany(value) : await lookupFeriaParticipant(value, documentRule.dni);
      if (requestId !== request.current) return;
      update(data);
      setLookupNotice({ field: model, message: "Información encontrada. Revisa y completa los datos restantes." });
    } catch (error) {
      if (requestId === request.current) setLookupNotice({ field: model, message: feriaApiError(error, "No se pudo realizar la búsqueda. Puedes completar los datos manualmente.") });
    } finally {
      if (requestId === request.current) setLoadingLookup(null);
    }
  };

  const selectCatalogs: Partial<Record<FeriaTextKey, ReturnType<typeof useOptions>>> = {
    economicsector_id: sectors, rubro_id: rubros, comercialactivity_id: activities, city_id: regions,
    province_id: provinces, district_id: districts, typedocument_id: documentTypes, gender_id: genders, role_company_id: roles,
  };

  const focusError = (field: FeriaErrorKey) => {
    requestAnimationFrame(() => {
      const wrapper = formRef.current?.querySelector<HTMLElement>(`[data-field="${field}"]`);
      wrapper?.scrollIntoView({ behavior: "smooth", block: "center" });
      (wrapper?.querySelector<HTMLElement>("input:not(:disabled),select:not(:disabled),textarea,button") ?? wrapper)?.focus({ preventScroll: true });
    });
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saveLock.current || loadingLookup) return;
    const validation = validateFeriaEdit(values, record, files, Boolean(isPapa), documentLabel);
    setErrors(validation);
    if (Object.keys(validation).length) {
      setSaveNotice({ type: "error", text: "Revisa los campos indicados antes de guardar los cambios." });
      if (socialFields.some(({ model }) => validation[model])) {
        setSocialErrorsModalOpen(true);
      } else {
        focusError(Object.keys(validation)[0] as FeriaErrorKey);
      }
      return;
    }
    const payload = buildFeriaEditPayload(values, record, Boolean(isPapa));
    if (!hasFeriaEdits(payload, files)) {
      setSaveNotice({ type: "info", text: "No hay cambios para guardar." });
      return;
    }
    saveLock.current = true;
    setSaving(true);
    setSaveNotice(null);
    try {
      const result = await updateFeriaParticipant(payload, files);
      const labels: Record<string, string> = {};
      for (const [model, name] of Object.entries({
        economicsector_id: "sector_economico_nombre", rubro_id: "rubro_nombre", comercialactivity_id: "actividad_comercial_nombre",
        city_id: "region_nombre", province_id: "provincia_nombre", district_id: "distrito_nombre",
        typedocument_id: "tipo_documento_nombre", gender_id: "genero_nombre", role_company_id: "cargo_empresa_nombre",
      })) {
        const key = model as FeriaTextKey;
        const option = selectCatalogs[key]?.options.find((item) => String(item.value) === values[key]) ?? originalOptions[key];
        if (option && String(option.value) === values[key]) labels[name] = option.label;
      }
      const next = mergeFeriaEditResult(context, result, labels);
      onSaved(next);
      setValues(mapFeriaParticipantToValues(next.record));
      setFiles({ reporte: null, imagenes: [] });
      setErrors({});
      setSaveNotice(null);
      setSuccessModalOpen(true);
    } catch (error) {
      if (axios.isAxiosError<{ errors?: Record<string, string[]> }>(error) && error.response?.data?.errors) {
        const mapped = mapFeriaApiErrors(error.response.data.errors);
        setErrors(mapped);
        if (Object.keys(mapped).length) focusError(Object.keys(mapped)[0] as FeriaErrorKey);
      }
      setSaveNotice({ type: "error", text: feriaApiError(error, "No se pudieron guardar los cambios. Intenta nuevamente.") });
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  };

  const renderField = (field: FeriaField) => {
    const { model, label } = field;
    const error = errors[model];
    const accessibility = { "aria-invalid": error ? true as const : undefined, "aria-describedby": error ? `${model}-error` : undefined };
    let content: ReactNode;
    if (field.type === "select") {
      const catalog = selectCatalogs[model];
      const dependentDisabled = (model === "comercialactivity_id" && !values.rubro_id) || (model === "province_id" && !values.city_id) || (model === "district_id" && !values.province_id);
      const items: SelectOption[] = [...(model === "sick" ? yesNoOptions : model === "feria_principal" ? feriaPriorities.filter((item) => item.value !== values.feria_opcional) : model === "feria_opcional" ? feriaPriorities.filter((item) => item.value !== values.feria_principal) : catalog?.options ?? [])];
      const original = originalOptions[model];
      if (original && original.value === values[model] && !items.some((item) => String(item.value) === original.value)) items.push(original);
      content = <>
        <Label htmlFor={model}>{label}</Label>
        <NativeSelect id={model} name={model} value={values[model]} disabled={dependentDisabled || catalog?.loading} variant={error ? "error" : "default"} onChange={(event) => changeText(field, event.target.value)} className={fieldClassName} aria-required={model !== "feria_opcional"} {...accessibility}>
          <NativeSelectOption value="">{catalog?.loading ? "Cargando..." : dependentDisabled ? "Seleccione primero la opción anterior" : model === "feria_opcional" ? "Sin segunda opción" : "Seleccione una opción"}</NativeSelectOption>
          {items.map((item) => <NativeSelectOption key={item.value} value={item.value}>{item.label}</NativeSelectOption>)}
        </NativeSelect>
        {catalog?.error && <p role="alert" className="text-xs text-input-error">{catalog.error}</p>}
      </>;
    } else if (field.type === "radio") {
      const choices = [...yesNoOptions, ...(field.other ? [{ label: "Otro", value: "3" }] : [])];
      content = <fieldset {...accessibility}>
        <legend className="mb-3 text-[14px] text-input-label-text">{label}</legend>
        <div className="grid gap-2.5 pl-2">
          {choices.map((choice) => <label key={choice.value} className="flex w-fit cursor-pointer items-center gap-2.5 text-[#124e78]">
            <input type="radio" name={model} value={choice.value} checked={values[model] === choice.value} onChange={() => update({ [model]: String(choice.value) })} className="h-4 w-4 accent-[#2b8aa8]" aria-required="true" />{choice.label}
          </label>)}
        </div>
      </fieldset>;
    } else if (field.type === "textarea") {
      content = <>
        <Label htmlFor={model}>{label}</Label>
        <textarea id={model} name={model} rows={4} value={values[model]} placeholder={field.placeholder ?? "Ingrese la información"} onChange={(event) => update({ [model]: event.target.value })} className={`${textareaClassName} ${error ? "border-input-error" : ""}`} aria-required="true" {...accessibility} />
      </>;
    } else {
      const isSearch = model === "ruc" || model === "documentnumber";
      const numeric = isSearch ? model !== "documentnumber" || !documentRule.passport : field.type === "number";
      const maxLength = model === "ruc" ? 11 : model === "documentnumber" ? documentRule.length : model === "phone" ? 9 : undefined;
      const autocomplete: Partial<Record<FeriaTextKey, string>> = { razonSocial: "organization", address: "street-address", name: "given-name", lastname: "family-name", email: "email", phone: "tel", birthday: "bday" };
      content = <>
        <Label htmlFor={model}>{label}</Label>
        <div className="relative">
          <Input id={model} name={model} value={values[model]} type={field.type === "date" ? "date" : model === "email" ? "email" : model === "phone" ? "tel" : "text"} inputMode={numeric ? "numeric" : undefined} maxLength={maxLength} max={field.type === "date" ? new Date().toLocaleDateString("en-CA") : undefined} placeholder={field.placeholder ?? `Ingrese ${label.toLowerCase()}`} autoComplete={autocomplete[model] ?? "off"} state={error ? "error" : "default"} onChange={(event) => changeText(field, event.target.value)} className={`${fieldClassName} ${isSearch ? "pr-32" : ""}`} aria-required="true" {...accessibility} />
          {isSearch && <div className="absolute inset-y-0 right-2 flex items-center gap-1">
            <button type="button" onClick={() => void search(model)} disabled={Boolean(loadingLookup)} aria-label={`Buscar ${model === "ruc" ? "RUC" : "documento"}`} className="rounded-md bg-[#2b8aa8] px-2.5 py-1.5 text-xs text-white hover:bg-[#20708a] disabled:opacity-60">{loadingLookup === model ? "..." : "Buscar"}</button>
            {values[model] && <button type="button" onClick={() => clearLookup(model)} aria-label={`Limpiar ${label}`} className="rounded-md bg-[#ff535b] px-2.5 py-1 text-lg leading-5 text-white hover:bg-[#e4434b]">×</button>}
          </div>}
        </div>
        {isSearch && lookupNotice?.field === model && <p role="status" className="text-xs text-[#3e647d]">{lookupNotice.message}</p>}
      </>;
    }
    return <div key={model} data-field={model} tabIndex={-1} className={`grid min-w-0 gap-2 outline-none ${field.full ? "md:col-span-2" : ""}`}>
      {content}<ErrorText id={model} message={error} />
    </div>;
  };

  const chooseReport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const error = validateFeriaFile(file, "pdf");
    setErrors((previous) => ({ ...previous, reporte_tributario: error ?? undefined }));
    if (!error) setFiles((previous) => ({ ...previous, reporte: file }));
  };

  const chooseImages = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!picked.length) return;
    const merged = [...files.imagenes];
    for (const file of picked) if (!merged.some((item) => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified)) merged.push(file);
    const error = merged.length > 2 ? "Puedes cargar como máximo 2 imágenes." : merged.map((file) => validateFeriaFile(file, "image")).find(Boolean);
    setErrors((previous) => ({ ...previous, imagenes_papa: error ?? undefined }));
    if (!error) setFiles((previous) => ({ ...previous, imagenes: merged }));
  };

  const closeSocialErrorsModal = () => {
    setSocialErrorsModalOpen(false);
    const first = socialFields.find(({ model }) => errors[model]);
    if (first) focusError(first.model);
  };

  return (
    <>
    <form ref={formRef} noValidate onSubmit={(event) => void handleSave(event)} className="[&_label]:text-[14px] [&_label]:font-normal">
      <fieldset disabled={saving} className="space-y-10">
      <div className="rounded-lg border border-[#d5e7f1] bg-[#f7fdff] px-4 py-3 text-sm text-[#124e78]">
        <p className="font-semibold">{String(record.nombre_completo ?? [record.apellido_paterno, record.apellido_materno, record.nombres].filter(Boolean).join(" "))}</p>
        <p className="mt-1 text-xs text-[#5a7585]">Registro: {record.id} · Documento: {String(record.numero_dni_empresario ?? record.numero_dni ?? "")}</p>
      </div>
      {steps.map((step) => <section key={step.id} aria-labelledby={`${step.id}-title`}>
        <h2 id={`${step.id}-title`} className="mb-4 text-[15px] font-bold text-[#2b8aa8]">{step.title}</h2>
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">{getFeriaFields(step.id, values).map(renderField)}</div>

        {step.id === "prioridades" && <div data-field="imagenes_papa" tabIndex={-1} className="mt-6 grid gap-3 outline-none">
          {Boolean(record.feria_papa?.imagenes?.length) && <p className="text-sm text-[#3e647d]">Imágenes registradas: {record.feria_papa?.imagenes?.map((image) => image.nombre ?? image.name ?? `Imagen ${image.id}`).join(", ")}</p>}
          <Label htmlFor="imagenes_papa">Carga como máximo 2 imágenes reales de tus productos alusivos al Papa</Label>
          <input id="imagenes_papa" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={chooseImages} aria-describedby="imagenes_papa-help imagenes_papa-error" aria-invalid={Boolean(errors.imagenes_papa)} className="block w-full rounded-lg border border-[#a7a7a7] p-3 text-sm text-[#3e647d] file:mr-3 file:rounded-md file:border-0 file:bg-[#e6f4f9] file:px-3 file:py-2 file:text-[#124e78]" />
          <p id="imagenes_papa-help" className="text-xs text-[#5a7585]">JPG, PNG o WEBP. Máximo 5 MB por imagen.</p>
          <div className="flex flex-wrap gap-3">{files.imagenes.map((file, index) => <ImagePreview key={`${file.name}-${file.size}-${file.lastModified}`} file={file} onRemove={() => { setFiles((previous) => ({ ...previous, imagenes: previous.imagenes.filter((_, item) => item !== index) })); setErrors((previous) => ({ ...previous, imagenes_papa: undefined })); }} />)}</div>
          <ErrorText id="imagenes_papa" message={errors.imagenes_papa} />
        </div>}

        {step.id === "empresa" && <div data-field="socials" tabIndex={-1} className="mt-8 outline-none">
          <h3 className="mb-4 text-[15px] font-bold text-[#2b8aa8]">Redes sociales y de contacto</h3>
          <div className="grid gap-6">{socialFields.map(({ model, name }) => <div key={model} data-field={model} className="grid gap-2">
            <Label htmlFor={model}>Link de {name}</Label>
            <div className="relative">
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-4 flex items-center"><SocialIcon platform={model} /></span>
              <Input id={model} type="url" inputMode="url" value={values[model]} placeholder="https://..." onChange={(event) => update({ [model]: event.target.value })} className={`${fieldClassName} pl-10`} state={errors[model] ? "error" : "default"} aria-invalid={Boolean(errors[model])} aria-describedby={errors[model] ? `${model}-error` : undefined} />
            </div>
            <ErrorText id={model} message={errors[model]} />
          </div>)}</div>
          <ErrorText id="socials" message={errors.socials} />
        </div>}

        {step.id === "emprendimiento" && <div className="mt-8 grid gap-6">
          <div data-field="reporte_tributario" tabIndex={-1} className="grid gap-2 outline-none">
            <Label htmlFor="reporte_tributario">Adjuntar su reporte tributario (opcional)</Label>
            {record.reporte_tributario && <p className="text-sm text-[#3e647d]">Archivo registrado: {record.reporte_tributario.nombre_original ?? `Reporte ${record.reporte_tributario.archivo_id ?? "tributario"}`}</p>}
            <input id="reporte_tributario" type="file" accept=".pdf,application/pdf" onChange={chooseReport} aria-describedby="reporte_tributario-help reporte_tributario-error" aria-invalid={Boolean(errors.reporte_tributario)} className="block w-full rounded-lg border border-[#a7a7a7] p-3 text-sm text-[#3e647d] file:mr-3 file:rounded-md file:border-0 file:bg-[#e6f4f9] file:px-3 file:py-2 file:text-[#124e78]" />
            <p id="reporte_tributario-help" className="text-xs text-[#5a7585]">Solo archivo PDF (máximo 10 MB).</p>
            {files.reporte && <div className="flex items-center justify-between gap-3 rounded-lg bg-[#f7fdff] px-3 py-2 text-sm text-[#124e78]"><span className="min-w-0 break-all">{files.reporte.name}</span><button type="button" onClick={() => { setFiles((previous) => ({ ...previous, reporte: null })); setErrors((previous) => ({ ...previous, reporte_tributario: undefined })); }} className="shrink-0 text-red-600">Quitar</button></div>}
            <ErrorText id="reporte_tributario" message={errors.reporte_tributario} />
          </div>
          <div data-field="terminos_condiciones" tabIndex={-1} className="rounded-lg border border-[#c9d4dc] bg-[#f7fdff] p-5 outline-none">
            <h3 className="text-[15px] font-bold text-[#124e78]">Términos y Condiciones</h3>
            <p className="mt-2 text-sm text-[#3e647d]">Para recibir constancias por parte de ferias:</p>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#3e647d]">
              <li>Cumplir con los lineamientos de participación en las ferias.</li>
              <li>Cumplir con el plan de acción, que entre otros implica la participación en las capacitaciones en el marco de las ferias comerciales.</li>
            </ul>
            <label className="mt-5 flex cursor-pointer items-start gap-3 text-[#124e78]"><input type="checkbox" checked={values.terminos_condiciones} onChange={(event) => update({ terminos_condiciones: event.target.checked })} className="mt-1 h-4 w-4 shrink-0 accent-[#2b8aa8]" aria-required="true" aria-invalid={Boolean(errors.terminos_condiciones)} aria-describedby={errors.terminos_condiciones ? "terminos_condiciones-error" : undefined} />Acepto los Términos y Condiciones</label>
            <ErrorText id="terminos_condiciones" message={errors.terminos_condiciones} />
          </div>
        </div>}

      </section>)}
      {saveNotice && <p role={saveNotice.type === "error" ? "alert" : "status"} className={`rounded-lg border px-4 py-3 text-sm ${saveNotice.type === "error" ? "border-input-error/30 bg-input-error/5 text-input-error" : "border-[#b9dce5] bg-[#f0fafc] text-[#124e78]"}`}>{saveNotice.text}</p>}
      <footer className="flex flex-col gap-4 border-t border-[#e0e7ec] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#5a7585]">Guarda los cambios del participante seleccionado.</p>
        <Button type="submit" disabled={saving || Boolean(loadingLookup)} className="shrink-0 bg-[#2b8aa8] px-6 hover:bg-[#20708a]">{saving ? "Guardando..." : "Guardar cambios"}</Button>
      </footer>
      </fieldset>
    </form>
    <ModalOverlay
      isOpen={successModalOpen}
      onOpenChange={setSuccessModalOpen}
      isDismissable
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
    >
      <Modal className="w-full max-w-md outline-none">
        <Dialog aria-labelledby="feriante-actualizado-title" aria-describedby="feriante-actualizado-message" className="rounded-2xl bg-white p-6 text-center shadow-2xl outline-none md:p-8">
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="m7 12 3 3 7-7" />
            </svg>
          </span>
          <h2 id="feriante-actualizado-title" className="text-xl font-bold text-[#124e78]">¡Datos actualizados!</h2>
          <p id="feriante-actualizado-message" className="mt-3 text-sm leading-relaxed text-[#3e647d]">Los datos del participante se han actualizado correctamente.</p>
          <Button type="button" autoFocus onPress={() => setSuccessModalOpen(false)} className="mx-auto mt-6 bg-[#2b8aa8] px-10 hover:bg-[#20708a] focus:ring-[#2b8aa8]/30">Aceptar</Button>
        </Dialog>
      </Modal>
    </ModalOverlay>
    <ModalOverlay
      isOpen={socialErrorsModalOpen}
      onOpenChange={(open) => { if (!open) closeSocialErrorsModal(); }}
      isDismissable
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
    >
      <Modal className="max-h-full w-full max-w-lg overflow-y-auto outline-none">
        <Dialog aria-labelledby="feriante-enlaces-title" aria-describedby="feriante-enlaces-message" className="rounded-2xl bg-white p-6 shadow-2xl outline-none md:p-8">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
            </svg>
          </span>
          <h2 id="feriante-enlaces-title" className="text-center text-xl font-bold text-[#124e78]">Corrige los enlaces de contacto</h2>
          <p id="feriante-enlaces-message" className="mt-3 text-sm leading-relaxed text-[#3e647d]">Los siguientes campos deben contener una URL válida antes de guardar los cambios:</p>
          <ul className="mt-4 space-y-3">
            {socialFields.filter(({ model }) => errors[model]).map(({ model, name }) => (
              <li key={model} className="rounded-lg border border-input-error/20 bg-input-error/5 p-3 text-sm text-input-error">
                <p className="font-semibold">Link de {name}</p>
                <p className="mt-1 break-words leading-relaxed">{errors[model]}</p>
              </li>
            ))}
          </ul>
          <Button type="button" autoFocus onPress={closeSocialErrorsModal} className="mx-auto mt-6 bg-[#2b8aa8] px-8 hover:bg-[#20708a] focus:ring-[#2b8aa8]/30">Corregir enlaces</Button>
        </Dialog>
      </Modal>
    </ModalOverlay>
    </>
  );
}

export default function ActualizarDatosFeriantes() {
  const { context, error, loading, updateContext } = useFerianteEditContext();
  useEffect(() => {
    const previous = document.title;
    document.title = "Tu Empresa | Actualizar datos de feriantes";
    return () => { document.title = previous; };
  }, []);

  return (
    <main className="min-h-screen w-full bg-white py-6">
      <div className="mx-auto w-full max-w-[1000px] px-4 md:px-8">
        <section className="relative min-h-[100vh] overflow-hidden rounded-md border border-[#e0e0e0] bg-white shadow-[0_12px_24px_rgba(0,0,0,0.08)]">
          <header className="relative bg-[#f7fdff] px-8 py-8 md:px-14 md:py-12">
            <p className="mb-2 text-[16px] text-[#124e78]">Ferias · Programa Nacional Tu Empresa</p>
            <h1 className="max-w-3xl text-[24px] font-extrabold leading-[1.15] text-[#2b8aa8] md:text-[30px]">Editar datos del participante</h1>
            <p className="mt-4 text-[14.5px] leading-relaxed text-[#3e647d]">{context?.event?.tema ?? "Revisa y edita los datos del participante, su empresa y su emprendimiento."}</p>
          </header>
          <div className="h-[8px] w-full bg-[#2b8aa8]" />
          <div className="px-8 py-6 md:px-14 md:py-10">
            {loading ? <p role="status" className="text-sm text-[#3e647d]">Cargando datos del participante...</p>
              : error ? <div role="alert" className="rounded-lg bg-red-50 p-5 text-sm text-input-error">{error}</div>
                : context ? <FeriaEditForm key={`${context.record.slug}-${context.record.id}`} context={context} onSaved={updateContext} /> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
