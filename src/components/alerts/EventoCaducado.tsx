export default function EventoCaducado() {
  return (
    <div className="min-h-screen w-full bg-[#fff] py-6">
      <div className="mx-auto w-full max-w-[800px] px-4 md:px-8">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center shadow-[0_12px_24px_rgba(0,0,0,0.08)]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-[22px] font-bold text-[#124e78]">Evento finalizado</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[#3e647d]">
            La capacitación que intentas ver ya finalizó. No es posible registrarse ni marcar asistencia a eventos pasados.
          </p>
          {/* <p className="mt-4 text-[13px] text-[#64748b]">
            Si necesitas información adicional, escríbenos a{" "}
            <a href="mailto:servicios.coop@produce.gob.pe" className="font-medium text-[#2b8aa8] hover:underline">
              servicios.coop@produce.gob.pe
            </a>
          </p> */}
        </div>
      </div>
    </div>
  );
}
