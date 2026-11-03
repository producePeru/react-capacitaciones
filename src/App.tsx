import { BrowserRouter, Route, Routes } from "react-router-dom";
import { routes } from "@/routes";
import { Suspense } from "react";

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
        <Routes>
          {routes.map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App
