import { Navigate, type RouteObject } from "react-router-dom";

import Inicio from "@/pages/index/inicio";
import Asistencia from "@/pages/ugseco/asistencia";
import CoursesTemplate from "@/pages/ugseco/capacitaciones";
import Diagnostico from "@/pages/ugseco/diagnóstico";
import Inscripciones from "@/pages/ugseco/inscripciones";
import InscripcionesSinCooperativa from "@/pages/ugseco/inscripciones-sin-cooperativa";

import CapacitacionesComprasMYPEru from "@/pages/compras-myperu/capacitaciones";
import InscripcionesComprasMYPEru from "@/pages/compras-myperu/inscripciones";

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
    path: "/compras-myperu",
    element: <CapacitacionesComprasMYPEru />,
  },
  {
    path: "/compras-myperu/inscripciones",
    element: <InscripcionesComprasMYPEru />,
  },

  {
    path: "*",
    element: <Navigate to="/ugseco/capacitaciones" replace />,
  },
];
