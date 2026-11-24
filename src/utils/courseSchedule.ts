type ScheduleSession = {
  fecha?: unknown;
  date?: unknown;
  horaInicio?: unknown;
  horaFin?: unknown;
  hora_inicio?: unknown;
  hora_fin?: unknown;
};

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const sessionDate = (session: ScheduleSession) => text(session.fecha ?? session.date).slice(0, 10);

export function getCourseTimeRanges(schedule: unknown, date?: string | null): string[] {
  if (typeof schedule === "string") {
    return [...new Set(schedule.split("/").map((range) => range.trim()).filter(Boolean))];
  }
  if (!Array.isArray(schedule)) return [];

  const targetDate = date?.slice(0, 10);
  let sessions = schedule;
  if (targetDate && schedule.some((session) => session && typeof session === "object" && sessionDate(session))) {
    sessions = schedule.filter((session) => session && typeof session === "object" && sessionDate(session) === targetDate);
    if (!sessions.length) {
      sessions = schedule.filter((session) => typeof session === "string" || (session && typeof session === "object" && !sessionDate(session)));
    }
  }

  // Compatibilidad con el formato antiguo [hora de inicio, hora de fin].
  if (sessions.length === 2 && sessions.every((session) => typeof session === "string" && /^\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]\.?m\.?)?$/i.test(session.trim()))) {
    return [`${sessions[0].trim()} - ${sessions[1].trim()}`];
  }

  const ranges = sessions.flatMap((session) => {
    if (typeof session === "string") return session.split("/").map((range) => range.trim()).filter(Boolean);
    if (!session || typeof session !== "object") return [];
    const start = text(session.horaInicio ?? session.hora_inicio);
    const end = text(session.horaFin ?? session.hora_fin);
    const range = [start, end].filter(Boolean).join(" - ");
    return range ? [range] : [];
  });
  return [...new Set(ranges)];
}
