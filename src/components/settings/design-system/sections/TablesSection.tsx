import { ComponentShowcase } from "../ComponentShowcase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreHorizontal } from "lucide-react";

export function TablesSection() {
  const data = [
    { id: 1, name: "Projet Alpha", client: "Client A", status: "En cours", amount: "12 500 €" },
    { id: 2, name: "Projet Beta", client: "Client B", status: "Terminé", amount: "8 200 €" },
    { id: 3, name: "Projet Gamma", client: "Client C", status: "En attente", amount: "15 000 €" },
  ];

  return (
    <div className="space-y-6">
      <ComponentShowcase
        name="Table"
        description="Tableau de données standard"
        filePath="src/components/ui/table.tsx"
        importStatement='import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"'
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Projet</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Montant</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>{row.client}</TableCell>
                <TableCell>
                  <Badge variant={row.status === "Terminé" ? "secondary" : "outline"}>
                    {row.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{row.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ComponentShowcase>

      <ComponentShowcase
        name="Table avec sélection"
        description="Tableau avec checkboxes et actions"
        filePath="src/components/ui/table.tsx"
        importStatement='import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"'
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox />
              </TableHead>
              <TableHead>Projet</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>{row.client}</TableCell>
                <TableCell>
                  <Badge variant="outline">{row.status}</Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ComponentShowcase>

      <ComponentShowcase
        name="Skeleton"
        description="Placeholder de chargement"
        filePath="src/components/ui/skeleton.tsx"
        importStatement='import { Skeleton } from "@/components/ui/skeleton"'
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
          <Skeleton className="h-32 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </ComponentShowcase>

      <ComponentShowcase
        name="Empty State"
        description="État vide pour les listes sans données"
        filePath="src/components/ui/empty-state.tsx"
        importStatement='import { EmptyState } from "@/components/ui/empty-state"'
      >
        <div className="py-12 text-center border border-dashed rounded-lg">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <svg
              className="h-8 w-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="font-medium mb-1">Aucun élément</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Commencez par créer votre premier élément.
          </p>
          <Button>Créer</Button>
        </div>
      </ComponentShowcase>
    </div>
  );
}
