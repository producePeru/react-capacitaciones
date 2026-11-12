import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ugsecoIcon from "@/assets/icons/compras-myperu.ico";
import { useFavicon } from "@/hooks/useFavicon";
import { httpRequest } from "@/services/api";
import empresarios from "@/assets/images/reactiva.png";

type ApiCourse = {
  id: number;
  slug: string;
  fechas: string[] | null;
  tema: string | null;
  horario: unknown;
  modalidad: string | null;
  direccion: string | null;
  asesor: string | null;
  activo: number | boolean | null;
};

type ApiResponse = {
  status: number;
  data: ApiCourse[];
};

let cursosRequest: Promise<ApiCourse[]> | null = null;

function loadCursosCooperativasUgseco() {
  if (cursosRequest) return cursosRequest;

  const request = httpRequest<ApiResponse>({
    method: "GET",
    url: "event-pnte-public/cursos-compras-myperu",
  }).then((response) => response.data ?? []);

  cursosRequest = request;

  request.then(
    () => {
      if (cursosRequest === request) cursosRequest = null;
    },
    () => {
      if (cursosRequest === request) cursosRequest = null;
    }
  );

  return request;
}

type CourseDate = {
  iso: string;
  day: string;
  month: string;
  year: string;
};

type Course = {
  slug: string;
  fechas: CourseDate[];
  title: string;
  expositor: string;
  modo: string;
  direccion: string | null;
  horario: string;
};

const MONTHS = [
  "ENE.",
  "FEB.",
  "MAR.",
  "ABR.",
  "MAY.",
  "JUN.",
  "JUL.",
  "AGO.",
  "SEP.",
  "OCT.",
  "NOV.",
  "DIC.",
];

function parseFechas(fechas: string[] | null): CourseDate[] {
  return (fechas ?? [])
    .filter((fecha) => typeof fecha === "string" && /^\d{4}-\d{2}-\d{2}/.test(fecha))
    .sort()
    .map((fecha) => {
      const iso = fecha.slice(0, 10);
      const [year, month, day] = iso.split("-");
      const monthIndex = Number(month) - 1;

      return {
        iso,
        day: day ?? "--",
        month: MONTHS[monthIndex] ?? "---",
        year: year ?? "----",
      };
    });
}

function formatFechaNumerica(fecha: CourseDate) {
  const [, month, day] = fecha.iso.split("-");
  return `${day}/${month}/${fecha.year}`;
}

function formatFechas(fechas: CourseDate[]) {
  if (fechas.length === 0) return "Por confirmar";

  const labels = fechas.map(formatFechaNumerica);

  if (labels.length === 1) return labels[0];

  return `${labels.slice(0, -1).join(", ")} y ${labels[labels.length - 1]}`;
}

function to12Hour(time: string) {
  const m = time.trim().match(/^(\d{1,2}):?(\d{2})?$/);
  if (!m) return time;
  let h = parseInt(m[1], 10);
  const min = m[2] ? `:${m[2]}` : "";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}${min} ${ampm}`;
}

function formatHorario(horario: unknown) {
  const convertRange = (txt: string) => {
    return txt
      .split("/")
      .map((part) => part.trim())
      .map((seg) => {
        return seg.replace(/(\d{1,2}:\d{2})/g, (t) => to12Hour(t));
      })
      .join(" / ");
  };

  if (Array.isArray(horario)) {
    const rangos = horario.flatMap((item) => {
      if (typeof item === "string" && item.trim() !== "") {
        return [convertRange(item.trim())];
      }

      if (item && typeof item === "object") {
        const sesion = item as { horaInicio?: unknown; horaFin?: unknown };
        const inicioRaw =
          typeof sesion.horaInicio === "string" ? sesion.horaInicio.trim() : "";
        const finRaw = typeof sesion.horaFin === "string" ? sesion.horaFin.trim() : "";

        const inicio = inicioRaw ? to12Hour(inicioRaw) : "";
        const fin = finRaw ? to12Hour(finRaw) : "";

        if (inicio && fin) return [`${inicio} - ${fin}`];
        if (inicio) return [inicio];
      }

      return [];
    });

    return [...new Set(rangos)].join(" / ") || "Por confirmar";
  }

  if (typeof horario === "string" && horario.trim() !== "") {
    return convertRange(horario.trim());
  }

  return "Por confirmar";
}

function formatModalidad(modalidad: string | null) {
  const value = modalidad?.trim().toUpperCase();

  if (!value) return "Por confirmar";

  return value.charAt(0) + value.slice(1).toLowerCase();
}

function mapCourse(item: ApiCourse): Course {
  return {
    slug: item.slug,
    fechas: parseFechas(item.fechas),
    title: item.tema ?? "Capacitación",
    expositor: item.asesor ?? "Por confirmar",
    modo: formatModalidad(item.modalidad),
    direccion: item.direccion ?? null,
    horario: formatHorario(item.horario),
  };
}

function HeroBanner() {
  return (
    <section className="relative overflow-hidden rounded-md border border-[#f8d7d5]">
      <div className="grid md:grid-cols-[1fr_380px]">
        {/* Texto */}
        <div className="relative px-8 py-10 md:px-14 md:py-12">
          {/* iconos decorativos */}

          <h1 className="max-w-3xl text-[28px] font-extrabold leading-[1.15] md:text-[42px]">
            {/* <span className="text-[#000]">Da el siguiente paso en el crecimiento de </span> */}
            <span className="text-[#e93224]">Potencia Tu Empresa - Reactivación Sector Textil confecciones</span>
          </h1>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-[#2f5670] md:text-[17px]">
            Accede a capacitaciones gratuitas. Elige los cursos que mejor se adapten a tus necesidades e impulsa tu desarrollo y el de tu organización.
          </p>
        </div>

        {/* Imagen */}
        <div className="relative m-0 hidden h-auto items-center justify-center overflow-hidden bg-white p-0 md:flex">
          <img
            src={empresarios}
            alt="Empresarios"
            className="m-0 block h-[210px] w-auto max-w-full object-contain object-center p-0 md:h-[260px]"
          />
        </div>
      </div>
      {/* franja inferior */}
      <div className="h-[8px] w-full bg-[#e93224]" />
    </section>
  );
}

function CourseRow({ item }: { item: Course }) {
  const esVirtual = item.modo.trim().toLowerCase() === "virtual";
  const primeraFecha = item.fechas[0];
  const fechasAdicionales = Math.max(item.fechas.length - 1, 0);

  return (
    <div className="flex min-h-[110px] overflow-hidden rounded-lg border border-[#f8d7d5] bg-[#fff5f5]">
      {/* Fecha */}
      <div className="flex w-[104px] shrink-0 flex-col items-center justify-center bg-[#b71c1c] py-5 leading-none text-white md:w-[132px]">
        <span className="text-[36px] font-bold tracking-tight">
          {primeraFecha?.day ?? "--"}
        </span>
        <span className="mt-1 text-[12px] font-medium text-white">
          {primeraFecha?.month ?? "---"}
        </span>
        <span className="text-[12px] font-medium text-[#f9c7c5]">
          {primeraFecha?.year ?? "----"}
        </span>
        {fechasAdicionales > 0 && (
          <span className="mt-2 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white">
            +{fechasAdicionales} {fechasAdicionales === 1 ? "fecha" : "fechas"}
          </span>
        )}
      </div>

      {/* Detalle */}
      <div className="flex flex-1 flex-col sm:flex-row">
        <div className="flex-1 px-5 py-4 md:px-6">
          <h3 className="text-[16px] md:text-[20px] font-bold leading-tight text-[#000]">{item.title}</h3>
          <div className="mt-1 text-[13.5px] leading-relaxed text-[#3e647d]">
            <p>Expositor: {item.expositor}</p>
            <p>Modalidad: {item.modo}</p>
            <p>Fechas: {formatFechas(item.fechas)}</p>
            {!esVirtual && item.direccion && (
              <p>Dirección: {item.direccion}</p>
            )}
            <p>Horario: {item.horario}</p>
          </div>
        </div>

        {/* Inscripción */}
        <div className="flex items-center px-5 pb-4 sm:w-[190px] sm:justify-center sm:px-6 sm:pb-0 md:w-[220px]">
          <Link
            to={`/reactiva-sector/inscripciones?slug=${encodeURIComponent(item.slug)}`}
            className="inline-flex w-full items-center justify-center rounded-md border border-[#b71c1c] px-6 py-2 text-[14px] font-semibold text-[#b71c1c] transition-colors hover:bg-[#b71c1c] hover:text-white sm:w-auto sm:min-w-[130px]"
          >
            Inscríbete
          </Link>
        </div>
      </div>
    </div>
  );
}

function CourseRowSkeleton() {
  return (
    <div className="flex min-h-[110px] overflow-hidden rounded-lg border border-[#f8d7d5] bg-[#fff5f5]">
      {/* Fecha */}
      <div className="flex w-[104px] shrink-0 flex-col items-center justify-center gap-2 bg-[#b71c1c] py-5 md:w-[132px]">
        <div className="h-9 w-11 animate-pulse rounded bg-white/20" />
        <div className="h-3 w-10 animate-pulse rounded bg-white/20" />
        <div className="h-3 w-8 animate-pulse rounded bg-white/20" />
      </div>

      {/* Detalle */}
      <div className="flex flex-1 flex-col sm:flex-row">
        <div className="flex-1 px-5 py-4 md:px-6">
          <div className="h-5 w-3/4 animate-pulse rounded bg-[#f5c6c4]" />
          <div className="mt-3 space-y-2">
            <div className="h-3.5 w-1/2 animate-pulse rounded bg-[#f8d7d5]" />
            <div className="h-3.5 w-1/3 animate-pulse rounded bg-[#f8d7d5]" />
            <div className="h-3.5 w-2/5 animate-pulse rounded bg-[#f8d7d5]" />
          </div>
        </div>

        {/* Inscripción */}
        <div className="flex items-center px-5 pb-4 sm:w-[190px] sm:justify-center sm:px-6 sm:pb-0 md:w-[220px]">
          <div className="h-9 w-full animate-pulse rounded-md bg-[#f8d7d5] sm:w-[130px]" />
        </div>
      </div>
    </div>
  );
}

export default function CoursesTemplate() {
  useFavicon(ugsecoIcon);
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "compras MYPErú";
    return () => {
      document.title = previousTitle;
    };
  }, []);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    loadCursosCooperativasUgseco()
      .then((data) => {
        if (active) {
          setCourses(
            data.map(mapCourse)
          );
        }
      })
      .catch(() => {
        if (active) {
          setError("No se pudieron cargar las capacitaciones.");
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
  }, []);

  return (
    <div className="min-h-screen w-full bg-white py-6">
      <div className="mx-auto w-full max-w-[1280px] px-6">
        <HeroBanner />

        <div className="mt-6 mb-3 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-[#000]">Próximas capacitaciones</h2>
          <span className="text-[13px] text-[#3e647d]">
            {loading ? "Cargando..." : `${courses.length} cursos`}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          {loading &&
            Array.from({ length: 3 }).map((_, index) => (
              <CourseRowSkeleton key={index} />
            ))}

          {!loading && error && (
            <p className="text-[14px] text-[#b42318]">{error}</p>
          )}

          {!loading && !error && courses.length === 0 && (
            <p className="text-[14px] text-[#3e647d]">
              No hay capacitaciones disponibles por el momento.
            </p>
          )}

          {!loading &&
            !error &&
            courses.map((item) => <CourseRow key={item.slug} item={item} />)}
        </div>
      </div>
    </div>
  );
}
