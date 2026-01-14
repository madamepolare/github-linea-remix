import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ExternalLink,
  Download,
  Edit,
  Save,
  X,
  Lock,
  Calendar,
  User,
  FileText,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Copy,
  Check,
  Key,
} from "lucide-react";
import { ProjectElement, UpdateElementData } from "@/hooks/useProjectElements";
import {
  ElementVisibility,
  ELEMENT_TYPE_CONFIG,
  ELEMENT_CATEGORIES,
  VISIBILITY_CONFIG,
  getElementTypeColor,
} from "@/lib/elementTypes";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { useWorkspaceProfiles } from "@/hooks/useWorkspaceProfiles";

interface ElementDetailSheetProps {
  element: ProjectElement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (data: UpdateElementData) => Promise<void>;
  canEdit: boolean;
}

export function ElementDetailSheet({
  element,
  open,
  onOpenChange,
  onUpdate,
  canEdit,
}: ElementDetailSheetProps) {
  const { isAtLeast } = usePermissions();
  const { data: profiles = [] } = useWorkspaceProfiles();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<ProjectElement>>({});
  const [tagInput, setTagInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!element) return null;

  const typeConfig = ELEMENT_TYPE_CONFIG[element.element_type];
  const TypeIcon = typeConfig.icon;
  const createdByProfile = profiles.find((p) => p.user_id === element.created_by);

  const handleEdit = () => {
    setEditData({
      title: element.title,
      description: element.description,
      url: element.url,
      category: element.category,
      visibility: element.visibility,
      tags: element.tags || [],
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    await onUpdate({
      id: element.id,
      ...editData,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({});
    setIsEditing(false);
  };

  const addTag = () => {
    if (tagInput.trim() && !editData.tags?.includes(tagInput.trim())) {
      setEditData({
        ...editData,
        tags: [...(editData.tags || []), tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setEditData({
      ...editData,
      tags: editData.tags?.filter((t) => t !== tag),
    });
  };

  const handleOpen = () => {
    if (element.element_type === "link" && element.url) {
      window.open(element.url, "_blank");
    } else if (element.file_url) {
      window.open(element.file_url, "_blank");
    }
  };

  const handleDownload = () => {
    if (element.file_url) {
      const link = document.createElement("a");
      link.href = element.file_url;
      link.download = element.file_name || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const isImage = element.file_type?.startsWith("image/");
  const isPdf = element.file_type === "application/pdf";
  const isCredential = element.element_type === "credential";
  const credential = element.credential_data;

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                getElementTypeColor(element.element_type)
              )}
            >
              <TypeIcon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <SheetTitle className="flex items-center gap-2">
                {isEditing ? (
                  <Input
                    value={editData.title || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, title: e.target.value })
                    }
                    className="font-semibold"
                  />
                ) : (
                  <>
                    {element.title}
                    {element.visibility !== "all" && (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </>
                )}
              </SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {typeConfig.label}
                </Badge>
                {element.is_pinned && (
                  <Badge variant="default" className="text-xs">
                    Épinglé
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Preview */}
          {element.file_url && (
            <div className="rounded-lg border overflow-hidden">
              {isImage ? (
                <img
                  src={element.file_url}
                  alt={element.title}
                  className="w-full max-h-64 object-contain bg-muted"
                />
              ) : isPdf ? (
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {element.file_name}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={handleOpen}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ouvrir le PDF
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-muted flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{element.file_name}</p>
                      {element.file_size && (
                        <p className="text-xs text-muted-foreground">
                          {(element.file_size / 1024).toFixed(1)} Ko
                        </p>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {(element.element_type === "link" || element.file_url) && (
              <Button variant="outline" className="flex-1" onClick={handleOpen}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Ouvrir
              </Button>
            )}
            {element.file_url && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
            )}
            {canEdit && !isEditing && (
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            )}
          </div>

          {/* Credential display */}
          {isCredential && credential && (
            <div className="space-y-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Key className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-sm">Informations d'accès</span>
                {element.is_sensitive && (
                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/30">
                    <Lock className="h-3 w-3 mr-1" />
                    Sensible
                  </Badge>
                )}
              </div>

              {credential.service && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Service</Label>
                  <p className="text-sm font-medium">{credential.service}</p>
                </div>
              )}

              {credential.username && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Identifiant</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-2 py-1 rounded bg-background text-sm font-mono">
                      {credential.username}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(credential.username!, "username")}
                    >
                      {copiedField === "username" ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {credential.password && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Mot de passe</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-2 py-1 rounded bg-background text-sm font-mono">
                      {showPassword ? credential.password : "••••••••••••"}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(credential.password!, "password")}
                    >
                      {copiedField === "password" ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {credential.notes && (
                <div className="space-y-1 pt-2 border-t border-amber-500/20">
                  <Label className="text-xs text-muted-foreground">Notes</Label>
                  <p className="text-sm text-muted-foreground">{credential.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* URL for links */}
          {element.element_type === "link" && element.url && (
            <div className="space-y-2">
              <Label>URL</Label>
              {isEditing ? (
                <Input
                  value={editData.url || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, url: e.target.value })
                  }
                />
              ) : (
                <a
                  href={element.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline break-all"
                >
                  {element.url}
                </a>
              )}
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            {isEditing ? (
              <Textarea
                value={editData.description || ""}
                onChange={(e) =>
                  setEditData({ ...editData, description: e.target.value })
                }
                rows={4}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {element.description || "Aucune description"}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Catégorie</Label>
            {isEditing ? (
              <Select
                value={editData.category || ""}
                onValueChange={(v) => setEditData({ ...editData, category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {ELEMENT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm">
                {ELEMENT_CATEGORIES.find((c) => c.value === element.category)
                  ?.label || "Non définie"}
              </p>
            )}
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label>Visibilité</Label>
            {isEditing ? (
              <Select
                value={editData.visibility || "all"}
                onValueChange={(v) =>
                  setEditData({ ...editData, visibility: v as ElementVisibility })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {VISIBILITY_CONFIG.all.label}
                  </SelectItem>
                  {isAtLeast("admin") && (
                    <SelectItem value="admin">
                      {VISIBILITY_CONFIG.admin.label}
                    </SelectItem>
                  )}
                  {isAtLeast("owner") && (
                    <SelectItem value="owner">
                      {VISIBILITY_CONFIG.owner.label}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2">
                {element.visibility !== "all" && (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm">
                  {VISIBILITY_CONFIG[element.visibility].label}
                </span>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            {isEditing ? (
              <>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Ajouter un tag..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    Ajouter
                  </Button>
                </div>
                {editData.tags && editData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {editData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-wrap gap-1">
                {element.tags && element.tags.length > 0 ? (
                  element.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Aucun tag
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>
                Créé par{" "}
                {createdByProfile?.full_name || "Utilisateur inconnu"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(element.created_at), "d MMMM yyyy à HH:mm", {
                  locale: fr,
                })}
              </span>
            </div>
            {element.updated_at !== element.created_at && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Edit className="h-4 w-4" />
                <span>
                  Modifié le{" "}
                  {format(new Date(element.updated_at), "d MMMM yyyy à HH:mm", {
                    locale: fr,
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Edit actions */}
          {isEditing && (
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
