import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";

export function SignInButtons() {
  return (
    <div className="flex flex-col gap-3">
      <form
        action={async () => {
          "use server";
          await signIn("github", { redirectTo: "/" });
        }}
      >
        <Button type="submit" className="w-full">
          Sign in with GitHub
        </Button>
      </form>
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/" });
        }}
      >
        <Button type="submit" variant="outline" className="w-full">
          Sign in with Google
        </Button>
      </form>
    </div>
  );
}

export { SignInButtons as SignInButton };
