"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, CheckCircle2, Crop, ImageUp, Loader2, MoveHorizontal, RotateCcw, SunMedium, Trash2, Wand2, X, Camera, ImageOff } from "lucide-react";
import { acoes, useStore } from "@/lib/store";
import type { Foto } from "@/lib/data";
import { checksFoto, filtroFoto } from "@/lib/calc";
import { Cabecalho, Imagem, Painel, Vazio } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const FILTROS = { todas: "Todas", pendentes: "Pendentes", aprovadas: "Aprovadas", ambiente: "Ambientes" } as const;
type Filtro = keyof typeof FILTROS;
const pronta = (f: Foto) => f.aprovada && f.ajuste.quadrada;

export function Estudio() {
  const { fotos, produtos } = useStore();
  const sp = useSearchParams();
  const [filtro, setFiltro] = useState<Filtro>((sp.get("filtro") as Filtro) ?? "todas");
  const [aberta, setAberta] = useState<Foto | null>(null);
  const [enviando, setEnviando] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const usadaEm = useMemo(() => {
    const m = new Map<string, string>();
    produtos.forEach((p) => p.fotos.forEach((id) => !m.has(id) && m.set(id, p.nome)));
    return m;
  }, [produtos]);

  const lista = fotos.filter((f) => (filtro === "todas" ? true : filtro === "pendentes" ? f.tipo === "produto" && !pronta(f) : filtro === "aprovadas" ? pronta(f) : f.tipo === "ambiente"));
  const prod = fotos.filter((f) => f.tipo === "produto");
  const ok = prod.filter(pronta).length;

  async function enviar(arquivos: FileList | null) {
    if (!arquivos?.length) return;
    const validos = Array.from(arquivos).filter((a) => /image\/(jpeg|png|webp)/.test(a.type));
    if (validos.length < arquivos.length) toast.error("Alguns arquivos foram ignorados", { description: "Envie JPG, PNG ou WEBP." });
    if (!validos.length) return;
    setEnviando(true);
    const novas = await Promise.all(validos.map((a, i) => new Promise<Foto>((res) => {
      const src = URL.createObjectURL(a);
      const img = new window.Image();
      const montar = (w: number, h: number) => res({ id: `up-${Date.now()}-${i}`, src, nome: a.name.replace(/\.\w+$/, ""), w, h, kb: Math.round(a.size / 1024), tipo: "produto", aprovada: false, ajuste: { luz: 100, contraste: 100, saturacao: 100, quadrada: w === h }, enviadaEm: new Date().toISOString().slice(0, 16).replace("T", " ") });
      img.onload = () => montar(img.naturalWidth, img.naturalHeight);
      img.onerror = () => montar(0, 0);
      img.src = src;
    })));
    await new Promise((r) => setTimeout(r, 700));
    acoes.enviarFotos(novas);
    setEnviando(false);
    setFiltro("pendentes");
    toast.success(`${novas.length} foto(s) no estúdio`, { description: "Revise o recorte e aprove antes de usar no anúncio." });
  }

  return (
    <div>
      <Cabecalho kicker="Estúdio de fotos" titulo="Fotos que vendem, no padrão da Shopee"
        sub="Recorte 1:1, luz e contraste ajustados, até 2 MB e aprovação foto a foto. A capa é o que o comprador vê na busca: é ela que decide o clique."
        acoes={<>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => { enviar(e.target.files); e.target.value = ""; }} aria-label="Enviar fotos" />
          <Button onClick={() => input.current?.click()} disabled={enviando} className="glow-laranja h-11 rounded-2xl bg-laranja px-5 font-bold hover:bg-[#e04d23]">
            {enviando ? <Loader2 className="size-4 animate-spin" /> : <ImageUp className="size-4" />} {enviando ? "Enviando..." : "Enviar fotos"}
          </Button>
        </>} />

      <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className="relative overflow-hidden rounded-[28px] text-white">
          <Imagem src="/img/estudio.jpg" alt="Estúdio com softboxes" className="absolute inset-0 size-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-ameixa/85 via-ameixa/55 to-transparent" />
          <div className="relative grid gap-3 p-6 sm:max-w-md">
            <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-pessego uppercase"><Camera className="size-4" /> Padrão da capa</p>
            <ul className="grid gap-2 text-sm">
              {["Fundo claro e limpo, produto ocupando 70% do quadro", "Quadrado 1:1, mínimo 500 px (ideal 1024 px)", "Luz suave lateral, sem sombra dura", "Segunda foto em ambiente, mostrando escala"].map((t) => (
                <li key={t} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-salvia" /> {t}</li>
              ))}
            </ul>
          </div>
        </section>
        <Painel className="grid grid-cols-3 gap-3 p-4 text-center">
          {[["Fotos de produto", prod.length], ["Prontas", ok], ["Pendentes", prod.length - ok]].map(([k, v], i) => (
            <div key={k} className={cn("grid content-center rounded-2xl p-3", i === 1 ? "bg-salvia/25" : i === 2 ? "bg-mel/20" : "bg-white/70")}>
              <p className="font-heading text-3xl font-bold tabular">{v}</p>
              <p className="text-xs font-semibold text-muted-foreground">{k}</p>
            </div>
          ))}
          <button type="button" onClick={() => input.current?.click()} className="col-span-3 grid place-items-center gap-1 rounded-2xl border-2 border-dashed border-laranja/40 bg-white/50 p-4 text-sm font-semibold text-laranja transition hover:bg-white"
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); enviar(e.dataTransfer.files); }}>
            <ImageUp className="size-6" /> Arraste as fotos aqui ou clique pra escolher
          </button>
        </Painel>
      </div>

      <div role="tablist" aria-label="Filtrar fotos" className="glass mb-4 inline-flex flex-wrap gap-1 rounded-2xl p-1">
        {(Object.keys(FILTROS) as Filtro[]).map((k) => (
          <button key={k} role="tab" type="button" aria-selected={filtro === k} onClick={() => setFiltro(k)}
            className={cn("h-10 rounded-xl px-4 text-sm font-semibold transition", filtro === k ? "bg-laranja text-white shadow" : "hover:bg-white/70")}>{FILTROS[k]}</button>
        ))}
      </div>

      {lista.length === 0 ? (
        <Vazio icone={ImageOff} titulo={filtro === "pendentes" ? "Nenhuma foto pendente" : "Nada por aqui"} texto={filtro === "pendentes" ? "Todas as fotos de produto estão recortadas e aprovadas." : "Envie fotos pra começar."} />
      ) : (
        <ul className="columns-2 gap-3 sm:columns-3 xl:columns-4">
          {lista.map((f, i) => {
            const cs = checksFoto(f);
            return (
              <li key={f.id} className="animate-pop mb-3 break-inside-avoid" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
                <button type="button" onClick={() => setAberta(f)} className="glass group block w-full overflow-hidden rounded-3xl p-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-laranja">
                  <div className="relative overflow-hidden rounded-[20px]">
                    <Imagem src={f.src} alt={f.nome} ajuste={f.ajuste} className={cn("w-full transition duration-700 group-hover:scale-105", f.ajuste.quadrada ? "aspect-square" : "")} style={f.ajuste.quadrada ? undefined : { aspectRatio: `${f.w || 4} / ${f.h || 3}` }} />
                    <span className={cn("absolute top-2 left-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold", pronta(f) ? "bg-salvia text-[#14432b]" : f.tipo === "ambiente" ? "chip-glass text-white" : "bg-mel text-[#5c3700]")}>
                      {pronta(f) ? <><Check className="size-3" /> Pronta</> : f.tipo === "ambiente" ? "Ambiente" : "Tratar"}
                    </span>
                    <span className="chip-glass absolute right-2 bottom-2 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 transition group-hover:opacity-100"><Wand2 className="mr-1 inline size-3" />Tratar</span>
                  </div>
                  <div className="px-2 pt-2 pb-1.5">
                    <p className="truncate text-sm font-semibold">{f.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">{usadaEm.get(f.id) ?? "Sem produto vinculado"}</p>
                    <div className="mt-1.5 flex gap-1">{cs.map((c) => <span key={c.rotulo} title={c.rotulo} className={cn("h-1.5 flex-1 rounded-full", c.ok ? "bg-salvia" : "bg-mel")} />)}</div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={!!aberta} onOpenChange={(v) => !v && setAberta(null)}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-3xl p-0 sm:max-w-4xl">
          {aberta && <Tratamento key={aberta.id} foto={aberta} usadaEm={usadaEm.get(aberta.id)} fechar={() => setAberta(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Tratamento({ foto, usadaEm, fechar }: { foto: Foto; usadaEm?: string; fechar: () => void }) {
  const [aj, setAj] = useState(foto.ajuste);
  const [corte, setCorte] = useState(50);
  const [processando, setProcessando] = useState(false);
  const atual = { ...foto, ajuste: aj };
  const cs = checksFoto(atual);
  const proporcao = aj.quadrada ? "1 / 1" : `${foto.w || 4} / ${foto.h || 3}`;

  async function automatico() {
    setProcessando(true);
    await new Promise((r) => setTimeout(r, 900));
    setAj((a) => ({ ...a, luz: 108, contraste: 106, saturacao: 112, quadrada: true }));
    setProcessando(false);
    toast.success("Ajuste automático aplicado", { description: "Luz +8, contraste +6, saturação +12 e recorte 1:1." });
  }

  function salvar(aprovar: boolean) {
    if (aprovar && !aj.quadrada) return toast.error("Recorte em 1:1 antes de aprovar", { description: "A Shopee corta a capa em quadrado na busca." });
    acoes.salvarFoto({ ...foto, ajuste: aj, aprovada: aprovar || foto.aprovada });
    toast.success(aprovar ? "Foto aprovada" : "Ajustes salvos");
    fechar();
  }

  const controles = [
    { k: "luz" as const, r: "Luz", I: SunMedium },
    { k: "contraste" as const, r: "Contraste", I: MoveHorizontal },
    { k: "saturacao" as const, r: "Saturação", I: Wand2 },
  ];

  return (
    <div className="grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="xadrez relative grid place-items-center p-4 sm:p-6">
        <div className="relative w-full max-w-[520px] overflow-hidden rounded-2xl shadow-xl transition-[aspect-ratio] duration-500" style={{ aspectRatio: proporcao }}>
          <Imagem src={foto.src} alt={`${foto.nome} tratada`} ajuste={aj} className="absolute inset-0 size-full" />
          <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - corte}% 0 0)` }}>
            <Imagem src={foto.src} alt={`${foto.nome} original`} className="absolute inset-0 size-full" />
          </div>
          <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_12px_rgb(0_0_0/0.4)]" style={{ left: `${corte}%` }}>
            <span className="absolute top-1/2 left-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-ameixa shadow-lg"><MoveHorizontal className="size-4" /></span>
          </div>
          <span className="chip-glass absolute top-3 left-3 rounded-full px-2 py-0.5 text-[11px] font-bold text-white">Antes</span>
          <span className="chip-glass absolute top-3 right-3 rounded-full px-2 py-0.5 text-[11px] font-bold text-white">Depois</span>
          {aj.quadrada && <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">{Array.from({ length: 9 }, (_, i) => <span key={i} className="border border-white/25" />)}</div>}
          <input type="range" min={0} max={100} value={corte} onChange={(e) => setCorte(Number(e.target.value))} aria-label="Comparar antes e depois" className="absolute inset-0 size-full cursor-ew-resize opacity-0" />
        </div>
      </div>
      <div className="grid content-start gap-4 p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">{foto.nome}</DialogTitle>
          <DialogDescription>{foto.w}×{foto.h} px · {foto.kb >= 1024 ? `${(foto.kb / 1024).toFixed(1)} MB` : `${foto.kb} KB`} · {usadaEm ? `usada em ${usadaEm.slice(0, 40)}` : "sem produto"}</DialogDescription>
        </DialogHeader>
        <Button onClick={automatico} disabled={processando} variant="outline" className="h-11 rounded-xl border-laranja/40 font-semibold text-laranja">
          {processando ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />} {processando ? "Analisando luz e enquadramento..." : "Ajuste automático"}
        </Button>
        <label className="flex items-center justify-between gap-3 rounded-2xl bg-muted/70 p-3 text-sm font-semibold">
          <span className="flex items-center gap-2"><Crop className="size-4 text-laranja" /> Recorte quadrado 1:1</span>
          <Switch checked={aj.quadrada} onCheckedChange={(v) => setAj({ ...aj, quadrada: v })} />
        </label>
        {controles.map((c) => (
          <div key={c.k} className="grid gap-2">
            <div className="flex items-center justify-between text-sm font-semibold"><span className="flex items-center gap-2"><c.I className="size-4 text-laranja" /> {c.r}</span><span className="text-muted-foreground tabular">{aj[c.k] - 100 > 0 ? "+" : ""}{aj[c.k] - 100}</span></div>
            <Slider min={70} max={130} value={[aj[c.k]]} onValueChange={(v) => setAj({ ...aj, [c.k]: Array.isArray(v) ? v[0] : v })} aria-label={c.r} />
          </div>
        ))}
        <ul className="grid gap-1.5 rounded-2xl bg-muted/50 p-3">
          {cs.map((c) => (
            <li key={c.rotulo} className="flex items-center gap-2 text-sm">
              <span className={cn("grid size-5 place-items-center rounded-full", c.ok ? "bg-salvia text-[#14432b]" : "bg-mel/40 text-[#7a4a05]")}>{c.ok ? <Check className="size-3" /> : <X className="size-3" />}</span> {c.rotulo}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => salvar(true)} className="h-11 flex-1 rounded-xl bg-laranja font-bold hover:bg-[#e04d23]"><CheckCircle2 className="size-4" /> Aprovar</Button>
          <Button onClick={() => salvar(false)} variant="outline" className="h-11 rounded-xl">Salvar</Button>
          <Button onClick={() => setAj({ luz: 100, contraste: 100, saturacao: 100, quadrada: foto.ajuste.quadrada })} variant="ghost" aria-label="Desfazer ajustes" className="h-11 rounded-xl"><RotateCcw className="size-4" /></Button>
          <Button onClick={() => { acoes.excluirFoto(foto.id); toast.success("Foto removida do estúdio"); fechar(); }} variant="ghost" aria-label="Excluir foto" className="h-11 rounded-xl text-destructive"><Trash2 className="size-4" /></Button>
        </div>
        <p className="text-[11px] text-muted-foreground">Filtro aplicado: {filtroFoto(aj)}</p>
      </div>
    </div>
  );
}
