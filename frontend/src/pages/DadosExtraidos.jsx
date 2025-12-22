import { useEffect, useState } from "react";
import ListaPdfs from "../components/dadosExtraidos/ListaPdfs";
import DadosExtraidos from "../components/dadosExtraidos/DadosExtraidos";
import "../styles/DadosExtraidos.css";

export default function Mensagens() {
  const [listaPdfs, setListaPdfs] = useState(null);
  const [crlvSelecionadoId, setCrlvSelecionadoId] = useState(null);

  // Busca lista de CRLVs (leve)
  useEffect(() => {
    fetch("http://localhost:3001/api/crlv")
      .then(res => res.json())
      .then(setListaPdfs)
      .catch(err => console.error("Erro ao buscar lista:", err));
  }, []);

  function selecionarCrlv(id) {
    console.log("ID selecionado:", id); // 👈 debug
    setCrlvSelecionadoId(id);
  }

  return (
    <div className="dadosExtraidos-container">
      <ListaPdfs
        lista={listaPdfs}
        onSelect={selecionarCrlv}
        selecionadoId={crlvSelecionadoId}
      />

      <DadosExtraidos crlvId={crlvSelecionadoId} />
    </div>
  );
}
