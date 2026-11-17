import { notFound } from "next/navigation";
import Demo from "./Demo";

export const metadata = { title: "Styleguide (dev)" };

// só existe em desenvolvimento; em produção responde 404
export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Demo />;
}
