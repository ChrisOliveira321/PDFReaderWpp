import "../styles/Topbar.css";
import logo from "../assets/rodofrota-logo.avif";

export default function Topbar() {
  return (
    <header className="topbar">
  <div className="topbar-inner">
    <div className="topbar-logo">
      <img src={logo} alt="Rodofrota" />
    </div>

    <nav className="topbar-nav">
      <a href="/">Dashboard</a>
      <a href="/mensagens">Mensagens</a>
      <a href="/dados-extraidos">Dados Extraídos</a>
      <a href="/automacao">Automação</a>
    </nav>
  </div>
</header>

  );
}
