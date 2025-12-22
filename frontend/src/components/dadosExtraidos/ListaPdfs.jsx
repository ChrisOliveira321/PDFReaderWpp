export default function ListaPdfs({ lista, onSelect, selecionadoId }) {
  if (!lista) {
    return (
      <div className="lista-pdfs">
        <h3>CRLVs Processados</h3>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="lista-pdfs">
      <h3>CRLVs Processados</h3>

      {lista.length === 0 ? (
        <p>Nenhum CRLV encontrado</p>
      ) : (
        <ul>
          {lista.map((pdf) => (
            <li
              key={pdf.id}
              onClick={() => onSelect(pdf.id)}
              className={`item-crlv ${
                selecionadoId === pdf.id ? "ativo" : ""
              }`}
              style={{ cursor: "pointer" }}
            >
              <strong>{pdf.placa || "Sem placa"}</strong>

              <span style={{ marginLeft: "8px", opacity: 0.7 }}>
                {pdf.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
