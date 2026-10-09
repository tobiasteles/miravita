// aparece NA HORA quando você clica em algo que troca de tela, enquanto a próxima tela carrega
export default function Loading() {
  return (
    <div
      className="grid min-h-[60vh] place-items-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4 text-violet-200">
        <div className="mv-spin h-12 w-12 rounded-full border-4 border-violet-900 border-t-cyan-400" />
        <span className="text-sm tracking-[.3em]">CARREGANDO</span>
      </div>
    </div>
  );
}
