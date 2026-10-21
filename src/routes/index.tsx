import { Navigate, type RouteObject } from "react-router-dom";

import Inicio from "@/pages/index/inicio";
import CoursesTemplate from "@/pages/ugseco/capacitaciones";
import Diagnostico from "@/pages/ugseco/diagnóstico";
import Inscripciones from "@/pages/ugseco/inscripciones";

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
    path: "/ugseco/diagnostico",
    element: <Diagnostico />,
  },
  {
    path: "*",
    element: <Navigate to="/ugseco/capacitaciones" replace />,
  },
];
