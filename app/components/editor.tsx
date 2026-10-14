"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Calculator, Check, CircleAlert, ImagePlus, Loader2, Plus, Save, Sparkles, Star, Trash2, X, Box, Tag, Images, Layers } from "lucide-react";
import { acoes, type Rascunho, useHidratado, useStore } from "@/lib/store";
import { CATEGORIAS, STATUS, type Produto, type StatusProduto } from "@/lib/data";
import { brl, lucro, pontuacao, precoParaMargem, regras } from "@/lib/calc";
import { Anel, Cabecalho, Campo, Imagem, Painel, Skeleton, StatusBadge, Vazio } from "@/components/kit";
import { Anuncio, Celular } from "@/components/celular";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const VAZIO: Rascunho = {
  sku: "", nome: "", categoriaId: "aromas", descricao: "", preco: 0, precoPromo: null, custo: 0, estoque: 0, pesoG: 0,
  dimensoes: { c: 0, l: 0, a: 0 }, fotos: [], variacoes: [], status: "rascunho",
};

type Erros = Partial<Record<"nome" | "sku" | "preco" | "precoPromo" | "custo" | "estoque" | "pesoG" | "status", string>>;
const ABA_DO_ERRO: Record<keyof Erros, string> = { nome: "anuncio", sku: "anuncio", status: "anuncio", preco: "preco", precoPromo: "preco", custo: "preco", estoque: "preco", pesoG: "envio" };

export function Editor({ id }: { id: string }) {
  const { produtos } = useStore();
  const hidratado = useHidratado();
  const original = produtos.find((p) => p.id === id);
  const novo = id === "novo";
  if (!hidratado) return <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"><Skeleton className="h-[70vh]" /><Skeleton className="h-[70vh]" /></div>;
  if (!novo && !original)
    return <Vazio icone={CircleAlert} titulo="Produto não encontrado" texto="Ele pode ter sido excluído. Volte ao catálogo pra escolher outro." acao={<Link href="/produtos" className="font-semibold text-laranja">Voltar ao catálogo</Link>} />;
  return <Formulario key={id} inicial={original ?? VAZIO} novo={novo} />;
}

function Formulario({ inicial, novo }: { inicial: Rascunho; novo: boolean }) {
  const { produtos, fotos, loja } = useStore();
  const router = useRouter();
  const [p, setP] = useState<Rascunho>(inicial);
  const [aba, setAba] = useState("anuncio");
  const [erros, setErros] = useState<Erros>({});
  const [salvando, setSalvando] = useState(false);
  const [excluir, setExcluir] = useState(false);
  const [galeria, setGaleria] = useState(false);
  const [novaVar, setNovaVar] = useState({ nome: "", opcoes: "" });
  const [margemAlvo, setMargemAlvo] = useState(30);
  const set = <K extends keyof Rascunho>(k: K, v: Rascunho[K]) => { setP((x) => ({ ...x, [k]: v })); setErros((e) => ({ ...e, [k]: undefined })); };

  const comoProduto = { ...p, id: p.id ?? "novo", atualizadoEm: "" } as Produto;
  const rs = regras(comoProduto, fotos, loja);
  const nota = pontuacao(rs);
  const venda = p.precoPromo ?? p.preco;
  const conta = lucro(venda, p.custo, loja.taxas);
  const sugerido = precoParaMargem(p.custo, margemAlvo, loja.taxas);
  const pesoCubado = (p.dimensoes.c * p.dimensoes.l * p.dimensoes.a) / 6; // g, fator 6000 cm³/kg
  const sujo = JSON.stringify(p) !== JSON.stringify(inicial);
  const disponiveis = useMemo(() => fotos.filter((f) => !p.fotos.includes(f.id)), [fotos, p.fotos]);

  function validar(): Erros {
    const e: Erros = {};
    if (p.nome.trim().length < 10) e.nome = "O título precisa de pelo menos 10 caracteres.";
    else if (p.nome.length > 120) e.nome = "A Shopee aceita no máximo 120 caracteres.";
    if (!/^[A-Z0-9-]{4,20}$/.test(p.sku)) e.sku = "Use de 4 a 20 letras maiúsculas, números ou hífen.";
    else if (produtos.some((x) => x.sku === p.sku && x.id !== p.id)) e.sku = "Já existe outro produto com esse SKU.";
    if (!(p.preco > 0)) e.preco = "Informe o preço de venda.";
    if (p.precoPromo !== null && (p.precoPromo <= 0 || p.precoPromo >= p.preco)) e.precoPromo = "A promoção tem que ser menor que o preço cheio.";
    if (p.custo < 0) e.custo = "O custo não pode ser negativo.";
    if (!Number.isInteger(p.estoque) || p.estoque < 0) e.estoque = "Estoque em unidades inteiras.";
    if (p.pesoG > 30000) e.pesoG = "Acima de 30 kg a Shopee Xpress não coleta.";
    if ((p.status === "pronto" || p.status === "publicado") && nota < 85) e.status = `Qualidade ${nota}/100: resolva as pendências antes de marcar como ${STATUS[p.status].rotulo.toLowerCase()}.`;
    return e;
  }

  async function salvar() {
    const e = validar();
    setErros(e);
    const primeiro = Object.keys(e)[0] as keyof Erros | undefined;
    if (primeiro) {
      setAba(ABA_DO_ERRO[primeiro]);
      toast.error("Confira os campos destacados", { description: e[primeiro] });
      return;
    }
    setSalvando(true);
    await new Promise((r) => setTimeout(r, 600));
    const salvo = acoes.salvarProduto(p);
    setSalvando(false);
    toast.success(novo ? "Produto criado" : "Alterações salvas", { description: `${salvo.nome.slice(0, 60)} · qualidade ${nota}/100` });
    if (novo) router.replace(`/produtos/${salvo.id}`);
  }

  function addVariacao() {
    const opcoes = novaVar.opcoes.split(",").map((s) => s.trim()).filter(Boolean);
    if (!novaVar.nome.trim() || opcoes.length === 0) return toast.error("Dê um nome e pelo menos uma opção, separadas por vírgula.");
    if (p.variacoes.length >= 2) return toast.error("A Shopee permite no máximo 2 níveis de variação.");
    set("variacoes", [...p.variacoes, { nome: novaVar.nome.trim(), opcoes }]);
    setNovaVar({ nome: "", opcoes: "" });
  }

  const moverFoto = (i: number, d: number) => { const f = [...p.fotos]; const j = i + d; if (j < 0 || j >= f.length) return; [f[i], f[j]] = [f[j], f[i]]; set("fotos", f); };
  const num = (v: string) => (v === "" ? 0 : Number(v.replace(",", ".")));
  const abas = [
    { v: "anuncio", r: "Anúncio", I: Tag, err: erros.nome || erros.sku || erros.status },
    { v: "preco", r: "Preço e estoque", I: Calculator, err: erros.preco || erros.precoPromo || erros.custo || erros.estoque },
    { v: "fotos", r: "Fotos", I: Images, err: undefined },
    { v: "variacoes", r: "Variações", I: Layers, err: undefined },
    { v: "envio", r: "Envio", I: Box, err: erros.pesoG },
  ];

  return (
    <div>
      <Link href="/produtos" className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-white/85 hover:text-white"><ArrowLeft className="size-4" /> Catálogo</Link>
      <Cabecalho kicker={novo ? "Novo produto" : `${inicial.sku} · ${CATEGORIAS.find((c) => c.id === p.categoriaId)?.nome}`} titulo={<span className="line-clamp-2">{p.nome || "Produto sem título"}</span>}
        acoes={<>
          {!novo && <Button variant="ghost" onClick={() => setExcluir(true)} className="h-11 rounded-2xl bg-white/15 px-4 text-white hover:bg-destructive hover:text-white"><Trash2 className="size-4" /> Excluir</Button>}
          <Button onClick={salvar} disabled={salvando} className="glow-laranja h-11 rounded-2xl bg-laranja px-5 font-bold hover:bg-[#e04d23]">
            {salvando ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} {salvando ? "Salvando..." : novo ? "Criar produto" : "Salvar"}
          </Button>
        </>} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Painel className="min-w-0">
          <Tabs value={aba} onValueChange={(v) => setAba(String(v))}>
            <TabsList className="scroll-thin mb-5 h-auto! w-full justify-start gap-1 overflow-x-auto rounded-2xl bg-ameixa/6 p-1">
              {abas.map((a) => (
                <TabsTrigger key={a.v} value={a.v} className="h-10 flex-none rounded-xl px-3.5 font-semibold data-active:bg-white data-active:text-laranja data-active:shadow-sm">
                  <a.I className="size-4" /> {a.r} {a.err && <span className="size-2 rounded-full bg-destructive" aria-label="com erro" />}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="anuncio" className="grid gap-4">
              <Campo id="nome" rotulo="Título do anúncio" obrigatorio erro={erros.nome} dica={<span className={cn(p.nome.length > 120 && "text-destructive")}>{p.nome.length}/120 · inclua material, medida e uso, que é como as pessoas buscam</span>}>
                <Input id="nome" value={p.nome} onChange={(e) => set("nome", e.target.value)} aria-invalid={!!erros.nome} placeholder="Ex.: Vela Aromática de Soja 200g em Pote de Vidro - Lavanda" className="field" />
              </Campo>
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo id="sku" rotulo="SKU" obrigatorio erro={erros.sku} dica="Código interno, aparece na etiqueta">
                  <Input id="sku" value={p.sku} onChange={(e) => set("sku", e.target.value.toUpperCase())} aria-invalid={!!erros.sku} placeholder="LUM-VEL-021" className="field font-mono" />
                </Campo>
                <Campo id="categoria" rotulo="Categoria na Shopee" obrigatorio dica={CATEGORIAS.find((c) => c.id === p.categoriaId)?.caminho}>
                  <Select value={p.categoriaId} onValueChange={(v) => v && set("categoriaId", String(v))}>
                    <SelectTrigger id="categoria" className="field h-11! w-full"><SelectValue>{(v: string) => CATEGORIAS.find((c) => c.id === v)?.nome}</SelectValue></SelectTrigger>
                    <SelectContent>{CATEGORIAS.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </Campo>
              </div>
              <Campo id="descricao" rotulo="Descrição" dica={`${p.descricao.length}/3000 · conte material, medidas, cuidados e o que vem na embalagem`}>
                <Textarea id="descricao" rows={7} value={p.descricao} maxLength={3000} onChange={(e) => set("descricao", e.target.value)} placeholder="Vela de cera de soja com pavio de algodão..." className="field" />
              </Campo>
              <Campo id="status" rotulo="Status" erro={erros.status}>
                <div id="status" role="radiogroup" aria-label="Status" className="flex flex-wrap gap-2">
                  {(Object.keys(STATUS) as StatusProduto[]).map((s) => (
                    <button key={s} type="button" role="radio" aria-checked={p.status === s} onClick={() => set("status", s)}
                      className={cn("rounded-full transition", p.status === s ? "ring-2 ring-laranja ring-offset-2" : "opacity-70 hover:opacity-100")}><StatusBadge status={s} className="h-8 px-3.5 text-xs" /></button>
                  ))}
                </div>
              </Campo>
            </TabsContent>

            <TabsContent value="preco" className="grid gap-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Campo id="preco" rotulo="Preço cheio (R$)" obrigatorio erro={erros.preco}>
                  <Input id="preco" type="number" min={0} step="0.01" inputMode="decimal" value={p.preco || ""} onChange={(e) => set("preco", num(e.target.value))} aria-invalid={!!erros.preco} className="field tabular" />
                </Campo>
                <Campo id="promo" rotulo="Preço promocional" erro={erros.precoPromo}>
                  <Input id="promo" type="number" min={0} step="0.01" inputMode="decimal" value={p.precoPromo ?? ""} placeholder="opcional" onChange={(e) => set("precoPromo", e.target.value === "" ? null : num(e.target.value))} aria-invalid={!!erros.precoPromo} className="field tabular" />
                </Campo>
                <Campo id="custo" rotulo="Custo da peça" erro={erros.custo} dica="produto + embalagem">
                  <Input id="custo" type="number" min={0} step="0.01" inputMode="decimal" value={p.custo || ""} onChange={(e) => set("custo", num(e.target.value))} aria-invalid={!!erros.custo} className="field tabular" />
                </Campo>
                <Campo id="estoque" rotulo="Estoque" obrigatorio erro={erros.estoque}>
                  <Input id="estoque" type="number" min={0} step="1" value={p.estoque} onChange={(e) => set("estoque", num(e.target.value))} aria-invalid={!!erros.estoque} className="field tabular" />
                </Campo>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                <div className="rounded-3xl bg-gradient-to-br from-ameixa to-[#5b2f3c] p-5 text-white">
                  <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-pessego uppercase"><Calculator className="size-4" /> Quanto sobra por venda</p>
                  <dl className="mt-4 grid gap-2 text-sm">
                    {[
                      ["Preço de venda", brl(venda)],
                      [`Comissão + frete grátis (${loja.taxas.comissao + loja.taxas.freteGratis}%)`, `- ${brl(conta.percentual)}`],
                      ["Tarifa fixa por item", `- ${brl(loja.taxas.tarifaFixa)}`],
                      ["Custo da peça", `- ${brl(p.custo)}`],
                    ].map(([k, v]) => <div key={k} className="flex justify-between gap-3 border-b border-white/10 pb-2"><dt className="text-white/75">{k}</dt><dd className="tabular font-semibold">{v}</dd></div>)}
                  </dl>
                  <div className="mt-4 flex items-end justify-between">
                    <div><p className="text-xs text-white/70">Lucro por unidade</p><p className={cn("font-heading text-3xl font-bold tabular", conta.ganho < 0 && "text-[#ff9a9a]")}>{brl(conta.ganho)}</p></div>
                    <span className={cn("rounded-full px-3 py-1 text-sm font-bold", conta.margem >= 15 ? "bg-salvia text-[#14432b]" : "bg-[#ff9a9a] text-ameixa")}>{conta.margem.toFixed(1)}% margem</span>
                  </div>
                  <p className="mt-3 text-[11px] text-white/55">Tarifas de referência configuráveis em Configurações · confira os valores vigentes no Seller Centre.</p>
                </div>
                <div className="glass-soft rounded-3xl p-5">
                  <p className="font-heading text-lg font-bold">Preço pela margem</p>
                  <p className="text-sm text-muted-foreground">Quanto cobrar pra sobrar a margem que você quer.</p>
                  <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Margem alvo">
                    {[20, 30, 40, 50].map((m) => (
                      <button key={m} type="button" role="radio" aria-checked={margemAlvo === m} onClick={() => setMargemAlvo(m)}
                        className={cn("h-9 rounded-xl px-3.5 text-sm font-bold transition", margemAlvo === m ? "bg-laranja text-white" : "bg-white hover:bg-accent")}>{m}%</button>
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">Preço sugerido</p>
                  <p className="font-heading text-3xl font-bold text-laranja tabular">{sugerido > 0 ? brl(Math.ceil(sugerido) - 0.1) : "-"}</p>
                  <Button variant="outline" disabled={!(sugerido > 0)} onClick={() => { set("preco", Math.ceil(sugerido) - 0.1); set("precoPromo", null); toast.success("Preço sugerido aplicado"); }} className="mt-3 h-10 rounded-xl"><Sparkles className="size-4 text-laranja" /> Usar este preço</Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="fotos" className="grid gap-4">
              <p className="text-sm text-muted-foreground">A primeira foto é a capa do anúncio. Use as setas pra reordenar. Fotos sem recorte 1:1 aparecem cortadas na busca.</p>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {p.fotos.map((fid, i) => {
                  const f = fotos.find((x) => x.id === fid);
                  return (
                    <li key={fid} className="animate-pop group relative overflow-hidden rounded-2xl bg-white shadow-sm">
                      <Imagem src={f?.src} alt={f?.nome ?? "Foto"} ajuste={f?.ajuste} className="aspect-square w-full" />
                      {i === 0 && <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-laranja px-2 py-0.5 text-[11px] font-bold text-white"><Star className="size-3 fill-current" /> Capa</span>}
                      <span className={cn("absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-bold", f?.aprovada && f.ajuste.quadrada ? "bg-salvia text-[#14432b]" : "bg-mel text-[#5c3700]")}>{f?.aprovada && f.ajuste.quadrada ? "OK" : "Tratar"}</span>
                      <div className="absolute inset-x-2 bottom-2 flex justify-between gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                        <button type="button" onClick={() => moverFoto(i, -1)} disabled={i === 0} aria-label="Mover para a esquerda" className="grid size-8 place-items-center rounded-full bg-white/90 shadow disabled:opacity-40"><ArrowLeft className="size-4" /></button>
                        <button type="button" onClick={() => set("fotos", p.fotos.filter((x) => x !== fid))} aria-label="Remover foto" className="grid size-8 place-items-center rounded-full bg-white/90 text-destructive shadow"><X className="size-4" /></button>
                        <button type="button" onClick={() => moverFoto(i, 1)} disabled={i === p.fotos.length - 1} aria-label="Mover para a direita" className="grid size-8 place-items-center rounded-full bg-white/90 shadow disabled:opacity-40"><ArrowRight className="size-4" /></button>
                      </div>
                    </li>
                  );
                })}
                <li>
                  <button type="button" onClick={() => setGaleria(true)} disabled={p.fotos.length >= 9} className="grid aspect-square w-full place-items-center rounded-2xl border-2 border-dashed border-laranja/40 bg-white/50 text-sm font-semibold text-laranja transition hover:bg-white disabled:opacity-50">
                    <span className="grid justify-items-center gap-1"><ImagePlus className="size-7" /> Adicionar foto<span className="text-xs font-normal text-muted-foreground">{p.fotos.length}/9</span></span>
                  </button>
                </li>
              </ul>
            </TabsContent>

            <TabsContent value="variacoes" className="grid gap-4">
              {p.variacoes.length === 0 && <p className="rounded-2xl bg-white/60 p-4 text-sm text-muted-foreground">Sem variações. Use quando o mesmo anúncio tem fragrâncias, cores ou tamanhos diferentes: reúne as vendas e as avaliações num lugar só.</p>}
              {p.variacoes.map((v, i) => (
                <div key={v.nome} className="glass-soft flex flex-wrap items-center gap-2 rounded-2xl p-3">
                  <b className="mr-1 text-sm">{v.nome}</b>
                  {v.opcoes.map((o) => (
                    <span key={o} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold shadow-sm">{o}
                      <button type="button" aria-label={`Remover ${o}`} onClick={() => set("variacoes", p.variacoes.map((x, k) => (k === i ? { ...x, opcoes: x.opcoes.filter((y) => y !== o) } : x)).filter((x) => x.opcoes.length))}><X className="size-3" /></button>
                    </span>
                  ))}
                  <Button variant="ghost" size="sm" className="ml-auto text-destructive" onClick={() => set("variacoes", p.variacoes.filter((_, k) => k !== i))}><Trash2 className="size-4" /> Remover</Button>
                </div>
              ))}
              <div className="grid gap-3 rounded-2xl border border-dashed border-ameixa/20 p-4 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
                <Campo id="var-nome" rotulo="Nome da variação"><Input id="var-nome" value={novaVar.nome} onChange={(e) => setNovaVar({ ...novaVar, nome: e.target.value })} placeholder="Fragrância" className="field" /></Campo>
                <Campo id="var-op" rotulo="Opções (separe por vírgula)"><Input id="var-op" value={novaVar.opcoes} onChange={(e) => setNovaVar({ ...novaVar, opcoes: e.target.value })} onKeyDown={(e) => e.key === "Enter" && addVariacao()} placeholder="Lavanda, Alecrim, Rosa" className="field" /></Campo>
                <Button onClick={addVariacao} className="h-11 rounded-xl bg-ameixa px-4"><Plus className="size-4" /> Adicionar</Button>
              </div>
            </TabsContent>

            <TabsContent value="envio" className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-4">
                <Campo id="peso" rotulo="Peso (g)" erro={erros.pesoG}><Input id="peso" type="number" min={0} value={p.pesoG || ""} onChange={(e) => set("pesoG", num(e.target.value))} aria-invalid={!!erros.pesoG} className="field tabular" /></Campo>
                {(["c", "l", "a"] as const).map((k) => (
                  <Campo key={k} id={`dim-${k}`} rotulo={{ c: "Comprimento (cm)", l: "Largura (cm)", a: "Altura (cm)" }[k]}>
                    <Input id={`dim-${k}`} type="number" min={0} value={p.dimensoes[k] || ""} onChange={(e) => set("dimensoes", { ...p.dimensoes, [k]: num(e.target.value) })} className="field tabular" />
                  </Campo>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Peso real", `${(p.pesoG / 1000).toFixed(2)} kg`],
                  ["Peso cubado", `${(pesoCubado / 1000).toFixed(2)} kg`],
                  ["Cobrado pelo frete", `${(Math.max(p.pesoG, pesoCubado) / 1000).toFixed(2)} kg`],
                ].map(([k, v], i) => (
                  <div key={k} className={cn("rounded-2xl p-4", i === 2 ? "bg-laranja text-white" : "bg-white/70")}>
                    <p className={cn("text-xs font-semibold", i === 2 ? "text-white/80" : "text-muted-foreground")}>{k}</p>
                    <p className="font-heading text-2xl font-bold tabular">{v}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">O frete considera o maior entre o peso real e o cubado. Caixa grande demais pra peça leve encarece o envio e derruba a conversão: vale ajustar a embalagem antes de abrir.</p>
            </TabsContent>
          </Tabs>
        </Painel>

        <aside className="grid content-start gap-4 xl:sticky xl:top-20">
          <Painel className="p-4">
            <div className="flex items-center gap-4">
              <Anel valor={nota} tamanho={84} traco={8}><span className="font-heading text-2xl font-bold tabular">{nota}</span></Anel>
              <div>
                <p className="font-heading text-lg font-bold">Qualidade do anúncio</p>
                <p className="text-xs text-muted-foreground">{nota >= 85 ? "Pronto pra publicar" : "85 ou mais libera a publicação"}{sujo && " · alterações não salvas"}</p>
              </div>
            </div>
            <ul className="mt-3 grid gap-1.5">
              {rs.map((r) => (
                <li key={r.id} className="flex items-center gap-2 text-sm">
                  <span className={cn("grid size-5 shrink-0 place-items-center rounded-full", r.ok ? "bg-salvia text-[#14432b]" : "bg-destructive/12 text-destructive")}>{r.ok ? <Check className="size-3" /> : <X className="size-3" />}</span>
                  <span className={cn(!r.ok && "font-medium")}>{r.rotulo}</span>
                  <span className="ml-auto text-xs text-muted-foreground tabular">{r.peso}</span>
                </li>
              ))}
            </ul>
          </Painel>
          <div>
            <p className="mb-2 text-center text-xs font-semibold tracking-widest text-white/75 uppercase">Prévia no celular do comprador</p>
            <Celular><Anuncio p={comoProduto} fotos={fotos} loja={loja} /></Celular>
          </div>
        </aside>
      </div>

      <Dialog open={galeria} onOpenChange={setGaleria}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-3xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Escolher do estúdio de fotos</DialogTitle>
            <DialogDescription>Fotos marcadas com OK já estão recortadas e aprovadas.</DialogDescription>
          </DialogHeader>
          {disponiveis.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Todas as fotos do estúdio já estão neste produto.</p> : (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {disponiveis.map((f) => (
                <li key={f.id}>
                  <button type="button" onClick={() => { set("fotos", [...p.fotos, f.id]); setGaleria(false); toast.success("Foto adicionada"); }} className="group relative block w-full overflow-hidden rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-laranja">
                    <Imagem src={f.src} alt={f.nome} ajuste={f.ajuste} className="aspect-square w-full transition group-hover:scale-105" />
                    <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 px-2 pt-4 pb-1 text-left text-[11px] text-white">{f.nome}</span>
                    {f.aprovada && f.ajuste.quadrada && <span className="absolute top-1.5 right-1.5 rounded-full bg-salvia px-1.5 text-[10px] font-bold text-[#14432b]">OK</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Link href="/fotos" className="text-sm font-semibold text-laranja hover:underline">Enviar novas fotos no estúdio</Link>
        </DialogContent>
      </Dialog>

      <Dialog open={excluir} onOpenChange={setExcluir}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Excluir este produto?</DialogTitle>
            <DialogDescription>{p.nome} sai do catálogo e da vitrine. As fotos continuam no estúdio.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExcluir(false)}>Cancelar</Button>
            <Button variant="destructive" className="bg-destructive text-white hover:bg-destructive/90" onClick={() => { acoes.excluirProduto(p.id!); toast.success("Produto excluído"); router.push("/produtos"); }}><Trash2 className="size-4" /> Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
