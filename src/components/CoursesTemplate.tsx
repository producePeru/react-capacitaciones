type Category = {
  label: string;
  image: string;
  code: string;
  title: string;
  description: string;
  date: string;
  time: string;
};

const categories: Category[] = [
  {
    label: "ASESORÍA PARA EL FINANCIAMIENTO",
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80&auto=format&fit=crop",
    code: "FIN1-ESTRATEGIAS DE INVERSIÓN PARA LAS MYPE",
    title: "FIN1-ESTRATEGIAS DE INVERSIÓN PARA LAS MYPE",
    description:
      "Conoce cómo evaluar y gestionar inversiones para impulsar el crecimiento sostenible y la rentabilidad de tu negocio.",
    date: "15 Oct",
    time: "14:30 - 17:30",
  },
  {
    label: "DESARROLLO PRODUCTIVO",
    image:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&q=80&auto=format&fit=crop",
    code: "DES2-GESTIÓN DE LA CALIDAD: MEJORA DE PROCESOS",
    title: "DES2-GESTIÓN DE LA CALIDAD: MEJORA DE PROCESOS",
    description:
      "Fortalece la gestión de tu MYPE optimizando procesos para mejorar la productividad, reducir costos y brindar una mejor experiencia a tus clientes.",
    date: "21 Oct",
    time: "14:30 - 17:30",
  },
  {
    label: "DIGITALIZACIÓN",
    image:
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&q=80&auto=format&fit=crop",
    code: "DIG2- FUNDAMENTOS PARA LA TRANSFORMACIÓN DIGITAL DE LAS MYPE",
    title: "DIG2- FUNDAMENTOS PARA LA TRANSFORMACIÓN DIGITAL DE LAS MYPE",
    description:
      "Conoce las bases para transformar los procesos de tu empresa y migrar hacia un entorno digital más eficiente y competitivo.",
    date: "23 Oct",
    time: "14:30 - 17:30",
  },
  {
    label: "GESTIÓN EMPRESARIAL",
    image:
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=80&auto=format&fit=crop",
    code: "GE2-GESTIÓN COMERCIAL PARA IMPULSAR TUS VENTAS",
    title: "GE2-GESTIÓN COMERCIAL PARA IMPULSAR TUS VENTAS",
    description:
      "Aprende sobre las estrategias y herramientas para optimizar tu proceso de ventas, mejorar la atención al cliente y fortalecer su fidelización.",
    date: "19 Oct",
    time: "10:00 - 13:00",
  },
  {
    label: "INNOVACIÓN Y SOSTENIBILIDAD",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80&auto=format&fit=crop",
    code: "INN3-INNOVACIÓN SOSTENIBLE PARA MYPES COMPETITIVAS",
    title: "INN3-INNOVACIÓN SOSTENIBLE PARA MYPES COMPETITIVAS",
    description:
      "Descubre cómo innovar con enfoque sostenible para diferenciar tu negocio, reducir impactos y abrir nuevas oportunidades de mercado.",
    date: "25 Oct",
    time: "15:00 - 18:00",
  },
];

function HeroBanner() {
  return (
    <section className="relative overflow-hidden rounded-sm bg-white shadow-sm">
      <div className="grid md:grid-cols-[1fr_380px]">
        {/* Texto */}
        <div className="relative px-8 py-10 md:px-14 md:py-12">
          {/* iconos decorativos */}



          <h1 className="max-w-3xl text-[32px] font-extrabold leading-[1.15] md:text-[42px]">
            <span className="text-[#0b3d6b]">Da el siguiente paso</span>
            <br />
            <span className="text-[#1a8ca8]">en el crecimiento de tu empresa</span>
          </h1>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-[#0b3d6b] md:text-[17px]">
            Accede a capacitaciones gratuitas para fortalecer tu MYPE y mejorar su
            competitividad. Elige los cursos que mejor se adapten a tus necesidades e impulsa el
            crecimiento de tu empresa.
          </p>
        </div>

        {/* Imagen */}
        <div className="relative h-48 md:h-auto">
          <img
            src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80&auto=format&fit=crop"
            alt="Empresario con laptop"
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/20 to-transparent md:via-transparent" />
        </div>
      </div>
      {/* franja inferior */}
      <div className="h-[10px] w-full bg-[#1a7a99]" />
    </section>
  );
}

function CategoryCard({ item }: { item: Category }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Imagen cabecera */}
      <div className="relative h-[170px] overflow-hidden rounded-[3px] shadow-sm">
        <img
          src={item.image}
          alt={item.label}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a2f4f]/95 via-[#0a2f4f]/40 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
          <span className="h-[12px] w-[16px] shrink-0 bg-white" />
          <p className="text-[13px] font-extrabold uppercase leading-tight tracking-wide text-white">
            {item.label}
          </p>
        </div>
      </div>

      {/* Detalle curso */}
      <article className="flex flex-1 flex-col rounded-[3px] border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[14px] font-bold uppercase leading-snug text-gray-800">
            {item.title}
          </h3>

        </div>

        <p className="mt-3 text-[14.5px] leading-[1.6] text-gray-600">{item.description}</p>

        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50/60 px-3 py-2.5">
            <span className="flex items-center gap-1.5 text-[12.5px] font-bold text-gray-800">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              {item.date}
            </span>
            <span className="text-[12.5px] font-bold text-gray-800">{item.time}</span>
          </div>
        </div>
      </article>
    </div>
  );
}

export default function CoursesTemplate() {
  return (
    <div className="min-h-screen w-full bg-[#e9e9e9] py-6">
      <div className="mx-auto w-full max-w-[1720px] px-8">
        <HeroBanner />

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {categories.map((item) => (
            <CategoryCard key={item.code} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
