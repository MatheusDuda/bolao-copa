function Section({ title, children }) {
  return (
    <div className="card p-6 space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-700">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Row({ label, pts, desc }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <span className="text-white font-medium text-sm">{label}</span>
        {desc && <p className="text-slate-500 text-xs mt-0.5">{desc}</p>}
      </div>
      <span className="text-copa-green font-bold text-sm whitespace-nowrap">+{pts} pts</span>
    </div>
  );
}

export default function Rules() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-black text-white tracking-tight">Regras</h1>

      <Section title="Palpites dos jogos">
        <Row
          label="Placar exato"
          pts={3}
          desc="Acertou o placar certinho, ex: Brasil 2 × 1 Argentina"
        />
        <Row
          label="Vencedor certo"
          pts={1}
          desc="Acertou quem ganhou (ou empate), mas errou o placar"
        />
        <div className="text-slate-500 text-xs pt-1 border-t border-slate-800">
          Resultado errado = 0 pts. Jogos sem palpite antes do fechamento = 0 pts.
        </div>
      </Section>

      <Section title="Pré-torneio">
        <Row label="Campeão" pts={10} desc="Selecione o time que vai ganhar a Copa" />
        <Row label="Artilheiro" pts={8} desc="Jogador com mais gols no torneio" />
        <Row label="Desempenho do Brasil" pts={17} desc="Até onde o Brasil vai chegar" />
        <Row label="Melhor ataque (fase de grupos)" pts={5} desc="Time que marcar mais gols na fase de grupos" />
        <Row label="Melhor defesa (fase de grupos)" pts={5} desc="Time que sofrer menos gols na fase de grupos" />
        <Row label="Neymar marca pelo menos 3 gols?" pts={3} desc="Sim ou Não" />
        <div className="text-slate-500 text-xs pt-1 border-t border-slate-800">
          Palpites do pré-torneio ficam bloqueados quando o torneio começa.
        </div>
      </Section>

      <Section title="Geral">
        <p className="text-slate-300 text-sm leading-relaxed">
          A classificação é atualizada automaticamente conforme os resultados dos jogos são inseridos. Quem somar mais pontos no final do torneio vence o bolão.
        </p>
      </Section>
    </div>
  );
}
