"use client";
import { useState } from "react";
import { Badge, Button, Card, EaBar, HpBar, Modal, Tooltip, useToast } from "@/components/ui";

const swatches = ["bg-bg", "bg-surface", "bg-surface-2", "bg-line", "bg-arcane", "bg-aether", "bg-ember", "bg-blood", "bg-vital"];

export default function Demo() {
  const [open, setOpen] = useState(false);
  const [hp, setHp] = useState(80);
  const toast = useToast();
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4">
      <h1 className="font-display text-2xl font-extrabold">Styleguide</h1>
      <Card className="space-y-2">
        <h2 className="font-bold text-aether">Cores</h2>
        <div className="flex flex-wrap gap-2">
          {swatches.map((c) => <div key={c} className={`${c} h-10 w-16 rounded-chip ring-1 ring-line`} title={c} />)}
        </div>
      </Card>
      <Card className="space-y-3">
        <h2 className="font-bold text-aether">Botões</h2>
        <div className="flex flex-wrap gap-2">
          <Button>Primário</Button><Button variant="ghost">Fantasma</Button>
          <Button variant="danger">Perigo</Button><Button variant="gold">Ouro</Button>
          <Button size="sm">Pequeno</Button><Button disabled>Desativado</Button>
        </div>
      </Card>
      <Card tone="gold" className="space-y-3">
        <h2 className="font-bold text-ember">Barras e selos</h2>
        <HpBar value={hp} max={100} showValue />
        <EaBar value={55} max={100} showValue />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="danger" onClick={() => setHp((h) => Math.max(0, h - 25))}>Tomar dano</Button>
          <Button size="sm" variant="ghost" onClick={() => setHp(100)}>Curar</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>Comum</Badge><Badge tone="arcane">Raro</Badge><Badge tone="aether">Épico</Badge>
          <Badge tone="ember">Lendário</Badge><Badge tone="blood">Perigo</Badge><Badge tone="vital">Ativo</Badge>
        </div>
      </Card>
      <Card className="flex flex-wrap items-center gap-3">
        <Tooltip text="Dica acessível por hover e teclado"><Button variant="ghost">Passe o mouse</Button></Tooltip>
        <Button onClick={() => setOpen(true)}>Abrir modal</Button>
        <Button variant="ghost" onClick={() => toast("Item guardado na mochila.", "success")}>Toast ok</Button>
        <Button variant="ghost" onClick={() => toast("Sem energia para essa técnica.", "error")}>Toast erro</Button>
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title="Exemplo de modal">
        <p className="text-sm text-ink-dim">Esc, clique fora ou o botão fecham. O foco fica dentro do modal.</p>
        <Button onClick={() => setOpen(false)}>Entendi</Button>
      </Modal>
    </main>
  );
}
