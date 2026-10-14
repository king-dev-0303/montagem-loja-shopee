"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BadgePercent, Check, Landmark, Loader2, MapPin, RotateCcw, Save, Store, Truck, UserRound } from "lucide-react";
import { acoes, useHidratado, useStore } from "@/lib/store";
import type { Loja } from "@/lib/data";
import { brl, lucro } from "@/lib/calc";
import { Cabecalho, Campo, Imagem, Painel, Skeleton } from "@/components/kit";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const BANCOS = ["Nubank (260)", "Itaú (341)", "Bradesco (237)", "Banco do Brasil (001)", "Caixa (104)", "Inter (077)", "Santander (033)", "C6 Bank (336)"];
const LOGOS = ["vela-pote", "vela-bokeh", "cesto-verde", "suculentas", "oleo-alecrim"];
const CEPS: Record<string, string> = { "04538-132": "Av. Brigadeiro Faria Lima - Itaim Bibi, São Paulo/SP", "01310-100": "Av. Paulista - Bela Vista, São Paulo/SP", "22041-001": "Av. Atlântica - Copacabana, Rio de Janeiro/RJ" };

function Secao({ id, icone: I, titulo, sub, children, onSalvar, salvando }: { id: string; icone: typeof Store; titulo: string; sub: string; children: React.ReactNode; onSalvar: () => void; salvando: boolean }) {
  return (
    <Painel id={id} className="scroll-mt-24">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-laranja/12 text-laranja"><I className="size-5" /></span>
          <div><h2 className="font-heading text-xl font-bold">{titulo}</h2><p className="text-sm text-muted-foreground">{sub}</p></div>
        </div>
        <Button onClick={onSalvar} disabled={salvando} className="h-10 rounded-xl bg-ameixa px-4 font-semibold hover:bg-ameixa/90">{salvando ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Salvar</Button>
      </div>
      {children}
    </Painel>
  );
}

export default function LojaPage() {
  return useHidratado() ? <Configuracoes /> : <div className="grid gap-4"><Skeleton className="h-24" /><Skeleton className="h-96" /><Skeleton className="h-80" /></div>;
}

function Configuracoes() {
  const { loja, produtos } = useStore();
  const router = useRouter();
  const [f, setF] = useState<Loja>(loja);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState("");
  const set = (parcial: Partial<Loja>) => setF((x) => ({ ...x, ...parcial }));

  async function salvar(secao: string, checar: () => Record<string, string>, parcial: Partial<Loja>, texto: string) {
    const e = checar();
    setErros((x) => ({ ...Object.fromEntries(Object.entries(x).filter(([k]) => !k.startsWith(secao))), ...e }));
    if (Object.keys(e).length) return toast.error("Confira os campos destacados", { description: Object.values(e)[0] });
    setSalvando(secao);
    await new Promise((r) => setTimeout(r, 650));
    acoes.salvarLoja(parcial, texto);
    setSalvando("");
    toast.success(texto);
  }

  const cepOk = /^\d{5}-\d{3}$/.test(f.logistica.cep);
  const endereco = CEPS[f.logistica.cep] ?? (cepOk ? "Endereço encontrado · confira o número no Seller Centre" : "");
  const exemplo = produtos[0];
  const contaEx = exemplo ? lucro(exemplo.precoPromo ?? exemplo.preco, exemplo.custo, f.taxas) : null;

  return (
    <div>
      <Cabecalho kicker="Configurações" titulo="Dados da loja" sub="O que a Shopee pede antes de liberar a primeira venda: perfil, como os pedidos saem e pra onde o dinheiro vai."
        acoes={
          <Dialog>
            <DialogTrigger className="chip-glass inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-bold text-white hover:bg-white/30"><RotateCcw className="size-4" /> Restaurar demonstração</DialogTrigger>
            <DialogContent className="rounded-3xl sm:max-w-md">
              <DialogHeader><DialogTitle className="font-heading text-xl">Voltar aos dados de exemplo?</DialogTitle><DialogDescription>Produtos, fotos e configurações voltam ao estado inicial da demonstração.</DialogDescription></DialogHeader>
              <DialogFooter><Button variant="destructive" className="bg-destructive text-white" onClick={() => { acoes.restaurar(); toast.success("Demonstração restaurada"); router.push("/"); }}>Restaurar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        } />

      <nav aria-label="Seções" className="scroll-thin mb-5 flex gap-2 overflow-x-auto">
        {[["#perfil", "Perfil", UserRound], ["#envio", "Envio", Truck], ["#recebimento", "Recebimento", Landmark], ["#tarifas", "Tarifas", BadgePercent]].map(([h, r, I]) => {
          const Icone = I as typeof Store;
          return <a key={h as string} href={h as string} className="chip-glass inline-flex h-10 shrink-0 items-center gap-2 rounded-2xl px-4 text-sm font-semibold text-white hover:bg-white/30"><Icone className="size-4" /> {r as string}</a>;
        })}
      </nav>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
        <Secao id="perfil" icone={UserRound} titulo="Perfil da loja" sub="Nome, @usuário, logo e a descrição que aparece na página da loja" salvando={salvando === "perfil"}
          onSalvar={() => salvar("perfil", () => {
            const e: Record<string, string> = {};
            if (f.nome.trim().length < 3 || f.nome.length > 30) e["perfil.nome"] = "Nome entre 3 e 30 caracteres.";
            if (!/^[a-z0-9._]{5,30}$/.test(f.usuario)) e["perfil.usuario"] = "5 a 30 letras minúsculas, números, ponto ou _.";
            if (f.descricao.trim().length < 60) e["perfil.descricao"] = "Pelo menos 60 caracteres: conte o que a loja vende e de onde envia.";
            return e;
          }, { nome: f.nome, usuario: f.usuario, descricao: f.descricao, logo: f.logo }, "Perfil da loja salvo")}>
          <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo id="nome" rotulo="Nome da loja" obrigatorio erro={erros["perfil.nome"]} dica={`${f.nome.length}/30`}>
                  <Input id="nome" value={f.nome} onChange={(e) => set({ nome: e.target.value })} aria-invalid={!!erros["perfil.nome"]} className="field" />
                </Campo>
                <Campo id="usuario" rotulo="Usuário" obrigatorio erro={erros["perfil.usuario"]} dica={`shopee.com.br/${f.usuario || "..."}`}>
                  <Input id="usuario" value={f.usuario} onChange={(e) => set({ usuario: e.target.value.toLowerCase().replace(/\s/g, "") })} aria-invalid={!!erros["perfil.usuario"]} className="field" />
                </Campo>
              </div>
              <Campo id="descricao-loja" rotulo="Descrição da loja" obrigatorio erro={erros["perfil.descricao"]} dica={`${f.descricao.length}/500`}>
                <Textarea id="descricao-loja" rows={4} maxLength={500} value={f.descricao} onChange={(e) => set({ descricao: e.target.value })} aria-invalid={!!erros["perfil.descricao"]} className="field" />
              </Campo>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">Logo</p>
              <div className="relative mb-3 overflow-hidden rounded-3xl">
                <Imagem src="/img/sala.jpg" alt="" className="h-24 w-full" />
                <Imagem src={f.logo} alt="Logo atual" className="absolute bottom-2 left-3 size-16 rounded-full border-4 border-white shadow-lg" />
                <span className="chip-glass absolute right-2 bottom-2 rounded-full px-2.5 py-0.5 text-xs font-bold text-white">{f.nome}</span>
              </div>
              <div role="radiogroup" aria-label="Escolher logo" className="flex gap-2">
                {LOGOS.map((id) => (
                  <button key={id} type="button" role="radio" aria-checked={f.logo === `/img/${id}.jpg`} onClick={() => set({ logo: `/img/${id}.jpg` })} className={cn("rounded-full transition", f.logo === `/img/${id}.jpg` ? "ring-3 ring-laranja ring-offset-2" : "opacity-70 hover:opacity-100")}>
                    <Imagem src={`/img/${id}.jpg`} alt={id} className="size-10 rounded-full" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Secao>

        <Secao id="envio" icone={Truck} titulo="Envio e coleta" sub="Quais transportadoras atendem e de onde os pacotes saem" salvando={salvando === "envio"}
          onSalvar={() => salvar("envio", () => {
            const e: Record<string, string> = {};
            if (!f.logistica.shopeeXpress && !f.logistica.correios) e["envio.metodo"] = "Ative pelo menos uma forma de envio.";
            if (!cepOk) e["envio.cep"] = "CEP no formato 00000-000.";
            return e;
          }, { logistica: f.logistica }, "Envio e coleta salvos")}>
          <div className="grid gap-3 sm:grid-cols-3">
            {([["shopeeXpress", "Shopee Xpress", "Coleta no endereço, rastreio integrado"], ["correios", "Correios", "Postagem na agência, PAC e SEDEX"], ["coleta", "Coleta agendada", "Motorista passa no horário combinado"]] as const).map(([k, r, d]) => (
              <label key={k} className={cn("flex cursor-pointer items-start justify-between gap-3 rounded-2xl p-4 transition", f.logistica[k] ? "bg-white shadow-sm ring-2 ring-laranja/50" : "bg-white/55")}>
                <span><b className="block text-sm">{r}</b><span className="text-xs text-muted-foreground">{d}</span></span>
                <Switch checked={f.logistica[k]} onCheckedChange={(v) => set({ logistica: { ...f.logistica, [k]: v } })} aria-label={r} />
              </label>
            ))}
          </div>
          {erros["envio.metodo"] && <p className="mt-2 text-xs font-medium text-destructive" role="alert">{erros["envio.metodo"]}</p>}
          <div className="mt-4 grid gap-4 sm:grid-cols-[200px_1fr_200px] sm:items-start">
            <Campo id="cep" rotulo="CEP de coleta" obrigatorio erro={erros["envio.cep"]}>
              <Input id="cep" inputMode="numeric" value={f.logistica.cep} aria-invalid={!!erros["envio.cep"]} className="field tabular"
                onChange={(e) => { const d = e.target.value.replace(/\D/g, "").slice(0, 8); set({ logistica: { ...f.logistica, cep: d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d } }); }} />
            </Campo>
            <div className="grid gap-1.5">
              <span className="text-sm font-semibold">Endereço</span>
              <p className={cn("flex h-11 items-center gap-2 rounded-xl px-3 text-sm", endereco ? "bg-salvia/20 text-[#1f5a3c]" : "bg-white/50 text-muted-foreground")}><MapPin className="size-4 shrink-0" /> <span className="truncate">{endereco || "Digite o CEP"}</span></p>
            </div>
            <Campo id="prazo" rotulo="Prazo de postagem">
              <Select value={String(f.logistica.prazoPostagem)} onValueChange={(v) => set({ logistica: { ...f.logistica, prazoPostagem: Number(v) } })}>
                <SelectTrigger id="prazo" className="field h-11! w-full"><SelectValue>{(v: string) => `${v} dia(s) útil(eis)`}</SelectValue></SelectTrigger>
                <SelectContent>{[1, 2, 3].map((n) => <SelectItem key={n} value={String(n)}>{n} dia(s) útil(eis)</SelectItem>)}</SelectContent>
              </Select>
            </Campo>
          </div>
        </Secao>

        <Secao id="recebimento" icone={Landmark} titulo="Recebimento" sub="A conta precisa estar no mesmo CPF ou CNPJ cadastrado na Shopee" salvando={salvando === "receb"}
          onSalvar={() => salvar("receb", () => {
            const e: Record<string, string> = {};
            const pg = f.pagamento;
            const dig = pg.documento.replace(/\D/g, "").length;
            if (pg.tipo === "CNPJ" ? dig !== 14 : dig !== 11) e["receb.doc"] = `${pg.tipo} incompleto.`;
            if (pg.titular.trim().length < 4) e["receb.titular"] = "Nome do titular como está no banco.";
            if (!pg.banco) e["receb.banco"] = "Escolha o banco.";
            if (!/^\d{4}$/.test(pg.agencia)) e["receb.agencia"] = "Agência com 4 dígitos, sem o dígito verificador.";
            if (!/^\d{4,12}-?\d$/.test(pg.conta)) e["receb.conta"] = "Conta com dígito, ex.: 1234567-8.";
            return e;
          }, { pagamento: f.pagamento }, "Dados de recebimento salvos")}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Campo id="tipo" rotulo="Tipo de cadastro">
              <div id="tipo" role="radiogroup" className="flex rounded-xl bg-ameixa/6 p-1">
                {(["CPF", "CNPJ"] as const).map((t) => <button key={t} type="button" role="radio" aria-checked={f.pagamento.tipo === t} onClick={() => set({ pagamento: { ...f.pagamento, tipo: t } })} className={cn("h-9 flex-1 rounded-lg text-sm font-bold transition", f.pagamento.tipo === t ? "bg-white text-laranja shadow-sm" : "text-muted-foreground")}>{t}</button>)}
              </div>
            </Campo>
            <Campo id="doc" rotulo={f.pagamento.tipo} obrigatorio erro={erros["receb.doc"]}>
              <Input id="doc" inputMode="numeric" value={f.pagamento.documento} onChange={(e) => set({ pagamento: { ...f.pagamento, documento: e.target.value } })} aria-invalid={!!erros["receb.doc"]} className="field tabular" />
            </Campo>
            <Campo id="titular" rotulo="Titular" obrigatorio erro={erros["receb.titular"]}>
              <Input id="titular" value={f.pagamento.titular} onChange={(e) => set({ pagamento: { ...f.pagamento, titular: e.target.value } })} aria-invalid={!!erros["receb.titular"]} className="field" />
            </Campo>
            <Campo id="banco" rotulo="Banco" obrigatorio erro={erros["receb.banco"]}>
              <Select value={f.pagamento.banco || null} onValueChange={(v) => set({ pagamento: { ...f.pagamento, banco: String(v ?? "") } })}>
                <SelectTrigger id="banco" aria-invalid={!!erros["receb.banco"]} className="field h-11! w-full"><SelectValue placeholder="Escolha o banco" /></SelectTrigger>
                <SelectContent>{BANCOS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </Campo>
            <Campo id="agencia" rotulo="Agência" obrigatorio erro={erros["receb.agencia"]}>
              <Input id="agencia" inputMode="numeric" maxLength={4} placeholder="0001" value={f.pagamento.agencia} onChange={(e) => set({ pagamento: { ...f.pagamento, agencia: e.target.value.replace(/\D/g, "") } })} aria-invalid={!!erros["receb.agencia"]} className="field tabular" />
            </Campo>
            <Campo id="conta" rotulo="Conta" obrigatorio erro={erros["receb.conta"]}>
              <Input id="conta" inputMode="numeric" placeholder="1234567-8" value={f.pagamento.conta} onChange={(e) => set({ pagamento: { ...f.pagamento, conta: e.target.value.replace(/[^\d-]/g, "") } })} aria-invalid={!!erros["receb.conta"]} className="field tabular" />
            </Campo>
          </div>
        </Secao>

        <Secao id="tarifas" icone={BadgePercent} titulo="Tarifas de referência" sub="Usadas na calculadora de margem de cada produto. Ajuste se a Shopee mudar a tabela." salvando={salvando === "tarifas"}
          onSalvar={() => salvar("tarifas", (): Record<string, string> => {
            const t = f.taxas;
            return t.comissao < 0 || t.comissao > 50 || t.freteGratis < 0 || t.freteGratis > 30 || t.tarifaFixa < 0 ? { "tarifas.valor": "Valores fora do intervalo esperado." } : {};
          }, { taxas: f.taxas }, "Tarifas atualizadas")}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {([["comissao", "Comissão (%)"], ["freteGratis", "Programa de frete grátis (%)"], ["tarifaFixa", "Tarifa fixa por item (R$)"], ["tetoComissao", "Teto da comissão (R$)"]] as const).map(([k, r]) => (
              <Campo key={k} id={k} rotulo={r}>
                <Input id={k} type="number" min={0} step="0.5" value={f.taxas[k]} onChange={(e) => set({ taxas: { ...f.taxas, [k]: Number(e.target.value) } })} className="field tabular" />
              </Campo>
            ))}
          </div>
          {erros["tarifas.valor"] && <p className="mt-2 text-xs font-medium text-destructive">{erros["tarifas.valor"]}</p>}
          {exemplo && contaEx && (
            <p className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-white/60 p-3 text-sm">
              <Check className="size-4 text-[#1f7a4c]" /> Exemplo: {exemplo.nome.slice(0, 40)}... vendido a {brl(exemplo.precoPromo ?? exemplo.preco)} paga {brl(contaEx.tarifas)} de tarifas e deixa <b>{brl(contaEx.ganho)}</b> ({contaEx.margem.toFixed(1)}%).
            </p>
          )}
        </Secao>
      </div>
    </div>
  );
}
