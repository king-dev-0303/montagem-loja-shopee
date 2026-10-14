import { Suspense } from "react";
import { Estudio } from "@/components/estudio";
import { Skeleton } from "@/components/kit";

export default function FotosPage() {
  return (
    <Suspense fallback={<div className="grid gap-3 sm:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-64" />)}</div>}>
      <Estudio />
    </Suspense>
  );
}
