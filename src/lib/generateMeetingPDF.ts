import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { ProjectMeeting, ProjectObservation, MeetingAttendee } from "@/hooks/useChantier";
import { OBSERVATION_STATUS, OBSERVATION_PRIORITY } from "@/lib/projectTypes";

interface MeetingPDFData {
  meeting: ProjectMeeting;
  observations: ProjectObservation[];
  projectName: string;
  projectAddress?: string;
  projectClient?: string;
}

export function generateMeetingPDF({
  meeting,
  observations,
  projectName,
  projectAddress,
  projectClient,
}: MeetingPDFData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`Compte-rendu de réunion n°${meeting.meeting_number || ""}`, pageWidth / 2, yPos, {
    align: "center",
  });

  yPos += 15;

  // Project info section
  doc.setFontSize(12);
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
  doc.roundedRect(14, yPos, pageWidth - 28, 35, 3, 3, "FD");

  yPos += 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(meeting.title, 20, yPos);

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

  yPos += 15;

  // Attendees section
  const attendees = meeting.attendees || [];
  if (attendees.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Participants", 14, yPos);
    yPos += 3;

    const attendeeData = attendees.map((a: MeetingAttendee) => [
      a.name,
      a.present ? "Présent" : "Absent",
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
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Notes section
  if (meeting.notes) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Notes de réunion", 14, yPos);
    yPos += 6;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const splitNotes = doc.splitTextToSize(meeting.notes, pageWidth - 28);
    doc.text(splitNotes, 14, yPos);
    yPos += splitNotes.length * 5 + 10;
  }

  // Observations section
  if (observations.length > 0) {
    // Check if we need a new page
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Observations (${observations.length})`, 14, yPos);
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
        obs.description.substring(0, 80) + (obs.description.length > 80 ? "..." : ""),
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
        1: { cellWidth: 70 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 22 },
      },
      margin: { left: 14, right: 14 },
      didParseCell: (data) => {
        // Color coding for status
        if (data.column.index === 4 && data.section === "body") {
          const status = observations[data.row.index]?.status;
          if (status === "resolved") {
            data.cell.styles.textColor = [34, 139, 34];
          } else if (status === "open") {
            data.cell.styles.textColor = [220, 53, 69];
          }
        }
        // Color coding for priority
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

  // Footer
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
  }

  // Save
  const fileName = `CR_${meeting.meeting_number || "reunion"}_${projectName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
  doc.save(fileName);
}
