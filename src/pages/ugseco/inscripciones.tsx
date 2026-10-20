

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ugsecoIcon from "@/assets/icons/ugseco.ico";
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
import {
  getCountries,
  getDistricts,
  getDocumentTypes,
  getGenders,
  getProvinces,
  getRegions,
  getRubros,
  getSectors,
  type SelectOption,
} from "@/services/selects";

const steps = ["Datos de la Cooperativa", "Datos de la Empresa", "Datos del Participante"];

const WHATSAPP_COMMUNITY_URL =
  "https://chat.whatsapp.com/FcqgLQvvmP23HN1TYxQH5N";

// Color y medidas de marca de esta página: borde #a7a7a7, alto 50px
// y focus #2b8aa8 sobre los estilos base de Tailgrids
// (solo aquí, sin tocar el core).
const brandFieldCls = "h-[45px] border-[#a7a7a7] focus:border-[#2b8aa8] focus:ring-[#2b8aa8]/25";

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

function StepHeader({ current }: { current: number }) {
  return (
    <div className="mb-8 flex items-center">
      {steps.map((label, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <div key={label} className={`flex items-center ${i < steps.length - 1 ? "flex-1" : ""}`}>
            <div className="flex items-center gap-2.5">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold transition-colors ${active
                  ? "bg-[#2b8aa8] text-white"
                  : done
                    ? "bg-[#2b8aa8]/20 text-[#2b8aa8]"
                    : "border border-[#c9d4dc] bg-white text-[#8a9aa6]"
                  }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={`hidden text-[13.5px] sm:block ${active ? "font-bold text-[#2b8aa8]" : "font-medium text-[#8a9aa6]"
                  }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`mx-3 h-px flex-1 sm:mx-4 ${done ? "bg-[#2b8aa8]" : "bg-[#dbe3e9]"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

const RUC_PREFIXES = ["10", "15", "17", "20"];

function isValidRucPrefix(value: string) {
  if (value.length === 0) return true;
  const prefix = value.slice(0, 2);
  return RUC_PREFIXES.some((p) => p.startsWith(prefix));
}

function RucField({
  id,
  label,
  placeholder,
  value,
  onChange,
  required = false,
  showErrors = false,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  showErrors?: boolean;
}) {
  const [touched, setTouched] = useState(false);

  const prefixValid = isValidRucPrefix(value);
  const complete = value.length === 11;
  const error = !prefixValid
    ? "El RUC debe iniciar con 10, 15, 17 o 20."
    : (touched || (required && showErrors)) && !complete
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

function PhoneField({
  id,
  label,
  placeholder,
  value,
  onChange,
  required = false,
  showErrors = false,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  showErrors?: boolean;
}) {
  const [touched, setTouched] = useState(false);

  const prefixValid = value.length === 0 || value.startsWith("9");
  const complete = value.length === 9;
  const shouldShow = touched || (required && showErrors);
  const error = !prefixValid
    ? "El número de celular debe empezar con 9."
    : shouldShow && !complete
      ? required && value === ""
        ? "El número de celular es obligatorio."
        : "El número de celular debe tener exactamente 9 dígitos numéricos."
      : null;
  const errorId = `${id}-error`;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <BrandInput
        id={id}
        placeholder={placeholder}
        type="tel"
        inputMode="numeric"
        autoComplete="off"
        maxLength={9}
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(event.target.value.replace(/\D/g, "").slice(0, 9))
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function EmailField({
  id,
  label,
  placeholder,
  value,
  onChange,
  required = false,
  showErrors = false,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  showErrors?: boolean;
}) {
  const [touched, setTouched] = useState(false);

  const trimmed = value.trim();
  const shouldShow = touched || (required && showErrors);
  const error = shouldShow
    ? trimmed === ""
      ? required
        ? "El correo electrónico es obligatorio."
        : null
      : !EMAIL_REGEX.test(trimmed)
        ? "Ingrese un correo electrónico válido."
        : null
    : null;
  const errorId = `${id}-error`;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <BrandInput
        id={id}
        placeholder={placeholder}
        type="email"
        autoComplete="email"
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(event.target.value)
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

function useSelectOptions(loader: () => Promise<SelectOption[]>) {
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const loaderRef = useRef(loader);

  useEffect(() => {
    let active = true;
    loaderRef
      .current()
      .then((data) => {
        if (active) setOptions(data);
      })
      .catch(() => {
        if (active) setOptions([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { options, loading };
}

function OptionsSelectField({
  id,
  label,
  placeholder,
  loader,
  value,
  onChange,
  disabled = false,
  disabledPlaceholder = "Seleccione primero la opción anterior",
  filter,
  error,
}: {
  id: string;
  label: string;
  placeholder: string;
  loader: () => Promise<SelectOption[]>;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  disabledPlaceholder?: string;
  filter?: (option: SelectOption) => boolean;
  error?: string | null;
}) {
  const { options, loading } = useSelectOptions(loader);
  const controlled = value !== undefined;
  const visibleOptions = filter ? options.filter(filter) : options;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <BrandSelect
        id={id}
        {...(controlled
          ? {
            value,
            onChange: (event: ChangeEvent<HTMLSelectElement>) =>
              onChange?.(event.target.value),
          }
          : { defaultValue: "" })}
        placeholder={
          disabled ? disabledPlaceholder : loading ? "Cargando..." : placeholder
        }
        disabled={disabled}
        variant={error ? "error" : "default"}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      >
        {visibleOptions.map((o) => (
          <NativeSelectOption key={o.value} value={o.value}>
            {o.label}
          </NativeSelectOption>
        ))}
      </BrandSelect>
      {error && (
        <p id={`${id}-error`} className="text-xs text-input-error">
          {error}
        </p>
      )}
    </div>
  );
}

type CooperativaForm = {
  ruc: string;
  razonSocial: string;
  rol: string;
};

const emptyCooperativaForm: CooperativaForm = {
  ruc: "",
  razonSocial: "",
  rol: "",
};

function isCooperativaFormValid(values: CooperativaForm) {
  return (
    isValidRucPrefix(values.ruc) &&
    values.ruc.length === 11 &&
    values.razonSocial.trim().length > 0 &&
    values.rol !== ""
  );
}

type EmpresaForm = {
  ruc: string;
  razonSocial: string;
  nombreComercial: string;
  sector: string;
  rubro: string;
  actividad: string;
  region: string;
  province: string;
  district: string;
  direccion: string;
};

const emptyEmpresaForm: EmpresaForm = {
  ruc: "",
  razonSocial: "",
  nombreComercial: "",
  sector: "",
  rubro: "",
  actividad: "",
  region: "",
  province: "",
  district: "",
  direccion: "",
};

function isEmpresaFormValid(values: EmpresaForm) {
  return (
    values.nombreComercial.trim().length > 0 &&
    values.sector !== "" &&
    values.rubro !== "" &&
    values.actividad.trim().length > 0 &&
    values.region !== "" &&
    values.province !== "" &&
    values.district !== "" &&
    values.direccion.trim().length > 0
  );
}

function StepCooperativa({
  values,
  onChange,
  showErrors,
}: {
  values: CooperativaForm;
  onChange: (values: CooperativaForm) => void;
  showErrors: boolean;
}) {
  const { ruc, razonSocial, rol } = values;
  const update = (patch: Partial<CooperativaForm>) =>
    onChange({ ...values, ...patch });

  const razonSocialError =
    showErrors && razonSocial.trim().length === 0
      ? "La razón social es obligatoria."
      : null;
  const rolError = showErrors && rol === "" ? "El rol es obligatorio." : null;

  return (
    <div>
      <h3 className="mb-4 text-[15px] font-bold text-[#2b8aa8]">Datos de la Cooperativa</h3>
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
        <RucField
          id="ruc-cooperativa"
          label="Número de RUC Cooperativa"
          placeholder="Ingrese el número de RUC"
          value={ruc}
          onChange={(value) => update({ ruc: value })}
          required
          showErrors={showErrors}
        />
        <div className="grid gap-2">
          <Label htmlFor="razon-cooperativa">Razón Social Cooperativa</Label>
          <BrandInput
            id="razon-cooperativa"
            placeholder="Ingrese la razón social"
            value={razonSocial}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              update({ razonSocial: event.target.value })
            }
            state={razonSocialError ? "error" : "default"}
            aria-invalid={razonSocialError ? true : undefined}
            aria-describedby={
              razonSocialError ? "razon-cooperativa-error" : undefined
            }
          />
          {razonSocialError && (
            <p
              id="razon-cooperativa-error"
              className="text-xs text-input-error"
            >
              {razonSocialError}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="rol-cooperativa">¿Cuál es tu rol en la cooperativa?</Label>
          <BrandSelect
            id="rol-cooperativa"
            value={rol}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              update({ rol: event.target.value })
            }
            variant={rolError ? "error" : "default"}
            placeholder="Seleccione su rol"
            aria-invalid={rolError ? true : undefined}
            aria-describedby={rolError ? "rol-cooperativa-error" : undefined}
          >
            <NativeSelectOption value="dir">DIRIGENTE</NativeSelectOption>
            <NativeSelectOption value="soc">SOCIO</NativeSelectOption>
            <NativeSelectOption value="mie">MIEMBRO</NativeSelectOption>
          </BrandSelect>
          {rolError && (
            <p id="rol-cooperativa-error" className="text-xs text-input-error">
              {rolError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StepEmpresa({
  values,
  onChange,
  showErrors,
}: {
  values: EmpresaForm;
  onChange: (values: EmpresaForm) => void;
  showErrors: boolean;
}) {
  const {
    ruc,
    razonSocial,
    nombreComercial,
    sector,
    rubro,
    actividad,
    region,
    province,
    district,
    direccion,
  } = values;
  const update = (patch: Partial<EmpresaForm>) =>
    onChange({ ...values, ...patch });

  const nombreComercialError =
    showErrors && nombreComercial.trim() === ""
      ? "El nombre comercial es obligatorio."
      : null;
  const actividadError =
    showErrors && actividad.trim() === ""
      ? "La actividad comercial es obligatoria."
      : null;
  const direccionError =
    showErrors && direccion.trim() === ""
      ? "La dirección es obligatoria."
      : null;
  const sectorError =
    showErrors && sector === "" ? "El sector económico es obligatorio." : null;
  const rubroError =
    showErrors && rubro === "" ? "El rubro es obligatorio." : null;
  const regionError =
    showErrors && region === "" ? "La región es obligatoria." : null;
  const provinceError =
    showErrors && region !== "" && province === ""
      ? "La provincia es obligatoria."
      : null;
  const districtError =
    showErrors && province !== "" && district === ""
      ? "El distrito es obligatorio."
      : null;

  return (
    <div>
      <h3 className="mb-4 text-[15px] font-bold text-[#2b8aa8]">Datos de la Empresa</h3>
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
        <RucField
          id="ruc-empresa"
          label="Número de RUC"
          placeholder="Ingrese el número de RUC"
          value={ruc}
          onChange={(value) => update({ ruc: value })}
        />
        <div className="grid gap-2">
          <Label htmlFor="razon-empresa">Razón Social</Label>
          <BrandInput
            id="razon-empresa"
            placeholder="Ingrese la razón social"
            value={razonSocial}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              update({ razonSocial: event.target.value })
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="nombre-comercial">Nombre Comercial (marca)</Label>
          <BrandInput
            id="nombre-comercial"
            placeholder="Ingrese el nombre comercial"
            value={nombreComercial}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              update({ nombreComercial: event.target.value })
            }
            state={nombreComercialError ? "error" : "default"}
            aria-invalid={nombreComercialError ? true : undefined}
            aria-describedby={
              nombreComercialError ? "nombre-comercial-error" : undefined
            }
          />
          {nombreComercialError && (
            <p id="nombre-comercial-error" className="text-xs text-input-error">
              {nombreComercialError}
            </p>
          )}
        </div>
        <OptionsSelectField
          id="sector"
          label="Sector Económico"
          placeholder="Seleccione el sector"
          loader={getSectors}
          value={sector}
          onChange={(next) => update({ sector: next })}
          error={sectorError}
        />
        <OptionsSelectField
          id="rubro"
          label="Rubro"
          placeholder="Seleccione el rubro"
          loader={getRubros}
          value={rubro}
          onChange={(next) => update({ rubro: next })}
          error={rubroError}
        />
        <div className="grid gap-2">
          <Label htmlFor="actividad">Actividad Comercial</Label>
          <BrandInput
            id="actividad"
            placeholder="Ingrese la actividad comercial"
            value={actividad}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              update({ actividad: event.target.value })
            }
            state={actividadError ? "error" : "default"}
            aria-invalid={actividadError ? true : undefined}
            aria-describedby={actividadError ? "actividad-error" : undefined}
          />
          {actividadError && (
            <p id="actividad-error" className="text-xs text-input-error">
              {actividadError}
            </p>
          )}
        </div>
        <OptionsSelectField
          id="region"
          label="Región"
          placeholder="Seleccione la región"
          loader={getRegions}
          value={region}
          onChange={(next) =>
            update({ region: next, province: "", district: "" })
          }
          error={regionError}
        />
        <OptionsSelectField
          key={`provincia-${region}`}
          id="provincia"
          label="Provincia"
          placeholder="Seleccione la provincia"
          disabledPlaceholder="Seleccione primero la región"
          loader={() => (region ? getProvinces(region) : Promise.resolve([]))}
          value={province}
          onChange={(next) => update({ province: next, district: "" })}
          disabled={!region}
          error={provinceError}
        />
        <OptionsSelectField
          key={`distrito-${province}`}
          id="distrito"
          label="Distrito"
          placeholder="Seleccione el distrito"
          disabledPlaceholder="Seleccione primero la provincia"
          loader={() => (province ? getDistricts(province) : Promise.resolve([]))}
          value={district}
          onChange={(next) => update({ district: next })}
          disabled={!province}
          error={districtError}
        />
        <div className="grid gap-2">
          <Label htmlFor="direccion">Dirección</Label>
          <BrandInput
            id="direccion"
            placeholder="Ingrese la dirección"
            value={direccion}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              update({ direccion: event.target.value })
            }
            state={direccionError ? "error" : "default"}
            aria-invalid={direccionError ? true : undefined}
            aria-describedby={direccionError ? "direccion-error" : undefined}
          />
          {direccionError && (
            <p id="direccion-error" className="text-xs text-input-error">
              {direccionError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function GenderField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
}) {
  return (
    <OptionsSelectField
      id="genero"
      label="Género"
      placeholder="Seleccione el género"
      loader={getGenders}
      value={value}
      onChange={onChange}
      error={error}
    />
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

type ParticipanteSnapshot = {
  documentType: string;
  documentNumber: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
  genero: string;
  discapacidad: string;
  celular: string;
  correo: string;
  pais: string;
};

type ParticipanteHandle = {
  validate: () => boolean;
  getValues: () => ParticipanteSnapshot;
};

function StepParticipante({
  handleRef,
  showErrors,
}: {
  handleRef: { current: ParticipanteHandle };
  showErrors: boolean;
}) {
  const [documentType, setDocumentType] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [documentNumberTouched, setDocumentNumberTouched] = useState(false);
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [nombres, setNombres] = useState("");
  const [genero, setGenero] = useState("");
  const [discapacidad, setDiscapacidad] = useState("");
  const [celular, setCelular] = useState("");
  const [correo, setCorreo] = useState("");
  const [country, setCountry] = useState("");
  const { options: documentTypes } = useSelectOptions(getDocumentTypes);
  const { options: countries } = useSelectOptions(getCountries);

  const dniValue = documentTypes.find(
    (o) => normalizeOptionLabel(o.label) === "DNI"
  )?.value;
  const peruValue = countries.find(
    (o) => normalizeOptionLabel(o.label) === "PERU"
  )?.value;
  const dniValueStr = dniValue === undefined ? "" : String(dniValue);
  const peruValueStr = peruValue === undefined ? "" : String(peruValue);
  const isDni = documentType !== "" && documentType === dniValueStr;

  const documentRule = getDocumentRule(documentTypes, documentType);
  const documentNumberMaxLength = documentRule?.length;

  const documentTypeError =
    showErrors && documentType === ""
      ? "El tipo de documento es obligatorio."
      : null;
  const documentNumberError =
    showErrors && documentNumber === ""
      ? "El número de documento es obligatorio."
      : documentRule &&
          (documentNumberTouched || showErrors) &&
          documentNumber.length !== documentRule.length
        ? `El ${documentRule.name} debe tener exactamente ${documentRule.length} dígitos numéricos.`
        : null;
  const apellidoPaternoError =
    showErrors && apellidoPaterno.trim() === ""
      ? "El apellido paterno es obligatorio."
      : null;
  const apellidoMaternoError =
    showErrors && apellidoMaterno.trim() === ""
      ? "El apellido materno es obligatorio."
      : null;
  const nombresError =
    showErrors && nombres.trim() === ""
      ? "Los nombres son obligatorios."
      : null;
  const generoError =
    showErrors && genero === "" ? "El género es obligatorio." : null;
  const discapacidadError =
    showErrors && discapacidad === ""
      ? "Seleccione si tiene alguna discapacidad."
      : null;
  const paisError =
    showErrors && documentType !== "" && !isDni && country === ""
      ? "El país de nacimiento es obligatorio."
      : null;

  const documentNumberValid = documentRule
    ? documentNumber.length === documentRule.length
    : documentNumber.trim() !== "";
  const isValid =
    documentType !== "" &&
    documentNumberValid &&
    apellidoPaterno.trim() !== "" &&
    apellidoMaterno.trim() !== "" &&
    nombres.trim() !== "" &&
    genero !== "" &&
    discapacidad !== "" &&
    /^9\d{8}$/.test(celular) &&
    EMAIL_REGEX.test(correo.trim()) &&
    (isDni || country !== "");

  useEffect(() => {
    handleRef.current = {
      validate: () => isValid,
      getValues: () => ({
        documentType,
        documentNumber,
        apellidoPaterno,
        apellidoMaterno,
        nombres,
        genero,
        discapacidad,
        celular,
        correo,
        pais: isDni ? peruValueStr : country,
      }),
    };
  });

  const isPeru = (o: SelectOption) =>
    peruValueStr !== "" && String(o.value) === peruValueStr;
  const isNotPeru = (o: SelectOption) => !isPeru(o);

  return (
    <div>
      <h3 className="mb-4 text-[15px] font-bold text-[#2b8aa8]">Datos del Participante</h3>
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
        <OptionsSelectField
          id="tipo-doc"
          label="Tipo de documento"
          placeholder="Seleccione el tipo"
          loader={getDocumentTypes}
          value={documentType}
          onChange={(next) => {
            setDocumentType(next);
            setDocumentNumberTouched(false);
            const nextRule = getDocumentRule(documentTypes, next);
            if (nextRule) {
              setDocumentNumber((prev) => prev.slice(0, nextRule.length));
            }
            if (next === dniValueStr) {
              setCountry(peruValueStr);
            } else if (country === peruValueStr) {
              setCountry("");
            }
          }}
          error={documentTypeError}
        />
        <div className="grid gap-2">
          <Label htmlFor="num-doc">Número de Documento</Label>
          <BrandInput
            id="num-doc"
            placeholder={
              documentRule
                ? `Ingrese los ${documentRule.length} dígitos`
                : "Ingrese el número de documento"
            }
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={documentNumberMaxLength}
            value={documentNumber}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setDocumentNumber(
                event.target.value
                  .replace(/\D/g, "")
                  .slice(0, documentNumberMaxLength)
              )
            }
            onBlur={() => setDocumentNumberTouched(true)}
            state={documentNumberError ? "error" : "default"}
            aria-invalid={documentNumberError ? true : undefined}
            aria-describedby={
              documentNumberError ? "num-doc-error" : undefined
            }
          />
          {documentNumberError && (
            <p id="num-doc-error" className="text-xs text-input-error">
              {documentNumberError}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="ap-paterno">Apellido Paterno</Label>
          <BrandInput
            id="ap-paterno"
            placeholder="Ingrese el apellido paterno"
            value={apellidoPaterno}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setApellidoPaterno(event.target.value)
            }
            state={apellidoPaternoError ? "error" : "default"}
            aria-invalid={apellidoPaternoError ? true : undefined}
            aria-describedby={
              apellidoPaternoError ? "ap-paterno-error" : undefined
            }
          />
          {apellidoPaternoError && (
            <p id="ap-paterno-error" className="text-xs text-input-error">
              {apellidoPaternoError}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="ap-materno">Apellido Materno</Label>
          <BrandInput
            id="ap-materno"
            placeholder="Ingrese el apellido materno"
            value={apellidoMaterno}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setApellidoMaterno(event.target.value)
            }
            state={apellidoMaternoError ? "error" : "default"}
            aria-invalid={apellidoMaternoError ? true : undefined}
            aria-describedby={
              apellidoMaternoError ? "ap-materno-error" : undefined
            }
          />
          {apellidoMaternoError && (
            <p id="ap-materno-error" className="text-xs text-input-error">
              {apellidoMaternoError}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="nombres">Nombres</Label>
          <BrandInput
            id="nombres"
            placeholder="Ingrese los nombres"
            value={nombres}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setNombres(event.target.value)
            }
            state={nombresError ? "error" : "default"}
            aria-invalid={nombresError ? true : undefined}
            aria-describedby={nombresError ? "nombres-error" : undefined}
          />
          {nombresError && (
            <p id="nombres-error" className="text-xs text-input-error">
              {nombresError}
            </p>
          )}
        </div>
        <GenderField value={genero} onChange={setGenero} error={generoError} />
        <div className="grid gap-2">
          <Label htmlFor="discapacidad">¿Tiene alguna discapacidad?</Label>
          <BrandSelect
            id="discapacidad"
            value={discapacidad}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setDiscapacidad(event.target.value)
            }
            variant={discapacidadError ? "error" : "default"}
            placeholder="Seleccione una opción"
            aria-invalid={discapacidadError ? true : undefined}
            aria-describedby={
              discapacidadError ? "discapacidad-error" : undefined
            }
          >
            <NativeSelectOption value="1">SI</NativeSelectOption>
            <NativeSelectOption value="0">NO</NativeSelectOption>
          </BrandSelect>
          {discapacidadError && (
            <p id="discapacidad-error" className="text-xs text-input-error">
              {discapacidadError}
            </p>
          )}
        </div>
        <PhoneField
          id="celular"
          label="Número de celular"
          placeholder="Ingrese el número de celular"
          value={celular}
          onChange={setCelular}
          required
          showErrors={showErrors}
        />
        <EmailField
          id="correo"
          label="Correo electrónico"
          placeholder="Ingrese el correo electrónico"
          value={correo}
          onChange={setCorreo}
          required
          showErrors={showErrors}
        />
        <OptionsSelectField
          id="pais"
          label="País de nacimiento"
          placeholder="Seleccione el país"
          disabledPlaceholder={
            documentType === ""
              ? "Seleccione primero el tipo de documento"
              : undefined
          }
          loader={getCountries}
          value={isDni ? peruValueStr : country}
          onChange={setCountry}
          disabled={documentType === "" || isDni}
          filter={isDni ? isPeru : isNotPeru}
          error={paisError}
        />
      </div>
    </div>
  );
}

function RegistrationStepper({
  slug,
  course,
}: {
  slug: string | null;
  course: CourseDetail | null;
}) {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [successOpen, setSuccessOpen] = useState(false);
  const [cooperativa, setCooperativa] =
    useState<CooperativaForm>(emptyCooperativaForm);
  const [showCooperativaErrors, setShowCooperativaErrors] = useState(false);
  const [empresa, setEmpresa] = useState<EmpresaForm>(emptyEmpresaForm);
  const [showEmpresaErrors, setShowEmpresaErrors] = useState(false);
  const [showParticipanteErrors, setShowParticipanteErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const participanteHandle = useRef<ParticipanteHandle>({
    validate: () => false,
    getValues: () => ({
      documentType: "",
      documentNumber: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      nombres: "",
      genero: "",
      discapacidad: "",
      celular: "",
      correo: "",
      pais: "",
    }),
  });
  const last = current === steps.length - 1;
  const calendarUrl = buildGoogleCalendarUrl(course);

  const handleNext = () => {
    if (current === 0 && !isCooperativaFormValid(cooperativa)) {
      setShowCooperativaErrors(true);
      return;
    }
    if (current === 1 && !isEmpresaFormValid(empresa)) {
      setShowEmpresaErrors(true);
      return;
    }
    setCurrent((c) => c + 1);
  };

  const toId = (value: string) => (value === "" ? null : Number(value));

  const handleCloseSuccess = () => {
    setSuccessOpen(false);
    navigate("/ugseco/capacitaciones");
  };

  const handleRegister = async () => {
    if (!slug) {
      setSubmitError(
        "No se pudo identificar la capacitación. Vuelva a seleccionarla desde el listado."
      );
      return;
    }

    const participante = participanteHandle.current;
    if (!participante.validate()) {
      setShowParticipanteErrors(true);
      return;
    }

    const participanteValues = participante.getValues();
    const payload = {
      slug,
      ruc: empresa.ruc,
      razon_social: empresa.razonSocial,
      nombre_comercial: empresa.nombreComercial,
      sector_economico_id: toId(empresa.sector),
      rubro_id: toId(empresa.rubro),
      region_id: toId(empresa.region),
      provincia_id: toId(empresa.province),
      distrito_id: toId(empresa.district),
      direccion: empresa.direccion,
      pais_id: toId(participanteValues.pais),
      tipo_documento_id: toId(participanteValues.documentType),
      numero_dni: participanteValues.documentNumber,
      apellido_paterno: participanteValues.apellidoPaterno,
      apellido_materno: participanteValues.apellidoMaterno,
      nombres: participanteValues.nombres,
      genero_id: toId(participanteValues.genero),
      discapacidad: Number(participanteValues.discapacidad),
      celular: participanteValues.celular,
      correo_electronico: participanteValues.correo,
      actividad_comercial_nombre: empresa.actividad,
      coop_ruc: cooperativa.ruc,
      coop_razon_social: cooperativa.razonSocial,
      coop_rol: cooperativa.rol,
    };

    setSubmitting(true);
    setSubmitError(null);
    try {
      await httpRequest({
        method: "POST",
        url: "event-pnte-public/registro-cooperativas",
        data: payload,
      });
      setSuccessOpen(true);
    } catch {
      setSubmitError("No se pudo completar el registro. Intente nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="[&_label]:text-[14px] [&_label]:font-normal">
      <StepHeader current={current} />

      {current === 0 && (
        <StepCooperativa
          values={cooperativa}
          onChange={setCooperativa}
          showErrors={showCooperativaErrors}
        />
      )}
      {current === 1 && (
        <StepEmpresa
          values={empresa}
          onChange={setEmpresa}
          showErrors={showEmpresaErrors}
        />
      )}
      {current === 2 && (
        <StepParticipante
          handleRef={participanteHandle}
          showErrors={showParticipanteErrors}
        />
      )}

      <div className={`mt-8 flex ${current === 0 ? "justify-end" : "justify-between"}`}>
        {current > 0 && (
          <Button
            appearance="outline"
            onPress={() => setCurrent((c) => c - 1)}
            className="border-[#2b8aa8] text-[#2b8aa8] hover:bg-[#2b8aa8]/10 hover:text-[#2b8aa8]"
          >
            ← Atrás
          </Button>
        )}
        {!last ? (
          <Button
            onPress={handleNext}
            className="bg-[#2b8aa8] hover:bg-[#20708a] focus:ring-[#2b8aa8]/30"
          >
            Continuar →
          </Button>
        ) : (
          <button
            type="button"
            onClick={handleRegister}
            disabled={submitting}
            className="rounded-md bg-[#2b8aa8] px-12 py-2.5 text-[14px] font-bold tracking-[0.15em] text-white transition-colors hover:bg-[#20708a] disabled:opacity-60"
          >
            {submitting ? "REGISTRANDO..." : "REGISTRAR"}
          </button>
        )}
      </div>
      {submitError && (
        <p className="mt-3 text-right text-xs text-input-error">
          {submitError}
        </p>
      )}

      {successOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="registro-exitoso-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl md:p-8">
            <div className="flex flex-col items-center text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f7ef] text-[#10b981]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-9 w-9"
                  aria-hidden="true"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>

              <h2
                id="registro-exitoso-title"
                className="mt-5 text-[22px] font-bold text-[#124e78]"
              >
                ¡Gracias por registrarte!
              </h2>

              <p className="mt-2 text-[14px] leading-relaxed text-[#3e647d]">
                Tu registro se completó correctamente. Ahora puedes unirte a
                nuestra comunidad y agendar la capacitación en tu calendario.
              </p>

              <a
                href={WHATSAPP_COMMUNITY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-3 text-[14px] font-bold text-white transition-colors hover:bg-[#1ebe5b]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.099-.198.05-.371-.05-.52-.099-.148-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                </svg>
                Únete a nuestra comunidad en WhatsApp
              </a>

              <a
                href={calendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#2b8aa8] bg-white px-4 py-3 text-[14px] font-bold text-[#2b8aa8] transition-colors hover:bg-[#f0f9fc]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
                </svg>
                Agendar en Google Calendar
              </a>

              <button
                type="button"
                onClick={handleCloseSuccess}
                className="mt-4 text-[13px] font-medium text-[#64748b] underline underline-offset-2 transition-colors hover:text-[#124e78]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type CourseDetail = {
  slug: string;
  tema: string | null;
  fechas: string[] | null;
  horario: unknown;
  modalidad: string | null;
  asesor: string | null;
  link?: string | null;
  direccion?: string | null;
};

type CoursesResponse = {
  status: number;
  data: CourseDetail[];
};

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
    return horario.filter(Boolean).join(" - ") || "Por confirmar";
  }

  if (typeof horario === "string" && horario.trim() !== "") {
    return horario;
  }

  return "Por confirmar";
}

function formatModalidad(modalidad: string | null | undefined) {
  const value = modalidad?.trim().toUpperCase();

  if (!value) return "Por confirmar";
  if (value === "VIRTUAL") return "Vía Meet";

  return value.charAt(0) + value.slice(1).toLowerCase();
}

function padCalendarValue(value: number) {
  return String(value).padStart(2, "0");
}

function formatCalendarDateTime(date: Date) {
  return (
    `${date.getFullYear()}${padCalendarValue(date.getMonth() + 1)}` +
    `${padCalendarValue(date.getDate())}T${padCalendarValue(date.getHours())}` +
    `${padCalendarValue(date.getMinutes())}00`
  );
}

function formatCalendarDate(date: Date) {
  return `${date.getFullYear()}${padCalendarValue(date.getMonth() + 1)}${padCalendarValue(date.getDate())}`;
}

function parseHorarioRango(horario: unknown) {
  const text = Array.isArray(horario)
    ? horario.filter(Boolean).join(" - ")
    : typeof horario === "string"
      ? horario
      : "";

  const matches = [
    ...text.matchAll(/(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/gi),
  ]
    .map((match) => {
      let hour = Number(match[1]);
      const minute = Number(match[2] ?? 0);
      const meridiem = match[3]?.toLowerCase().replace(/\./g, "");

      if (meridiem === "pm" && hour < 12) hour += 12;
      if (meridiem === "am" && hour === 12) hour = 0;

      return { hour, minute };
    })
    .filter(
      ({ hour, minute }) => hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59
    );

  if (matches.length === 0) return null;

  const start = matches[0];
  const end = matches[1] ?? {
    hour: (start.hour + 1) % 24,
    minute: start.minute,
  };

  return { start, end };
}

function buildGoogleCalendarUrl(course: CourseDetail | null) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: course?.tema?.trim() || "Capacitación UGSEco",
    ctz: "America/Lima",
  });

  const details = [
    course?.tema ? `Capacitación: ${course.tema}` : null,
    course?.asesor ? `Capacitador: ${course.asesor}` : null,
    course?.link ? `Enlace de conexión: ${course.link}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  if (details) params.set("details", details);

  const location = course?.link || course?.direccion;
  if (location) params.set("location", location);

  const fecha = course?.fechas?.[0] ?? null;

  if (fecha) {
    const [year, month, day] = fecha.split("-").map(Number);

    if (year && month && day) {
      const rango = parseHorarioRango(course?.horario);

      if (rango) {
        const start = new Date(
          year,
          month - 1,
          day,
          rango.start.hour,
          rango.start.minute
        );
        const end = new Date(
          year,
          month - 1,
          day,
          rango.end.hour,
          rango.end.minute
        );

        if (end <= start) end.setDate(end.getDate() + 1);

        params.set(
          "dates",
          `${formatCalendarDateTime(start)}/${formatCalendarDateTime(end)}`
        );
      } else {
        const start = new Date(year, month - 1, day);
        const end = new Date(year, month - 1, day + 1);

        params.set(
          "dates",
          `${formatCalendarDate(start)}/${formatCalendarDate(end)}`
        );
      }
    }
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function HeroBanner({
  course,
  loading,
}: {
  course: CourseDetail | null;
  loading: boolean;
}) {
  const fecha = course?.fechas?.[0] ?? null;

  return (
    <div className="grid bg-[#f7fdff] md:grid-cols-[1fr_380px]">
      {/* Texto */}
      <div className="relative px-8 py-8 md:px-14 md:py-12">

        <h1 className="max-w-3xl text-[16px] leading-[1.15] md:text-[16px] mb-2">
          <span className="text-[#124e78]">Capacitaciones a las cooperativas</span>
        </h1>

        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-8 w-4/5 rounded bg-[#d5e7f1] md:h-11" />
            <div className="h-8 w-3/5 rounded bg-[#d5e7f1] md:h-11" />
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-[13px] font-medium text-[#2b8aa8]">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#2b8aa8] border-t-transparent" />
              Cargando capacitación...
            </div>
          </div>
        ) : (
          <h1 className="max-w-3xl text-[32px] font-extrabold leading-[1.15] md:text-[42px]">
            <span className="text-[#2b8aa8]">
              {course?.tema ?? "En el crecimiento de tu empresa"}
            </span>
          </h1>
        )}

        <div className={`mt-4 space-y-1.5 text-[14.5px] leading-relaxed ${loading ? "hidden" : ""}`}>
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
            <span className="text-[#3e647d]">{formatModalidad(course?.modalidad)}</span>
          </p>
          <p className="flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2b8aa8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span className="font-semibold text-[#124e78]">Capacitador: </span>
            <span className="text-[#3e647d]">{course?.asesor ?? "Por confirmar"}</span>
          </p>
        </div>

      </div>

      {/* Imagen */}
      <div className="relative m-0 hidden h-auto items-center justify-center overflow-hidden bg-[#f7fdff] p-0 md:flex">
        <img
          src="https://www.fundacione.org/img/Imagenes/Empresarios.webp"
          alt="Empresarios"
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

export default function Inscripciones() {
  useFavicon(ugsecoIcon);
  const [searchParams] = useSearchParams();
  const slug = searchParams.get("slug");
  const [loadedCourse, setLoadedCourse] = useState<{
    slug: string;
    course: CourseDetail | null;
  } | null>(null);

  useEffect(() => {
    if (!slug) return;

    let active = true;

    httpRequest<CoursesResponse>({
      method: "GET",
      url: "event-pnte-public/cursos-cooperativas-ugseco",
    })
      .then((response) => {
        if (!active) return;

        const found = (response.data ?? []).find((item) => item.slug === slug);
        setLoadedCourse({ slug, course: found ?? null });
      })
      .catch(() => {
        if (active) setLoadedCourse({ slug, course: null });
      });

    return () => {
      active = false;
    };
  }, [slug]);

  const isLoadingCourse = Boolean(slug) && loadedCourse?.slug !== slug;
  const course = loadedCourse?.slug === slug ? loadedCourse.course : null;

  if (isLoadingCourse) {
    return <PageLoading />;
  }

  return (
    <div className="min-h-screen w-full bg-[#fff] py-6">
      <div className="mx-auto w-full max-w-[1000px] px-4 md:px-8">
        <section className="relative min-h-[100vh] overflow-hidden rounded-md border border-[#e0e0e0] bg-white shadow-[0_12px_24px_rgba(0,0,0,0.08)]">
          <HeroBanner course={course} loading={isLoadingCourse} />

          {/* franja de unión */}
          <div className="h-[8px] w-full bg-[#2b8aa8]" />

          <div className="px-8 py-6 md:px-14 md:py-10">
            <RegistrationStepper slug={slug} course={course} />
          </div>
        </section>

      </div>
    </div>
  );
}