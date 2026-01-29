import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

// Nota: Em um ambiente real, usaríamos a biblioteca 'amazon-cognito-identity-js' ou 'aws-amplify'
// Mas para manter leve e direto no MVP, podemos usar a API do Cognito via fetch
const COGNITO_REGION = "us-east-1";
const CLIENT_ID = "4lq4qmusum75oqfjm0v9n272cg";

export default function Login() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }

    setIsLoading(true);
    try {
      // Chamada direta para a API do Cognito (InitiateAuth)
      const response = await fetch(`https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-amz-json-1.1",
          "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
        },
        body: JSON.stringify({
          AuthFlow: "USER_PASSWORD_AUTH",
          ClientId: CLIENT_ID,
          AuthParameters: {
            USERNAME: email,
            PASSWORD: password,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Falha na autenticação");
      }

      // Salvar tokens (simples para o MVP, idealmente usar cookies seguros ou context)
      localStorage.setItem("jarvis_access_token", data.AuthenticationResult.AccessToken);
      localStorage.setItem("jarvis_id_token", data.AuthenticationResult.IdToken);
      localStorage.setItem("jarvis_refresh_token", data.AuthenticationResult.RefreshToken);
      
      // Salvar dados básicos do usuário
      localStorage.setItem("jarvis_user", JSON.stringify({
        email: email,
        name: "Bruno Barreto", // No futuro, extrair do ID Token
      }));

      toast.success("Login realizado com sucesso!");
      setLocation("/");
      window.location.reload(); // Recarregar para atualizar o estado do Auth
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Erro ao realizar login. Verifique suas credenciais.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-lg border-primary/10">
        <CardHeader className="space-y-4 flex flex-col items-center">
          <img src={APP_LOGO} alt={APP_TITLE} className="h-16 w-16 rounded-xl object-cover" />
          <div className="text-center">
            <CardTitle className="text-2xl font-bold">{APP_TITLE}</CardTitle>
            <CardDescription>Acesse sua conta para gerenciar suas tarefas</CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="seu@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Entrar
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Acesso restrito ao projeto Jarvis 2.0 MVP
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
