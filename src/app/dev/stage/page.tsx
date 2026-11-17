import { notFound } from "next/navigation";
import StageBench from "./StageBench";

export const metadata = { title: "Stage (dev)" };
// bancada de teste do núcleo 3D: só em desenvolvimento (em produção, 404)
export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <StageBench />;
}
