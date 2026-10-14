// Dados de demonstração com o mesmo formato que a API da Shopee Open Platform devolve/recebe
// (produto, mídia, logística). Trocando o store por chamadas reais, as telas continuam iguais.

export type StatusProduto = "rascunho" | "revisao" | "pronto" | "publicado";

export interface Categoria {
  id: string;
  nome: string;
  caminho: string; // árvore de categorias da Shopee
  capa: string;
}

export interface Variacao {
  nome: string;
  opcoes: string[];
}

export interface Produto {
  id: string;
  sku: string;
  nome: string;
  categoriaId: string;
  descricao: string;
  preco: number;
  precoPromo: number | null;
  custo: number;
  estoque: number;
  pesoG: number;
  dimensoes: { c: number; l: number; a: number };
  fotos: string[]; // ids de Foto, a primeira é a capa
  variacoes: Variacao[];
  status: StatusProduto;
  atualizadoEm: string;
}

export interface AjusteFoto {
  luz: number; // 100 = original
  contraste: number;
  saturacao: number;
  quadrada: boolean;
}

export interface Foto {
  id: string;
  src: string;
  nome: string;
  w: number;
  h: number;
  kb: number;
  tipo: "produto" | "ambiente";
  aprovada: boolean;
  ajuste: AjusteFoto;
  enviadaEm: string;
}

export interface Loja {
  nome: string;
  usuario: string;
  descricao: string;
  logo: string;
  whatsapp: string;
  logistica: { shopeeXpress: boolean; correios: boolean; coleta: boolean; cep: string; prazoPostagem: number };
  pagamento: { tipo: "CPF" | "CNPJ"; documento: string; titular: string; banco: string; agencia: string; conta: string };
  vitrine: { banner: string; slogan: string; destaques: string[]; colecoes: string[]; publicada: boolean };
  taxas: { comissao: number; freteGratis: number; tarifaFixa: number; tetoComissao: number };
  lancada: boolean;
  abertura: string;
}

export interface Atividade {
  id: string;
  quando: string;
  texto: string;
  tipo: "produto" | "foto" | "loja" | "importacao";
}

export const STATUS: Record<StatusProduto, { rotulo: string; cor: string }> = {
  rascunho: { rotulo: "Rascunho", cor: "bg-white text-ameixa ring-ameixa/15" },
  revisao: { rotulo: "Com pendência", cor: "bg-mel text-[#4a2c00] ring-mel" },
  pronto: { rotulo: "Pronto", cor: "bg-salvia text-[#123d27] ring-salvia" },
  publicado: { rotulo: "Publicado", cor: "bg-laranja text-white ring-laranja" },
};

export const CATEGORIAS: Categoria[] = [
  { id: "aromas", nome: "Velas & Aromas", caminho: "Casa e Construção > Decoração > Velas e Aromatizadores", capa: "/img/vela-bokeh.jpg" },
  { id: "mesa", nome: "Mesa & Cozinha", caminho: "Casa e Construção > Cozinha > Canecas e Xícaras", capa: "/img/xicara-azul.jpg" },
  { id: "texteis", nome: "Têxteis", caminho: "Casa e Construção > Cama, Mesa e Banho > Almofadas e Mantas", capa: "/img/almofadas.jpg" },
  { id: "banho", nome: "Banho & Corpo", caminho: "Beleza > Banho e Corpo > Sabonetes", capa: "/img/sabonete-mel.jpg" },
  { id: "cestos", nome: "Cestos & Plantas", caminho: "Casa e Construção > Decoração > Cestos e Vasos", capa: "/img/cestos.jpg" },
];

function f(id: string, nome: string, w: number, h: number, kb: number, tipo: Foto["tipo"], aprovada: boolean, quadrada = false): Foto {
  return { id, src: `/img/${id}.jpg`, nome, w, h, kb, tipo, aprovada, ajuste: { luz: 100, contraste: 100, saturacao: 100, quadrada }, enviadaEm: "2026-10-13 15:20" };
}

export const FOTOS: Foto[] = [
  f("vela-lilas", "Kit velas lilás", 2400, 1350, 812, "produto", true, true),
  f("vela-pote", "Velas em pote", 1500, 2000, 640, "produto", true, true),
  f("vela-pilar", "Vela pilar 3 pavios", 2400, 1350, 455, "produto", false),
  f("vela-bokeh", "Vela acesa - ambiente", 1920, 1920, 150, "ambiente", true, true),
  f("oleos-kit", "Kit óleos essenciais", 3000, 2000, 1210, "produto", true, true),
  f("oleo-alecrim", "Óleo de alecrim", 2600, 1733, 690, "produto", true, true),
  f("difusor", "Difusor ultrassônico", 1500, 2000, 380, "produto", false),
  f("rechaud", "Rechaud verde-petróleo", 2000, 1500, 520, "produto", true, true),
  f("xicara-azul", "Xícara azul poá", 2400, 1878, 488, "produto", true, true),
  f("caneca-vintage", "Caneca vintage", 1800, 1967, 402, "produto", false),
  f("almofadas", "Capas mostarda e verde", 3000, 2000, 905, "produto", true, true),
  f("almofada-floral", "Capa floral vermelha", 2400, 1600, 744, "produto", false),
  f("toalhas", "Toalhas arco-íris", 2200, 1884, 610, "produto", true, true),
  f("manta", "Manta tricô cru", 2400, 1800, 1480, "produto", true, true),
  f("sabonete-mel", "Sabonete mel e aveia", 2400, 2063, 560, "produto", true, true),
  f("sabonete-oliva", "Sabonete de oliva", 2400, 1930, 830, "produto", false),
  f("manteiga", "Manteiga de karité", 2400, 1502, 470, "produto", true, true),
  f("cesto-verde", "Cesto verde", 1600, 2002, 720, "produto", true, true),
  f("cesto-roxo", "Fruteira espiral magenta", 1600, 2011, 690, "produto", true, true),
  f("suculentas", "Vaso de suculentas", 2400, 1600, 540, "produto", true, true),
  f("vaso-rosto", "Vaso rosto", 1500, 2000, 2350, "produto", false),
  f("sala", "Sala - sofá caramelo", 1920, 1282, 252, "ambiente", true),
  f("sala-2", "Sala - almofadas", 1920, 1281, 578, "ambiente", true),
  f("cestos", "Cestos empilhados", 1920, 2908, 1049, "ambiente", true),
  f("artesas", "Ateliê das artesãs", 1920, 1280, 547, "ambiente", true),
];

const D = (n: number) => `Feito em pequenos lotes por artesãs parceiras. ${"Acabamento revisado peça por peça antes do envio, embalagem reforçada com papel kraft e proteção extra para chegar inteiro na sua casa. ".repeat(n)}`;

function p(
  n: number, sku: string, nome: string, categoriaId: string, preco: number, custo: number, estoque: number, pesoG: number,
  dim: [number, number, number], fotos: string[], status: StatusProduto, extra: Partial<Produto> = {},
): Produto {
  return {
    id: `P${String(n).padStart(3, "0")}`, sku, nome, categoriaId, descricao: D(1), preco, precoPromo: null, custo, estoque, pesoG,
    dimensoes: { c: dim[0], l: dim[1], a: dim[2] }, fotos, variacoes: [], status, atualizadoEm: `2026-10-${String(10 + (n % 4)).padStart(2, "0")} 1${n % 9}:${String((n * 7) % 60).padStart(2, "0")}`, ...extra,
  };
}

export const PRODUTOS: Produto[] = [
  p(1, "LUM-VEL-001", "Kit 3 Velas Aromáticas de Soja 140g - Lavanda, Alecrim e Rosa", "aromas", 89.9, 31.5, 42, 620, [18, 12, 8], ["vela-lilas", "vela-bokeh"], "pronto",
    { precoPromo: 79.9, variacoes: [{ nome: "Aroma do kit", opcoes: ["Floral", "Herbal"] }], descricao: "Três velas de cera de soja em copos de vidro reutilizáveis, com pavio de algodão e queima limpa de até 30 horas cada. Fragrâncias suaves de lavanda, alecrim e rosa, pensadas pra quarto, banho e sala. " + D(1) }),
  p(2, "LUM-VEL-002", "Vela de Soja em Pote de Vidro 200g Âmbar e Baunilha", "aromas", 54.9, 17.8, 60, 380, [10, 10, 11], ["vela-pote"], "pronto",
    { variacoes: [{ nome: "Fragrância", opcoes: ["Âmbar e Baunilha", "Capim-limão", "Lenha e Cedro"] }] }),
  p(3, "LUM-VEL-003", "Vela Pilar 3 Pavios Branca 15cm", "aromas", 69.9, 24, 18, 900, [16, 16, 16], ["vela-pilar", "vela-bokeh"], "revisao"),
  p(4, "LUM-ARO-004", "Kit 10 Óleos Essenciais 10ml para Difusor e Aromaterapia", "aromas", 119.9, 46, 25, 410, [22, 6, 8], ["oleos-kit"], "pronto"),
  p(5, "LUM-ARO-005", "Óleo Essencial de Alecrim 30ml com Conta-gotas", "aromas", 39.9, 12.4, 80, 120, [5, 5, 12], ["oleo-alecrim"], "pronto"),
  p(6, "LUM-ARO-006", "Difusor Umidificador Ultrassônico 300ml Luz LED", "aromas", 129.9, 58, 14, 650, [14, 14, 22], ["difusor"], "revisao", { variacoes: [{ nome: "Voltagem", opcoes: ["Bivolt"] }] }),
  p(7, "LUM-ARO-007", "Rechaud Aromatizador de Cerâmica Esmaltada Verde", "aromas", 64.9, 21, 22, 700, [12, 12, 14], ["rechaud"], "pronto"),
  p(8, "LUM-MES-008", "Xícara de Chá Cerâmica Azul Poá 250ml", "mesa", 44.9, 13.5, 36, 340, [14, 11, 8], ["xicara-azul"], "pronto",
    { variacoes: [{ nome: "Quantidade", opcoes: ["1 unidade", "Par", "Jogo com 4"] }] }),
  p(9, "LUM-MES-009", "Caneca Vintage", "mesa", 49.9, 15, 0, 0, [0, 0, 0], ["caneca-vintage"], "rascunho", { descricao: "Caneca de cerâmica." }),
  p(10, "LUM-TEX-010", "Kit 2 Capas de Almofada 45x45 Mostarda e Verde Musgo", "texteis", 79.9, 26, 30, 420, [30, 25, 4], ["almofadas", "sala-2"], "pronto"),
  p(11, "LUM-TEX-011", "Capa de Almofada Jacquard Floral Vermelha 50x50", "texteis", 59.9, 19.9, 12, 300, [30, 25, 3], ["almofada-floral"], "revisao"),
  p(12, "LUM-TEX-012", "Jogo 5 Toalhas de Rosto Arco-Íris 100% Algodão", "texteis", 99.9, 38, 20, 1100, [32, 26, 12], ["toalhas"], "pronto"),
  p(13, "LUM-TEX-013", "Manta de Tricô Fio Grosso 1,20 x 1,50 m Cru", "texteis", 189.9, 82, 8, 1800, [40, 32, 14], ["manta", "sala"], "revisao", { precoPromo: 169.9 }),
  p(14, "LUM-BAN-014", "Sabonete Artesanal Mel e Aveia 110g", "banho", 19.9, 5.2, 150, 130, [8, 6, 3], ["sabonete-mel"], "pronto",
    { variacoes: [{ nome: "Kit", opcoes: ["1 unidade", "3 unidades", "6 unidades"] }] }),
  p(15, "LUM-BAN-015", "Sabonete de Oliva", "banho", 24.9, 8, 90, 210, [9, 7, 4], ["sabonete-oliva"], "rascunho", { descricao: "" }),
  p(16, "LUM-BAN-016", "Manteiga Corporal de Karité 150g sem Perfume", "banho", 59.9, 18, 40, 220, [9, 9, 7], ["manteiga"], "revisao", { custo: 49 }),
  p(17, "LUM-CES-017", "Cesto de Palha Trançado à Mão Verde e Natural 30cm", "cestos", 109.9, 38, 10, 480, [32, 32, 12], ["cesto-verde", "cestos"], "pronto"),
  p(18, "LUM-CES-018", "Fruteira de Palha Espiral Magenta 35cm", "cestos", 94.9, 33, 9, 420, [36, 36, 8], ["cesto-roxo", "cestos"], "pronto"),
  p(19, "LUM-CES-019", "Vaso Cerâmica Branco com Mix de Suculentas", "cestos", 74.9, 27, 15, 1300, [18, 18, 14], ["suculentas"], "rascunho", { estoque: 0 }),
  p(20, "LUM-CES-020", "Vaso Rosto", "cestos", 84.9, 29, 6, 900, [14, 14, 20], ["vaso-rosto"], "rascunho", { descricao: "Vaso de cerâmica em formato de rosto." }),
];

export const LOJA: Loja = {
  nome: "Luma Casa & Aromas",
  usuario: "lumacasa",
  descricao: "Casa com cheiro de casa. Velas de soja, óleos essenciais, têxteis e cestos feitos à mão por artesãs brasileiras, enviados com cuidado pra todo o Brasil.",
  logo: "/img/vela-pote.jpg",
  whatsapp: "",
  logistica: { shopeeXpress: true, correios: false, coleta: true, cep: "04538-132", prazoPostagem: 2 },
  pagamento: { tipo: "CNPJ", documento: "54.218.903/0001-07", titular: "Luma Casa Comércio de Decoração LTDA", banco: "", agencia: "", conta: "" },
  vitrine: { banner: "sala", slogan: "Casa com cheiro de casa", destaques: ["P001", "P010", "P017", "P004"], colecoes: ["aromas", "texteis", "cestos"], publicada: false },
  taxas: { comissao: 14, freteGratis: 6, tarifaFixa: 4, tetoComissao: 100 },
  lancada: false,
  abertura: "2026-10-28",
};

export const ATIVIDADES: Atividade[] = [
  { id: "A6", quando: "2026-10-14 09:42", texto: "12 fotos recortadas em 1:1 e aprovadas no estúdio", tipo: "foto" },
  { id: "A5", quando: "2026-10-13 18:10", texto: "Planilha de 20 produtos importada (3 com erros corrigidos)", tipo: "importacao" },
  { id: "A4", quando: "2026-10-13 16:05", texto: "Kit 3 Velas Aromáticas marcado como pronto", tipo: "produto" },
  { id: "A3", quando: "2026-10-13 11:30", texto: "Shopee Xpress e coleta ativados no CEP 04538-132", tipo: "loja" },
  { id: "A2", quando: "2026-10-12 17:48", texto: "Perfil da loja criado: @lumacasa", tipo: "loja" },
];

export const BANNERS = ["sala", "sala-2", "vela-bokeh", "cestos", "artesas"];
