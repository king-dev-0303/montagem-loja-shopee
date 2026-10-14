import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NaoEncontrada() {
  return (
    <div className="glass mx-auto mt-10 flex max-w-lg flex-col items-center rounded-3xl px-6 py-14 text-center">
      <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-laranja/12 text-laranja"><SearchX className="size-7" /></span>
      <h1 className="font-heading text-2xl font-bold">Página não encontrada</h1>
      <p className="mt-1 text-sm text-muted-foreground">O endereço pode ter mudado. Volte ao painel pra continuar a montagem da loja.</p>
      <Link href="/" className="mt-5 inline-flex h-11 items-center rounded-xl bg-laranja px-5 text-sm font-bold text-white">Ir ao painel</Link>
    </div>
  );
}
