"use client";

import { useParams } from "next/navigation";
import { Editor } from "@/components/editor";

export default function ProdutoPage() {
  const { id } = useParams<{ id: string }>();
  return <Editor id={id} />;
}
