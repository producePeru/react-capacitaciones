import { useEffect, useRef, useState } from "react";
import { httpRequest } from "@/services/api";

export default function PruebaSalidaComprasMyPeru({ slug, numeroDni, empresarioId, date, horarioInicio, horarioFin }) {
  const [loading, setLoading] = useState(true);
  const [testEntrada, setTestEntrada] = useState([]);
  const [testSalida, setTestSalida] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('success');

  const entradaRefs = useRef({});
  const salidaRefs = useRef({});

    useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await httpRequest({
          method: "GET",
          url: `/event-pnte-public/compras-myperu-test-end/${slug}`,
        });
        if (!mounted) return;
        const data = res?.data ?? {};
        setTestEntrada(Array.isArray(data.test_entrada) ? data.test_entrada : []);
        setTestSalida(Array.isArray(data.test_salida) ? data.test_salida : []);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [slug]);

  const handleAnswer = (section, idx, value) => {
    setAnswers(prev => ({ ...prev, [`${section}-${idx}`]: value }));
  };

  const handleSubmit = async () => {
    const missing = [];
    testEntrada.forEach((_, i) => { if (!answers[`entrada-${i}`]) missing.push({section:"entrada", idx:i}); });
    testSalida.forEach((_, i) => { if (!answers[`salida-${i}`]) missing.push({section:"salida", idx:i}); });
    if (missing.length) {
      const first = missing[0];
      const ref = first.section === "entrada" ? entradaRefs.current[first.idx] : salidaRefs.current[first.idx];
      ref?.scrollIntoView({ behavior: "smooth", block: "center" });
      ref?.classList.add("ring-2", "ring-red-400");
      setTimeout(() => ref?.classList.remove("ring-2", "ring-red-400"), 1500);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        slug,
        numero_dni: numeroDni,
        empresario_id: empresarioId || null,
        test_salida: testEntrada.reduce((acc, _, i) => ({ ...acc, [`pregunta_${i+1}`]: answers[`entrada-${i}`] }), {}),
        ratings: testSalida.reduce((acc, _, i) => ({ ...acc, [`rating_${i+1}`]: answers[`salida-${i}`] }), {}),
      };
      await httpRequest({
        method: "POST",
        url: "/event-pnte-public/compras-myperu-test-end-responses",
        data: payload,
      });
      setModalType('success');
      setShowModal(true);
    } catch (e) {
      console.error(e);
      const status = e?.response?.status || e?.response?.data?.status;
      if (status === 409) {
        setModalType('already');
        setShowModal(true);
      } else {
        alert("Error al guardar respuestas");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl bg-white p-6">
        <p className="text-[#3e647d]">Cargando prueba...</p>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-3xl bg-white">
        <h2 className="text-[22px] font-bold text-[#124e78] mb-6">Prueba de salida</h2>
        <div className="space-y-6">
          {testEntrada.length ? testEntrada.map((q,i)=>(
            <div key={q.id ?? i} ref={el=>entradaRefs.current[i]=el}>
              <Question number={i+1} text={q.texto ?? q.pregunta} options={q.opciones ?? []} value={answers[`entrada-${i}`]} onChange={v=>handleAnswer("entrada",i,v)} />
            </div>
          )) : <div className="rounded-xl border border-[#cfe0ec] p-6 text-[#3e647d]">No hay preguntas de entrada.</div>}
        </div>

        <h2 className="text-[22px] font-bold text-[#124e78] mt-10 mb-6">Encuesta de satisfacción</h2>
        <div className="space-y-6">
          {testSalida.length ? testSalida.map((q,i)=>(
            <div key={q.id ?? i} ref={el=>salidaRefs.current[i]=el}>
              <RatingQuestion number={i+1} text={q.texto ?? q.pregunta} options={q.opciones ?? []} value={answers[`salida-${i}`]} onChange={v=>handleAnswer("salida",i,v)} />
            </div>
          )) : <div className="rounded-xl border border-[#cfe0ec] p-6 text-[#3e647d]">No hay preguntas de satisfacción.</div>}
        </div>

        <div className="mt-8 flex justify-end">
          <button onClick={handleSubmit} disabled={submitting} className="rounded-md bg-[#2b8aa8] px-6 py-3 text-[14px] font-bold tracking-wide text-white hover:bg-[#20708a] transition-colors disabled:opacity-60">
            {submitting ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative w-[90%] max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#e9f1f7]">
              <span className="text-2xl">{modalType === 'already' ? 'ℹ️' : '✅'}</span>
            </div>
            <h3 className="text-[20px] font-bold text-[#124e78]">{modalType === 'already' ? 'Ya registrado' : '¡Gracias por completar este test!'}</h3>
            <p className="mt-2 text-[14px] text-[#3e647d]">
              {modalType === 'already'
                ? 'El test de salida ya fue registrado anteriormente. Revisa más cursos que tenemos para ti.'
                : 'Nos da gusto que te sigas capacitando. Revisa más cursos que tenemos para ti.'}
            </p>
            <button
              onClick={() => {
                const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                const base = isLocal ? 'http://localhost:5174' : import.meta.env.VITE_APP_FRONTEND_URL || window.location.origin;
                window.location.href = `${base}/compras-myperu`;
              }}
              className="mt-6 rounded-md bg-[#2b8aa8] px-6 py-3 text-[14px] font-bold text-white hover:bg-[#20708a]"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Question({ number, text, options, value, onChange }) {
  return (
    <div className="rounded-xl border border-[#cfe0ec] p-5 md:p-6 bg-white">
      <p className="mb-4 text-[16px] font-semibold text-[#124e78]">{number}. {text}</p>
      <div className="space-y-2 pl-1">
        {(options||[]).map((opt,idx)=>{
          const optValue = opt.id ?? idx;
          const optLabel = opt.texto ?? opt.label ?? opt;
          const checked = String(value)===String(optValue);
          return (
            <label key={optValue} className="flex items-center gap-3 text-[15px] text-[#3e647d] cursor-pointer">
              <input type="radio" name={`q${number}`} value={optValue} checked={checked} onChange={()=>onChange(optValue)} className="h-4 w-4 accent-[#2b8aa8]" />
              <span>{optLabel}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function RatingQuestion({ number, text, options, value, onChange }) {
  const defaultLabels = ["Muy insatisfecho","Insatisfecho","Poco satisfecho","Satisfecho","Muy satisfecho"];
  const opts = options?.length ? options : defaultLabels.map(l=>({label:l}));
  return (
    <div className="rounded-xl border border-[#cfe0ec] p-5 md:p-6 bg-white">
      <p className="mb-5 text-[16px] font-semibold text-[#124e78]">{number}. {text}</p>
      <div className="flex flex-wrap justify-between gap-y-6">
        {opts.map((opt,i)=>{
          const n = i+1;
          const label = opt.label ?? opt.texto ?? defaultLabels[i] ?? `${n}`;
          const checked = String(value)===String(n);
          return (
            <div key={i} className="flex flex-col items-center w-[18%] min-w-[70px]">
              <label className="cursor-pointer">
                <input type="radio" name={`r${number}`} value={n} checked={checked} onChange={()=>onChange(n)} className="sr-only" />
                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-[16px] font-semibold transition-colors ${checked ? "border-[#2b8aa8] bg-[#e9f1f7] text-[#124e78]" : "border-[#cfe0ec] text-[#124e78]"}`}>{n}</div>
              </label>
              <span className="mt-2 text-[12px] leading-snug text-center text-[#3e647d] whitespace-pre-line">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
