"use client";

import { useState } from "react";
import { ImageOff, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS, type StatusProduto } from "@/lib/data";
import { filtroFoto } from "@/lib/calc";
import type { Foto } from "@/lib/data";

export function Cabecalho({ kicker, titulo, sub, acoes, className }: { kicker?: string; titulo: React.ReactNode; sub?: React.ReactNode; acoes?: React.ReactNode; className?: string }) {
  return (
    <header className={cn("mb-6 flex flex-wrap items-end justify-between gap-4 text-white", className)}>
      <div className="min-w-0">
        {kicker && <p className="mb-2 text-xs font-bold tracking-[0.18em] text-pessego uppercase">{kicker}</p>}
        <h1 className="font-heading text-3xl leading-tight font-bold sm:text-4xl">{titulo}</h1>
        {sub && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">{sub}</p>}
      </div>
      {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
    </header>
  );
}

export function Painel({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("glass rounded-3xl p-5 sm:p-6", className)} {...props} />;
}

export function StatusBadge({ status, className }: { status: StatusProduto; className?: string }) {
  const s = STATUS[status];
  return <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-bold whitespace-nowrap ring-1", s.cor, className)}>{s.rotulo}</span>;
}

export function Anel({ valor, tamanho = 120, traco = 10, className, children, claro = false }: { valor: number; tamanho?: number; traco?: number; className?: string; children?: React.ReactNode; claro?: boolean }) {
  const r = (tamanho - traco) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className={cn("relative grid place-items-center", className)} style={{ width: tamanho, height: tamanho }} role="img" aria-label={`${valor}% concluído`}>
      <svg width={tamanho} height={tamanho} className="-rotate-90">
        <defs>
          <linearGradient id={`anel-${tamanho}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffb48f" />
            <stop offset="1" stopColor="#ee5a2f" />
          </linearGradient>
        </defs>
        <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" strokeWidth={traco} className={claro ? "stroke-white/20" : "stroke-ameixa/10"} />
        <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" strokeWidth={traco} strokeLinecap="round" stroke={`url(#anel-${tamanho})`}
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, valor) / 100)} style={{ transition: "stroke-dashoffset 1s cubic-bezier(.2,.7,.2,1)" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function Barra({ valor, className }: { valor: number; className?: string }) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-ameixa/10", className)} role="progressbar" aria-valuenow={Math.round(valor)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-gradient-to-r from-pessego to-laranja transition-[width] duration-700" style={{ width: `${Math.min(100, valor)}%` }} />
    </div>
  );
}

export function Vazio({ icone: Icone, titulo, texto, acao }: { icone: LucideIcon; titulo: string; texto: string; acao?: React.ReactNode }) {
  return (
    <div className="glass flex flex-col items-center rounded-3xl px-6 py-14 text-center">
      <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-laranja/12 text-laranja"><Icone className="size-7" /></span>
      <h2 className="font-heading text-xl font-bold">{titulo}</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{texto}</p>
      {acao && <div className="mt-5">{acao}</div>}
    </div>
  );
}

/** Imagem com fallback: nunca deixa um quadro quebrado na tela. */
export function Imagem({ src, alt, className, style, ajuste }: { src?: string; alt: string; className?: string; style?: React.CSSProperties; ajuste?: Foto["ajuste"] }) {
  const [erro, setErro] = useState(false);
  if (!src || erro)
    return (
      <div className={cn("grid place-items-center bg-muted text-muted-foreground", className)} style={style} role="img" aria-label={alt}>
        <ImageOff className="size-6" />
      </div>
    );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={cn("object-cover", className)} style={{ ...style, filter: ajuste ? filtroFoto(ajuste) : undefined }} onError={() => setErro(true)} loading="lazy" decoding="async" />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton-shimmer rounded-2xl", className)} />;
}

export function Campo({ id, rotulo, erro, dica, obrigatorio, children, className }: { id: string; rotulo: string; erro?: string; dica?: React.ReactNode; obrigatorio?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-semibold">
        {rotulo} {obrigatorio && <span className="text-laranja" aria-hidden>*</span>}
      </label>
      {children}
      {erro ? <p id={`${id}-erro`} className="text-xs font-medium text-destructive" role="alert">{erro}</p> : dica ? <p className="text-xs text-muted-foreground">{dica}</p> : null}
    </div>
  );
}
