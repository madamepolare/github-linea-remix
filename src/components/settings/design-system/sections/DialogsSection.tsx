import { useState } from "react";
import { ComponentShowcase } from "../ComponentShowcase";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DialogsSection() {
  return (
    <div className="space-y-6">
      <ComponentShowcase
        name="Dialog"
        description="Modal de dialogue standard"
        filePath="src/components/ui/dialog.tsx"
        importStatement='import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"'
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button>Ouvrir Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Titre du Dialog</DialogTitle>
              <DialogDescription>
                Description du dialog avec des informations importantes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input placeholder="Entrez votre nom" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline">Annuler</Button>
              <Button>Confirmer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ComponentShowcase>

      <ComponentShowcase
        name="AlertDialog"
        description="Dialog de confirmation/alerte"
        filePath="src/components/ui/alert-dialog.tsx"
        importStatement='import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"'
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Supprimer</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Cela supprimera définitivement
                vos données de nos serveurs.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </ComponentShowcase>

      <ComponentShowcase
        name="Sheet"
        description="Panneau latéral coulissant"
        filePath="src/components/ui/sheet.tsx"
        importStatement='import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"'
      >
        <div className="flex gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Sheet Droite</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Panneau latéral</SheetTitle>
                <SheetDescription>
                  Contenu du panneau latéral avec plus de détails.
                </SheetDescription>
              </SheetHeader>
              <div className="py-4">
                <p className="text-sm text-muted-foreground">
                  Ici vous pouvez afficher des formulaires, des détails, etc.
                </p>
              </div>
            </SheetContent>
          </Sheet>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Sheet Gauche</Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Panneau gauche</SheetTitle>
                <SheetDescription>
                  Navigation ou filtres.
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </div>
      </ComponentShowcase>

      <ComponentShowcase
        name="Popover"
        description="Bulle de contenu contextuelle"
        filePath="src/components/ui/popover.tsx"
        importStatement='import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"'
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Ouvrir Popover</Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <h4 className="font-medium">Titre du Popover</h4>
              <p className="text-sm text-muted-foreground">
                Contenu du popover avec des informations contextuelles.
              </p>
            </div>
          </PopoverContent>
        </Popover>
      </ComponentShowcase>

      <ComponentShowcase
        name="Tooltip"
        description="Infobulle au survol"
        filePath="src/components/ui/tooltip.tsx"
        importStatement='import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"'
      >
        <TooltipProvider>
          <div className="flex gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Survolez-moi</Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Information supplémentaire</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">?</Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Aide contextuelle</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </ComponentShowcase>
    </div>
  );
}
