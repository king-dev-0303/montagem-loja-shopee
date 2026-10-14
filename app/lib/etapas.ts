import type { Estado } from "@/lib/store";

export interface Etapa {
  id: string;
  titulo: string;
  resumo: string;
  href: string;
  imagem: string;
  feito: number;
  total: number;
}

const cepValido = (c: string) => /^\d{5}-?\d{3}$/.test(c);

/** As seis etapas que deixam uma loja Shopee pronta pra vender, calculadas a partir do estado real. */
export function etapas(e: Estado): Etapa[] {
  const { loja, produtos, fotos } = e;
  const perfil = [loja.nome.trim().length >= 3, /^[a-z0-9._]{5,30}$/.test(loja.usuario), loja.descricao.trim().length >= 60, !!loja.logo];
  const envio = [loja.logistica.shopeeXpress || loja.logistica.correios, cepValido(loja.logistica.cep), loja.logistica.prazoPostagem > 0];
  const pg = loja.pagamento;
  const receb = [pg.titular.trim().length > 3, pg.documento.replace(/\D/g, "").length >= 11, !!pg.banco, /^\d{4}$/.test(pg.agencia), /^\d{4,12}-?\d$/.test(pg.conta)];
  const usadas = new Set(produtos.flatMap((p) => p.fotos));
  const fotosProd = fotos.filter((f) => usadas.has(f.id));
  const prontos = produtos.filter((p) => p.status === "pronto" || p.status === "publicado").length;
  return [
    { id: "perfil", titulo: "Perfil da loja", resumo: "Nome, usuário, logo e descrição", href: "/loja", imagem: "/img/sala.jpg", feito: perfil.filter(Boolean).length, total: perfil.length },
    { id: "envio", titulo: "Envio e coleta", resumo: "Shopee Xpress, Correios e CEP de coleta", href: "/loja#envio", imagem: "/img/cestos.jpg", feito: envio.filter(Boolean).length, total: envio.length },
    { id: "recebimento", titulo: "Recebimento", resumo: "Conta bancária no nome do CNPJ", href: "/loja#recebimento", imagem: "/img/artesas.jpg", feito: receb.filter(Boolean).length, total: receb.length },
    { id: "fotos", titulo: "Fotos tratadas", resumo: "Recorte 1:1, luz e aprovação", href: "/fotos", imagem: "/img/vela-lilas.jpg", feito: fotosProd.filter((f) => f.aprovada && f.ajuste.quadrada).length, total: fotosProd.length },
    { id: "catalogo", titulo: "Catálogo com preços", resumo: "Itens revisados, margem e estoque", href: "/produtos", imagem: "/img/toalhas.jpg", feito: prontos, total: produtos.length },
    { id: "vitrine", titulo: "Vitrine decorada", resumo: "Banner, coleções e destaques", href: "/vitrine", imagem: "/img/vela-bokeh.jpg", feito: loja.vitrine.publicada ? 1 : 0, total: 1 },
  ];
}

export const progresso = (es: Etapa[]) => Math.round((es.reduce((s, x) => s + (x.total ? x.feito / x.total : 1), 0) / es.length) * 100);
