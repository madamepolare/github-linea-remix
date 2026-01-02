import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Upload, X, Image, FileText, Loader2 } from "lucide-react";

interface FileUploadProps {
  bucket: string;
  folder: string;
  onUpload: (urls: string[]) => void;
  existingUrls?: string[];
  onRemove?: (url: string) => void;
  accept?: string;
  maxFiles?: number;
  className?: string;
}

export function FileUpload({
  bucket,
  folder,
  onUpload,
  existingUrls = [],
  onRemove,
  accept = "image/*,application/pdf",
  maxFiles = 5,
  className,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = maxFiles - existingUrls.length;
    if (files.length > remainingSlots) {
      toast.error(`Maximum ${maxFiles} fichiers autorisés`);
      return;
    }

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
      }

      onUpload(uploadedUrls);
      toast.success(`${uploadedUrls.length} fichier(s) ajouté(s)`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Existing files */}
      {existingUrls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {existingUrls.map((url, idx) => (
            <div
              key={idx}
              className="relative group w-16 h-16 rounded-md border overflow-hidden bg-muted"
            >
              {isImage(url) ? (
                <img
                  src={url}
                  alt={`File ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(url)}
                  className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {existingUrls.length < maxFiles && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                Upload...
              </>
            ) : (
              <>
                <Image className="h-3.5 w-3.5 mr-1" />
                Photo
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
