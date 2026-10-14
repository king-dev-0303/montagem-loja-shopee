"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Eye, Image as ImageIcon, LayoutGrid, Loader2, Megaphone, Save, Send, Star } from "lucide-react";
import { acoes, fotoPorId, useHidratado, useStore } from "@/lib/store";
import { BANNERS, CATEGORIAS, type Loja } from "@/lib/data";
import { brl } from "@/lib/calc";
import { Cabecalho, Campo, Imagem, Painel, Skeleton } from "@/components/kit";
import { Celular, PaginaLoja } from "@/components/celular";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export default function VitrinePage() {
  return useHidratado() ? <Vitrine /> : <Skeleton className="h-[70vh]" />;
}

function Vitrine() {
  const { loja, produtos, fotos } = useStore();
  const [v, setV] = useState<Loja["vitrine"]>(loja.vitrine);
  const [confirmar, setConfirmar] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const sujo = JSON.stringify(v) !== JSON.stringify(loja.vitrine);
  const previa = { ...loja, vitrine: v };
  const elegiveis = produtos.filter((p) => p.status !== "rascunho");
  const erroSlogan = v.slogan.trim().length < 3 ? "Escreva uma frase curta pro banner." : v.slogan.length > 40 ? "Até 40 caracteres pra caber no banner." : undefined;

  const alternarDestaque = (id: string) => setV((x) => x.destaques.includes(id) ? { ...x, destaques: x.destaques.filter((d) => d !== id) } : x.destaques.length >= 6 ? (toast.error("Máximo de 6 destaques"), x) : { ...x, destaques: [...x.destaques, id] });
  const alternarColecao = (id: string) => setV((x) => x.colecoes.includes(id) ? { ...x, colecoes: x.colecoes.filter((d) => d !== id) } : x.colecoes.length >= 3 ? (toast.error("Escolha até 3 coleções"), x) : { ...x, colecoes: [...x.colecoes, id] });

  function salvar() {
    if (erroSlogan) return toast.error(erroSlogan);
    acoes.salvarLoja({ vitrine: { ...v, publicada: loja.vitrine.publicada && !sujo ? true : false } }, "Rascunho da vitrine salvo");
    setV((x) => ({ ...x, publicada: loja.vitrine.publicada && !sujo }));
    toast.success("Rascunho da vitrine salvo");
  }

  async function publicar() {
    setPublicando(true);
    await new Promise((r) => setTimeout(r, 1200));
    const nova = { ...v, publicada: true };
    acoes.salvarLoja({ vitrine: nova }, "Decoração da vitrine publicada");
    setV(nova);
    setPublicando(false);
    setConfirmar(false);
    toast.success("Vitrine publicada", { description: "Banner, coleções e destaques já aparecem na página da loja." });
  }

  const previaCelular = <Celular><PaginaLoja loja={previa} produtos={produtos} fotos={fotos} /></Celular>;

  return (
    <div>
      <Cabecalho kicker="Decoração da loja" titulo="Vitrine da Luma Casa"
        sub="A página da loja é onde o comprador decide se segue e volta. Banner com a cara da marca, coleções pra navegar e os produtos que puxam a venda logo em cima."
        acoes={<>
          <span className={cn("inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold", loja.vitrine.publicada && !sujo ? "bg-salvia text-[#14432b]" : "chip-glass text-white")}>
            {loja.vitrine.publicada && !sujo ? <><Check className="size-3.5" /> Publicada</> : sujo ? "Alterações não salvas" : "Rascunho"}
          </span>
          <Sheet>
            <SheetTrigger className="chip-glass inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-bold text-white xl:hidden"><Eye className="size-4" /> Prévia</SheetTrigger>
            <SheetContent side="right" className="w-full overflow-y-auto border-0 bg-[#f6ede6] p-4 sm:max-w-md">
              <SheetHeader className="p-0 pb-3"><SheetTitle>Prévia no celular</SheetTitle><SheetDescription>Como o comprador vê a página da loja.</SheetDescription></SheetHeader>
              {previaCelular}
            </SheetContent>
          </Sheet>
          <Button variant="ghost" onClick={salvar} disabled={!sujo} className="h-11 rounded-2xl bg-white/15 px-4 font-bold text-white hover:bg-white/25 hover:text-white"><Save className="size-4" /> Salvar rascunho</Button>
          <Button onClick={() => (erroSlogan ? toast.error(erroSlogan) : setConfirmar(true))} className="glow-laranja h-11 rounded-2xl bg-laranja px-5 font-bold hover:bg-[#e04d23]"><Send className="size-4" /> Publicar</Button>
        </>} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
        <div className="grid min-w-0 gap-5">
          <Painel>
            <h2 className="mb-1 flex items-center gap-2 font-heading text-xl font-bold"><ImageIcon className="size-5 text-laranja" /> Banner principal</h2>
            <p className="mb-4 text-sm text-muted-foreground">Foto em ambiente funciona melhor que produto isolado: mostra o estilo da casa.</p>
            <div role="radiogroup" aria-label="Banner" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {BANNERS.map((id) => {
                const f = fotoPorId(fotos, id);
                return (
                  <button key={id} type="button" role="radio" aria-checked={v.banner === id} onClick={() => setV({ ...v, banner: id })}
                    className={cn("group relative overflow-hidden rounded-2xl outline-none transition focus-visible:ring-2 focus-visible:ring-laranja", v.banner === id ? "ring-3 ring-laranja ring-offset-2 ring-offset-white/60" : "opacity-85 hover:opacity-100")}>
                    <Imagem src={f?.src} alt={f?.nome ?? id} className="aspect-[4/3] w-full transition duration-500 group-hover:scale-110" />
                    {v.banner === id && <span className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-laranja text-white"><Check className="size-3.5" /></span>}
                    <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 px-2 pt-5 pb-1.5 text-left text-xs font-semibold text-white">{f?.nome}</span>
                  </button>
                );
              })}
            </div>
            <Campo id="slogan" rotulo="Frase do banner" erro={erroSlogan} dica={`${v.slogan.length}/40`} className="mt-4 max-w-md">
              <Input id="slogan" value={v.slogan} onChange={(e) => setV({ ...v, slogan: e.target.value })} aria-invalid={!!erroSlogan} className="field" />
            </Campo>
          </Painel>

          <Painel>
            <h2 className="mb-1 flex items-center gap-2 font-heading text-xl font-bold"><LayoutGrid className="size-5 text-laranja" /> Coleções em destaque</h2>
            <p className="mb-4 text-sm text-muted-foreground">Até 3 categorias logo abaixo do perfil. {v.colecoes.length}/3 escolhidas.</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {CATEGORIAS.map((c) => {
                const on = v.colecoes.includes(c.id);
                return (
                  <button key={c.id} type="button" aria-pressed={on} onClick={() => alternarColecao(c.id)} className={cn("group relative aspect-square overflow-hidden rounded-3xl text-left outline-none transition focus-visible:ring-2 focus-visible:ring-laranja", on ? "ring-3 ring-laranja ring-offset-2 ring-offset-white/60" : "")}>
                    <Imagem src={c.capa} alt="" className={cn("absolute inset-0 size-full transition duration-700 group-hover:scale-110", !on && "saturate-50")} />
                    <div className="absolute inset-0 bg-gradient-to-t from-ameixa/85 via-ameixa/10 to-transparent" />
                    <span className={cn("absolute top-2.5 right-2.5 grid size-7 place-items-center rounded-full text-xs font-bold", on ? "bg-laranja text-white" : "chip-glass text-white")}>{on ? v.colecoes.indexOf(c.id) + 1 : ""}</span>
                    <span className="absolute bottom-3 left-3 font-heading text-base leading-tight font-bold text-white">{c.nome}<span className="block text-[11px] font-medium text-white/75">{produtos.filter((p) => p.categoriaId === c.id).length} produtos</span></span>
                  </button>
                );
              })}
            </div>
          </Painel>

          <Painel>
            <h2 className="mb-1 flex items-center gap-2 font-heading text-xl font-bold"><Star className="size-5 text-laranja" /> Produtos em destaque</h2>
            <p className="mb-4 text-sm text-muted-foreground">Até 6, na ordem em que você clicar. Rascunhos não aparecem. {v.destaques.length}/6 escolhidos.</p>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
              {elegiveis.map((p) => {
                const ordem = v.destaques.indexOf(p.id);
                const f = fotoPorId(fotos, p.fotos[0]);
                return (
                  <li key={p.id}>
                    <button type="button" aria-pressed={ordem >= 0} onClick={() => alternarDestaque(p.id)} className={cn("group relative block w-full overflow-hidden rounded-2xl bg-white text-left shadow-sm outline-none transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-laranja", ordem >= 0 && "ring-3 ring-laranja")}>
                      <Imagem src={f?.src} alt={p.nome} ajuste={f?.ajuste} className="aspect-square w-full" />
                      {ordem >= 0 && <span className="animate-pop absolute top-2 left-2 grid size-7 place-items-center rounded-full bg-laranja text-sm font-bold text-white shadow">{ordem + 1}</span>}
                      <div className="p-2"><p className="line-clamp-2 text-xs leading-snug">{p.nome}</p><p className="mt-1 text-sm font-bold text-laranja">{brl(p.precoPromo ?? p.preco)}</p></div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Painel>
        </div>

        <aside className="hidden xl:sticky xl:top-20 xl:block xl:self-start">
          <p className="mb-2 flex items-center justify-center gap-2 text-xs font-semibold tracking-widest text-white/80 uppercase"><Megaphone className="size-4" /> Prévia ao vivo</p>
          {previaCelular}
        </aside>
      </div>

      <Dialog open={confirmar} onOpenChange={(o) => !publicando && setConfirmar(o)}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Publicar a nova vitrine?</DialogTitle>
            <DialogDescription>Banner &quot;{v.slogan}&quot;, {v.colecoes.length} coleções e {v.destaques.length} destaques passam a aparecer na página da loja.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmar(false)} disabled={publicando}>Cancelar</Button>
            <Button onClick={publicar} disabled={publicando} className="bg-laranja hover:bg-[#e04d23]">{publicando ? <><Loader2 className="size-4 animate-spin" /> Publicando...</> : "Publicar vitrine"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
