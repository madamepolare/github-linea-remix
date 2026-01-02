import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { ProjectMeeting, ProjectObservation, MeetingAttendee } from "@/hooks/useChantier";
import { OBSERVATION_STATUS, OBSERVATION_PRIORITY } from "@/lib/projectTypes";
import { ReportData, LotProgress, BlockingPoint, TechnicalDecision } from "@/hooks/useMeetingReportData";

interface AttentionItem {
  id: string;
  description: string;
  urgency: string;
  progress: number;
  due_date?: string | null;
  assignee_names?: string[] | null;
  stakeholder_type?: string;
}

interface TaskItem {
  id: string;
  title: string;
  status?: string | null;
  priority?: string | null;
  due_date?: string | null;
  assigned_to?: string[] | null;
}

interface LotInfo {
  id: string;
  name: string;
}

interface MeetingPDFData {
  meeting: ProjectMeeting;
  observations: ProjectObservation[];
  attentionItems?: AttentionItem[];
  tasks?: TaskItem[];
  projectName: string;
  projectAddress?: string;
  projectClient?: string;
  aiSummary?: string;
  reportData?: ReportData;
  lots?: LotInfo[];
}

export function generateMeetingPDF({
  meeting,
  observations,
  attentionItems = [],
  tasks = [],
  projectName,
  projectAddress,
  projectClient,
  aiSummary,
  reportData,
  lots = [],
}: MeetingPDFData): { blob: Blob; fileName: string } {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;
  let sectionNumber = 1;

  // Helper function to check and add new page if needed
  const checkPageBreak = (requiredSpace: number = 40) => {
    if (yPos > doc.internal.pageSize.getHeight() - requiredSpace) {
      doc.addPage();
      yPos = 20;
    }
  };

  // Helper to add a section title
  const addSectionTitle = (title: string) => {
    checkPageBreak(30);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(`${sectionNumber}. ${title}`, 14, yPos);
    sectionNumber++;
    yPos += 6;
  };

  // Helper to add subsection text
  const addSubsectionTitle = (title: string) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60);
    doc.text(title, 14, yPos);
    yPos += 5;
  };

  // Helper to add normal text
  const addText = (text: string, indent: number = 14) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);
    const splitText = doc.splitTextToSize(text, pageWidth - indent - 14);
    doc.text(splitText, indent, yPos);
    yPos += splitText.length * 4 + 2;
  };

  // Helper to get lot name by id
  const getLotName = (lotId: string | null): string => {
    if (!lotId) return "-";
    const lot = lots.find(l => l.id === lotId);
    return lot?.name || "-";
  };

  // ========================
  // HEADER
  // ========================
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`Compte rendu de chantier n°${meeting.meeting_number || 1}`, pageWidth / 2, yPos, {
    align: "center",
  });

  yPos += 10;

  // Meeting title
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(meeting.title, pageWidth / 2, yPos, {
    align: "center",
  });

  yPos += 15;

  // Project info section
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Projet:", 14, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(projectName, 40, yPos);

  yPos += 7;
  if (projectClient) {
    doc.setFont("helvetica", "bold");
    doc.text("Client:", 14, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(projectClient, 40, yPos);
    yPos += 7;
  }

  if (projectAddress) {
    doc.setFont("helvetica", "bold");
    doc.text("Adresse:", 14, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(projectAddress, 40, yPos);
    yPos += 7;
  }

  yPos += 5;

  // Meeting details box
  doc.setDrawColor(200);
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(14, yPos, pageWidth - 28, 28, 3, 3, "FD");

  yPos += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const meetingDate = format(parseISO(meeting.meeting_date), "EEEE d MMMM yyyy 'à' HH:mm", {
    locale: fr,
  });
  doc.text(`Date: ${meetingDate}`, 20, yPos);

  yPos += 6;
  if (meeting.location) {
    doc.text(`Lieu: ${meeting.location}`, 20, yPos);
  }

  yPos += 6;
  doc.text(`Rédacteur: Compte rendu généré automatiquement`, 20, yPos);

  yPos += 15;

  // ========================
  // SECTION 1: Participants
  // ========================
  const attendees = meeting.attendees || [];
  if (attendees.length > 0) {
    addSectionTitle("Participants");

    const presentAttendees = attendees.filter((a: MeetingAttendee) => a.present);
    const absentAttendees = attendees.filter((a: MeetingAttendee) => !a.present);

    const attendeeData = attendees.map((a: MeetingAttendee) => [
      a.name,
      a.present ? "✓ Présent" : "✗ Absent",
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Nom", "Présence"]],
      body: attendeeData,
      theme: "striped",
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 40 },
      },
      margin: { left: 14, right: 14 },
      didParseCell: (data) => {
        if (data.column.index === 1 && data.section === "body") {
          const isPresent = attendees[data.row.index]?.present;
          data.cell.styles.textColor = isPresent ? [34, 139, 34] : [220, 53, 69];
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 5;
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text(`${presentAttendees.length} présent(s), ${absentAttendees.length} absent(s)`, 14, yPos);
    yPos += 10;
  }

  // ========================
  // SECTION 2: Contexte (from reportData)
  // ========================
  if (reportData?.context) {
    addSectionTitle("Contexte");
    addText(reportData.context);
    yPos += 5;
  }

  // ========================
  // SECTION 3: Notes / Ordre du jour
  // ========================
  if (meeting.notes) {
    addSectionTitle("Notes & Ordre du jour");
    addText(meeting.notes);
    yPos += 5;
  }

  // ========================
  // SECTION 4: Avancement général (from reportData)
  // ========================
  if (reportData?.general_progress) {
    addSectionTitle("Avancement général");
    
    const statusLabels: Record<string, string> = {
      on_track: "✓ Conforme au planning",
      slight_delay: "⚠ Léger retard",
      critical: "✗ Retard critique",
    };
    
    const statusColors: Record<string, number[]> = {
      on_track: [34, 139, 34],
      slight_delay: [255, 165, 0],
      critical: [220, 53, 69],
    };
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const status = reportData.general_progress.status || "on_track";
    const statusColor = statusColors[status] || [0, 0, 0];
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(statusLabels[status] || status, 14, yPos);
    doc.setTextColor(0);
    yPos += 6;
    
    if (reportData.general_progress.comment) {
      addText(reportData.general_progress.comment);
    }
    yPos += 5;
  }

  // ========================
  // SECTION 5: Avancement par lots (from reportData)
  // ========================
  if (reportData?.lot_progress && reportData.lot_progress.length > 0) {
    addSectionTitle("Avancement par lots");
    
    const lotProgressData = reportData.lot_progress.map((lp: LotProgress) => [
      getLotName(lp.lot_id),
      `${lp.progress_percent}%`,
      lp.works_done.substring(0, 50) + (lp.works_done.length > 50 ? "..." : ""),
      lp.works_planned.substring(0, 50) + (lp.works_planned.length > 50 ? "..." : ""),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Lot", "Avancement", "Travaux réalisés", "Travaux prévus"]],
      body: lotProgressData,
      theme: "striped",
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 25 },
        2: { cellWidth: 55 },
        3: { cellWidth: 55 },
      },
      margin: { left: 14, right: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // ========================
  // SECTION 6: Points techniques (from reportData)
  // ========================
  if (reportData?.technical_decisions && reportData.technical_decisions.length > 0) {
    addSectionTitle("Points techniques & Décisions");
    
    const techData = reportData.technical_decisions.map((td: TechnicalDecision, index: number) => [
      `${index + 1}`,
      td.description.substring(0, 60) + (td.description.length > 60 ? "..." : ""),
      td.decision.substring(0, 60) + (td.decision.length > 60 ? "..." : ""),
      td.reference_doc || "-",
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["#", "Description", "Décision", "Réf. doc"]],
      body: techData,
      theme: "striped",
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 60 },
        2: { cellWidth: 60 },
        3: { cellWidth: 35 },
      },
      margin: { left: 14, right: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // ========================
  // SECTION 7: Points bloquants (from reportData)
  // ========================
  if (reportData?.blocking_points && reportData.blocking_points.length > 0) {
    addSectionTitle("Points bloquants");
    
    const statusLabels: Record<string, string> = {
      open: "Ouvert",
      in_progress: "En cours",
      resolved: "Résolu",
    };
    
    const blockingData = reportData.blocking_points.map((bp: BlockingPoint, index: number) => {
      const resolutionDate = bp.resolution_date
        ? format(parseISO(bp.resolution_date), "dd/MM/yyyy")
        : "-";
      
      return [
        `${index + 1}`,
        bp.description.substring(0, 50) + (bp.description.length > 50 ? "..." : ""),
        getLotName(bp.lot_id),
        bp.responsibility || "-",
        bp.consequence.substring(0, 30) + (bp.consequence.length > 30 ? "..." : ""),
        statusLabels[bp.status] || bp.status,
        resolutionDate,
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [["#", "Description", "Lot", "Responsabilité", "Conséquence", "Statut", "Résolution"]],
      body: blockingData,
      theme: "striped",
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        overflow: "linebreak",
      },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 40 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 30 },
        5: { cellWidth: 18 },
        6: { cellWidth: 20 },
      },
      margin: { left: 14, right: 14 },
      didParseCell: (data) => {
        if (data.column.index === 5 && data.section === "body") {
          const status = reportData.blocking_points[data.row.index]?.status;
          if (status === "resolved") {
            data.cell.styles.textColor = [34, 139, 34];
          } else if (status === "open") {
            data.cell.styles.textColor = [220, 53, 69];
          } else {
            data.cell.styles.textColor = [255, 165, 0];
          }
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // ========================
  // SECTION 8: Points abordés (Attention Items)
  // ========================
  if (attentionItems.length > 0) {
    addSectionTitle("Points abordés");

    const urgencyLabels: Record<string, string> = {
      critical: "Critique",
      high: "Haute",
      medium: "Moyenne",
      low: "Basse",
    };

    const attentionData = attentionItems.map((item, index) => {
      const assignees = item.assignee_names?.join(", ") || "-";
      const dueDate = item.due_date
        ? format(parseISO(item.due_date), "dd/MM/yyyy")
        : "-";
      
      return [
        `${index + 1}`,
        item.description.substring(0, 80) + (item.description.length > 80 ? "..." : ""),
        urgencyLabels[item.urgency] || item.urgency,
        `${item.progress}%`,
        assignees.substring(0, 25) + (assignees.length > 25 ? "..." : ""),
        dueDate,
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [["#", "Description", "Urgence", "Avancement", "Responsable", "Échéance"]],
      body: attentionData,
      theme: "striped",
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 55 },
        2: { cellWidth: 22 },
        3: { cellWidth: 22 },
        4: { cellWidth: 35 },
        5: { cellWidth: 22 },
      },
      margin: { left: 14, right: 14 },
      didParseCell: (data) => {
        if (data.column.index === 2 && data.section === "body") {
          const urgency = attentionItems[data.row.index]?.urgency;
          if (urgency === "critical") {
            data.cell.styles.textColor = [220, 53, 69];
            data.cell.styles.fontStyle = "bold";
          } else if (urgency === "high") {
            data.cell.styles.textColor = [255, 140, 0];
          }
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // ========================
  // SECTION 9: Observations & Réserves
  // ========================
  if (observations.length > 0) {
    addSectionTitle("Observations & Réserves");

    const observationData = observations.map((obs, index) => {
      const statusConfig = OBSERVATION_STATUS.find((s) => s.value === obs.status);
      const priorityConfig = OBSERVATION_PRIORITY.find((p) => p.value === obs.priority);
      const lotName = obs.lot?.name || "-";
      const dueDate = obs.due_date
        ? format(parseISO(obs.due_date), "dd/MM/yyyy")
        : "-";

      return [
        `${index + 1}`,
        obs.description.substring(0, 70) + (obs.description.length > 70 ? "..." : ""),
        lotName,
        priorityConfig?.label || obs.priority,
        statusConfig?.label || obs.status,
        dueDate,
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [["#", "Description", "Lot", "Priorité", "Statut", "Échéance"]],
      body: observationData,
      theme: "striped",
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 65 },
        2: { cellWidth: 30 },
        3: { cellWidth: 22 },
        4: { cellWidth: 25 },
        5: { cellWidth: 22 },
      },
      margin: { left: 14, right: 14 },
      didParseCell: (data) => {
        if (data.column.index === 4 && data.section === "body") {
          const status = observations[data.row.index]?.status;
          if (status === "resolved") {
            data.cell.styles.textColor = [34, 139, 34];
          } else if (status === "open") {
            data.cell.styles.textColor = [220, 53, 69];
          }
        }
        if (data.column.index === 3 && data.section === "body") {
          const priority = observations[data.row.index]?.priority;
          if (priority === "critical") {
            data.cell.styles.textColor = [220, 53, 69];
            data.cell.styles.fontStyle = "bold";
          } else if (priority === "high") {
            data.cell.styles.textColor = [255, 140, 0];
          }
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // ========================
  // SECTION 10: Actions & Tâches
  // ========================
  if (tasks.length > 0) {
    addSectionTitle("Actions & Tâches");

    const statusLabels: Record<string, string> = {
      todo: "À faire",
      in_progress: "En cours",
      done: "Terminé",
    };

    const priorityLabels: Record<string, string> = {
      low: "Basse",
      medium: "Moyenne",
      high: "Haute",
      urgent: "Urgente",
    };

    const taskData = tasks.map((task, index) => {
      const dueDate = task.due_date
        ? format(parseISO(task.due_date), "dd/MM/yyyy")
        : "-";
      
      return [
        `${index + 1}`,
        task.title.substring(0, 70) + (task.title.length > 70 ? "..." : ""),
        priorityLabels[task.priority || "medium"] || task.priority || "-",
        statusLabels[task.status || "todo"] || task.status || "-",
        dueDate,
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [["#", "Tâche", "Priorité", "Statut", "Échéance"]],
      body: taskData,
      theme: "striped",
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 85 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
      },
      margin: { left: 14, right: 14 },
      didParseCell: (data) => {
        if (data.column.index === 3 && data.section === "body") {
          const status = tasks[data.row.index]?.status;
          if (status === "done") {
            data.cell.styles.textColor = [34, 139, 34];
          } else if (status === "in_progress") {
            data.cell.styles.textColor = [255, 140, 0];
          }
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // ========================
  // SECTION 11: Planning (from reportData)
  // ========================
  if (reportData?.planning && (reportData.planning.contractual_reminder || reportData.planning.delays_noted || reportData.planning.corrective_actions)) {
    addSectionTitle("Planning");
    
    if (reportData.planning.contractual_reminder) {
      addSubsectionTitle("Rappel contractuel:");
      addText(reportData.planning.contractual_reminder);
    }
    
    if (reportData.planning.delays_noted) {
      addSubsectionTitle("Retards constatés:");
      addText(reportData.planning.delays_noted);
    }
    
    if (reportData.planning.corrective_actions) {
      addSubsectionTitle("Actions correctives:");
      addText(reportData.planning.corrective_actions);
    }
    
    if (reportData.planning.delivery_impact) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(220, 53, 69);
      doc.text("⚠ Impact sur la livraison signalé", 14, yPos);
      doc.setTextColor(0);
      yPos += 6;
    }
    
    yPos += 5;
  }

  // ========================
  // SECTION 12: Questions financières (from reportData)
  // ========================
  if (reportData?.financial?.enabled) {
    addSectionTitle("Questions financières");
    
    if (reportData.financial.supplementary_works) {
      addSubsectionTitle("Travaux supplémentaires:");
      addText(reportData.financial.supplementary_works);
    }
    
    if (reportData.financial.pending_quotes) {
      addSubsectionTitle("Devis en attente:");
      addText(reportData.financial.pending_quotes);
    }
    
    if (reportData.financial.service_orders) {
      addSubsectionTitle("Ordres de service:");
      addText(reportData.financial.service_orders);
    }
    
    yPos += 5;
  }

  // ========================
  // SECTION 13: SQE (from reportData)
  // ========================
  if (reportData?.sqe) {
    const hasSQEContent = !reportData.sqe.safety_ok || 
                          !reportData.sqe.cleanliness_ok || 
                          reportData.sqe.sps_observations || 
                          reportData.sqe.nuisances_comment;
    
    if (hasSQEContent) {
      addSectionTitle("Sécurité, Qualité, Environnement (SQE)");
      
      // Safety status
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const safetyIcon = reportData.sqe.safety_ok ? "✓" : "✗";
      const safetyColor = reportData.sqe.safety_ok ? [34, 139, 34] : [220, 53, 69];
      doc.setTextColor(safetyColor[0], safetyColor[1], safetyColor[2]);
      doc.text(`${safetyIcon} Sécurité: ${reportData.sqe.safety_ok ? "Conforme" : "Non conforme"}`, 14, yPos);
      doc.setTextColor(0);
      yPos += 5;
      
      if (reportData.sqe.sps_observations) {
        addSubsectionTitle("Observations SPS:");
        addText(reportData.sqe.sps_observations);
      }
      
      // Cleanliness status
      const cleanIcon = reportData.sqe.cleanliness_ok ? "✓" : "✗";
      const cleanColor = reportData.sqe.cleanliness_ok ? [34, 139, 34] : [220, 53, 69];
      doc.setTextColor(cleanColor[0], cleanColor[1], cleanColor[2]);
      doc.text(`${cleanIcon} Propreté: ${reportData.sqe.cleanliness_ok ? "Satisfaisante" : "À améliorer"}`, 14, yPos);
      doc.setTextColor(0);
      yPos += 5;
      
      if (reportData.sqe.nuisances_comment) {
        addSubsectionTitle("Nuisances environnementales:");
        addText(reportData.sqe.nuisances_comment);
      }
      
      yPos += 5;
    }
  }

  // ========================
  // SECTION 14: Prochaine réunion (from reportData)
  // ========================
  if (reportData?.next_meeting?.date) {
    addSectionTitle("Prochaine réunion");
    
    const locationLabels: Record<string, string> = {
      site: "Sur site",
      remote: "Visioconférence",
      office: "En agence",
    };
    
    const nextMeetingDate = format(parseISO(reportData.next_meeting.date), "EEEE d MMMM yyyy", { locale: fr });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${nextMeetingDate} à ${reportData.next_meeting.time || "09:00"}`, 14, yPos);
    yPos += 5;
    doc.text(`Lieu: ${locationLabels[reportData.next_meeting.location_type] || reportData.next_meeting.location_type}`, 14, yPos);
    yPos += 10;
  }

  // ========================
  // SECTION 15: AI Summary
  // ========================
  if (aiSummary) {
    addSectionTitle("Synthèse AI");

    doc.setDrawColor(200);
    doc.setFillColor(245, 245, 250);
    
    const splitSummary = doc.splitTextToSize(aiSummary, pageWidth - 36);
    const boxHeight = splitSummary.length * 5 + 10;
    
    doc.roundedRect(14, yPos - 2, pageWidth - 28, boxHeight, 3, 3, "FD");
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text(splitSummary, 18, yPos + 4);
    yPos += boxHeight + 10;
  }

  // ========================
  // SECTION 16: Mentions légales (from reportData)
  // ========================
  if (reportData?.legal_mention) {
    checkPageBreak(30);
    
    doc.setDrawColor(180);
    doc.setFillColor(250, 250, 250);
    
    const legalText = reportData.legal_mention.replace("{DELAY}", reportData.legal_delay_days?.toString() || "7");
    const splitLegal = doc.splitTextToSize(legalText, pageWidth - 36);
    const legalBoxHeight = splitLegal.length * 4 + 8;
    
    doc.roundedRect(14, yPos, pageWidth - 28, legalBoxHeight, 2, 2, "FD");
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(80);
    doc.text(splitLegal, 18, yPos + 5);
    doc.setTextColor(0);
    yPos += legalBoxHeight + 10;
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Page ${i} / ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
    doc.text(
      `Généré le ${format(new Date(), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}`,
      14,
      doc.internal.pageSize.getHeight() - 10
    );
    doc.text(
      projectName,
      pageWidth - 14,
      doc.internal.pageSize.getHeight() - 10,
      { align: "right" }
    );
  }

  // Return blob and filename
  const fileName = `CR_Chantier_${meeting.meeting_number || 1}_${projectName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
  const blob = doc.output("blob");
  return { blob, fileName };
}
