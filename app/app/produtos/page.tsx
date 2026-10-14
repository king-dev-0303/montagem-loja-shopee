import { Suspense } from "react";
import { Catalogo } from "@/components/catalogo";
import { Skeleton } from "@/components/kit";

export default function ProdutosPage() {
  return (
    <Suspense fallback={<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-80" />)}</div>}>
      <Catalogo />
    </Suspense>
  );
}
