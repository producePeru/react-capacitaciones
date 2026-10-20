import { BrowserRouter, Route, Routes } from "react-router-dom";
import { routes } from "@/routes";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {routes.map((r) => (
          <Route key={r.path} path={r.path} element={r.element} />
        ))}
      </Routes>
    </BrowserRouter>
  );
}

export default App
