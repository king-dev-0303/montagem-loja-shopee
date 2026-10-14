"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowDownWideNarrow, FileSpreadsheet, LayoutGrid, List, Loader2, PackagePlus, PackageSearch, Search, Send, Undo2, CheckCheck, X } from "lucide-react";
import { acoes, fotoPorId, useStore } from "@/lib/store";
import { CATEGORIAS, STATUS, type Produto, type StatusProduto } from "@/lib/data";
import { brl, lucro, pontuacao, regras } from "@/lib/calc";
import { Cabecalho, Imagem, Skeleton, StatusBadge, Vazio } from "@/components/kit";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const ORDENS = { recentes: "Mais recentes", nome: "Nome (A-Z)", "preco-asc": "Menor preço", "preco-desc": "Maior preço", margem: "Maior margem", qualidade: "Pior qualidade primeiro" } as const;
type Ordem = keyof typeof ORDENS;
const STATUS_OPC = { todos: "Todos os status", ...Object.fromEntries(Object.entries(STATUS).map(([k, v]) => [k, v.rotulo])) } as Record<"todos" | StatusProduto, string>;

export function Catalogo() {
  const { produtos, fotos, loja } = useStore();
  const sp = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [cat, setCat] = useState(sp.get("cat") ?? "todas");
  const [status, setStatus] = useState<"todos" | StatusProduto>((sp.get("status") as StatusProduto) ?? "todos");
  const [ordem, setOrdem] = useState<Ordem>((sp.get("ordem") as Ordem) ?? "recentes");
  const [vista, setVista] = useState<"grade" | "lista">("grade");
  const [sel, setSel] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [publicar, setPublicar] = useState(false);
  const [processando, setProcessando] = useState(false);

  useEffect(() => { const t = setTimeout(() => setCarregando(false), 450); return () => clearTimeout(t); }, []);
  const ultimo = useRef<string | null>(null);
  // A busca do topo navega pra cá com ?q=; só reaplica quando a URL não foi escrita por esta tela
  useEffect(() => {
    if (ultimo.current !== null && sp.toString() !== ultimo.current) {
      setQ(sp.get("q") ?? "");
      setStatus((sp.get("status") as StatusProduto) ?? "todos");
    }
  }, [sp]);

  // Mantém os filtros na URL: dá pra compartilhar "produtos com pendência" com a equipe
  useEffect(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (cat !== "todas") p.set("cat", cat);
    if (status !== "todos") p.set("status", status);
    if (ordem !== "recentes") p.set("ordem", ordem);
    const s = p.toString();
    ultimo.current = s;
    router.replace(s ? `/produtos?${s}` : "/produtos", { scroll: false });
  }, [q, cat, status, ordem, router]);

  const info = useMemo(() => new Map(produtos.map((p) => [p.id, { nota: pontuacao(regras(p, fotos, loja)), margem: lucro(p.precoPromo ?? p.preco, p.custo, loja.taxas).margem }])), [produtos, fotos, loja]);

  const lista = useMemo(() => {
    const termo = q.trim().toLowerCase();
    const r = produtos.filter((p) =>
      (cat === "todas" || p.categoriaId === cat) &&
      (status === "todos" || p.status === status) &&
      (!termo || `${p.nome} ${p.sku} ${CATEGORIAS.find((c) => c.id === p.categoriaId)?.nome}`.toLowerCase().includes(termo)));
    const preco = (p: Produto) => p.precoPromo ?? p.preco;
    const cmp: Record<Ordem, (a: Produto, b: Produto) => number> = {
      recentes: (a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm),
      nome: (a, b) => a.nome.localeCompare(b.nome, "pt-BR"),
      "preco-asc": (a, b) => preco(a) - preco(b),
      "preco-desc": (a, b) => preco(b) - preco(a),
      margem: (a, b) => info.get(b.id)!.margem - info.get(a.id)!.margem,
      qualidade: (a, b) => info.get(a.id)!.nota - info.get(b.id)!.nota,
    };
    return [...r].sort(cmp[ordem]);
  }, [produtos, q, cat, status, ordem, info]);

  const alternar = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const todosSel = lista.length > 0 && lista.every((p) => sel.includes(p.id));
  const aptos = sel.filter((id) => (info.get(id)?.nota ?? 0) >= 85);

  function mover(st: StatusProduto) {
    acoes.mudarStatus(sel, st);
    toast.success(`${sel.length} produto(s) movidos para "${STATUS[st].rotulo}"`);
    setSel([]);
  }

  async function confirmarPublicacao() {
    setProcessando(true);
    await new Promise((r) => setTimeout(r, 1300));
    acoes.mudarStatus(aptos, "publicado");
    const ignorados = sel.length - aptos.length;
    toast.success(`${aptos.length} anúncio(s) publicados na Shopee`, { description: ignorados ? `${ignorados} ficaram de fora por ter qualidade abaixo de 85.` : "Todos passaram nas checagens." });
    setProcessando(false);
    setPublicar(false);
    setSel([]);
  }

  return (
    <div>
      <Cabecalho kicker="Catálogo" titulo="Produtos da Luma Casa" sub={`${produtos.length} itens com preço, tarifa e qualidade de anúncio calculados. Clique num produto pra editar e ver a prévia como na Shopee.`}
        acoes={<>
          <Link href="/importar" className="chip-glass inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-bold text-white hover:bg-white/30"><FileSpreadsheet className="size-4" /> Importar planilha</Link>
          <Link href="/produtos/novo" className="glow-laranja inline-flex h-11 items-center gap-2 rounded-2xl bg-laranja px-4 text-sm font-bold text-white hover:bg-[#e04d23]"><PackagePlus className="size-4" /> Novo produto</Link>
        </>} />

      <div className="scroll-thin -mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Categorias">
        {[{ id: "todas", nome: "Todas", capa: "/img/sala.jpg" }, ...CATEGORIAS].map((c) => {
          const n = c.id === "todas" ? produtos.length : produtos.filter((p) => p.categoriaId === c.id).length;
          return (
            <button key={c.id} type="button" onClick={() => setCat(c.id)} aria-pressed={cat === c.id}
              className={cn("flex h-12 shrink-0 items-center gap-2 rounded-2xl py-1 pr-4 pl-1 text-sm font-semibold transition", cat === c.id ? "bg-white text-ameixa shadow-lg" : "chip-glass text-white hover:bg-white/30")}>
              <Imagem src={c.capa} alt="" className="size-10 rounded-xl" /> {c.nome} <span className={cn("tabular rounded-full px-1.5 text-xs", cat === c.id ? "bg-laranja/15 text-laranja" : "bg-white/20")}>{n}</span>
            </button>
          );
        })}
      </div>

      <div className="glass mb-4 flex flex-wrap items-center gap-2 rounded-3xl p-2.5">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, SKU ou categoria" aria-label="Buscar no catálogo"
            className="h-11 w-full rounded-2xl border border-ameixa/10 bg-white/80 pr-9 pl-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-laranja" />
          {q && <button type="button" onClick={() => setQ("")} aria-label="Limpar busca" className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-full hover:bg-muted"><X className="size-4" /></button>}
        </div>
        <Select value={status} onValueChange={(v) => v && setStatus(v as typeof status)}>
          <SelectTrigger aria-label="Status" className="field h-11! w-44 rounded-2xl"><SelectValue>{(v: typeof status) => STATUS_OPC[v]}</SelectValue></SelectTrigger>
          <SelectContent>{(Object.keys(STATUS_OPC) as (typeof status)[]).map((s) => <SelectItem key={s} value={s}>{STATUS_OPC[s]}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={ordem} onValueChange={(v) => v && setOrdem(v as Ordem)}>
          <SelectTrigger aria-label="Ordenar" className="field h-11! w-52 rounded-2xl"><ArrowDownWideNarrow className="size-4 text-laranja" /><SelectValue>{(v: Ordem) => ORDENS[v]}</SelectValue></SelectTrigger>
          <SelectContent>{(Object.keys(ORDENS) as Ordem[]).map((o) => <SelectItem key={o} value={o}>{ORDENS[o]}</SelectItem>)}</SelectContent>
        </Select>
        <div role="group" aria-label="Visualização" className="flex rounded-2xl bg-ameixa/6 p-1">
          {([["grade", LayoutGrid], ["lista", List]] as const).map(([v, I]) => (
            <button key={v} type="button" onClick={() => setVista(v)} aria-pressed={vista === v} aria-label={v === "grade" ? "Grade" : "Lista"}
              className={cn("grid size-9 place-items-center rounded-xl transition", vista === v ? "bg-white text-laranja shadow-sm" : "text-muted-foreground hover:text-foreground")}><I className="size-4" /></button>
          ))}
        </div>
        <label className="ml-1 flex items-center gap-2 text-sm font-medium">
          <Checkbox checked={todosSel} onCheckedChange={(v) => setSel(v ? lista.map((p) => p.id) : [])} aria-label="Selecionar todos" /> Todos
        </label>
      </div>

      {carregando ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-80" />)}</div>
      ) : lista.length === 0 ? (
        <Vazio icone={PackageSearch} titulo="Nenhum produto com esses filtros" texto="Tente outra categoria ou limpe a busca. Produtos importados por planilha entram como rascunho."
          acao={<Button onClick={() => { setQ(""); setCat("todas"); setStatus("todos"); }} className="bg-laranja">Limpar filtros</Button>} />
      ) : vista === "grade" ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {lista.map((p, i) => {
            const capa = fotoPorId(fotos, p.fotos[0]);
            const seg = fotoPorId(fotos, p.fotos[1]);
            const { nota, margem } = info.get(p.id)!;
            const desc = p.precoPromo ? Math.round((1 - p.precoPromo / p.preco) * 100) : 0;
            return (
              <li key={p.id} className="animate-pop" style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}>
                <article className={cn("glass group relative h-full overflow-hidden rounded-3xl transition hover:-translate-y-1", sel.includes(p.id) && "ring-2 ring-laranja")}>
                  <div className="relative aspect-[4/3.4] overflow-hidden">
                    <Imagem src={capa?.src} alt={p.nome} ajuste={capa?.ajuste} className="absolute inset-0 size-full transition duration-700 group-hover:scale-105" />
                    {seg && <Imagem src={seg.src} alt="" ajuste={seg.ajuste} className="absolute inset-0 size-full opacity-0 transition duration-700 group-hover:opacity-100" />}
                    <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
                      <span className="rounded-lg bg-white/90 p-1.5 shadow" onClick={(e) => e.stopPropagation()}><Checkbox checked={sel.includes(p.id)} onCheckedChange={() => alternar(p.id)} aria-label={`Selecionar ${p.nome}`} /></span>
                      <StatusBadge status={p.status} />
                    </div>
                    {desc > 0 && <span className="absolute bottom-3 left-3 rounded-lg bg-laranja px-2 py-1 text-xs font-bold text-white">-{desc}%</span>}
                    <span className={cn("tabular absolute right-3 bottom-3 grid size-11 place-items-center rounded-full text-sm font-bold backdrop-blur-md", nota >= 85 ? "bg-salvia/85 text-[#14432b]" : nota >= 60 ? "bg-mel/85 text-[#5c3700]" : "bg-destructive/85 text-white")} title="Qualidade do anúncio">{nota}</span>
                  </div>
                  <Link href={`/produtos/${p.id}`} className="block p-4 outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-laranja focus-visible:after:rounded-3xl">
                    <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{p.sku} · {CATEGORIAS.find((c) => c.id === p.categoriaId)?.nome}</p>
                    <h3 className="mt-1 line-clamp-2 min-h-10 text-sm leading-snug font-semibold">{p.nome}</h3>
                    <div className="mt-3 flex items-end justify-between gap-2">
                      <div>
                        {p.precoPromo && <p className="text-xs text-muted-foreground line-through">{brl(p.preco)}</p>}
                        <p className="font-heading text-xl font-bold text-laranja">{brl(p.precoPromo ?? p.preco)}</p>
                      </div>
                      <div className="text-right text-xs">
                        <p className={cn("font-bold", margem >= 15 ? "text-[#1f7a4c]" : "text-destructive")}>{margem.toFixed(0)}% margem</p>
                        <p className={cn("text-muted-foreground", p.estoque === 0 && "font-semibold text-destructive")}>{p.estoque === 0 ? "Sem estoque" : `${p.estoque} em estoque`}</p>
                      </div>
                    </div>
                  </Link>
                </article>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="glass overflow-x-auto rounded-3xl">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="text-left text-xs text-muted-foreground uppercase">
              <tr className="border-b border-ameixa/10">
                <th className="w-10 p-3"><span className="sr-only">Selecionar</span></th>
                <th className="p-3">Produto</th><th className="p-3">Status</th><th className="p-3 text-right">Preço</th><th className="p-3 text-right">Margem</th><th className="p-3 text-right">Estoque</th><th className="p-3 text-right">Qualidade</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => {
                const { nota, margem } = info.get(p.id)!;
                return (
                  <tr key={p.id} className="border-b border-ameixa/6 transition last:border-0 hover:bg-white/60">
                    <td className="p-3"><Checkbox checked={sel.includes(p.id)} onCheckedChange={() => alternar(p.id)} aria-label={`Selecionar ${p.nome}`} /></td>
                    <td className="p-3">
                      <Link href={`/produtos/${p.id}`} className="flex items-center gap-3 hover:text-laranja">
                        <Imagem src={fotoPorId(fotos, p.fotos[0])?.src} alt="" className="size-11 rounded-xl" />
                        <span><span className="line-clamp-1 font-semibold">{p.nome}</span><span className="text-xs text-muted-foreground">{p.sku}</span></span>
                      </Link>
                    </td>
                    <td className="p-3"><StatusBadge status={p.status} /></td>
                    <td className="tabular p-3 text-right font-semibold">{brl(p.precoPromo ?? p.preco)}</td>
                    <td className={cn("tabular p-3 text-right font-semibold", margem >= 15 ? "text-[#1f7a4c]" : "text-destructive")}>{margem.toFixed(1)}%</td>
                    <td className="tabular p-3 text-right">{p.estoque}</td>
                    <td className="tabular p-3 text-right font-bold">{nota}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {sel.length > 0 && (
        <div className="glass-dark animate-pop fixed inset-x-3 bottom-24 z-40 mx-auto flex max-w-2xl flex-wrap items-center gap-2 rounded-3xl p-2.5 pl-5 text-white lg:bottom-6" role="region" aria-label="Ações em massa">
          <p className="mr-auto text-sm font-semibold">{sel.length} selecionado(s)</p>
          <Button size="sm" variant="ghost" className="text-white hover:bg-white/15 hover:text-white" onClick={() => mover("rascunho")}><Undo2 className="size-4" /> Rascunho</Button>
          <Button size="sm" variant="ghost" className="text-white hover:bg-white/15 hover:text-white" onClick={() => mover("pronto")}><CheckCheck className="size-4" /> Marcar pronto</Button>
          <Button size="sm" className="bg-laranja text-white hover:bg-[#e04d23]" onClick={() => setPublicar(true)}><Send className="size-4" /> Publicar</Button>
          <button type="button" onClick={() => setSel([])} aria-label="Limpar seleção" className="grid size-8 place-items-center rounded-full hover:bg-white/15"><X className="size-4" /></button>
        </div>
      )}

      <Dialog open={publicar} onOpenChange={(v) => !processando && setPublicar(v)}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Publicar {aptos.length} anúncio(s) na Shopee?</DialogTitle>
            <DialogDescription>
              Só sobem os anúncios com qualidade 85 ou mais.{sel.length - aptos.length > 0 && ` ${sel.length - aptos.length} item(ns) selecionado(s) ainda têm pendência e vão ficar de fora.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublicar(false)} disabled={processando}>Cancelar</Button>
            <Button onClick={confirmarPublicacao} disabled={processando || aptos.length === 0} className="bg-laranja hover:bg-[#e04d23]">
              {processando ? <><Loader2 className="size-4 animate-spin" /> Enviando...</> : "Publicar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
