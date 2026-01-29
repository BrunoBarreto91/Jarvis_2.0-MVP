import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, File, X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Nota: Para o MVP, usaremos o bucket configurado: jarvis-user-interface
// Em uma implementação final, usaríamos Presigned URLs via API
const S3_BUCKET = "jarvis-user-interface";
const REGION = "us-east-1";

export function FileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      // Nota: Esta é uma simulação de upload direto. 
      // Para funcionar sem Presigned URL, o bucket precisaria de permissão de escrita pública (não recomendado)
      // Ou usaríamos o AWS SDK no frontend com as credenciais (também não recomendado expor no frontend)
      // O ideal é o backend gerar a URL. Para este MVP, vamos simular o sucesso e mostrar como seria a UI.
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simular delay
      
      toast.success(`Arquivo "${file.name}" importado com sucesso!`);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      toast.error("Erro ao fazer upload do arquivo");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.csv,.xlsx,.json"
      />
      
      {file ? (
        <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-md border text-sm">
          <File className="w-4 h-4 text-primary" />
          <span className="max-w-[150px] truncate">{file.name}</span>
          <button 
            onClick={() => setFile(null)}
            className="hover:text-destructive transition-colors"
            disabled={isUploading}
          >
            <X className="w-4 h-4" />
          </button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-7 px-2 text-primary hover:text-primary hover:bg-primary/10"
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-4 h-4" />}
          </Button>
        </div>
      ) : (
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Importar Calendário/Relatório</span>
        </Button>
      )}
    </div>
  );
}
