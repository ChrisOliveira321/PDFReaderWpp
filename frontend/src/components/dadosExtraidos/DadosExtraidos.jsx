import { useEffect, useState } from "react";

export default function DadosExtraidos({ crlvId }) {
  const [crlv, setCrlv] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!crlvId) {
      setCrlv(null);
      return;
    }

    async function buscarCRLV() {
      try {
        setLoading(true);

        const res = await fetch(`http://localhost:3001/api/crlv/${crlvId}`);
        const data = await res.json();

        setCrlv(data);
      } catch (err) {
        console.error("Erro ao buscar CRLV:", err);
        setCrlv(null);
      } finally {
        setLoading(false);
      }
    }

    buscarCRLV();
  }, [crlvId]);

  if (!crlvId) {
    return (
      <div className="dados-extraidos">
        <h3>Dados Extraídos</h3>
        <p>Nenhum CRLV selecionado.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dados-extraidos">
        <h3>Dados Extraídos</h3>
        <p>Carregando dados...</p>
      </div>
    );
  }

  if (!crlv) {
    return (
      <div className="dados-extraidos">
        <h3>Dados Extraídos</h3>
        <p>Erro ao carregar CRLV.</p>
      </div>
    );
  }

  return (
    <div className="dados-extraidos">
      <h3>Dados Extraídos</h3>

      <div className="dados-grid">
        <Campo label="Placa" valor={crlv.placa} />
        <Campo label="RENAVAM" valor={crlv.renavam} />
        <Campo label="Exercício" valor={crlv.exercicio} />

        <Campo label="Ano Fabricação" valor={crlv.ano_fabricacao} />
        <Campo label="Ano Modelo" valor={crlv.ano_modelo} />

        <Campo label="Número CRV" valor={crlv.numero_crv} />
        <Campo label="Código Segurança CLA" valor={crlv.codigo_seguranca_cla} />

        <Campo label="Chassi" valor={crlv.chassi} />
        <Campo label="Cor Predominante" valor={crlv.cor_predominante} />

        <Campo label="Nome do Proprietário" valor={crlv.nome_proprietario} />
        <Campo label="Local" valor={crlv.local} />

        <Campo label="Status" valor={crlv.status} />
      </div>
    </div>
  );
}

// --------------------------------
// Subcomponente reutilizável
// --------------------------------
function Campo({ label, valor }) {
  return (
    <div className="dado">
      <span>{label}</span>
      <strong>
        {valor !== null && valor !== undefined && valor !== "" ? valor : "-"}
      </strong>
    </div>
  );
}
