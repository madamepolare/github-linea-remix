import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WorkspaceEmailAccount {
  id: string;
  gmail_email: string;
  display_name: string | null;
  is_default: boolean;
  is_active: boolean;
  connected_by: string | null;
  created_at: string;
  updated_at: string;
}

interface WorkspaceEmailStatus {
  accounts: WorkspaceEmailAccount[];
  defaultAccount: WorkspaceEmailAccount | null;
  isLoading: boolean;
  isConnecting: boolean;
}

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

export function useWorkspaceEmail() {
  const { user, activeWorkspace } = useAuth();
  const [status, setStatus] = useState<WorkspaceEmailStatus>({
    accounts: [],
    defaultAccount: null,
    isLoading: true,
    isConnecting: false,
  });

  const fetchAccounts = useCallback(async () => {
    if (!user) {
      setStatus({ accounts: [], defaultAccount: null, isLoading: false, isConnecting: false });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('workspace-email-status');

      if (error) {
        console.error('Error fetching workspace email status:', error);
        setStatus(prev => ({ ...prev, accounts: [], defaultAccount: null, isLoading: false }));
      } else {
        setStatus(prev => ({
          ...prev,
          accounts: data?.accounts || [],
          defaultAccount: data?.defaultAccount || null,
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('Error fetching workspace email status:', error);
      setStatus(prev => ({ ...prev, accounts: [], defaultAccount: null, isLoading: false }));
    }
  }, [user]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Listen for OAuth callback messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'workspace-email-oauth-success') {
        setStatus(prev => ({ ...prev, isConnecting: false }));
        toast.success(`Email workspace connecté : ${event.data.email}`);
        fetchAccounts();
      } else if (event.data?.type === 'workspace-email-oauth-error') {
        setStatus(prev => ({ ...prev, isConnecting: false }));
        toast.error(`Erreur de connexion : ${event.data.error}`);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [fetchAccounts]);

  const connect = useCallback(async () => {
    if (!user || !activeWorkspace) {
      toast.error('Vous devez être connecté pour ajouter un email workspace');
      return;
    }

    setStatus(prev => ({ ...prev, isConnecting: true }));

    try {
      const { data: config, error: configError } = await supabase.functions.invoke('workspace-email-config');

      if (configError || !config?.clientId) {
        toast.error('Configuration Google OAuth manquante');
        setStatus(prev => ({ ...prev, isConnecting: false }));
        return;
      }

      const state = `${user.id}:${activeWorkspace.id}`;

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', config.clientId);
      authUrl.searchParams.set('redirect_uri', config.redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', GMAIL_SCOPES);
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      authUrl.searchParams.set('state', state);

      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl.toString(),
        'workspace-email-oauth',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
      );

      if (!popup) {
        toast.error("Impossible d'ouvrir la fenêtre de connexion. Vérifiez les bloqueurs de popups.");
        setStatus(prev => ({ ...prev, isConnecting: false }));
      }

      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setStatus(prev => ({ ...prev, isConnecting: false }));
        }
      }, 1000);

    } catch (error) {
      console.error('Error initiating workspace email connect:', error);
      toast.error("Erreur lors de la connexion de l'email workspace");
      setStatus(prev => ({ ...prev, isConnecting: false }));
    }
  }, [user, activeWorkspace]);

  const disconnect = useCallback(async (accountId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.functions.invoke('workspace-email-update', {
        body: { accountId, action: 'disconnect' },
      });

      if (error) {
        throw error;
      }

      toast.success('Email workspace déconnecté');
      fetchAccounts();
    } catch (error) {
      console.error('Error disconnecting workspace email:', error);
      toast.error("Erreur lors de la déconnexion de l'email");
    }
  }, [user, fetchAccounts]);

  const setDefault = useCallback(async (accountId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.functions.invoke('workspace-email-update', {
        body: { accountId, action: 'setDefault' },
      });

      if (error) {
        throw error;
      }

      toast.success('Email par défaut mis à jour');
      fetchAccounts();
    } catch (error) {
      console.error('Error setting default workspace email:', error);
      toast.error("Erreur lors de la mise à jour");
    }
  }, [user, fetchAccounts]);

  const updateDisplayName = useCallback(async (accountId: string, displayName: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.functions.invoke('workspace-email-update', {
        body: { accountId, action: 'updateDisplayName', displayName },
      });

      if (error) {
        throw error;
      }

      toast.success("Nom d'affichage mis à jour");
      fetchAccounts();
    } catch (error) {
      console.error('Error updating display name:', error);
      toast.error("Erreur lors de la mise à jour du nom");
    }
  }, [user, fetchAccounts]);

  const sendEmail = useCallback(async (params: {
    to: string | string[];
    subject: string;
    body: string;
    cc?: string[];
    bcc?: string[];
    replyTo?: string;
    contactId?: string;
    companyId?: string;
    leadId?: string;
    projectId?: string;
    tenderId?: string;
    workspaceEmailAccountId?: string;
  }) => {
    if (status.accounts.length === 0) {
      throw new Error('Aucun email workspace configuré');
    }

    const { data, error } = await supabase.functions.invoke('gmail-send-email', {
      body: {
        ...params,
        sendVia: 'workspace',
        workspaceEmailAccountId: params.workspaceEmailAccountId || status.defaultAccount?.id,
      },
    });

    if (error) {
      throw error;
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return data;
  }, [status.accounts, status.defaultAccount]);

  return {
    ...status,
    connect,
    disconnect,
    setDefault,
    updateDisplayName,
    sendEmail,
    refresh: fetchAccounts,
  };
}
