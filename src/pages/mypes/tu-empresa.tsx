import { useEffect, useRef, useState } from "react";
import mypesStore from "@/assets/images/mypes-store.png";
import pointPhone from "@/assets/points/point-1.png";
import pointClock from "@/assets/points/point-2.png";
import pointDiscount from "@/assets/points/point-3.png";
import pointGift from "@/assets/points/point-4.png";
import pointLocation from "@/assets/points/point-5.png";
import { httpRequest } from "@/services/api";

type Social = {
  name?: string;
  link?: string;
};

type Store = {
  id: number;
  nombre: string;
  logo?: string | null;
  socials?: Social[] | null;
  descripcion?: string | null;
  region?: string | null;
  provincia?: string | null;
};

type ApiInscrito = {
  id: number;
  razon_social?: string | null;
  nombre_comercial?: string | null;
  agregar_logo?: string | null;
  logo?: string | null;
  fecha_asistencia?: boolean;
  socials?: Social[] | null;
  descripcion?: string | null;
  region?: string | null;
  provincia?: string | null;
};

type ApiResponse = {
  data?: {
    data?: ApiInscrito[];
    current_page?: number;
    last_page?: number;
  };
};

const FERIA_SLUG = "act-8-2026-11-10-f3fmae";
const PAGE_SIZE = 10;

const socialColors: Record<string, string> = {
  facebook: "bg-[#1877f2]",
  instagram: "bg-[#d62976]",
  tiktok: "bg-[#111827]",
  whatsapp: "bg-[#25d366]",
};

function SocialIcon({ name }: { name: string }) {
  const label = name.toLowerCase();

  return (
    <span
      aria-hidden="true"
      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold text-white shadow-sm ${socialColors[label] ?? "bg-slate-500"}`}
    >
      {label === "facebook" ? "f" : label === "instagram" ? "◎" : label === "whatsapp" ? "wa" : "♪"}
    </span>
  );
}

export default function TuEmpresa() {
  const [stores, setStores] = useState<Store[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const pageRef = useRef(0);
  const hasMoreRef = useRef(true);

  useEffect(() => {
    const loadNextPage = async () => {
      if (loadingRef.current || !hasMoreRef.current) return;

      const nextPage = pageRef.current + 1;
      loadingRef.current = true;
      setLoading(true);

      try {
        const response = await httpRequest<ApiResponse>({
          method: "GET",
          url: `event-pnte-public/inscritos-feria-page/${FERIA_SLUG}`,
          params: {
            page: nextPage,
            pageSize: PAGE_SIZE,
          },
        });

        const inscritos = (response.data?.data ?? []).filter(
          (inscrito) => inscrito.fecha_asistencia === true,
        );
        const newStores = inscritos.map((inscrito) => ({
          id: inscrito.id,
          nombre: inscrito.nombre_comercial || inscrito.razon_social || "Empresa participante",
          logo: inscrito.logo || inscrito.agregar_logo || null,
          socials: inscrito.socials || [],
          descripcion: inscrito.descripcion || null,
          region: inscrito.region || null,
          provincia: inscrito.provincia || null,
        }));

        setStores((currentStores) => [...currentStores, ...newStores]);
        pageRef.current = nextPage;

        const lastPage = response.data?.last_page ?? nextPage;
        hasMoreRef.current = nextPage < lastPage;
        setHasMore(hasMoreRef.current);
      } catch (error) {
        console.error("No se pudieron cargar las empresas de la feria:", error);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    };

    loadNextPage();

    let observer: IntersectionObserver | null = null;

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) loadNextPage();
        },
        { rootMargin: "0px 0px 320px" },
      );

      if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    }

    return () => {
      observer?.disconnect();
    };
  }, []);

  const visibleStores = stores.filter((store) =>
    store.nombre.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <main className="min-h-screen bg-white text-[#171717]">
      <section className="w-full bg-[#f3f1ed]">
        <div className="mx-auto grid max-w-6xl sm:grid-cols-2">
          <div className="mype-hero-copy flex flex-col justify-center px-8 py-12 sm:px-12 lg:px-16 lg:py-16">
            <h1 className="max-w-md font-display text-4xl leading-[1.02] tracking-[-0.03em] sm:text-5xl lg:text-6xl">
              Marcas con historia, hechas para quedarse.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-black/60">
              Conoce emprendimientos peruanos y encuentra una nueva marca para seguir, recomendar y elegir.
            </p>
            <a href="#marcas" className="mt-8 w-fit bg-[#171717] px-6 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#e93224]">
              Ver marcas
            </a>
          </div>
          <div className="mype-hero-art relative flex aspect-[3/2] h-fit self-end items-end overflow-visible bg-[#f3f1ed]">
            <img src={pointPhone} alt="" aria-hidden="true" className="mype-point mype-point--phone" />
            <img src={pointClock} alt="" aria-hidden="true" className="mype-point mype-point--clock" />
            <img src={pointDiscount} alt="" aria-hidden="true" className="mype-point mype-point--discount" />
            <img src={pointGift} alt="" aria-hidden="true" className="mype-point mype-point--gift" />
            <img src={pointLocation} alt="" aria-hidden="true" className="mype-point mype-point--location" />
            <img src={mypesStore} alt="Emprendedores peruanos" className="absolute inset-0 block h-full w-full object-contain" />
          </div>
        </div>
      </section>

      <section id="marcas" className="mx-auto max-w-6xl px-5 pb-20 pt-16 sm:px-8 lg:px-14">
        <div className="flex flex-col gap-5 border-b border-black/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl">Descubre nuestras MYPE</h2>
          </div>
          <label className="flex items-center gap-3 border-b border-black/40 pb-2">
            <span className="text-lg leading-none text-[#e93224]">⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar marca"
              aria-label="Buscar una marca"
              className="w-32 border-0 bg-transparent p-0 text-sm outline-none ring-0 placeholder:text-black/45 focus:ring-0 sm:w-44"
            />
          </label>
        </div>

        {visibleStores.length === 0 && !loading && (
          <div className="py-20 text-center">
            <p className="text-lg font-bold text-[#12253f]">No encontramos esa marca.</p>
            <p className="mt-2 text-sm text-slate-500">Prueba con otro nombre.</p>
          </div>
        )}

        {visibleStores.length > 0 && (
          <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 sm:gap-y-12 lg:grid-cols-4">
            {visibleStores.map((store) => (
              <article key={store.id} className="group">
                <div className="relative aspect-[4/3] overflow-hidden bg-[#f3f1ed]">
                  {store.logo ? (
                    <img src={store.logo} alt={`Logo de ${store.nombre}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="grid h-full place-items-center bg-gradient-to-br from-[#f5b335] to-[#e93224] text-5xl font-black text-white">
                      {store.nombre.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="border-b border-[#17212b]/15 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-sm font-bold leading-5 text-[#17212b] sm:text-base" title={store.nombre}>{store.nombre}</h2>
                  </div>
                  {store.descripcion && (
                    <p className="mt-2 line-clamp-3 text-xs leading-5 text-black/60" title={store.descripcion}>
                      {store.descripcion}
                    </p>
                  )}
                  {(store.region || store.provincia) && (
                    <div className="mt-3 inline-flex items-center rounded-full bg-[#fff1ed] px-3 py-1 text-[11px] font-semibold text-[#d84432] ring-1 ring-[#f8c8bd]">
                      <span aria-hidden="true" className="mr-1">•</span>
                      {[store.region, store.provincia].filter(Boolean).join(", ")}
                    </div>
                  )}
                  <div className="mt-4 flex items-center gap-2">
                    {store.socials?.filter((social) => social.link).map((social) => (
                      <a key={`${social.name}-${social.link}`} href={social.link} target="_blank" rel="noreferrer" className="opacity-65 transition hover:opacity-100" aria-label={`${social.name} de ${store.nombre}`}>
                        <SocialIcon name={social.name ?? "red social"} />
                      </a>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div ref={loadMoreRef} className="py-8 text-center text-sm text-black/50">
          {loading && "Cargando más empresas..."}
          {!loading && !hasMore && visibleStores.length > 0 && "No hay más empresas."}
        </div>
      </section>
    </main>
  );
}
