import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Lock, Loader2 } from "lucide-react";
import { useAuth } from "react-oidc-context"; //

export default function Login() {
  const auth = useAuth(); // Hook de autenticação moderno

  // Se estiver carregando o estado de login (ex: processando o retorno da AWS)
  if (auth.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Autenticando no Jarvis...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-lg border-primary/10">
        <CardHeader className="space-y-4 flex flex-col items-center">
          <img src={APP_LOGO} alt={APP_TITLE} className="h-16 w-16 rounded-xl object-cover" />
          <div className="text-center">
            <CardTitle className="text-2xl font-bold">{APP_TITLE}</CardTitle>
            <CardDescription>Acesse o portal seguro para gerenciar suas tarefas</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-center text-muted-foreground">
            Você será redirecionado para o ambiente de autenticação da AWS Cognito.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            onClick={() => auth.signinRedirect()} // Dispara o fluxo OIDC
            className="w-full py-6 text-lg"
          >
            <Lock className="mr-2 h-5 w-5" />
            Entrar com Portal Jarvis
          </Button>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Acesso restrito ao projeto Jarvis 2.0 MVP
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}