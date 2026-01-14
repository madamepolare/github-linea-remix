import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Eye, EyeOff } from "lucide-react";

import { useAgencyInfo } from "@/hooks/useAgencyInfo";
import { QuoteDocument, QuoteLine } from "@/types/quoteTypes";
import { isArchitectureContractType } from "@/lib/moeContractDefaults";
import { isCommunicationContractType } from "@/lib/communicationContractDefaults";
import { buildMOEContractDataFromDocument } from "@/lib/moeContractBuilder";
import { buildCommunicationContractDataFromDocument } from "@/lib/communicationContractBuilder";
import { MOEContractData, MOE_PROJECT_TYPES, MOE_FEE_METHODS } from "@/lib/moeContractConfig";
import { CommunicationContractData } from "@/lib/generateCommunicationContractPDF";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ContractPreviewPanelProps {
  document: Partial<QuoteDocument>;
  lines: QuoteLine[];
  zoom: number;
  contractTypeCode?: string | null;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  try {
    return format(new Date(dateStr), "d MMMM yyyy", { locale: fr });
  } catch {
    return dateStr;
  }
}

function formatCurrency(value?: number) {
  if (value === undefined || value === null) return "-";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);
}

function formatClauseTitle(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs text-gray-500 uppercase mb-2 font-semibold tracking-wide border-b border-gray-200 pb-1">
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between text-xs py-0.5">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  );
}

export function ContractPreviewPanel({
  document,
  lines,
  zoom,
  contractTypeCode,
}: ContractPreviewPanelProps) {
  const { agencyInfo } = useAgencyInfo();
  const [hideDescriptions, setHideDescriptions] = useState(false);

  const scale = zoom / 100;

  const contractData = useMemo(() => {
    const code = (contractTypeCode || "").toUpperCase();
    const fallback = (document.project_type || "").toString().toUpperCase();

    const isMOE = isArchitectureContractType(code || fallback);
    const isCOM = isCommunicationContractType(code || fallback);

    if (isMOE) {
      return {
        kind: "moe" as const,
        data: buildMOEContractDataFromDocument(document as any, lines, agencyInfo),
      };
    }

    if (isCOM) {
      return {
        kind: "communication" as const,
        data: buildCommunicationContractDataFromDocument(document as any, lines, agencyInfo),
      };
    }

    return null;
  }, [agencyInfo, contractTypeCode, document, lines]);

  const moe = contractData?.kind === "moe" ? (contractData.data as MOEContractData) : null;
  const com = contractData?.kind === "communication" ? (contractData.data as CommunicationContractData) : null;

  return (
    <div className="relative">
      {/* Toggle descriptions button */}
      <div className="absolute top-2 right-2 z-10">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHideDescriptions(!hideDescriptions)}
              className="h-8 gap-1.5 bg-white/90 backdrop-blur-sm shadow-sm"
            >
              {hideDescriptions ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              <span className="text-xs">{hideDescriptions ? "Afficher" : "Masquer"} textes</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {hideDescriptions ? "Afficher les descriptions des phases" : "Masquer les descriptions des phases"}
          </TooltipContent>
        </Tooltip>
      </div>

      <div
        className="bg-white shadow-lg rounded-lg overflow-hidden origin-top-left"
        style={{
          transform: `scale(${scale})`,
          width: `${100 / scale}%`,
          minHeight: "297mm",
        }}
      >
      <div className="p-8 text-sm text-gray-800" style={{ fontFamily: "system-ui, sans-serif" }}>
        {/* ===== HEADER ===== */}
        <div className="flex justify-between items-start mb-8">
          <div>
            {agencyInfo?.logo_url ? (
              <img src={agencyInfo.logo_url} alt="Logo" className="h-12 object-contain" />
            ) : (
              <div className="font-bold text-xl text-gray-900">{agencyInfo?.name || "Votre agence"}</div>
            )}
            <div className="mt-2 text-xs text-gray-500">
              {agencyInfo?.address && <div>{agencyInfo.address}</div>}
              {(agencyInfo?.postal_code || agencyInfo?.city) && (
                <div>{agencyInfo.postal_code} {agencyInfo.city}</div>
              )}
              {agencyInfo?.phone && <div>Tél: {agencyInfo.phone}</div>}
              {agencyInfo?.email && <div>{agencyInfo.email}</div>}
              {agencyInfo?.siret && <div className="mt-1">SIRET: {agencyInfo.siret}</div>}
              {agencyInfo?.vat_number && <div>TVA: {agencyInfo.vat_number}</div>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 uppercase">Contrat</div>
            <div className="text-gray-500 mt-1">{moe?.reference || com?.reference || document.document_number || "BROUILLON"}</div>
            <div className="text-xs text-gray-400 mt-1">
              {formatDate(moe?.date || com?.date || document.created_at) || format(new Date(), "d MMMM yyyy", { locale: fr })}
            </div>
          </div>
        </div>

        {/* ===== NO DATA FALLBACK ===== */}
        {!contractData ? (
          <div className="p-4 rounded bg-gray-50 text-sm text-gray-700">
            <div className="font-medium mb-1">Aperçu détaillé indisponible</div>
            <div className="text-xs text-gray-500">
              Sélectionne un type de contrat (Architecture / Communication) pour afficher le contenu complet.
            </div>
          </div>
        ) : (
          <>
            {/* ===== PARTIES (MOA / MOE or Client / Agency) ===== */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {moe && (
                <>
                  <div className="p-3 bg-gray-50 rounded">
                    <SectionTitle>Maître d'ouvrage (Client)</SectionTitle>
                    <div className="font-medium">{moe.moa.name}</div>
                    {moe.moa.company_name && moe.moa.company_name !== moe.moa.name && (
                      <div className="text-xs text-gray-600">{moe.moa.company_name}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {moe.moa.address && <div>{moe.moa.address}</div>}
                      {moe.moa.city && <div>{moe.moa.city}</div>}
                      {moe.moa.phone && <div>Tél: {moe.moa.phone}</div>}
                      {moe.moa.email && <div>{moe.moa.email}</div>}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <SectionTitle>Maître d'œuvre (Architecte)</SectionTitle>
                    <div className="font-medium">{moe.moe.name}</div>
                    {moe.moe.company_name && moe.moe.company_name !== moe.moe.name && (
                      <div className="text-xs text-gray-600">{moe.moe.company_name}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {moe.moe.address && <div>{moe.moe.address}</div>}
                      {(moe.moe.postal_code || moe.moe.city) && <div>{moe.moe.postal_code} {moe.moe.city}</div>}
                      {moe.moe.phone && <div>Tél: {moe.moe.phone}</div>}
                      {moe.moe.email && <div>{moe.moe.email}</div>}
                      {moe.moe.ordre_number && <div className="mt-1">N° Ordre: {moe.moe.ordre_number}</div>}
                    </div>
                  </div>
                </>
              )}
              {com && (
                <>
                  <div className="p-3 bg-gray-50 rounded">
                    <SectionTitle>Client</SectionTitle>
                    <div className="font-medium">{com.client.name}</div>
                    {com.client.company_name && com.client.company_name !== com.client.name && (
                      <div className="text-xs text-gray-600">{com.client.company_name}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {com.client.address && <div>{com.client.address}</div>}
                      {(com.client.postal_code || com.client.city) && <div>{com.client.postal_code} {com.client.city}</div>}
                      {com.client.phone && <div>Tél: {com.client.phone}</div>}
                      {com.client.email && <div>{com.client.email}</div>}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <SectionTitle>Agence</SectionTitle>
                    <div className="font-medium">{com.agency.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {com.agency.address && <div>{com.agency.address}</div>}
                      {(com.agency.postal_code || com.agency.city) && <div>{com.agency.postal_code} {com.agency.city}</div>}
                      {com.agency.phone && <div>Tél: {com.agency.phone}</div>}
                      {com.agency.email && <div>{com.agency.email}</div>}
                      {com.agency.siret && <div className="mt-1">SIRET: {com.agency.siret}</div>}
                      {com.agency.vat_number && <div>TVA: {com.agency.vat_number}</div>}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ===== PROJECT INFO ===== */}
            <div className="mb-6 p-4 border border-gray-200 rounded">
              <SectionTitle>Projet</SectionTitle>
              <h2 className="font-semibold text-lg mb-2">{moe?.project.name || com?.project.name || document.title || "Projet sans titre"}</h2>
              {(moe?.project.additional_notes || com?.project.description || document.description) && (
                <p className="text-gray-600 text-xs mb-3">{moe?.project.additional_notes || com?.project.description || document.description}</p>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                {moe && (
                  <>
                    <div>
                      <InfoRow label="Adresse" value={moe.project.address} />
                      <InfoRow label="Ville" value={moe.project.city} />
                      <InfoRow label="Code postal" value={moe.project.postal_code} />
                      <InfoRow label="Type de projet" value={MOE_PROJECT_TYPES[moe.project.project_type] || moe.project.project_type} />
                    </div>
                    <div>
                      <InfoRow label="Surface existante" value={moe.project.existing_surface ? `${moe.project.existing_surface} m²` : undefined} />
                      <InfoRow label="Surface projet" value={moe.project.project_surface ? `${moe.project.project_surface} m²` : undefined} />
                      <InfoRow label="Budget global" value={moe.project.budget_global ? formatCurrency(moe.project.budget_global) : undefined} />
                      <InfoRow label="Budget travaux" value={moe.project.budget_travaux ? formatCurrency(moe.project.budget_travaux) : undefined} />
                    </div>
                  </>
                )}
                {com && (
                  <>
                    <div>
                      <InfoRow label="Budget" value={com.project.budget ? formatCurrency(com.project.budget) : undefined} />
                      <InfoRow label="Taux journalier" value={com.daily_rate ? formatCurrency(com.daily_rate) : undefined} />
                    </div>
                    <div>
                      <InfoRow label="Date début" value={com.project.start_date ? formatDate(com.project.start_date) : undefined} />
                      <InfoRow label="Date fin" value={com.project.end_date ? formatDate(com.project.end_date) : undefined} />
                    </div>
                  </>
                )}
              </div>
              
              {moe?.project.constraints && (
                <div className="mt-3">
                  <div className="text-xs text-gray-500">Contraintes</div>
                  <div className="text-xs text-gray-700">{moe.project.constraints}</div>
                </div>
              )}
              {moe?.project.requirements && (
                <div className="mt-2">
                  <div className="text-xs text-gray-500">Exigences</div>
                  <div className="text-xs text-gray-700">{moe.project.requirements}</div>
                </div>
              )}
            </div>

            {/* ===== MODE DE CALCUL (MOE) ===== */}
            {moe && (
              <div className="mb-4 text-xs">
                <span className="text-gray-500">Mode de calcul des honoraires : </span>
                <span className="font-medium">{MOE_FEE_METHODS[moe.fee_calculation_method] || moe.fee_calculation_method}</span>
              </div>
            )}

            {/* ===== PHASES / PRESTATIONS ===== */}
            <div className="mb-6">
              <SectionTitle>{moe ? "Phases de mission" : "Phases"}</SectionTitle>
              <table className="w-full" style={{ fontSize: "11px" }}>
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium">Code</th>
                    <th className="text-left py-2 font-medium">Intitulé</th>
                    <th className="text-center py-2 font-medium w-16">Inclus</th>
                    <th className="text-right py-2 font-medium w-16">%</th>
                  </tr>
                </thead>
                <tbody>
                  {(moe ? moe.mission_phases : com?.phases || []).map((p: any) => (
                    <tr key={p.code} className={`border-b border-gray-100 ${!p.is_included ? "opacity-50" : ""}`}>
                      <td className="py-2 text-xs text-gray-500 font-mono">{p.code}</td>
                      <td className="py-2">
                        <div className="font-medium">{p.name}</div>
                        {!hideDescriptions && p.description && <div className="text-xs text-gray-500 mt-0.5">{p.description}</div>}
                        {!hideDescriptions && Array.isArray(p.deliverables) && p.deliverables.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">📦 {p.deliverables.join(", ")}</div>
                        )}
                      </td>
                      <td className="py-2 text-center">
                        {p.is_included ? "✓" : p.is_optional ? "(option)" : "—"}
                      </td>
                      <td className="py-2 text-right">{Math.round((p.percentage || 0) * 100) / 100}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ===== HONORAIRES / PRESTATIONS (avec montants) ===== */}
            <div className="mb-6">
              <SectionTitle>{moe ? "Détail des honoraires" : "Détail des prestations"}</SectionTitle>
              <table className="w-full" style={{ fontSize: "11px" }}>
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium">Désignation</th>
                    <th className="text-center py-2 font-medium w-16">Qté</th>
                    <th className="text-right py-2 font-medium w-28">Montant HT</th>
                  </tr>
                </thead>
                <tbody>
                  {(moe ? moe.honoraires : com?.prestations || []).map((item: any, idx: number) => (
                    <tr key={idx} className={`border-b border-gray-100 ${item.is_optional ? "opacity-60" : ""}`}>
                      <td className="py-2">
                        <span className="font-medium">{item.name}</span>
                        {item.is_offered && <span className="ml-2 text-xs text-green-600">(offert)</span>}
                        {item.is_optional && <span className="ml-2 text-xs text-gray-400">(option)</span>}
                      </td>
                      <td className="py-2 text-center">{item.quantity}</td>
                      <td className="py-2 text-right font-medium">{formatCurrency(item.amount_ht)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ===== TOTAUX ===== */}
            <div className="mb-6 flex justify-end">
              <div className="w-64 border border-gray-200 rounded p-3">
                <div className="flex justify-between py-1 text-sm">
                  <span>Total HT</span>
                  <span className="font-medium">{formatCurrency(moe?.total_ht || com?.total_ht)}</span>
                </div>
                <div className="flex justify-between py-1 text-sm text-gray-500">
                  <span>TVA ({((moe?.tva_rate || com?.tva_rate || 0.2) * 100).toFixed(0)}%)</span>
                  <span>{formatCurrency(moe?.tva_amount || com?.tva_amount)}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-gray-900 mt-1">
                  <span className="font-bold">Total TTC</span>
                  <span className="font-bold text-lg">{formatCurrency(moe?.total_ttc || com?.total_ttc)}</span>
                </div>
              </div>
            </div>

            {/* ===== PAYMENT SCHEDULE ===== */}
            <div className="mb-6">
              <SectionTitle>Échéancier de paiement</SectionTitle>
              <table className="w-full" style={{ fontSize: "11px" }}>
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium">Étape</th>
                    <th className="text-left py-2 font-medium">Phase</th>
                    <th className="text-left py-2 font-medium">Description</th>
                    <th className="text-right py-2 font-medium w-16">%</th>
                    <th className="text-right py-2 font-medium w-28">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {((moe || com)?.payment_schedule || []).map((s: any, idx: number) => {
                    const total = moe?.total_ht || com?.total_ht || 0;
                    const amount = (s.percentage / 100) * total;
                    return (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-2 font-medium">{s.stage || ""}</td>
                        <td className="py-2 text-gray-500 font-mono text-xs">{s.phase_code || ""}</td>
                        <td className="py-2 text-gray-600">{s.description || ""}</td>
                        <td className="py-2 text-right">{s.percentage}%</td>
                        <td className="py-2 text-right font-medium">{formatCurrency(amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ===== INSURANCE (MOE) ===== */}
            {moe && (moe.insurance_company || moe.insurance_policy_number) && (
              <div className="mb-6 p-3 bg-blue-50 rounded text-xs">
                <SectionTitle>Assurance professionnelle</SectionTitle>
                <InfoRow label="Compagnie" value={moe.insurance_company} />
                <InfoRow label="N° Police" value={moe.insurance_policy_number} />
              </div>
            )}

            {/* ===== CLAUSES ===== */}
            <div className="mb-6">
              <SectionTitle>Clauses contractuelles</SectionTitle>
              <div className="space-y-4">
                {Object.entries((moe || com)?.clauses || {}).map(([key, value]) => (
                  <div key={key} className="border-l-2 border-gray-200 pl-3">
                    <div className="font-semibold text-sm text-gray-900">{formatClauseTitle(key)}</div>
                    <div className="text-xs text-gray-700 whitespace-pre-line mt-1">{String(value || "")}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ===== SIGNATURE ===== */}
            <div className="mt-10 pt-6 border-t border-gray-300">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="text-xs text-gray-500 mb-2">Le Client</div>
                  <div className="text-xs text-gray-400 mb-1">Date et signature précédée de "Bon pour accord"</div>
                  <div className="border-b border-gray-300 w-48 mt-8"></div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-2">L'Agence / L'Architecte</div>
                  {agencyInfo?.signature_url && (
                    <img src={agencyInfo.signature_url} alt="Signature" className="h-16 object-contain ml-auto" />
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ===== FOOTER ===== */}
        <div className="mt-10 pt-4 border-t border-gray-200 text-[9px] text-gray-400 text-center">
          {agencyInfo?.name}
          {agencyInfo?.siret && ` - SIRET: ${agencyInfo.siret}`}
          {agencyInfo?.vat_number && ` - TVA: ${agencyInfo.vat_number}`}
        </div>
      </div>
      </div>
    </div>
  );
}
