import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { ProjectMeeting, ProjectObservation, MeetingAttendee } from "@/hooks/useChantier";
import { OBSERVATION_STATUS, OBSERVATION_PRIORITY } from "@/lib/projectTypes";

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

interface MeetingPDFData {
  meeting: ProjectMeeting;
  observations: ProjectObservation[];
  attentionItems?: AttentionItem[];
  tasks?: TaskItem[];
  projectName: string;
  projectAddress?: string;
  projectClient?: string;
  aiSummary?: string;
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
}: MeetingPDFData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Helper function to check and add new page if needed
  const checkPageBreak = (requiredSpace: number = 40) => {
    if (yPos > doc.internal.pageSize.getHeight() - requiredSpace) {
      doc.addPage();
      yPos = 20;
    }
  };

  // Title with meeting number
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`Réunion de chantier n°${meeting.meeting_number || 1}`, pageWidth / 2, yPos, {
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
  // SECTION 1: Attendees
  // ========================
  const attendees = meeting.attendees || [];
  if (attendees.length > 0) {
    checkPageBreak(60);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("1. Participants", 14, yPos);
    yPos += 3;

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
  // SECTION 2: Notes
  // ========================
  if (meeting.notes) {
    checkPageBreak(50);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("2. Notes & Ordre du jour", 14, yPos);
    yPos += 6;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const splitNotes = doc.splitTextToSize(meeting.notes, pageWidth - 28);
    doc.text(splitNotes, 14, yPos);
    yPos += splitNotes.length * 5 + 10;
  }

  // ========================
  // SECTION 3: Attention Items (Points abordés)
  // ========================
  if (attentionItems.length > 0) {
    checkPageBreak(60);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`3. Points abordés (${attentionItems.length})`, 14, yPos);
    yPos += 3;

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
  // SECTION 4: Observations
  // ========================
  if (observations.length > 0) {
    checkPageBreak(60);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`4. Observations & Réserves (${observations.length})`, 14, yPos);
    yPos += 3;

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
  // SECTION 5: Tasks
  // ========================
  if (tasks.length > 0) {
    checkPageBreak(60);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`5. Actions & Tâches (${tasks.length})`, 14, yPos);
    yPos += 3;

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
  // SECTION 6: AI Summary
  // ========================
  if (aiSummary) {
    checkPageBreak(50);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("6. Synthèse AI", 14, yPos);
    yPos += 6;

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

  // Save
  const fileName = `CR_Chantier_${meeting.meeting_number || 1}_${projectName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
  doc.save(fileName);
}
