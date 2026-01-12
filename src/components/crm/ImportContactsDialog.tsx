import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Sparkles,
  Building2,
  User,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useContacts } from "@/hooks/useContacts";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface ParsedCompany {
  temp_id: string;
  name: string;
  industry?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  selected?: boolean;
}

interface ParsedContact {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  role?: string;
  gender?: "male" | "female" | "other";
  company_temp_id?: string;
  notes?: string;
  selected?: boolean;
}

interface ImportContactsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "upload" | "analyzing" | "review" | "importing" | "done";

export function ImportContactsDialog({ open, onOpenChange }: ImportContactsDialogProps) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [companies, setCompanies] = useState<ParsedCompany[]>([]);
  const [contacts, setContacts] = useState<ParsedContact[]>([]);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [importStatusText, setImportStatusText] = useState("");

  const { createContact } = useContacts();
  const { createCompany } = useCRMCompanies();
  const { toast } = useToast();

  const resetState = useCallback(() => {
    setStep("upload");
    setFile(null);
    setCompanies([]);
    setContacts([]);
    setSummary("");
    setError(null);
    setImportProgress(0);
    setAnalyzeProgress(0);
    setImportStatusText("");
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onOpenChange(false);
  }, [resetState, onOpenChange]);

  const readFileContent = async (file: File): Promise<string> => {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    // Handle XLSX/XLS files
    if (
      fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      fileType === "application/vnd.ms-excel" ||
      fileName.endsWith(".xlsx") ||
      fileName.endsWith(".xls")
    ) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            
            let content = "";
            workbook.SheetNames.forEach((sheetName) => {
              const sheet = workbook.Sheets[sheetName];
              const csv = XLSX.utils.sheet_to_csv(sheet);
              content += `=== Feuille: ${sheetName} ===\n${csv}\n\n`;
            });
            
            resolve(content);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
    }

    // Handle PDF - read as base64 and send for parsing
    if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          // For PDF, we'll send a note that it's a PDF and let the backend handle it
          // In a real implementation, you'd use a PDF parsing library
          const base64 = (e.target?.result as string).split(",")[1];
          resolve(`[PDF FILE - Base64 encoded]\nNom du fichier: ${file.name}\nTaille: ${file.size} bytes\n\nNote: Le contenu PDF nécessite un parsing spécial. Veuillez utiliser un fichier XLSX pour de meilleurs résultats.`);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    // Handle text/CSV files - try UTF-16 first (Excel exports), then UTF-8
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const bytes = new Uint8Array(arrayBuffer);
        
        // Check for UTF-16 BOM (little-endian: FF FE, big-endian: FE FF)
        const isUtf16LE = bytes[0] === 0xFF && bytes[1] === 0xFE;
        const isUtf16BE = bytes[0] === 0xFE && bytes[1] === 0xFF;
        
        let text: string;
        
        if (isUtf16LE || isUtf16BE) {
          // Decode as UTF-16
          const decoder = new TextDecoder(isUtf16LE ? "utf-16le" : "utf-16be");
          text = decoder.decode(arrayBuffer);
        } else {
          // Try UTF-8
          const decoder = new TextDecoder("utf-8");
          text = decoder.decode(arrayBuffer);
        }
        
        // Normalize line endings and convert tabs to semicolons for consistency
        text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        
        // If the file uses tabs as separator, convert to semicolons
        // Only do this if there are more tabs than commas/semicolons per line
        const firstLine = text.split("\n")[0] || "";
        const tabCount = (firstLine.match(/\t/g) || []).length;
        const commaCount = (firstLine.match(/,/g) || []).length;
        const semicolonCount = (firstLine.match(/;/g) || []).length;
        
        if (tabCount > Math.max(commaCount, semicolonCount)) {
          // Tab-separated file - convert tabs to semicolons
          text = text.split("\n").map(line => line.replace(/\t/g, ";")).join("\n");
        }
        
        resolve(text);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setStep("analyzing");
    setAnalyzeProgress(0);

    // Simulate progress during analysis
    const progressInterval = setInterval(() => {
      setAnalyzeProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      const content = await readFileContent(selectedFile);
      setAnalyzeProgress(30);
      
      const { data, error: fnError } = await supabase.functions.invoke("parse-contacts-import", {
        body: {
          fileContent: content,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
        },
      });

      clearInterval(progressInterval);

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      setAnalyzeProgress(100);
      
      // Small delay to show 100% before switching
      await new Promise((resolve) => setTimeout(resolve, 300));

      setCompanies((data.companies || []).map((c: ParsedCompany) => ({ ...c, selected: true })));
      setContacts((data.contacts || []).map((c: ParsedContact) => ({ ...c, selected: true })));
      setSummary(data.summary || "");
      setStep("review");
    } catch (err) {
      clearInterval(progressInterval);
      console.error("Error parsing file:", err);
      const msg = err instanceof Error ? err.message : "Erreur lors de l'analyse du fichier";
      const friendly =
        msg.toLowerCase().includes("failed to fetch") ||
        msg.toLowerCase().includes("load failed") ||
        msg.toLowerCase().includes("network")
          ? "La requête a expiré (fichier volumineux). Réessayez : l'import est maintenant découpé en moins de lots, sinon importez par fichiers plus petits."
          : msg;
      setError(friendly);
      setStep("upload");
    }
  };

  const toggleCompany = (tempId: string) => {
    setCompanies((prev) =>
      prev.map((c) => (c.temp_id === tempId ? { ...c, selected: !c.selected } : c))
    );
  };

  const toggleContact = (index: number) => {
    setContacts((prev) =>
      prev.map((c, i) => (i === index ? { ...c, selected: !c.selected } : c))
    );
  };

  const selectAll = () => {
    setCompanies((prev) => prev.map((c) => ({ ...c, selected: true })));
    setContacts((prev) => prev.map((c) => ({ ...c, selected: true })));
  };

  const deselectAll = () => {
    setCompanies((prev) => prev.map((c) => ({ ...c, selected: false })));
    setContacts((prev) => prev.map((c) => ({ ...c, selected: false })));
  };

  const handleImport = async () => {
    setStep("importing");
    setImportProgress(0);
    setImportStatusText("");

    const selectedCompanies = companies.filter((c) => c.selected);
    const selectedContacts = contacts.filter((c) => c.selected);
    const total = selectedCompanies.length + selectedContacts.length;
    let processed = 0;
    let successCompanies = 0;
    let successContacts = 0;

    try {
      // Create a map of temp_id to real company ID
      const companyIdMap = new Map<string, string>();

      // First, create companies
      for (const company of selectedCompanies) {
        setImportStatusText(`Création entreprise: ${company.name}`);
        try {
          const result = await createCompany.mutateAsync({
            name: company.name,
            industry: company.industry,
            email: company.email,
            phone: company.phone,
            website: company.website,
            address: company.address,
            city: company.city,
            postal_code: company.postal_code,
          });
          companyIdMap.set(company.temp_id, result.id);
          successCompanies++;
        } catch (err) {
          console.error("Error creating company:", company.name, err);
        }
        processed++;
        setImportProgress(Math.round((processed / total) * 100));
      }

      // Then, create contacts with company links
      for (const contact of selectedContacts) {
        setImportStatusText(`Création contact: ${contact.first_name} ${contact.last_name}`);
        try {
          const companyId = contact.company_temp_id
            ? companyIdMap.get(contact.company_temp_id)
            : undefined;

          await createContact.mutateAsync({
            name: `${contact.first_name} ${contact.last_name}`.trim(),
            first_name: contact.first_name,
            last_name: contact.last_name,
            email: contact.email,
            phone: contact.phone,
            role: contact.role,
            gender: contact.gender,
            crm_company_id: companyId,
            notes: contact.notes,
          });
          successContacts++;
        } catch (err) {
          console.error("Error creating contact:", contact.first_name, contact.last_name, err);
        }
        processed++;
        setImportProgress(Math.round((processed / total) * 100));
      }

      setImportStatusText("Import terminé !");
      setStep("done");
      toast({
        title: "Import terminé",
        description: `${successCompanies} entreprise(s) et ${successContacts} contact(s) importé(s)`,
      });
    } catch (err) {
      console.error("Import error:", err);
      setError("Erreur lors de l'import");
      setStep("review");
    }
  };

  const selectedCompaniesCount = companies.filter((c) => c.selected).length;
  const selectedContactsCount = contacts.filter((c) => c.selected).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Import intelligent de contacts
          </DialogTitle>
          <DialogDescription>
            Importez des contacts depuis un fichier Excel ou PDF. L'IA analysera et extraira automatiquement les informations.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Upload Step */}
          {step === "upload" && (
            <div className="py-8">
              <label
                htmlFor="file-upload"
                className={cn(
                  "flex flex-col items-center justify-center gap-4 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors",
                  "hover:border-primary/50 hover:bg-primary/5"
                )}
              >
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Glissez un fichier ou cliquez pour sélectionner</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Formats supportés: XLSX, XLS, CSV, PDF
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <FileSpreadsheet className="h-3 w-3" />
                    Excel
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <FileText className="h-3 w-3" />
                    PDF
                  </Badge>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls,.csv,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {error && (
                <div className="mt-4 p-4 rounded-lg bg-destructive/10 text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Analyzing Step */}
          {step === "analyzing" && (
            <div className="py-12 flex flex-col items-center gap-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-medium">Analyse en cours...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  L'IA extrait tous les contacts et entreprises de votre fichier
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Les fichiers volumineux sont traités par lots pour extraire tous les contacts
                </p>
              </div>
              <div className="w-full max-w-sm space-y-2">
                <Progress value={analyzeProgress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  {Math.round(analyzeProgress)}% - Extraction des données...
                </p>
              </div>
              {file && (
                <Badge variant="outline" className="gap-1.5">
                  <FileSpreadsheet className="h-3 w-3" />
                  {file.name}
                </Badge>
              )}
            </div>
          )}

          {/* Review Step */}
          {step === "review" && (
            <div className="space-y-4">
              {summary && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm">{summary}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Building2 className="h-3 w-3" />
                    {selectedCompaniesCount}/{companies.length} entreprises
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <User className="h-3 w-3" />
                    {selectedContactsCount}/{contacts.length} contacts
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAll}>
                    Tout sélectionner
                  </Button>
                  <Button variant="ghost" size="sm" onClick={deselectAll}>
                    Tout désélectionner
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[350px] pr-4">
                <div className="space-y-4">
                  {/* Companies */}
                  {companies.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-1.5">
                        <Building2 className="h-4 w-4" />
                        Entreprises ({companies.length})
                      </h4>
                      <div className="space-y-2">
                        {companies.map((company) => (
                          <div
                            key={company.temp_id}
                            className={cn(
                              "p-3 rounded-lg border transition-colors cursor-pointer",
                              company.selected
                                ? "bg-primary/5 border-primary/30"
                                : "bg-muted/30 border-border opacity-60"
                            )}
                            onClick={() => toggleCompany(company.temp_id)}
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox checked={company.selected} className="mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium">{company.name}</p>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                                  {company.industry && <span>{company.industry}</span>}
                                  {company.email && <span>{company.email}</span>}
                                  {company.phone && <span>{company.phone}</span>}
                                  {company.city && <span>{company.city}</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contacts */}
                  {contacts.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-1.5">
                        <User className="h-4 w-4" />
                        Contacts ({contacts.length})
                      </h4>
                      <div className="space-y-2">
                        {contacts.map((contact, index) => {
                          const linkedCompany = companies.find(
                            (c) => c.temp_id === contact.company_temp_id
                          );
                          return (
                            <div
                              key={index}
                              className={cn(
                                "p-3 rounded-lg border transition-colors cursor-pointer",
                                contact.selected
                                  ? "bg-primary/5 border-primary/30"
                                  : "bg-muted/30 border-border opacity-60"
                              )}
                              onClick={() => toggleContact(index)}
                            >
                              <div className="flex items-start gap-3">
                                <Checkbox checked={contact.selected} className="mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium">
                                    {contact.first_name} {contact.last_name}
                                  </p>
                                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                                    {contact.role && <span>{contact.role}</span>}
                                    {contact.email && <span>{contact.email}</span>}
                                    {contact.phone && <span>{contact.phone}</span>}
                                    {linkedCompany && (
                                      <span className="flex items-center gap-1">
                                        <Building2 className="h-3 w-3" />
                                        {linkedCompany.name}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Importing Step */}
          {step === "importing" && (
            <div className="py-12 flex flex-col items-center gap-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-medium">Import en cours...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Création des contacts et entreprises
                </p>
              </div>
              <div className="w-full max-w-sm space-y-2">
                <Progress value={importProgress} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="truncate max-w-[200px]">{importStatusText}</span>
                  <span className="font-medium">{importProgress}%</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="gap-1">
                  <Building2 className="h-3 w-3" />
                  {companies.filter((c) => c.selected).length} entreprises
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <User className="h-3 w-3" />
                  {contacts.filter((c) => c.selected).length} contacts
                </Badge>
              </div>
            </div>
          )}

          {/* Done Step */}
          {step === "done" && (
            <div className="py-12 flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <div className="text-center">
                <p className="font-medium">Import terminé !</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedCompaniesCount} entreprise(s) et {selectedContactsCount} contact(s) ont été créés
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === "review" && (
            <>
              <Button variant="outline" onClick={resetState}>
                Recommencer
              </Button>
              <Button
                onClick={handleImport}
                disabled={selectedCompaniesCount === 0 && selectedContactsCount === 0}
              >
                Importer {selectedCompaniesCount + selectedContactsCount} élément(s)
              </Button>
            </>
          )}
          {step === "done" && (
            <Button onClick={handleClose}>Fermer</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
