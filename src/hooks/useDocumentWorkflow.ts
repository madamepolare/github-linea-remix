import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface WorkflowStep {
  id: string;
  workflow_id: string;
  step_order: number;
  name: string;
  approver_type: 'user' | 'role' | 'any';
  approver_user_id: string | null;
  approver_role: 'owner' | 'admin' | 'member' | null;
  is_required: boolean;
  auto_approve_after_days: number | null;
  created_at: string;
}

export interface DocumentWorkflow {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  document_types: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  steps?: WorkflowStep[];
}

export interface ApprovalInstance {
  id: string;
  document_id: string;
  workflow_id: string | null;
  current_step: number;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'cancelled';
  started_by: string;
  started_at: string;
  completed_at: string | null;
  workflow?: DocumentWorkflow;
  approvals?: DocumentApproval[];
}

export interface DocumentApproval {
  id: string;
  instance_id: string;
  step_id: string | null;
  approver_id: string;
  status: 'pending' | 'approved' | 'rejected';
  comment: string | null;
  approved_at: string | null;
  created_at: string;
  step?: WorkflowStep;
  approver?: {
    id: string;
    full_name: string | null;
  };
}

export interface CreateWorkflowInput {
  name: string;
  description?: string;
  document_types: string[];
  steps: {
    name: string;
    approver_type: 'user' | 'role' | 'any';
    approver_user_id?: string;
    approver_role?: 'owner' | 'admin' | 'member';
    is_required?: boolean;
    auto_approve_after_days?: number;
  }[];
}

export function useDocumentWorkflows() {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  // Get all workflows
  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ["document-workflows", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      const { data, error } = await supabase
        .from("document_workflows")
        .select(`
          *,
          steps:document_workflow_steps(*)
        `)
        .eq("workspace_id", activeWorkspace.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      return (data || []).map(w => ({
        ...w,
        steps: (w.steps || []).sort((a: WorkflowStep, b: WorkflowStep) => a.step_order - b.step_order),
      })) as DocumentWorkflow[];
    },
    enabled: !!activeWorkspace?.id,
  });

  // Create workflow
  const createWorkflow = useMutation({
    mutationFn: async (input: CreateWorkflowInput) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");

      const { data: workflow, error: wfError } = await supabase
        .from("document_workflows")
        .insert({
          workspace_id: activeWorkspace.id,
          name: input.name,
          description: input.description,
          document_types: input.document_types,
        })
        .select()
        .single();

      if (wfError) throw wfError;

      const stepsData = input.steps.map((s, idx) => ({
        workflow_id: workflow.id,
        step_order: idx + 1,
        name: s.name,
        approver_type: s.approver_type,
        approver_user_id: s.approver_user_id,
        approver_role: s.approver_role,
        is_required: s.is_required ?? true,
        auto_approve_after_days: s.auto_approve_after_days,
      }));

      const { error: stepsError } = await supabase
        .from("document_workflow_steps")
        .insert(stepsData);

      if (stepsError) throw stepsError;

      return workflow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-workflows"] });
      toast.success("Workflow créé");
    },
    onError: (error) => {
      toast.error("Erreur lors de la création du workflow");
      console.error(error);
    },
  });

  // Update workflow
  const updateWorkflow = useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateWorkflowInput> & { id: string }) => {
      const { error } = await supabase
        .from("document_workflows")
        .update({
          name: input.name,
          description: input.description,
          document_types: input.document_types,
        })
        .eq("id", id);

      if (error) throw error;

      // Update steps if provided
      if (input.steps) {
        // Delete existing steps
        await supabase
          .from("document_workflow_steps")
          .delete()
          .eq("workflow_id", id);

        // Insert new steps
        const stepsData = input.steps.map((s, idx) => ({
          workflow_id: id,
          step_order: idx + 1,
          name: s.name,
          approver_type: s.approver_type,
          approver_user_id: s.approver_user_id,
          approver_role: s.approver_role,
          is_required: s.is_required ?? true,
          auto_approve_after_days: s.auto_approve_after_days,
        }));

        await supabase
          .from("document_workflow_steps")
          .insert(stepsData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-workflows"] });
      toast.success("Workflow mis à jour");
    },
  });

  // Delete workflow
  const deleteWorkflow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("document_workflows")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-workflows"] });
      toast.success("Workflow supprimé");
    },
  });

  // Toggle workflow active status
  const toggleWorkflow = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("document_workflows")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-workflows"] });
    },
  });

  return {
    workflows,
    isLoading,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    toggleWorkflow,
  };
}

// Hook for document approval instances
export function useDocumentApproval(documentId?: string) {
  const { user, activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  // Get approval instance for a document
  const { data: approvalInstance, isLoading } = useQuery({
    queryKey: ["document-approval", documentId],
    queryFn: async () => {
      if (!documentId) return null;

      const { data, error } = await supabase
        .from("document_approval_instances")
        .select(`
          *,
          workflow:document_workflows(*),
          approvals:document_approvals(
            *,
            step:document_workflow_steps(*)
          )
        `)
        .eq("document_id", documentId)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as ApprovalInstance | null;
    },
    enabled: !!documentId,
  });

  // Get pending approvals for current user
  const { data: pendingApprovals = [], isLoading: isLoadingPending } = useQuery({
    queryKey: ["pending-approvals", user?.id, activeWorkspace?.id],
    queryFn: async () => {
      if (!user?.id || !activeWorkspace?.id) return [];

      const { data, error } = await supabase
        .from("document_approvals")
        .select(`
          *,
          instance:document_approval_instances(
            *,
            document:agency_documents(id, title, document_type)
          ),
          step:document_workflow_steps(*)
        `)
        .eq("approver_id", user.id)
        .eq("status", "pending");

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!activeWorkspace?.id && !documentId,
  });

  // Start approval workflow
  const startApproval = useMutation({
    mutationFn: async ({ documentId, workflowId }: { documentId: string; workflowId: string }) => {
      if (!user?.id) throw new Error("No user");

      // Get workflow steps
      const { data: steps } = await supabase
        .from("document_workflow_steps")
        .select("*")
        .eq("workflow_id", workflowId)
        .order("step_order", { ascending: true });

      if (!steps?.length) throw new Error("Workflow has no steps");

      // Create instance
      const { data: instance, error: instError } = await supabase
        .from("document_approval_instances")
        .insert({
          document_id: documentId,
          workflow_id: workflowId,
          started_by: user.id,
          status: 'in_progress',
        })
        .select()
        .single();

      if (instError) throw instError;

      // Create first approval request
      const firstStep = steps[0];
      let approverId = firstStep.approver_user_id;

      // If role-based, find a user with that role
      if (firstStep.approver_type === 'role' && firstStep.approver_role) {
        const { data: members } = await supabase
          .from("workspace_members")
          .select("user_id")
          .eq("workspace_id", activeWorkspace?.id)
          .eq("role", firstStep.approver_role as 'owner' | 'admin' | 'member' | 'viewer')
          .limit(1);
        
        approverId = members?.[0]?.user_id || user.id;
      } else if (firstStep.approver_type === 'any') {
        approverId = user.id; // Will be assigned when someone approves
      }

      await supabase.from("document_approvals").insert({
        instance_id: instance.id,
        step_id: firstStep.id,
        approver_id: approverId || user.id,
      });

      // Create notification
      if (approverId && approverId !== user.id) {
        await supabase.from("notifications").insert({
          workspace_id: activeWorkspace?.id,
          user_id: approverId,
          type: 'approval_request',
          title: 'Document en attente d\'approbation',
          message: 'Un document nécessite votre approbation',
          action_url: `/documents/${documentId}`,
        });
      }

      return instance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-approval"] });
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      toast.success("Workflow d'approbation démarré");
    },
    onError: (error) => {
      toast.error("Erreur lors du démarrage du workflow");
      console.error(error);
    },
  });

  // Approve step
  const approveStep = useMutation({
    mutationFn: async ({ approvalId, comment }: { approvalId: string; comment?: string }) => {
      if (!user?.id) throw new Error("No user");

      // Update approval
      const { data: approval, error: appError } = await supabase
        .from("document_approvals")
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          comment,
        })
        .eq("id", approvalId)
        .select(`
          *,
          instance:document_approval_instances(
            *,
            workflow:document_workflows(steps:document_workflow_steps(*))
          )
        `)
        .single();

      if (appError) throw appError;

      const instance = approval.instance;
      const steps = instance?.workflow?.steps || [];
      const currentStepIndex = steps.findIndex((s: WorkflowStep) => s.id === approval.step_id);
      const nextStep = steps[currentStepIndex + 1];

      if (nextStep) {
        // Create next approval
        let approverId = nextStep.approver_user_id;
        
        if (nextStep.approver_type === 'role' && nextStep.approver_role) {
          const { data: members } = await supabase
            .from("workspace_members")
            .select("user_id")
            .eq("workspace_id", activeWorkspace?.id)
            .eq("role", nextStep.approver_role as 'owner' | 'admin' | 'member' | 'viewer')
            .limit(1);
          
          approverId = members?.[0]?.user_id || user.id;
        }

        await supabase.from("document_approvals").insert({
          instance_id: instance.id,
          step_id: nextStep.id,
          approver_id: approverId || user.id,
        });

        await supabase
          .from("document_approval_instances")
          .update({ current_step: currentStepIndex + 2 })
          .eq("id", instance.id);

        // Notify next approver
        if (approverId && approverId !== user.id) {
          await supabase.from("notifications").insert({
            workspace_id: activeWorkspace?.id,
            user_id: approverId,
            type: 'approval_request',
            title: 'Document en attente d\'approbation',
            action_url: `/documents/${instance.document_id}`,
          });
        }
      } else {
        // All steps completed
        await supabase
          .from("document_approval_instances")
          .update({
            status: 'approved',
            completed_at: new Date().toISOString(),
          })
          .eq("id", instance.id);

        // Update document status
        await supabase
          .from("agency_documents")
          .update({ status: 'validated' })
          .eq("id", instance.document_id);

        // Notify document creator
        await supabase.from("notifications").insert({
          workspace_id: activeWorkspace?.id,
          user_id: instance.started_by,
          type: 'approval_completed',
          title: 'Document approuvé',
          message: 'Votre document a été approuvé',
          action_url: `/documents/${instance.document_id}`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-approval"] });
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      toast.success("Approbation enregistrée");
    },
  });

  // Reject step
  const rejectStep = useMutation({
    mutationFn: async ({ approvalId, comment }: { approvalId: string; comment?: string }) => {
      if (!user?.id) throw new Error("No user");

      const { data: approval, error: appError } = await supabase
        .from("document_approvals")
        .update({
          status: 'rejected',
          approved_at: new Date().toISOString(),
          comment,
        })
        .eq("id", approvalId)
        .select("instance_id, instance:document_approval_instances(document_id, started_by)")
        .single();

      if (appError) throw appError;

      await supabase
        .from("document_approval_instances")
        .update({
          status: 'rejected',
          completed_at: new Date().toISOString(),
        })
        .eq("id", approval.instance_id);

      // Notify document creator
      await supabase.from("notifications").insert({
        workspace_id: activeWorkspace?.id,
        user_id: approval.instance?.started_by,
        type: 'approval_rejected',
        title: 'Document rejeté',
        message: comment || 'Votre document a été rejeté',
        action_url: `/documents/${approval.instance?.document_id}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-approval"] });
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      toast.success("Document rejeté");
    },
  });

  return {
    approvalInstance,
    pendingApprovals,
    isLoading: isLoading || isLoadingPending,
    startApproval,
    approveStep,
    rejectStep,
  };
}
