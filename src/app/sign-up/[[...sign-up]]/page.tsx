import AuthForm from "@/components/AuthForm";
import { register } from "@/actions/auth";
export default async function P({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  return <AuthForm mode="up" action={register} error={error} next={next} />;
}
