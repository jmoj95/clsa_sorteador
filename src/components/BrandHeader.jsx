import aveMariaMonogram from "../assets/ave-maria-monogram.svg";

export function BrandHeader({ loading, results }) {
  return (
    <div className="topbar">
      <div className="brand">
        <img className="brand-monogram" src={aveMariaMonogram} alt="Monograma Ave Maria" />
        <span>CLSA</span>
        <span className="brand-cross" aria-label="Cruzeiro do Clube de Literatura Santo Agostinho">✝</span>
      </div>
      <div className="status">
        <span className="status-dot" />
        {loading ? "Sorteando..." : results ? "Sorteio concluído" : "Pronto para sortear"}
      </div>
    </div>
  );
}
