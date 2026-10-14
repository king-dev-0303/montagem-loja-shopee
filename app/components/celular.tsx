"use client";

import { useState } from "react";
import { ChevronLeft, Heart, MessageCircle, Search, Share2, ShoppingCart, Star, Store, Truck, BadgeCheck, MapPin } from "lucide-react";
import { Imagem } from "@/components/kit";
import { brl } from "@/lib/calc";
import { CATEGORIAS, type Foto, type Loja, type Produto } from "@/lib/data";
import { cn } from "@/lib/utils";

export function Celular({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative mx-auto w-full max-w-[330px] rounded-[44px] bg-gradient-to-b from-[#3a2433] to-[#1f141b] p-2.5 shadow-[0_40px_80px_-30px_rgb(20_8_14/0.8),inset_0_1px_0_rgb(255_255_255/0.25)]", className)}>
      <div className="absolute top-4 left-1/2 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
      <div className="scroll-thin relative h-[620px] overflow-y-auto overflow-x-hidden rounded-[36px] bg-[#f5f5f5] text-[#222]">{children}</div>
    </div>
  );
}

/** Prévia do anúncio como o comprador vê no app (layout de referência, sem marca). */
export function Anuncio({ p, fotos, loja }: { p: Produto; fotos: Foto[]; loja: Loja }) {
  const [i, setI] = useState(0);
  const lista = p.fotos.map((id) => fotos.find((f) => f.id === id)).filter(Boolean) as Foto[];
  const atual = lista[Math.min(i, lista.length - 1)];
  const desc = p.precoPromo ? Math.round((1 - p.precoPromo / p.preco) * 100) : 0;
  return (
    <div>
      <div className="relative aspect-square bg-white">
        {atual ? <Imagem key={atual.id} src={atual.src} alt={p.nome} ajuste={atual.ajuste} className="animate-pop size-full" /> : <div className="xadrez size-full" />}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-3 pt-10">
          {[ChevronLeft, null, ShoppingCart].map((I, k) => I ? <span key={k} className="grid size-8 place-items-center rounded-full bg-black/35 text-white"><I className="size-4" /></span> : <span key={k} />)}
        </div>
        {lista.length > 1 && (
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
            {lista.map((f, k) => <button key={f.id} type="button" onClick={() => setI(k)} aria-label={`Foto ${k + 1}`} className={cn("h-1.5 rounded-full transition-all", k === i ? "w-5 bg-[#ee4d2d]" : "w-1.5 bg-black/30")} />)}
          </div>
        )}
        <span className="absolute right-3 bottom-2 rounded-full bg-black/45 px-2 text-[10px] text-white">{lista.length ? `${Math.min(i, lista.length - 1) + 1}/${lista.length}` : "sem foto"}</span>
      </div>
      <div className="bg-white px-3 pt-2.5 pb-3">
        <div className="flex items-end gap-2">
          <p className="text-xl font-semibold text-[#ee4d2d]">{brl(p.precoPromo ?? p.preco)}</p>
          {desc > 0 && <><p className="pb-0.5 text-xs text-[#999] line-through">{brl(p.preco)}</p><span className="mb-1 rounded-sm bg-[#fdeee9] px-1 text-[10px] font-semibold text-[#ee4d2d]">-{desc}%</span></>}
        </div>
        <p className="mt-1 line-clamp-2 text-[13px] leading-snug">{p.nome || "Título do anúncio"}</p>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-[#757575]">
          <span className="flex items-center gap-0.5 text-[#ffb400]">{Array.from({ length: 5 }, (_, k) => <Star key={k} className="size-3 fill-current" />)}</span> Novo · 0 vendidos
          <Heart className="ml-auto size-4" /><Share2 className="size-4" />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 bg-white px-3 py-2.5 text-[11px]">
        <Truck className="size-4 text-[#26aa99]" /> <span><b className="text-[#26aa99]">Frete grátis</b> acima de R$ 19 · envio em até {loja.logistica.prazoPostagem} dias úteis</span>
      </div>
      {p.variacoes.map((v) => (
        <div key={v.nome} className="mt-px bg-white px-3 py-2.5">
          <p className="text-[11px] text-[#757575]">{v.nome}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">{v.opcoes.map((o, k) => <span key={o} className={cn("rounded-sm border px-2 py-1 text-[11px]", k === 0 ? "border-[#ee4d2d] text-[#ee4d2d]" : "border-[#ddd]")}>{o}</span>)}</div>
        </div>
      ))}
      <div className="mt-2 flex items-center gap-2.5 bg-white px-3 py-3">
        <Imagem src={loja.logo} alt="" className="size-10 rounded-full" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold">{loja.nome}</p>
          <p className="flex items-center gap-1 text-[10px] text-[#757575]"><MapPin className="size-3" /> São Paulo · {CATEGORIAS.find((c) => c.id === p.categoriaId)?.nome}</p>
        </div>
        <span className="rounded-sm border border-[#ee4d2d] px-2 py-1 text-[11px] text-[#ee4d2d]">Ver loja</span>
      </div>
      <div className="mt-2 bg-white px-3 py-3">
        <p className="text-[13px] font-semibold">Descrição do produto</p>
        <p className="mt-1.5 line-clamp-6 text-[12px] leading-relaxed whitespace-pre-line text-[#555]">{p.descricao || "Sem descrição ainda."}</p>
      </div>
      <div className="sticky bottom-0 mt-2 flex h-12 text-[11px]">
        <span className="grid w-16 place-items-center bg-[#26aa99] text-white"><MessageCircle className="size-4" /></span>
        <span className="grid flex-1 place-items-center bg-[#fff1ec] font-semibold text-[#ee4d2d]">Adicionar ao carrinho</span>
        <span className="grid flex-1 place-items-center bg-[#ee4d2d] font-semibold text-white">Comprar agora</span>
      </div>
    </div>
  );
}

/** Prévia da página da loja decorada. */
export function PaginaLoja({ loja, produtos, fotos }: { loja: Loja; produtos: Produto[]; fotos: Foto[] }) {
  const v = loja.vitrine;
  const banner = fotos.find((f) => f.id === v.banner);
  const destaques = v.destaques.map((id) => produtos.find((p) => p.id === id)).filter(Boolean) as Produto[];
  const capa = (p: Produto) => fotos.find((f) => f.id === p.fotos[0]);
  return (
    <div>
      <div className="relative h-44 overflow-hidden">
        <Imagem key={banner?.id} src={banner?.src} alt="Banner" ajuste={banner?.ajuste} className="animate-pop size-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/60" />
        <div className="absolute inset-x-0 top-0 flex items-center gap-2 px-3 pt-10">
          <ChevronLeft className="size-5 text-white" />
          <span className="flex h-8 flex-1 items-center gap-1.5 rounded-sm bg-white/90 px-2 text-[11px] text-[#999]"><Search className="size-3.5" /> Buscar nesta loja</span>
        </div>
        <p className="absolute right-3 bottom-3 left-3 font-heading text-lg leading-tight font-bold text-white drop-shadow">{v.slogan}</p>
      </div>
      <div className="flex items-center gap-2.5 bg-white px-3 py-3">
        <Imagem src={loja.logo} alt="" className="size-12 rounded-full ring-2 ring-[#ee4d2d]/30" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 truncate text-sm font-semibold">{loja.nome} <BadgeCheck className="size-4 shrink-0 text-[#ee4d2d]" /></p>
          <p className="text-[10px] text-[#757575]">@{loja.usuario} · {produtos.filter((p) => p.status !== "rascunho").length} produtos</p>
        </div>
        <span className="rounded-sm bg-[#ee4d2d] px-3 py-1.5 text-[11px] font-semibold text-white">Seguir</span>
      </div>
      <div className="flex border-b border-[#eee] bg-white text-[12px]">
        {["Loja", "Produtos", "Categorias"].map((t, k) => <span key={t} className={cn("flex-1 py-2.5 text-center", k === 0 ? "border-b-2 border-[#ee4d2d] font-semibold text-[#ee4d2d]" : "text-[#555]")}>{t}</span>)}
      </div>
      {v.colecoes.length > 0 && (
        <div className="mt-2 bg-white px-3 py-3">
          <p className="mb-2 text-[13px] font-semibold">Coleções</p>
          <div className="grid grid-cols-3 gap-2">
            {v.colecoes.map((id) => {
              const c = CATEGORIAS.find((x) => x.id === id)!;
              return (
                <div key={id} className="animate-pop relative aspect-square overflow-hidden rounded-md">
                  <Imagem src={c.capa} alt="" className="size-full" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 pt-4 pb-1 text-[10px] font-semibold text-white">{c.nome}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="mt-2 bg-white px-3 py-3">
        <p className="mb-2 flex items-center gap-1 text-[13px] font-semibold"><Store className="size-4 text-[#ee4d2d]" /> Destaques da loja</p>
        {destaques.length === 0 ? <p className="py-6 text-center text-[11px] text-[#999]">Escolha até 6 produtos em destaque</p> : (
          <div className="grid grid-cols-2 gap-2">
            {destaques.map((p) => (
              <div key={p.id} className="animate-pop overflow-hidden rounded-md border border-[#eee]">
                <Imagem src={capa(p)?.src} alt={p.nome} ajuste={capa(p)?.ajuste} className="aspect-square w-full" />
                <div className="p-1.5">
                  <p className="line-clamp-2 text-[10px] leading-snug">{p.nome}</p>
                  <p className="mt-1 text-[12px] font-semibold text-[#ee4d2d]">{brl(p.precoPromo ?? p.preco)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
