import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ugsecoIcon from "@/assets/icons/ugseco.ico";
import { useFavicon } from "@/hooks/useFavicon";
import { httpRequest } from "@/services/api";

type ApiCourse = {
  id: number;
  slug: string;
  fechas: string[] | null;
  tema: string | null;
  horario: unknown;
  modalidad: string | null;
  asesor: string | null;
};

type ApiResponse = {
  status: number;
  data: ApiCourse[];
};

type Course = {
  slug: string;
  day: string;
  month: string;
  year: string;
  title: string;
  expositor: string;
  modo: string;
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

function formatDate(fechas: string[] | null) {
  const dates = (fechas ?? []).filter(Boolean).sort();

  if (dates.length === 0) {
    return { day: "--", month: "---", year: "----" };
  }

  const [year, month, day] = dates[0].split("-");
  const monthIndex = Number(month) - 1;

  return {
    day: day ?? "--",
    month: MONTHS[monthIndex] ?? "---",
    year: year ?? "----",
  };
}

function formatHorario(horario: unknown) {
  if (Array.isArray(horario)) {
    return horario.filter(Boolean).join(" - ") || "Por confirmar";
  }

  if (typeof horario === "string" && horario.trim() !== "") {
    return horario;
  }

  return "Por confirmar";
}

function mapCourse(item: ApiCourse): Course {
  const { day, month, year } = formatDate(item.fechas);

  return {
    slug: item.slug,
    day,
    month,
    year,
    title: item.tema ?? "Capacitación",
    expositor: item.asesor ?? "Por confirmar",
    modo: item.modalidad ?? "Por confirmar",
    horario: formatHorario(item.horario),
  };
}

function HeroBanner() {
  return (
    <section className="relative overflow-hidden rounded-md border border-[#cfe0ec] bg-white shadow-[0_12px_36px_rgba(18,86,125,0.22)]">
      <div className="grid md:grid-cols-[1fr_380px]">
        {/* Texto */}
        <div className="relative px-8 py-10 md:px-14 md:py-12">
          {/* iconos decorativos */}



          <h1 className="max-w-3xl text-[32px] font-extrabold leading-[1.15] md:text-[42px]">
            <span className="text-[#124e78]">Da el siguiente paso</span>
            <br />
            <span className="text-[#2b8aa8]">en el crecimiento de tu empresa</span>
          </h1>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-[#2f5670] md:text-[17px]">
            Accede a capacitaciones gratuitas para fortalecer tu MYPE y mejorar su
            competitividad. Elige los cursos que mejor se adapten a tus necesidades e impulsa el
            crecimiento de tu empresa.
          </p>
        </div>

        {/* Imagen */}
        <div className="relative m-0 flex h-auto items-center justify-center overflow-hidden bg-white p-0">
          <img
            src="https://www.fundacione.org/img/Imagenes/Empresarios.webp"
            alt="Empresarios"
            className="m-0 block h-[210px] w-auto max-w-full object-contain object-center p-0 md:h-[280px]"
          />
        </div>
      </div>
      {/* franja inferior */}
      <div className="h-[8px] w-full bg-[#2b8aa8]" />
    </section>
  );
}

function CourseRow({ item }: { item: Course }) {
  return (
    <div className="flex min-h-[110px] overflow-hidden rounded-lg border border-[#cfe0ec] bg-[#e9f1f7]">
      {/* Fecha */}
      <div className="flex w-[104px] shrink-0 flex-col items-center justify-center bg-[#14567d] py-5 leading-none text-white md:w-[132px]">
        <span className="text-[36px] font-bold tracking-tight">{item.day}</span>
        <span className="mt-1 text-[12px] font-medium text-white">{item.month}</span>
        <span className="text-[12px] font-medium text-[#c9e2f0]">{item.year}</span>
      </div>

      {/* Detalle */}
      <div className="flex flex-1 flex-col sm:flex-row">
        <div className="flex-1 px-5 py-4 md:px-6">
          <h3 className="text-[20px] font-bold leading-tight text-[#124e78]">{item.title}</h3>
          <div className="mt-1 text-[13.5px] leading-relaxed text-[#3e647d]">
            <p>Expositor: {item.expositor}</p>
            <p>Modo: {item.modo}</p>
            <p>Horario: {item.horario}</p>
          </div>
        </div>

        {/* Inscripción */}
        <div className="flex items-center px-5 pb-4 sm:w-[190px] sm:justify-center sm:px-6 sm:pb-0 md:w-[220px]">
          <Link
            to={`/ugseco/inscripciones?slug=${encodeURIComponent(item.slug)}`}
            className="inline-flex w-full items-center justify-center rounded-md border border-[#14567d] px-6 py-2 text-[14px] font-semibold text-[#14567d] transition-colors hover:bg-[#14567d] hover:text-white sm:w-auto sm:min-w-[130px]"
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
    <div className="flex min-h-[110px] overflow-hidden rounded-lg border border-[#cfe0ec] bg-[#e9f1f7]">
      {/* Fecha */}
      <div className="flex w-[104px] shrink-0 flex-col items-center justify-center gap-2 bg-[#14567d] py-5 md:w-[132px]">
        <div className="h-9 w-11 animate-pulse rounded bg-white/20" />
        <div className="h-3 w-10 animate-pulse rounded bg-white/20" />
        <div className="h-3 w-8 animate-pulse rounded bg-white/20" />
      </div>

      {/* Detalle */}
      <div className="flex flex-1 flex-col sm:flex-row">
        <div className="flex-1 px-5 py-4 md:px-6">
          <div className="h-5 w-3/4 animate-pulse rounded bg-[#c3d8e6]" />
          <div className="mt-3 space-y-2">
            <div className="h-3.5 w-1/2 animate-pulse rounded bg-[#cfe0ec]" />
            <div className="h-3.5 w-1/3 animate-pulse rounded bg-[#cfe0ec]" />
            <div className="h-3.5 w-2/5 animate-pulse rounded bg-[#cfe0ec]" />
          </div>
        </div>

        {/* Inscripción */}
        <div className="flex items-center px-5 pb-4 sm:w-[190px] sm:justify-center sm:px-6 sm:pb-0 md:w-[220px]">
          <div className="h-9 w-full animate-pulse rounded-md bg-[#cfe0ec] sm:w-[130px]" />
        </div>
      </div>
    </div>
  );
}

export default function CoursesTemplate() {
  useFavicon(ugsecoIcon);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    httpRequest<ApiResponse>({
      method: "GET",
      url: "event-pnte-public/cursos-cooperativas-ugseco",
    })
      .then((response) => {
        if (active) {
          setCourses((response.data ?? []).map(mapCourse));
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
      <div className="mx-auto w-full max-w-[1280px] px-8">
        <HeroBanner />

        <div className="mt-6 mb-3 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-[#124e78]">Próximas capacitaciones</h2>
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
