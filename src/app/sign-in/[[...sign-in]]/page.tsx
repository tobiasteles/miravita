import AuthForm from "@/components/AuthForm";
import { login } from "@/actions/auth";
export default async function P({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  return <AuthForm mode="in" action={login} error={error} next={next} />;
}
