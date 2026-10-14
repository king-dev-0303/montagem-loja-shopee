"use client";

import { useSyncExternalStore } from "react";
import { ATIVIDADES, FOTOS, LOJA, PRODUTOS, type Atividade, type Foto, type Loja, type Produto, type StatusProduto } from "@/lib/data";

// Estado da demo: memória + localStorage, pra que o que a cliente edita continue lá ao recarregar.
// Na versão real, cada ação vira uma chamada à API da Shopee (product.add_item, media_space.upload_image...).
export interface Estado {
  produtos: Produto[];
  fotos: Foto[];
  loja: Loja;
  atividades: Atividade[];
}

const CLAVE = "vitrine-pronta-v1";
const SEMILLA: Estado = { produtos: PRODUTOS, fotos: FOTOS, loja: LOJA, atividades: ATIVIDADES };
let estado = SEMILLA;
let cargado = false;
const oyentes = new Set<() => void>();

function leer(): Estado {
  if (!cargado) {
    cargado = true;
    try {
      const crudo = window.localStorage.getItem(CLAVE);
      if (crudo) estado = { ...SEMILLA, ...(JSON.parse(crudo) as Estado) };
    } catch {}
  }
  return estado;
}

function fijar(fn: (e: Estado) => Estado) {
  estado = fn(leer());
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify({ ...estado, fotos: estado.fotos.filter((x) => !x.src.startsWith("blob:")) }));
  } catch {}
  oyentes.forEach((f) => f());
}

const suscribir = (f: () => void) => {
  oyentes.add(f);
  return () => void oyentes.delete(f);
};

export function useStore(): Estado {
  return useSyncExternalStore(suscribir, leer, () => SEMILLA);
}

const agora = () => {
  const d = new Date();
  const z = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`;
};

function registrar(e: Estado, texto: string, tipo: Atividade["tipo"]): Atividade[] {
  return [{ id: `A${Date.now()}${Math.round(Math.random() * 99)}`, quando: agora(), texto, tipo }, ...e.atividades].slice(0, 30);
}

export type Rascunho = Omit<Produto, "id" | "atualizadoEm"> & { id?: string };

export const acoes = {
  salvarProduto(r: Rascunho): Produto {
    let salvo!: Produto;
    fijar((e) => {
      if (r.id && e.produtos.some((x) => x.id === r.id)) {
        salvo = { ...(r as Produto), atualizadoEm: agora() };
        return { ...e, produtos: e.produtos.map((x) => (x.id === r.id ? salvo : x)), atividades: registrar(e, `${salvo.nome.slice(0, 48)} atualizado`, "produto") };
      }
      const n = Math.max(0, ...e.produtos.map((x) => Number(x.id.slice(1)))) + 1;
      salvo = { ...r, id: `P${String(n).padStart(3, "0")}`, atualizadoEm: agora() };
      return { ...e, produtos: [salvo, ...e.produtos], atividades: registrar(e, `Novo produto: ${salvo.nome.slice(0, 48)}`, "produto") };
    });
    return salvo;
  },
  excluirProduto(id: string) {
    fijar((e) => {
      const p = e.produtos.find((x) => x.id === id);
      return { ...e, produtos: e.produtos.filter((x) => x.id !== id), loja: { ...e.loja, vitrine: { ...e.loja.vitrine, destaques: e.loja.vitrine.destaques.filter((d) => d !== id) } }, atividades: registrar(e, `${p?.nome.slice(0, 48)} excluído`, "produto") };
    });
  },
  mudarStatus(ids: string[], status: StatusProduto) {
    fijar((e) => ({
      ...e,
      produtos: e.produtos.map((x) => (ids.includes(x.id) ? { ...x, status, atualizadoEm: agora() } : x)),
      atividades: registrar(e, `${ids.length} produto(s) ${status === "publicado" ? "publicados na Shopee" : `movidos para "${status}"`}`, "produto"),
    }));
  },
  importar(novos: Rascunho[]) {
    fijar((e) => {
      let n = Math.max(0, ...e.produtos.map((x) => Number(x.id.slice(1))));
      const criados = novos.map((r) => ({ ...r, id: `P${String(++n).padStart(3, "0")}`, atualizadoEm: agora() }));
      return { ...e, produtos: [...criados, ...e.produtos], atividades: registrar(e, `Planilha importada: ${criados.length} produto(s) como rascunho`, "importacao") };
    });
  },
  salvarFoto(f: Foto) {
    fijar((e) => ({ ...e, fotos: e.fotos.map((x) => (x.id === f.id ? f : x)), atividades: registrar(e, `Foto "${f.nome}" ${f.aprovada ? "aprovada" : "ajustada"} no estúdio`, "foto") }));
  },
  enviarFotos(fs: Foto[]) {
    fijar((e) => ({ ...e, fotos: [...fs, ...e.fotos], atividades: registrar(e, `${fs.length} foto(s) enviada(s) ao estúdio`, "foto") }));
  },
  excluirFoto(id: string) {
    fijar((e) => ({ ...e, fotos: e.fotos.filter((x) => x.id !== id), produtos: e.produtos.map((p) => ({ ...p, fotos: p.fotos.filter((x) => x !== id) })) }));
  },
  salvarLoja(parcial: Partial<Loja>, texto: string) {
    fijar((e) => ({ ...e, loja: { ...e.loja, ...parcial }, atividades: registrar(e, texto, "loja") }));
  },
  restaurar() {
    fijar(() => SEMILLA);
  },
};

export const fotoPorId = (fotos: Foto[], id?: string) => fotos.find((x) => x.id === id);

/** Verdadeiro depois da montagem: formulários só leem o estado salvo no navegador a partir daí. */
const nada = () => () => {};
export function useHidratado() {
  return useSyncExternalStore(nada, () => true, () => false);
}
