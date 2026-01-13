import React, { useMemo } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { useAgencyInfo } from "@/hooks/useAgencyInfo";
import { QuoteDocument, QuoteLine } from "@/types/quoteTypes";
import { isArchitectureContractType } from "@/lib/moeContractDefaults";
import { isCommunicationContractType } from "@/lib/communicationContractDefaults";
import { buildMOEContractDataFromDocument } from "@/lib/moeContractBuilder";
import { buildCommunicationContractDataFromDocument } from "@/lib/communicationContractBuilder";

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

function formatClauseTitle(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ContractPreviewPanel({
  document,
  lines,
  zoom,
  contractTypeCode,
}: ContractPreviewPanelProps) {
  const { agencyInfo } = useAgencyInfo();

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

  return (
    <div
      className="bg-white shadow-lg rounded-lg overflow-hidden origin-top-left"
      style={{
        transform: `scale(${scale})`,
        width: `${100 / scale}%`,
        minHeight: "297mm",
      }}
    >
      <div className="p-8 text-sm text-gray-800" style={{ fontFamily: "system-ui, sans-serif" }}>
        {/* Header */}
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
                <div>
                  {agencyInfo.postal_code} {agencyInfo.city}
                </div>
              )}
              {agencyInfo?.phone && <div>Tél: {agencyInfo.phone}</div>}
              {agencyInfo?.email && <div>{agencyInfo.email}</div>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 uppercase">Contrat</div>
            <div className="text-gray-500 mt-1">{document.document_number || "BROUILLON"}</div>
            <div className="text-xs text-gray-400 mt-1">
              {formatDate(document.created_at) || format(new Date(), "d MMMM yyyy", { locale: fr })}
            </div>
          </div>
        </div>

        {/* Client info */}
        {document.client_company && (
          <div className="mb-6 p-4 bg-gray-50 rounded">
            <div className="text-xs text-gray-500 uppercase mb-1">Client</div>
            <div className="font-medium">{document.client_company.name}</div>
            {document.client_contact && (
              <div className="text-sm text-gray-600">
                {document.client_contact.name}
                {document.client_contact.email && ` - ${document.client_contact.email}`}
              </div>
            )}
          </div>
        )}

        {/* Project info */}
        <div className="mb-6">
          <h2 className="font-semibold text-lg mb-2">{document.title || "Projet sans titre"}</h2>
          {document.description && <p className="text-gray-600 text-sm">{document.description}</p>}
        </div>

        {!contractData ? (
          <div className="p-4 rounded bg-gray-50 text-sm text-gray-700">
            <div className="font-medium mb-1">Aperçu détaillé indisponible</div>
            <div className="text-xs text-gray-500">
              Sélectionne un type de contrat (Architecture / Communication) pour afficher les clauses, l'échéancier et le contenu complet.
            </div>
          </div>
        ) : (
          <>
            {/* Phases / Prestations */}
            <div className="mb-6">
              <div className="text-xs text-gray-500 uppercase mb-2">
                {contractData.kind === "moe" ? "Phases de mission" : "Phases"}
              </div>
              <table className="w-full" style={{ fontSize: "11px" }}>
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium">Code</th>
                    <th className="text-left py-2 font-medium">Intitulé</th>
                    <th className="text-right py-2 font-medium w-24">% / Poids</th>
                  </tr>
                </thead>
                <tbody>
                  {(contractData.kind === "moe" ? contractData.data.mission_phases : contractData.data.phases).map((p: any) => (
                    <tr key={p.code} className="border-b border-gray-100">
                      <td className="py-2 text-xs text-gray-500 font-mono">{p.code}</td>
                      <td className="py-2">
                        <div className="font-medium">{p.name}</div>
                        {p.description && <div className="text-xs text-gray-500 mt-0.5">{p.description}</div>}
                        {Array.isArray(p.deliverables) && p.deliverables.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">Livrables : {p.deliverables.join(", ")}</div>
                        )}
                      </td>
                      <td className="py-2 text-right">{Math.round((p.percentage || 0) * 100) / 100}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Payment schedule */}
            <div className="mb-6">
              <div className="text-xs text-gray-500 uppercase mb-2">Échéancier de paiement</div>
              <table className="w-full" style={{ fontSize: "11px" }}>
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium">Étape</th>
                    <th className="text-left py-2 font-medium">Description</th>
                    <th className="text-right py-2 font-medium w-24">%</th>
                  </tr>
                </thead>
                <tbody>
                  {(contractData.data.payment_schedule || []).map((s: any, idx: number) => (
                    <tr key={`${s.stage || "stage"}-${idx}`} className="border-b border-gray-100">
                      <td className="py-2 font-medium">{s.stage || s.phase_code || ""}</td>
                      <td className="py-2 text-gray-600">{s.description || ""}</td>
                      <td className="py-2 text-right">{s.percentage ?? ""}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Clauses */}
            <div className="mb-2">
              <div className="text-xs text-gray-500 uppercase mb-2">Clauses</div>
              <div className="space-y-4">
                {Object.entries(contractData.data.clauses || {}).map(([key, value]) => (
                  <div key={key}>
                    <div className="font-semibold text-sm text-gray-900">{formatClauseTitle(key)}</div>
                    <div className="text-xs text-gray-700 whitespace-pre-line mt-1">{String(value || "")}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Extras MOE */}
            {contractData.kind === "moe" && (
              <div className="mt-8 text-xs text-gray-600">
                {(contractData.data.insurance_company || contractData.data.insurance_policy_number) && (
                  <div>
                    Assurance : {contractData.data.insurance_company || ""}{" "}
                    {contractData.data.insurance_policy_number ? `(Police: ${contractData.data.insurance_policy_number})` : ""}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="mt-10 pt-4 border-t border-gray-200 text-[9px] text-gray-400 text-center">
          {agencyInfo?.name}
          {agencyInfo?.siret && ` - SIRET: ${agencyInfo.siret}`}
          {agencyInfo?.vat_number && ` - TVA: ${agencyInfo.vat_number}`}
        </div>
      </div>
    </div>
  );
}
