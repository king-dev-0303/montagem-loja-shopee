"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, Camera, FileSpreadsheet, LayoutDashboard, Menu, Package, Rocket, Search, Settings2, ShoppingBag, Sparkles, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { etapas, progresso } from "@/lib/etapas";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Barra } from "@/components/kit";

export const SECOES = [
  { href: "/", label: "Painel", curto: "Painel", icone: LayoutDashboard },
  { href: "/produtos", label: "Produtos", curto: "Produtos", icone: Package },
  { href: "/fotos", label: "Estúdio de fotos", curto: "Fotos", icone: Camera },
  { href: "/importar", label: "Importar planilha", curto: "Importar", icone: FileSpreadsheet },
  { href: "/vitrine", label: "Vitrine da loja", curto: "Vitrine", icone: Store },
  { href: "/loja", label: "Configurações", curto: "Loja", icone: Settings2 },
];

export function Marca({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="glow-laranja relative grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-pessego via-laranja to-[#7a3550] text-creme">
        <ShoppingBag className="size-5" strokeWidth={2.2} />
        <Sparkles className="absolute -top-1 -right-1 size-3.5 fill-mel text-mel" />
      </span>
      <span className="leading-none">
        <span className="block font-heading text-lg font-bold tracking-tight">Vitrine Pronta</span>
        <span className="text-[11px] font-medium text-white/65">montagem de loja Shopee</span>
      </span>
    </span>
  );
}

function Nav({ onNavegar }: { onNavegar?: () => void }) {
  const pathname = usePathname();
  const ativa = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return (
    <nav aria-label="Seções" className="grid gap-1">
      {SECOES.map((s) => (
        <Link key={s.href} href={s.href} onClick={onNavegar} aria-current={ativa(s.href) ? "page" : undefined}
          className={cn("group relative flex h-11 items-center gap-3 rounded-2xl px-3.5 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-pessego",
            ativa(s.href) ? "bg-white text-ameixa shadow-[0_10px_30px_-12px_rgb(0_0_0/0.5)]" : "text-white/85 hover:bg-white/12 hover:text-white")}>
          <s.icone className={cn("size-[18px] transition", ativa(s.href) ? "text-laranja" : "text-white/70 group-hover:text-white")} />
          {s.label}
          {ativa(s.href) && <span className="absolute top-1/2 -left-3 h-6 w-1 -translate-y-1/2 rounded-full bg-laranja" />}
        </Link>
      ))}
    </nav>
  );
}

function CartaoLancamento() {
  const estado = useStore();
  const pct = progresso(etapas(estado));
  return (
    <Link href="/" className="sheen relative block rounded-3xl border border-white/20 bg-white/10 p-4 text-white transition hover:bg-white/16">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wide text-pessego uppercase"><Rocket className="size-4" /> {estado.loja.lancada ? "Loja no ar" : "Lançamento"}</div>
      <p className="text-sm font-semibold">{estado.loja.lancada ? "@lumacasa já está vendendo" : `${pct}% da loja montada`}</p>
      <Barra valor={pct} className="mt-3 bg-white/15" />
      <p className="mt-2 text-[11px] text-white/65">Abertura prevista: 28/10</p>
    </Link>
  );
}

function Notificacoes() {
  const { produtos, fotos } = useStore();
  const pend = produtos.filter((p) => p.status === "revisao");
  const fotosPend = fotos.filter((f) => f.tipo === "produto" && !f.aprovada);
  const total = pend.length + (fotosPend.length ? 1 : 0);
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={`Pendências: ${total}`} className="chip-glass relative grid size-11 place-items-center rounded-2xl text-white outline-none hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-pessego">
        <Bell className="size-5" />
        {total > 0 && <span className="tabular absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-laranja px-1 text-[11px] font-bold animate-pulse-ring">{total}</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 rounded-2xl p-1.5">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Pendências antes de abrir</DropdownMenuLabel>
          {fotosPend.length > 0 && (
            <DropdownMenuItem onClick={() => router.push("/fotos?filtro=pendentes")} className="gap-3 rounded-xl py-2">
              <Camera className="size-4 text-laranja" /> {fotosPend.length} fotos sem recorte ou aprovação
            </DropdownMenuItem>
          )}
          {pend.slice(0, 5).map((p) => (
            <DropdownMenuItem key={p.id} onClick={() => router.push(`/produtos/${p.id}`)} className="gap-3 rounded-xl py-2">
              <Package className="size-4 shrink-0 text-mel" /> <span className="truncate">{p.nome}</span>
            </DropdownMenuItem>
          ))}
          {total === 0 && <p className="px-2 py-3 text-sm text-muted-foreground">Nada pendente. A loja pode abrir.</p>}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/produtos?status=revisao")} className="justify-center rounded-xl font-semibold text-laranja">Ver todos com pendência</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Busca() {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form role="search" className="relative hidden min-w-0 flex-1 sm:block" onSubmit={(e) => { e.preventDefault(); router.push(`/produtos?q=${encodeURIComponent(q.trim())}`); }}>
      <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-white/70" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar produto, SKU ou categoria..." aria-label="Buscar produtos"
        className="chip-glass h-11 w-full max-w-md rounded-2xl pr-4 pl-11 text-sm text-white placeholder:text-white/65 outline-none focus-visible:ring-2 focus-visible:ring-pessego" />
    </form>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const ativa = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return (
    <div className="flex min-h-dvh">
      <aside className="glass-dark sticky top-3 m-3 hidden h-[calc(100dvh-1.5rem)] w-64 shrink-0 flex-col gap-6 rounded-[28px] p-4 text-white lg:flex">
        <Link href="/" className="rounded-2xl px-1 pt-1 outline-none focus-visible:ring-2 focus-visible:ring-pessego"><Marca /></Link>
        <Nav />
        <div className="mt-auto"><CartaoLancamento /></div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 px-3 pt-3 pb-2 sm:px-5 lg:pl-2">
          <Sheet open={aberto} onOpenChange={setAberto}>
            <SheetTrigger aria-label="Abrir menu" className="chip-glass grid size-11 place-items-center rounded-2xl text-white outline-none focus-visible:ring-2 focus-visible:ring-pessego lg:hidden">
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="glass-dark flex w-[84%] flex-col gap-6 border-0 p-5 text-white sm:max-w-xs">
              <SheetHeader className="p-0">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <SheetDescription className="sr-only">Seções da montagem da loja</SheetDescription>
                <Marca />
              </SheetHeader>
              <Nav onNavegar={() => setAberto(false)} />
              <div className="mt-auto" onClick={() => setAberto(false)}><CartaoLancamento /></div>
            </SheetContent>
          </Sheet>
          <Link href="/" className="lg:hidden sm:hidden text-white"><span className="font-heading text-lg font-bold">Vitrine Pronta</span></Link>
          <Busca />
          <div className="ml-auto flex items-center gap-2">
            <Link href="/produtos/novo" className="glow-laranja hidden h-11 items-center gap-2 rounded-2xl bg-laranja px-4 text-sm font-bold text-white transition hover:bg-[#e04d23] md:flex">
              <Package className="size-4" /> Novo produto
            </Link>
            <Notificacoes />
            <Link href="/loja" className="chip-glass flex h-11 items-center gap-2 rounded-2xl pr-3 pl-1.5 text-white hover:bg-white/25" aria-label="Conta da Luana">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/vela-pote.jpg" alt="" className="size-8 rounded-xl object-cover" />
              <span className="hidden text-sm leading-tight xl:block"><b className="block">Luana</b><span className="text-[11px] text-white/70">@lumacasa</span></span>
            </Link>
          </div>
        </header>
        <main key={pathname} className="animate-rise mx-auto w-full max-w-[1400px] flex-1 px-3 pt-4 pb-28 sm:px-5 lg:pb-10 lg:pl-2">{children}</main>
      </div>

      <nav aria-label="Navegação inferior" className="glass-dark fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-3xl p-1.5 text-white lg:hidden">
        {SECOES.slice(0, 5).map((s) => (
          <Link key={s.href} href={s.href} aria-current={ativa(s.href) ? "page" : undefined}
            className={cn("flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] font-semibold transition", ativa(s.href) ? "bg-white text-ameixa" : "text-white/80")}>
            <s.icone className={cn("size-5", ativa(s.href) && "text-laranja")} /> {s.curto}
          </Link>
        ))}
      </nav>
    </div>
  );
}
