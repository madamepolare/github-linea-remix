import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GmailStatus {
  connected: boolean;
  email: string | null;
  lastSync: string | null;
}

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

export function useGmailConnection() {
  const { user, activeWorkspace } = useAuth();
  const [status, setStatus] = useState<GmailStatus>({ connected: false, email: null, lastSync: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!user) {
      setStatus({ connected: false, email: null, lastSync: null });
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('gmail-status');
      
      if (error) {
        console.error('Error checking Gmail status:', error);
        setStatus({ connected: false, email: null, lastSync: null });
      } else {
        setStatus({
          connected: data?.connected || false,
          email: data?.email || null,
          lastSync: data?.lastSync || null,
        });
      }
    } catch (error) {
      console.error('Error checking Gmail status:', error);
      setStatus({ connected: false, email: null, lastSync: null });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Listen for OAuth callback messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'gmail-oauth-success') {
        setIsConnecting(false);
        setStatus({
          connected: true,
          email: event.data.email,
          lastSync: new Date().toISOString(),
        });
        toast.success(`Gmail connecté : ${event.data.email}`);
      } else if (event.data?.type === 'gmail-oauth-error') {
        setIsConnecting(false);
        toast.error(`Erreur de connexion Gmail : ${event.data.error}`);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const connect = useCallback(async () => {
    if (!user || !activeWorkspace) {
      toast.error('Vous devez être connecté pour lier votre compte Gmail');
      return;
    }

    setIsConnecting(true);

    try {
      // Get Google OAuth config from edge function
      const { data: config, error: configError } = await supabase.functions.invoke('gmail-config');
      
      if (configError || !config?.clientId) {
        toast.error('Configuration Google OAuth manquante');
        setIsConnecting(false);
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

      // Open OAuth popup
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl.toString(),
        'gmail-oauth',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
      );

      if (!popup) {
        toast.error('Impossible d\'ouvrir la fenêtre de connexion. Vérifiez les bloqueurs de popups.');
        setIsConnecting(false);
      }

      // Check if popup was closed without completing
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setIsConnecting(false);
        }
      }, 1000);

    } catch (error) {
      console.error('Error initiating Gmail connect:', error);
      toast.error('Erreur lors de la connexion Gmail');
      setIsConnecting(false);
    }
  }, [user, activeWorkspace]);

  const disconnect = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase.functions.invoke('gmail-disconnect');
      
      if (error) {
        throw error;
      }

      setStatus({ connected: false, email: null, lastSync: null });
      toast.success('Gmail déconnecté');
    } catch (error) {
      console.error('Error disconnecting Gmail:', error);
      toast.error('Erreur lors de la déconnexion Gmail');
    }
  }, [user]);

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
  }) => {
    if (!status.connected) {
      throw new Error('Gmail non connecté');
    }

    const { data, error } = await supabase.functions.invoke('gmail-send-email', {
      body: params,
    });

    if (error) {
      throw error;
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return data;
  }, [status.connected]);

  return {
    ...status,
    isLoading,
    isConnecting,
    connect,
    disconnect,
    sendEmail,
    refresh: checkStatus,
  };
}
