import type { Foto, Loja, Produto } from "@/lib/data";

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Quanto sobra de cada venda depois das tarifas da Shopee (valores de referência, editáveis na loja). */
export function lucro(preco: number, custo: number, taxas: Loja["taxas"]) {
  const percentual = Math.min(preco * ((taxas.comissao + taxas.freteGratis) / 100), taxas.tetoComissao);
  const tarifas = percentual + taxas.tarifaFixa;
  const liquido = preco - tarifas;
  const ganho = liquido - custo;
  return { percentual, tarifas, liquido, ganho, margem: preco > 0 ? (ganho / preco) * 100 : 0 };
}

/** Preço mínimo pra atingir uma margem alvo sobre o preço de venda. */
export function precoParaMargem(custo: number, margemAlvo: number, taxas: Loja["taxas"]) {
  const pct = (taxas.comissao + taxas.freteGratis + margemAlvo) / 100;
  return pct >= 1 ? 0 : (custo + taxas.tarifaFixa) / (1 - pct);
}

export interface Regra {
  id: string;
  rotulo: string;
  ok: boolean;
  peso: number;
}

/** Os critérios que a Shopee usa pra qualificar um anúncio, traduzidos em checagens objetivas. */
export function regras(p: Produto, fotos: Foto[], loja: Loja): Regra[] {
  const capa = fotos.find((x) => x.id === p.fotos[0]);
  const { margem } = lucro(p.precoPromo ?? p.preco, p.custo, loja.taxas);
  return [
    { id: "titulo", rotulo: "Título entre 25 e 120 caracteres", ok: p.nome.trim().length >= 25 && p.nome.length <= 120, peso: 20 },
    { id: "descricao", rotulo: "Descrição com 120+ caracteres", ok: p.descricao.trim().length >= 120, peso: 15 },
    { id: "fotos", rotulo: "Pelo menos 2 fotos", ok: p.fotos.length >= 2, peso: 10 },
    { id: "capa", rotulo: "Capa quadrada e aprovada", ok: !!capa && capa.aprovada && capa.ajuste.quadrada, peso: 15 },
    { id: "envio", rotulo: "Peso e dimensões do pacote", ok: p.pesoG > 0 && p.dimensoes.c > 0 && p.dimensoes.l > 0 && p.dimensoes.a > 0, peso: 15 },
    { id: "margem", rotulo: "Margem de 15% ou mais", ok: p.preco > 0 && margem >= 15, peso: 15 },
    { id: "estoque", rotulo: "Estoque disponível", ok: p.estoque > 0, peso: 10 },
  ];
}

export const pontuacao = (r: Regra[]) => r.reduce((s, x) => s + (x.ok ? x.peso : 0), 0);

export function checksFoto(f: Foto) {
  const lado = Math.min(f.w, f.h);
  return [
    { rotulo: "Resolução mínima 500 px", ok: lado >= 500 },
    { rotulo: "Recorte 1:1 (quadrado)", ok: f.ajuste.quadrada },
    { rotulo: "Arquivo até 2 MB", ok: f.kb <= 2048 },
    { rotulo: "Revisada e aprovada", ok: f.aprovada },
  ];
}

export const filtroFoto = (a: Foto["ajuste"]) => `brightness(${a.luz}%) contrast(${a.contraste}%) saturate(${a.saturacao}%)`;

export const quando = (s: string) => {
  const [d, h] = s.split(" ");
  const [, m, dia] = d.split("-");
  return `${dia}/${m}${h ? ` às ${h}` : ""}`;
};
