"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle2, Columns3, Download, FileSpreadsheet, FileUp, ListChecks, Loader2, PartyPopper, TriangleAlert, Upload } from "lucide-react";
import { acoes, type Rascunho, useStore } from "@/lib/store";
import { CATEGORIAS } from "@/lib/data";
import { brl } from "@/lib/calc";
import { Barra, Cabecalho, Imagem, Painel } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const CAMPOS = [
  { k: "nome", r: "Título", obrigatorio: true, pistas: ["titulo", "título", "nome", "produto"] },
  { k: "sku", r: "SKU", obrigatorio: true, pistas: ["sku", "codigo", "código", "ref"] },
  { k: "categoria", r: "Categoria", obrigatorio: true, pistas: ["categoria"] },
  { k: "preco", r: "Preço", obrigatorio: true, pistas: ["preço", "preco", "valor"] },
  { k: "custo", r: "Custo", obrigatorio: false, pistas: ["custo"] },
  { k: "estoque", r: "Estoque", obrigatorio: true, pistas: ["estoque", "qtd", "quantidade"] },
  { k: "peso", r: "Peso (g)", obrigatorio: false, pistas: ["peso"] },
  { k: "descricao", r: "Descrição", obrigatorio: false, pistas: ["descrição", "descricao"] },
] as const;
type Chave = (typeof CAMPOS)[number]["k"];
const NENHUMA = "__nenhuma";

/** CSV com aspas, separador ; ou , (o Excel em português salva com ;). */
function lerCsv(txt: string): string[][] {
  const sep = (txt.split("\n")[0].match(/;/g)?.length ?? 0) >= (txt.split("\n")[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  const linhas: string[][] = [];
  let campo = "", linha: string[] = [], aspas = false;
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (aspas) {
      if (c === '"' && txt[i + 1] === '"') { campo += '"'; i++; } else if (c === '"') aspas = false; else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === sep) { linha.push(campo); campo = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && txt[i + 1] === "\n") i++; linha.push(campo); if (linha.some((x) => x.trim())) linhas.push(linha); linha = []; campo = ""; }
    else campo += c;
  }
  linha.push(campo);
  if (linha.some((x) => x.trim())) linhas.push(linha);
  return linhas;
}

const numero = (s: string) => { const t = s.trim().replace(/\./g, "").replace(",", "."); return t === "" ? NaN : Number(t); };

export default function ImportarPage() {
  const { produtos } = useStore();
  const [passo, setPasso] = useState(0);
  const [arquivo, setArquivo] = useState("");
  const [cab, setCab] = useState<string[]>([]);
  const [linhas, setLinhas] = useState<string[][]>([]);
  const [mapa, setMapa] = useState<Record<Chave, number>>({} as Record<Chave, number>);
  const [soValidas, setSoValidas] = useState(true);
  const [progresso, setProgresso] = useState(0);
  const [importados, setImportados] = useState(0);
  const [lendo, setLendo] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  function carregar(nome: string, txt: string) {
    const dados = lerCsv(txt.replace(/^﻿/, ""));
    if (dados.length < 2) return toast.error("Planilha vazia", { description: "Precisa de uma linha de cabeçalho e pelo menos um produto." });
    const [h, ...rs] = dados;
    const auto = {} as Record<Chave, number>;
    CAMPOS.forEach((c) => { auto[c.k] = h.findIndex((x) => c.pistas.some((p) => x.toLowerCase().includes(p))); });
    setArquivo(nome); setCab(h); setLinhas(rs); setMapa(auto); setPasso(1);
    toast.success(`${rs.length} linhas lidas de ${nome}`, { description: `${Object.values(auto).filter((v) => v >= 0).length} de ${CAMPOS.length} colunas reconhecidas automaticamente.` });
  }

  async function exemplo() {
    setLendo(true);
    try {
      const r = await fetch("/modelo-produtos.csv");
      if (!r.ok) throw new Error();
      carregar("modelo-produtos.csv", await r.text());
    } catch { toast.error("Não consegui abrir a planilha de exemplo."); }
    setLendo(false);
  }

  function arquivoEscolhido(f?: File) {
    if (!f) return;
    if (!/\.(csv|txt)$/i.test(f.name)) return toast.error("Formato não suportado", { description: "Salve a planilha como CSV (Arquivo > Salvar como > CSV)." });
    const r = new FileReader();
    r.onload = () => carregar(f.name, String(r.result));
    r.onerror = () => toast.error("Erro ao ler o arquivo.");
    r.readAsText(f, "utf-8");
  }

  const faltando = CAMPOS.filter((c) => c.obrigatorio && !(mapa[c.k] >= 0));
  const val = (l: string[], k: Chave) => (mapa[k] >= 0 ? (l[mapa[k]] ?? "").trim() : "");

  const revisao = useMemo(() => linhas.map((l, i) => {
    const erros: Partial<Record<Chave, string>> = {};
    const nome = val(l, "nome"), sku = val(l, "sku").toUpperCase(), preco = numero(val(l, "preco")), custo = numero(val(l, "custo")), estoque = numero(val(l, "estoque")), peso = numero(val(l, "peso"));
    const cat = CATEGORIAS.find((c) => c.nome.toLowerCase() === val(l, "categoria").toLowerCase() || c.id === val(l, "categoria").toLowerCase());
    if (nome.length < 10) erros.nome = "Título curto";
    if (nome.length > 120) erros.nome = `${nome.length}/120 caracteres`;
    if (!/^[A-Z0-9-]{4,20}$/.test(sku)) erros.sku = "SKU inválido";
    else if (produtos.some((p) => p.sku === sku) || linhas.slice(0, i).some((o) => val(o, "sku").toUpperCase() === sku)) erros.sku = "SKU repetido";
    if (!cat) erros.categoria = "Categoria desconhecida";
    if (!(preco > 0)) erros.preco = "Sem preço";
    if (!Number.isInteger(estoque) || estoque < 0) erros.estoque = "Estoque inválido";
    const produto: Rascunho = {
      nome, sku, categoriaId: cat?.id ?? "aromas", descricao: val(l, "descricao"), preco: preco > 0 ? preco : 0, precoPromo: null, custo: custo >= 0 ? custo : 0,
      estoque: estoque >= 0 ? estoque : 0, pesoG: peso > 0 ? peso : 0, dimensoes: { c: 0, l: 0, a: 0 }, fotos: [], variacoes: [], status: "rascunho",
    };
    return { i, erros, produto, ok: Object.keys(erros).length === 0 };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [linhas, mapa, produtos]);

  const validas = revisao.filter((r) => r.ok);
  const editar = (i: number, k: Chave, v: string) => setLinhas((ls) => ls.map((l, j) => { if (j !== i) return l; const n = [...l]; n[mapa[k]] = v; return n; }));

  async function importar() {
    const alvo = soValidas ? validas : revisao;
    if (!alvo.length) return toast.error("Nenhuma linha válida pra importar.");
    setPasso(3);
    for (let p = 0; p <= 100; p += 4) { setProgresso(p); await new Promise((r) => setTimeout(r, 45)); }
    acoes.importar(alvo.map((r) => r.produto));
    setImportados(alvo.length);
    setPasso(4);
    toast.success(`${alvo.length} produtos importados como rascunho`);
  }

  const PASSOS = [{ r: "Arquivo", I: FileUp }, { r: "Colunas", I: Columns3 }, { r: "Revisão", I: ListChecks }, { r: "Importar", I: Upload }];

  return (
    <div>
      <Cabecalho kicker="Cadastro em massa" titulo="Importar produtos por planilha"
        sub="Cadastrar item por item na Shopee é onde a montagem trava. Aqui a planilha entra de uma vez, cada linha é validada contra as regras da Shopee e só sobe o que estiver certo." />

      <ol className="glass mb-5 grid grid-cols-4 gap-1 rounded-3xl p-1.5" aria-label="Etapas da importação">
        {PASSOS.map((s, i) => {
          const atual = Math.min(passo, 3);
          return (
            <li key={s.r} aria-current={atual === i ? "step" : undefined} className={cn("flex items-center justify-center gap-2 rounded-2xl px-2 py-2.5 text-xs font-semibold transition sm:text-sm", atual === i ? "bg-laranja text-white shadow" : atual > i || passo === 4 ? "text-[#1f7a4c]" : "text-muted-foreground")}>
              {atual > i || passo === 4 ? <CheckCircle2 className="size-4" /> : <s.I className="size-4" />} <span className="hidden sm:inline">{s.r}</span>
            </li>
          );
        })}
      </ol>

      {passo === 0 && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Painel className="grid place-items-center p-3">
            <button type="button" onClick={() => input.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); arquivoEscolhido(e.dataTransfer.files[0]); }}
              className="group grid min-h-72 w-full place-items-center rounded-[22px] border-2 border-dashed border-laranja/40 bg-white/50 p-8 text-center transition hover:border-laranja hover:bg-white/80">
              <span>
                <span className="mx-auto mb-4 grid size-20 place-items-center rounded-3xl bg-gradient-to-br from-pessego to-laranja text-white shadow-lg transition group-hover:-translate-y-1 group-hover:rotate-3"><FileSpreadsheet className="size-10" /></span>
                <span className="block font-heading text-2xl font-bold">Arraste o CSV aqui</span>
                <span className="mt-1 block text-sm text-muted-foreground">ou clique pra escolher · Excel e Google Planilhas exportam em CSV</span>
              </span>
            </button>
            <input ref={input} type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => { arquivoEscolhido(e.target.files?.[0]); e.target.value = ""; }} aria-label="Escolher planilha CSV" />
          </Painel>
          <div className="grid content-start gap-4">
            <section className="relative overflow-hidden rounded-3xl text-white">
              <Imagem src="/img/embalagem.jpg" alt="Equipe conferindo caixas de pedidos" className="absolute inset-0 size-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-ameixa/95 via-ameixa/60 to-ameixa/10" />
              <div className="relative p-5 pt-28">
                <p className="font-heading text-xl font-bold">Não tem a planilha pronta?</p>
                <p className="mt-1 text-sm text-white/80">Use o modelo com 8 produtos de exemplo: dois têm erros de propósito, pra ver a validação funcionando.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={exemplo} disabled={lendo} className="h-10 rounded-xl bg-white px-4 font-bold text-ameixa hover:bg-creme">{lendo ? <Loader2 className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4" />} Usar o exemplo</Button>
                  <a href="/modelo-produtos.csv" download className="chip-glass inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold hover:bg-white/30"><Download className="size-4" /> Baixar modelo</a>
                </div>
              </div>
            </section>
            <Painel className="p-5 text-sm">
              <p className="mb-2 font-semibold">Colunas que a Shopee exige</p>
              <div className="flex flex-wrap gap-1.5">{CAMPOS.map((c) => <span key={c.k} className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", c.obrigatorio ? "bg-laranja/12 text-laranja" : "bg-white/80 text-muted-foreground")}>{c.r}</span>)}</div>
            </Painel>
          </div>
        </div>
      )}

      {passo === 1 && (
        <Painel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div><h2 className="font-heading text-xl font-bold">Ligue as colunas</h2><p className="text-sm text-muted-foreground">{arquivo} · {linhas.length} linhas · {cab.length} colunas</p></div>
            {faltando.length > 0 && <p className="flex items-center gap-1.5 rounded-full bg-mel/25 px-3 py-1 text-sm font-semibold text-[#7a4a05]"><TriangleAlert className="size-4" /> Falta ligar: {faltando.map((c) => c.r).join(", ")}</p>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CAMPOS.map((c) => (
              <div key={c.k} className={cn("rounded-2xl p-3", mapa[c.k] >= 0 ? "bg-white/75" : c.obrigatorio ? "bg-mel/20 ring-1 ring-mel/60" : "bg-white/50")}>
                <label htmlFor={`m-${c.k}`} className="text-sm font-semibold">{c.r} {c.obrigatorio && <span className="text-laranja">*</span>}</label>
                <Select value={mapa[c.k] >= 0 ? String(mapa[c.k]) : NENHUMA} onValueChange={(v) => setMapa({ ...mapa, [c.k]: v === NENHUMA ? -1 : Number(v) })}>
                  <SelectTrigger id={`m-${c.k}`} className="field mt-1.5 h-10! w-full"><SelectValue>{(v: string) => (v === NENHUMA ? "Não importar" : cab[Number(v)])}</SelectValue></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NENHUMA}>Não importar</SelectItem>
                    {cab.map((h, i) => <SelectItem key={i} value={String(i)}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="mt-1.5 truncate text-xs text-muted-foreground">ex.: {mapa[c.k] >= 0 ? linhas[0]?.[mapa[c.k]] || "(vazio)" : "-"}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-between gap-2">
            <Button variant="outline" onClick={() => setPasso(0)} className="h-11 rounded-xl"><ArrowLeft className="size-4" /> Outro arquivo</Button>
            <Button disabled={faltando.length > 0} onClick={() => setPasso(2)} className="h-11 rounded-xl bg-laranja px-5 font-bold hover:bg-[#e04d23]">Revisar linhas <ArrowRight className="size-4" /></Button>
          </div>
        </Painel>
      )}

      {passo === 2 && (
        <Painel className="p-0">
          <div className="flex flex-wrap items-center gap-3 p-5">
            <div className="mr-auto"><h2 className="font-heading text-xl font-bold">Revisão</h2><p className="text-sm text-muted-foreground">Corrija direto na tabela: a validação roda a cada tecla.</p></div>
            <span className="rounded-full bg-salvia/30 px-3 py-1 text-sm font-bold text-[#1f5a3c]">{validas.length} válidas</span>
            <span className="rounded-full bg-destructive/12 px-3 py-1 text-sm font-bold text-destructive">{revisao.length - validas.length} com erro</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-white/50 text-left text-xs text-muted-foreground uppercase">
                <tr><th className="p-3">#</th><th className="p-3">Título</th><th className="p-3">SKU</th><th className="p-3">Categoria</th><th className="p-3">Preço</th><th className="p-3">Estoque</th><th className="p-3">Situação</th></tr>
              </thead>
              <tbody>
                {revisao.map((r) => (
                  <tr key={r.i} className={cn("border-t border-ameixa/8", !r.ok && "bg-destructive/[0.04]")}>
                    <td className="p-3 text-muted-foreground tabular">{r.i + 2}</td>
                    {(["nome", "sku", "categoria", "preco", "estoque"] as Chave[]).map((k) => (
                      <td key={k} className="p-2 align-top">
                        <input value={val(linhas[r.i], k)} onChange={(e) => editar(r.i, k, e.target.value)} aria-label={`${k} da linha ${r.i + 2}`} aria-invalid={!!r.erros[k]}
                          className={cn("h-9 w-full rounded-lg border bg-white/80 px-2 outline-none focus-visible:ring-2 focus-visible:ring-laranja", r.erros[k] ? "border-destructive" : "border-ameixa/10", k === "nome" ? "min-w-64" : "min-w-20")} />
                        {r.erros[k] && <p className="mt-1 text-[11px] font-medium text-destructive">{r.erros[k]}</p>}
                      </td>
                    ))}
                    <td className="p-3">{r.ok ? <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1f7a4c]"><CheckCircle2 className="size-4" /> {brl(r.produto.preco)}</span> : <span className="text-xs font-bold text-destructive">{Object.keys(r.erros).length} erro(s)</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <Button variant="outline" onClick={() => setPasso(1)} className="h-11 rounded-xl"><ArrowLeft className="size-4" /> Colunas</Button>
            <label className="flex items-center gap-2 text-sm font-medium"><Switch checked={soValidas} onCheckedChange={setSoValidas} /> Importar só as linhas válidas</label>
            <Button onClick={importar} disabled={(soValidas ? validas.length : revisao.length) === 0 || (!soValidas && validas.length < revisao.length)} className="glow-laranja h-11 rounded-xl bg-laranja px-5 font-bold hover:bg-[#e04d23]">
              <Upload className="size-4" /> Importar {soValidas ? validas.length : revisao.length} produto(s)
            </Button>
          </div>
          {!soValidas && validas.length < revisao.length && <p className="px-5 pb-5 text-right text-xs text-destructive">Corrija as linhas com erro ou ative &quot;só as válidas&quot;.</p>}
        </Painel>
      )}

      {passo === 3 && (
        <Painel className="grid place-items-center py-16 text-center">
          <Loader2 className="size-10 animate-spin text-laranja" />
          <p className="mt-4 font-heading text-2xl font-bold">Cadastrando produtos...</p>
          <p className="text-sm text-muted-foreground">Validando categoria, SKU e preço de cada item</p>
          <Barra valor={progresso} className="mt-5 h-3 w-full max-w-md" />
          <p className="mt-2 text-sm font-semibold tabular">{progresso}%</p>
        </Painel>
      )}

      {passo === 4 && (
        <Painel className="grid place-items-center py-14 text-center">
          <span className="grid size-20 place-items-center rounded-full bg-salvia/30 text-[#1f7a4c] animate-pop"><PartyPopper className="size-10" /></span>
          <p className="mt-4 font-heading text-3xl font-bold">{importados} produtos no catálogo</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">Entraram como rascunho. Falta vincular as fotos e conferir peso e medidas da embalagem antes de marcar como pronto.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/produtos?status=rascunho" className="glow-laranja inline-flex h-11 items-center gap-2 rounded-xl bg-laranja px-5 text-sm font-bold text-white">Ver rascunhos <ArrowRight className="size-4" /></Link>
            <Button variant="outline" onClick={() => { setPasso(0); setLinhas([]); }} className="h-11 rounded-xl">Importar outra planilha</Button>
          </div>
        </Painel>
      )}
    </div>
  );
}
