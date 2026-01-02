import { MeetingAttendee, ProjectMeeting, ProjectObservation, ObservationStatus } from "@/hooks/useChantier";

export interface ReportSection {
  id: string;
  type: "header" | "attendees" | "notes" | "observations" | "tasks" | "summary";
  title: string;
  expanded: boolean;
}

export interface ExternalTask {
  id: string;
  title: string;
  assignee_name: string;
  assignee_type: "bet" | "entreprise" | "moa" | "other";
  due_date: string | null;
  completed: boolean;
  comment?: string;
}

export interface AttendeeWithType extends MeetingAttendee {
  type?: "moa" | "bet" | "entreprise" | "archi" | "other";
  email?: string;
}

export interface MeetingReportBuilderProps {
  projectId: string;
  meeting: ProjectMeeting;
  onBack: () => void;
}

export interface EmailRecipient {
  email: string;
  name: string;
  type: string;
  selected: boolean;
}
