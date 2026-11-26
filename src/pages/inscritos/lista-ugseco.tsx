import { useEffect, useState } from "react";
import ugsecoIcon from "@/assets/icons/ugseco.ico";
import { useFavicon } from "@/hooks/useFavicon";
import { httpRequest } from "@/services/api";

interface InscritoUgseco {
  id?: number;
  ruc?: string;
  razon_social?: string | null;
  nombre_comercial?: string | null;
  sector_economico_id?: number | null;
  sector_economico_nombre?: string | null;
  rubro_id?: number | null;
  rubro_nombre?: string | null;
  actividad_comercial_id?: number | null;
  actividad_comercial_nombre?: string | null;
  region_id?: number | null;
  region_nombre?: string | null;
  provincia_id?: number | null;
  provincia_nombre?: string | null;
  distrito_id?: number | null;
  distrito_nombre?: string | null;
  direccion?: string | null;
  pais_id?: number | null;
  pais_nombre?: string | null;
  tipo_documento_id?: number | null;
  tipo_documento_nombre?: string | null;
  numero_dni?: string;
  numero_dni_empresario?: string;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  nombres?: string | null;
  nombre_completo?: string | null;
  genero_id?: number | null;
  genero_avr?: string | null;
  discapacidad?: number | null;
  discapacidad_nombre?: string | null;
  celular?: string | null;
  correo_electronico?: string | null;
  cargo_empresa_id?: number | null;
  cargo_empresa_nombre?: string | null;
  fecha_nacimiento?: string | null;
  edad?: number | null;
  coop_nombre_institucion?: string | null;
  coop_rol_institucion?: string | null;
}

interface Evento {
  id?: number;
  slug?: string | null;
  tema?: string | null;
  fechas?: string[];
  horario?: string | null;
}

interface PaginatedResponse {
  current_page?: number;
  data?: InscritoUgseco[];
  from?: number;
  last_page?: number;
  path?: string;
  per_page?: number;
  to?: number;
  total?: number;
}

interface ApiResponse {
  status?: number;
  data?: PaginatedResponse;
  event?: Evento;
}

function Chip({ children, variant = "neutral" }: { children: React.ReactNode; variant?: "neutral" | "ok" | "warn" | "info" }) {
  const variants: Record<string, string> = {
    neutral: "bg-[#f1f5f9] text-[#475569] border border-[#cbd5e1]",
    ok: "bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]",
    warn: "bg-[#fffbeb] text-[#92400e] border border-[#fcd34d]",
    info: "bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter border ${variants[variant]}`}
    >
      {children}
    </span>
  );
}

export default function ListaUgseco() {
  useFavicon(ugsecoIcon);

  const [inscritos, setInscritos] = useState<InscritoUgseco[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    from?: number;
    to?: number;
  }>({});
  const [evento, setEvento] = useState<Evento | null>(null);
  const [search, setSearch] = useState("");

  const formatearFecha = (fecha: string | undefined) => {
    if (!fecha) return "-";
    const partes = fecha.split("-");
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return fecha;
  };

  const chipTipoDoc = (valor: string | null | undefined) => {
    if (!valor) return <span className="text-[#64748b] text-[11px]">-</span>;
    return <Chip variant="info">{valor}</Chip>;
  };

  useEffect(() => {
    let active = true;

    const loadInscritos = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await httpRequest<ApiResponse>({
          method: "GET",
          url: "event-pnte-public/inscritos-ugseco",
          params: {
            page,
            per_page: 50,
            name: search,
          },
        });

        if (!active) return;

        const data = response.data?.data ?? null;
        const list = Array.isArray(data) ? data : data ? [data] : [];
        setInscritos(list);
        setMeta({
          current_page: response.data?.current_page,
          last_page: response.data?.last_page,
          per_page: response.data?.per_page,
          total: response.data?.total,
          from: response.data?.from,
          to: response.data?.to,
        });
        setEvento(response.event ?? null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Error al cargar inscritos");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadInscritos();

    return () => {
      active = false;
    };
  }, [page, search]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#2b8aa8] border-t-transparent mb-2"></div>
          <p className="text-sm text-[#64748b] font-medium">Cargando inscritos…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center py-20">
        <p className="text-[#dc2626] text-sm font-medium mb-3">⚠</p>
        <h2 className="text-base font-bold text-[#1e293b] mb-2">Error al cargar inscritos</h2>
        <p className="text-xs text-[#64748b] mb-6 max-w-xs text-center">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            setError(null);
            window.location.reload();
          }}
          className="px-4 py-2 bg-[#2b8aa8] text-white rounded text-[12px] font-bold hover:bg-[#20708a] transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-[#1e293b] leading-tight">Lista UGSECO</h1>
            <p className="text-xs text-[#64748b] mt-1 uppercase tracking-wide">Inscritos por actividad</p>
          </div>
          {evento && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-[#2b8aa8]/40 bg-[#eff6ff] text-[#1d4ed8] text-[11px] font-bold uppercase tracking-tighter">
              {evento.tema}
            </div>
          )}
        </header>

        {evento && (
          <div className="mb-6 rounded border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <dt className="text-xs font-bold text-[#64748b] uppercase tracking-wide">Evento</dt>
              <dd className="text-[#1e293b] font-medium">{evento.tema || "Evento UGSECO"}</dd>
              <dt className="text-xs font-bold text-[#64748b] uppercase tracking-wide">Fecha</dt>
              <dd className="text-[#1e293b] font-medium">
                {evento.fechas?.length ? evento.fechas.map((f) => formatearFecha(f)).join(", ") : "-"}
              </dd>
              <dt className="text-xs font-bold text-[#64748b] uppercase tracking-wide">Horario</dt>
              <dd className="text-[#1e293b] font-medium">{evento.horario ?? "-"}</dd>
            </dl>
          </div>
        )}

        <div className="mb-6 flex items-center gap-3">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Buscar por RUC, DNI, nombre o apellido…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setPage(1)}
              className="w-full pl-8 pr-3 py-1.5 text-[12px] placeholder:text-[#94a3b8] bg-white border border-[#cbd5e1] rounded focus:ring-1 focus:ring-[#2b8aa8] focus:border-[#2b8aa8] outline-none transition-colors"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#1e293b] transition-colors"
              >
                ✕
              </button>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-[#64748b]">
            <span className="font-bold text-[#1e293b]">{meta.total ?? 0}</span>
            inscritos{" "}
            {search ? (
              <span className="px-2 py-0.5 rounded border border-[#2b8aa8]/40 bg-[#eff6ff] text-[#1d4ed8] text-[10px] font-bold uppercase tracking-tighter">
                filtrado
              </span>
            ) : null}
          </div>
        </div>

        <div className="rounded border border-[#e2e8f0] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#e2e8f0] text-left text-[12px]">
              <thead className="bg-[#f1f5f9] sticky top-0 z-10 border-b border-[#e2e8f0]">
                <tr>
                  <th scope="col" className="px-6 py-3 text-[10px] font-bold text-[#64748b] uppercase tracking-wider border-r border-[#e2e8f0]">
                    MYPE / Empresa
                  </th>
                  <th scope="col" className="px-6 py-3 text-[10px] font-bold text-[#64748b] uppercase tracking-wider border-r border-[#e2e8f0]">
                    Ubicación
                  </th>
                  <th scope="col" className="px-6 py-3 text-[10px] font-bold text-[#64748b] uppercase tracking-wider">
                    Empresario / Participante
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {inscritos.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center">
                      <p className="text-sm text-[#64748b] font-medium">No se encontraron inscritos</p>
                      {search && (
                        <p className="text-[10px] text-[#94a3b8] mt-1 uppercase tracking-wide">
                          Intenta con otro RUC, DNI o nombre.
                        </p>
                      )}
                    </td>
                  </tr>
                ) : (
                  inscritos.map((item) => (
                    <tr key={item.id} className="hover:bg-[#f8fafc] transition-colors duration-100">
                      <td className="px-6 py-3.5 border-r border-[#f1f5f9]">
                        <div className="text-sm font-semibold text-[#1e293b]">
                          {item.ruc ?? "-"}
                        </div>
                        {item.razon_social && (
                          <div className="mt-0.5 text-sm text-[#64748b] truncate max-w-[220px]">
                            {item.razon_social}
                          </div>
                        )}
                        {item.nombre_comercial && (
                          <div className="mt-0.5 text-sm text-[#475569] truncate max-w-[220px] italic">
                            {item.nombre_comercial}
                          </div>
                        )}
                        {item.coop_nombre_institucion && (
                          <div className="mt-1 text-sm text-[#1e293b] font-medium truncate max-w-[220px]">
                            {item.coop_nombre_institucion}
                          </div>
                        )}
                        {item.coop_rol_institucion && (
                          <div className="mt-0.5 text-[10px] text-[#64748b] truncate max-w-[220px]">
                            {item.coop_rol_institucion}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3.5 border-r border-[#f1f5f9]">
                        <div className="text-sm font-semibold text-[#1e293b]">
                          {[item.region_nombre, item.provincia_nombre, item.distrito_nombre]
                            .filter(Boolean)
                            .join(" / ") || "-"}
                        </div>
                        {item.direccion && (
                          <div className="mt-1 text-sm text-[#64748b] truncate max-w-[200px]">
                            {item.direccion}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="text-sm font-semibold text-[#1e293b]">
                          {item.numero_dni_empresario ?? "-"}
                        </div>
                        <div className="mt-0.5 text-base font-bold text-[#1e293b]">
                          {item.nombre_completo ?? "-"}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2">
                          <span className="text-[9px] font-bold text-[#94a3b8] uppercase tracking-tighter">
                            Documento
                          </span>
                          {chipTipoDoc(item.tipo_documento_nombre)}
                        </div>
                        <div className="mt-1 text-sm text-[#64748b] flex items-center gap-1">
                          <span className="text-[#94a3b8]">📱</span> {item.celular ?? "-"}
                        </div>
                        <div className="mt-0.5 text-sm text-[#64748b] flex items-center gap-1">
                          <span className="text-[#94a3b8]">✉️</span>
                          <span className="break-words">{item.correo_electronico ?? "-"}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {meta.last_page && meta.last_page > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-xs text-[#64748b]">
              Mostrando{" "}
              <span className="font-bold text-[#1e293b]">{meta.from}</span>{" "}
              a{" "}
              <span className="font-bold text-[#1e293b]">{meta.to}</span> de{" "}
              <span className="font-bold text-[#1e293b]">{meta.total}</span>
              inscritos
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => (p > 1 ? p - 1 : 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-[12px] rounded border border-[#cbd5e1] text-[#64748b] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f8fafc] font-medium"
              >
                Anterior
              </button>
              <span className="px-2.5 py-1.5 text-[12px] text-[#64748b] font-medium border-x border-[#e2e8f0]">
                Página {page} de {meta.last_page}
              </span>
              <button
                onClick={() => setPage((p) => (p < meta.last_page! ? p + 1 : p))}
                disabled={page >= meta.last_page}
                className="px-3 py-1.5 text-[12px] rounded border border-[#cbd5e1] text-[#64748b] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f8fafc] font-medium"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
