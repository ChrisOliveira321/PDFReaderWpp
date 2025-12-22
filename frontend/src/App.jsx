import { BrowserRouter, Routes, Route } from "react-router-dom";
import Topbar from "./components/Topbar";
import "./App.css";

import Dashboard from "./pages/Dashboard";
import Mensagens from "./pages/Mensagens";
import DadosExtraidos from "./pages/DadosExtraidos";
import Automacao from "./pages/Automacao";

export default function App() {
  return (
    <BrowserRouter>
      <Topbar />

      <main style={{ paddingTop: "72px", padding: "24px" }}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/mensagens" element={<Mensagens />} />
          <Route path="/dados-extraidos" element={<DadosExtraidos />} />
          <Route path="/automacao" element={<Automacao />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
