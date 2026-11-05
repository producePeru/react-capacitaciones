import { Navigate, type RouteObject } from "react-router-dom";
import { lazy } from "react";

const Inicio = lazy(() => import("@/pages/index/inicio"));
const Asistencia = lazy(() => import("@/pages/ugseco/asistencia"));
const CoursesTemplate = lazy(() => import("@/pages/ugseco/capacitaciones"));
const Diagnostico = lazy(() => import("@/pages/ugseco/diagnóstico"));
const Inscripciones = lazy(() => import("@/pages/ugseco/inscripciones"));
const InscripcionesSinCooperativa = lazy(() => import("@/pages/ugseco/inscripciones-sin-cooperativa"));
import AsistenciaPresencialUgseco from "@/pages/ugseco/asistencia-presencial";

const CapacitacionesComprasMYPEru = lazy(() => import("@/pages/compras-myperu/capacitaciones"));
const InscripcionesComprasMYPEru = lazy(() => import("@/pages/compras-myperu/inscripciones"));
import ComprasMyperuPruebaSalida from "@/pages/compras-myperu/prueba-salida";

export const routes: RouteObject[] = [

  {
    path: "/",
    element: <Inicio />,
  },
  {
    path: "/ugseco/capacitaciones",
    element: <CoursesTemplate />,
  },
  {
    path: "/ugseco/inscripciones",
    element: <Inscripciones />,
  },
  {
    path: "/ugseco/asistencia",
    element: <Asistencia />,
  },
  {
    path: "/ugseco/diagnostico",
    element: <Diagnostico />,
  },
  {
    path: "/ugseco/inscripciones-sin-cooperativa",
    element: <InscripcionesSinCooperativa />,
  },
  {
    path: "/ugseco/asistencia-presencial",
    element: <AsistenciaPresencialUgseco />,
  },

  //===================================> compras MYPEru
  {
    path: "/compras-myperu",
    element: <CapacitacionesComprasMYPEru />,
  },
  {
    path: "/compras-myperu/inscripciones",
    element: <InscripcionesComprasMYPEru />,
  },
  {
    path: "/compras-myperu/prueba-salida",
    element: <ComprasMyperuPruebaSalida />,
  },

  {
    path: "*",
    element: <Navigate to="/ugseco/capacitaciones" replace />,
  },
];
