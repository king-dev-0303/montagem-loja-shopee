"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, BadgePercent, Camera, CheckCircle2, CircleDashed, FileSpreadsheet, Loader2, Package, PartyPopper, Rocket, Settings2, Store, TriangleAlert, Wallet } from "lucide-react";
import { acoes, fotoPorId, useStore } from "@/lib/store";
import { etapas, progresso } from "@/lib/etapas";
import { brl, lucro, pontuacao, quando, regras } from "@/lib/calc";
import { Anel, Barra, Imagem, Painel } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const ICONE_ATIV = { produto: Package, foto: Camera, loja: Settings2, importacao: FileSpreadsheet };

function Confete() {
  const cores = ["#ee5a2f", "#ffb48f", "#f5b342", "#8fc4a5", "#fff4ea", "#7a3550"];
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {Array.from({ length: 70 }, (_, i) => (
        <span key={i} className="absolute -top-4 block h-3 w-2 rounded-[2px]"
          style={{ left: `${(i * 37) % 100}%`, background: cores[i % cores.length], animation: `confete ${2.4 + (i % 7) * 0.25}s cubic-bezier(.2,.6,.4,1) ${(i % 10) * 0.06}s forwards`, ["--dx" as string]: `${((i * 53) % 160) - 80}px`, ["--rot" as string]: `${(i * 97) % 720}deg` }} />
      ))}
    </div>
  );
}

export default function PainelPage() {
  const estado = useStore();
  const { produtos, fotos, loja, atividades } = estado;
  const es = useMemo(() => etapas(estado), [estado]);
  const pct = progresso(es);
  const proxima = es.find((e) => e.feito < e.total);
  const [confirmar, setConfirmar] = useState(false);
  const [abrindo, setAbrindo] = useState(false);
  const [festa, setFesta] = useState(false);

  const prontos = produtos.filter((p) => p.status === "pronto" || p.status === "publicado").length;
  const fotosProd = fotos.filter((f) => f.tipo === "produto");
  const aprovadas = fotosProd.filter((f) => f.aprovada && f.ajuste.quadrada).length;
  const margens = produtos.filter((p) => p.preco > 0).map((p) => lucro(p.precoPromo ?? p.preco, p.custo, loja.taxas).margem);
  const margemMedia = margens.length ? margens.reduce((a, b) => a + b, 0) / margens.length : 0;
  const valorEstoque = produtos.reduce((s, p) => s + p.preco * p.estoque, 0);
  const pendencias = produtos
    .map((p) => ({ p, falhas: regras(p, fotos, loja).filter((r) => !r.ok), nota: pontuacao(regras(p, fotos, loja)) }))
    .filter((x) => x.falhas.length)
    .sort((a, b) => a.nota - b.nota);

  async function abrirLoja() {
    setAbrindo(true);
    await new Promise((r) => setTimeout(r, 1600));
    acoes.mudarStatus(produtos.filter((p) => p.status === "pronto").map((p) => p.id), "publicado");
    acoes.salvarLoja({ lancada: true }, "Loja @lumacasa aberta na Shopee");
    setAbrindo(false);
    setConfirmar(false);
    setFesta(true);
    toast.success("A loja está no ar!", { description: "Os produtos prontos foram publicados na Shopee." });
    setTimeout(() => setFesta(false), 4200);
  }

  const kpis = [
    { icone: Package, rotulo: "Produtos prontos", valor: `${prontos}/${produtos.length}`, barra: (prontos / Math.max(1, produtos.length)) * 100, href: "/produtos" },
    { icone: Camera, rotulo: "Fotos tratadas", valor: `${aprovadas}/${fotosProd.length}`, barra: (aprovadas / Math.max(1, fotosProd.length)) * 100, href: "/fotos" },
    { icone: BadgePercent, rotulo: "Margem média", valor: `${margemMedia.toFixed(1)}%`, barra: margemMedia * 2.5, href: "/produtos?ordem=margem" },
    { icone: Wallet, rotulo: "Valor em estoque", valor: brl(valorEstoque), barra: 100, href: "/produtos" },
  ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
      {festa && <Confete />}
      {/* Destaque: a sala da loja, o progresso e as peças flutuando por cima */}
      <section className="relative overflow-hidden rounded-[32px] text-white">
        <Imagem src="/img/sala-2.jpg" alt="" className="absolute inset-0 size-full" />
        <div className="absolute inset-0 bg-gradient-to-r from-ameixa/90 via-ameixa/65 to-[#a0482e]/30" />
        <div className="relative grid gap-8 p-6 sm:p-9 lg:grid-cols-[1.25fr_1fr] lg:items-center">
          <div>
            <span className="chip-glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold">
              <span className={cn("size-2 rounded-full", loja.lancada ? "bg-salvia" : "bg-mel animate-pulse")} /> @{loja.usuario} · {loja.lancada ? "no ar na Shopee" : "abertura prevista 28/10"}
            </span>
            <h1 className="mt-4 font-heading text-4xl leading-[1.02] font-bold sm:text-5xl xl:text-6xl">
              {loja.lancada ? <>A Luma Casa <span className="text-grad">já está vendendo</span></> : <>Sua loja na Shopee, <span className="text-grad">pronta pra vender</span></>}
            </h1>
            <p className="mt-4 max-w-xl text-white/85">
              Perfil, envio, recebimento, {produtos.length} produtos com preço calculado sobre as tarifas, fotos tratadas em 1:1 e a vitrine decorada, tudo num lugar só antes de apertar o botão.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {proxima ? (
                <Link href={proxima.href} className="glow-laranja sheen relative inline-flex h-12 items-center gap-2 rounded-2xl bg-laranja px-5 font-bold transition hover:bg-[#e04d23]">
                  Continuar: {proxima.titulo} <ArrowRight className="size-4" />
                </Link>
              ) : null}
              <button type="button" onClick={() => (pct === 100 && !loja.lancada ? setConfirmar(true) : pct < 100 ? toast.warning("Ainda falta concluir etapas", { description: `${proxima?.titulo}: ${proxima?.feito} de ${proxima?.total}.` }) : toast.info("A loja já está aberta."))}
                className={cn("chip-glass inline-flex h-12 items-center gap-2 rounded-2xl px-5 font-bold transition hover:bg-white/30", pct === 100 && !loja.lancada && "bg-white text-ameixa hover:bg-creme")}>
                <Rocket className="size-4" /> {loja.lancada ? "Loja aberta" : "Abrir a loja"}
              </button>
            </div>
          </div>
          <div className="relative mx-auto h-72 w-full max-w-sm">
            <div className="glass-dark absolute top-1/2 left-1/2 grid size-56 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full">
              <Anel valor={pct} tamanho={200} traco={14} claro>
                <div>
                  <p className="font-heading text-5xl font-bold tabular">{pct}%</p>
                  <p className="text-xs font-semibold text-white/75">da loja montada</p>
                </div>
              </Anel>
            </div>
            {[
              { src: "/img/vela-lilas.jpg", c: "top-0 left-0 w-28 [--r:-8deg]" },
              { src: "/img/cesto-roxo.jpg", c: "top-2 right-0 w-24 [--r:7deg] [animation-delay:-2s]" },
              { src: "/img/xicara-azul.jpg", c: "bottom-0 left-4 w-24 [--r:6deg] [animation-delay:-4s]" },
              { src: "/img/sabonete-mel.jpg", c: "right-2 bottom-2 w-28 [--r:-5deg] [animation-delay:-1s]" },
            ].map((x) => (
              <div key={x.src} className={cn("absolute animate-float rounded-2xl border border-white/50 bg-white/30 p-1 shadow-2xl backdrop-blur-md", x.c)}>
                <Imagem src={x.src} alt="" className="aspect-square w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.rotulo} href={k.href} className="glass sheen group rounded-3xl p-4 transition hover:-translate-y-0.5 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-2xl bg-laranja/12 text-laranja"><k.icone className="size-5" /></span>
              <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-laranja" />
            </div>
            <p className="mt-4 text-xs font-semibold text-muted-foreground sm:text-sm">{k.rotulo}</p>
            <p className="font-heading text-xl font-bold tabular sm:text-2xl">{k.valor}</p>
            <Barra valor={k.barra} className="mt-3" />
          </Link>
        ))}
      </div>

      <section aria-labelledby="etapas">
        <div className="mb-3 flex items-end justify-between text-white">
          <h2 id="etapas" className="font-heading text-2xl font-bold">Etapas da montagem</h2>
          <span className="text-sm text-white/75">{es.filter((e) => e.feito >= e.total).length} de {es.length} concluídas</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {es.map((e, i) => {
            const ok = e.feito >= e.total;
            return (
              <Link key={e.id} href={e.href} className="glass group overflow-hidden rounded-3xl transition hover:-translate-y-1">
                <div className="relative h-28 overflow-hidden">
                  <Imagem src={e.imagem} alt="" className="size-full transition duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ameixa/80 to-transparent" />
                  <span className="absolute bottom-3 left-4 font-heading text-4xl font-bold text-white/90">0{i + 1}</span>
                  <span className={cn("absolute top-3 right-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold", ok ? "bg-salvia text-[#14432b]" : "chip-glass text-white")}>
                    {ok ? <CheckCircle2 className="size-3.5" /> : <CircleDashed className="size-3.5" />} {ok ? "Concluída" : `${e.feito} de ${e.total}`}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-heading text-lg font-bold">{e.titulo}</h3>
                    <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-laranja" />
                  </div>
                  <p className="text-sm text-muted-foreground">{e.resumo}</p>
                  <Barra valor={e.total ? (e.feito / e.total) * 100 : 100} className="mt-3" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Painel aria-labelledby="pend">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="pend" className="flex items-center gap-2 font-heading text-xl font-bold"><TriangleAlert className="size-5 text-mel" /> O que ainda trava a abertura</h2>
            <Link href="/produtos?status=revisao" className="text-sm font-semibold text-laranja hover:underline">Ver catálogo</Link>
          </div>
          {pendencias.length === 0 ? (
            <p className="rounded-2xl bg-salvia/20 p-4 text-sm font-medium text-[#1f5a3c]">Todos os anúncios passam nas checagens da Shopee.</p>
          ) : (
            <ul className="grid gap-2">
              {pendencias.slice(0, 6).map(({ p, falhas, nota }) => (
                <li key={p.id}>
                  <Link href={`/produtos/${p.id}`} className="glass-soft flex items-center gap-3 rounded-2xl p-2.5 pr-4 transition hover:bg-white/80">
                    <Imagem src={fotoPorId(fotos, p.fotos[0])?.src} alt={p.nome} className="size-14 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{p.nome}</p>
                      <p className="truncate text-xs text-muted-foreground">{falhas.map((f) => f.rotulo).join(" · ")}</p>
                    </div>
                    <span className={cn("tabular grid size-11 shrink-0 place-items-center rounded-full text-sm font-bold", nota >= 70 ? "bg-mel/25 text-[#7a4a05]" : "bg-destructive/12 text-destructive")}>{nota}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Painel>
        <Painel aria-labelledby="ativ">
          <h2 id="ativ" className="mb-4 font-heading text-xl font-bold">Atividade recente</h2>
          <ol className="relative grid gap-4 before:absolute before:top-2 before:bottom-2 before:left-[19px] before:w-px before:bg-ameixa/12">
            {atividades.slice(0, 6).map((a) => {
              const I = ICONE_ATIV[a.tipo];
              return (
                <li key={a.id} className="relative flex gap-3">
                  <span className="z-10 grid size-10 shrink-0 place-items-center rounded-2xl bg-white text-laranja shadow-sm"><I className="size-4" /></span>
                  <div>
                    <p className="text-sm font-medium">{a.texto}</p>
                    <p className="text-xs text-muted-foreground">{quando(a.quando)}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Painel>
      </div>

      <Painel className="overflow-hidden p-0" aria-label="Prévia do catálogo">
        <div className="flex items-center justify-between gap-3 px-5 pt-5 sm:px-6">
          <h2 className="flex items-center gap-2 font-heading text-xl font-bold"><Store className="size-5 text-laranja" /> Prévia do catálogo</h2>
          <Link href="/vitrine" className="text-sm font-semibold text-laranja hover:underline">Montar vitrine</Link>
        </div>
        <div className="relative mt-4 overflow-hidden pb-5 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
          <div className="flex w-max animate-marquee gap-3 hover:[animation-play-state:paused]">
            {[...produtos, ...produtos].map((p, i) => (
              <Link key={`${p.id}-${i}`} href={`/produtos/${p.id}`} className="w-40 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm" tabIndex={i >= produtos.length ? -1 : undefined}>
                <Imagem src={fotoPorId(fotos, p.fotos[0])?.src} alt={p.nome} className="aspect-square w-full" />
                <div className="p-2.5">
                  <p className="line-clamp-2 text-xs leading-snug">{p.nome}</p>
                  <p className="mt-1 text-sm font-bold text-laranja">{brl(p.precoPromo ?? p.preco)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Painel>

      <Dialog open={confirmar} onOpenChange={(v) => !abrindo && setConfirmar(v)}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading text-xl"><PartyPopper className="size-5 text-laranja" /> Abrir a loja agora?</DialogTitle>
            <DialogDescription>
              {produtos.filter((p) => p.status === "pronto").length} produtos prontos vão ser publicados na Shopee e a vitrine fica visível pra compradores. Dá pra pausar anúncios depois.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmar(false)} disabled={abrindo}>Ainda não</Button>
            <Button onClick={abrirLoja} disabled={abrindo} className="bg-laranja hover:bg-[#e04d23]">
              {abrindo ? <><Loader2 className="size-4 animate-spin" /> Publicando...</> : <><Rocket className="size-4" /> Abrir loja</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
