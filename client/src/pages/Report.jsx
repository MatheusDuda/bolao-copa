import { useState } from 'react';

export default function Report() {
  const [text, setText] = useState('');
  const [showPrank, setShowPrank] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowPrank(true);
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Reportar erro</h1>
      <p className="text-slate-500 text-sm mb-6">Encontrou algum problema? Descreva abaixo.</p>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="label">Descrição do erro</label>
          <textarea
            className="input min-h-[120px] resize-none"
            placeholder="Descreva o que aconteceu..."
            value={text}
            onChange={e => setText(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-primary w-full">
          Enviar relatório
        </button>
      </form>

      {showPrank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="text-5xl mb-4">🪑⌨️</div>
            <h2 className="text-xl font-black text-white mb-3">Erro identificado!</h2>
            <p className="text-slate-300 text-base leading-relaxed">
              O erro está entre a cadeira e o teclado!
            </p>
            <button
              onClick={() => { setShowPrank(false); setText(''); }}
              className="mt-6 btn-primary w-full"
            >
              Entendido 😅
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
