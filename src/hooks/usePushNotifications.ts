import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type SendTestResult = { success: boolean; message?: string };

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  permission: NotificationPermission | 'default';
}

export function usePushNotifications() {
  const { activeWorkspace } = useAuth();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: true,
    permission: 'default'
  });

  // Check if push notifications are supported
  useEffect(() => {
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    const permission = isSupported ? Notification.permission : 'default';
    
    setState(prev => ({
      ...prev,
      isSupported,
      permission,
      isLoading: isSupported
    }));

    if (isSupported) {
      checkExistingSubscription();
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const checkExistingSubscription = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Check if service worker is registered
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Check existing subscription
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // Verify it exists in database
        const { data } = await supabase
          .from('push_subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint)
          .maybeSingle();

        setState(prev => ({
          ...prev,
          isSubscribed: !!data,
          isLoading: false
        }));
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error checking push subscription:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!state.isSupported) {
      toast.error('Les notifications push ne sont pas supportées sur ce navigateur');
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));

      if (permission !== 'granted') {
        toast.error('Permission refusée pour les notifications');
        setState(prev => ({ ...prev, isLoading: false }));
        return false;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Get VAPID public key from environment or edge function
      const { data: configData, error: configError } = await supabase.functions.invoke('get-vapid-key');
      
      if (configError || !configData?.publicKey) {
        toast.error('Configuration push non disponible. Contactez l\'administrateur.');
        setState(prev => ({ ...prev, isLoading: false }));
        return false;
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(configData.publicKey) as BufferSource
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !activeWorkspace) {
        throw new Error('User or workspace not found');
      }

      // Get subscription keys
      const keys = subscription.toJSON().keys;
      
      // Save to database
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        workspace_id: activeWorkspace.id,
        endpoint: subscription.endpoint,
        p256dh: keys?.p256dh || '',
        auth: keys?.auth || '',
        user_agent: navigator.userAgent
      }, {
        onConflict: 'user_id,endpoint'
      });

      if (error) throw error;

      setState(prev => ({ ...prev, isSubscribed: true, isLoading: false }));
      toast.success('Notifications push activées !');
      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast.error('Erreur lors de l\'activation des notifications push');
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [state.isSupported, activeWorkspace]);

  const unsubscribe = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();

          // Remove from database
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('user_id', user.id)
              .eq('endpoint', subscription.endpoint);
          }
        }
      }

      setState(prev => ({ ...prev, isSubscribed: false, isLoading: false }));
      toast.success('Notifications push désactivées');
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      toast.error('Erreur lors de la désactivation');
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, []);

  const sendTestNotification = useCallback(async (): Promise<SendTestResult> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Utilisateur non connecté');
        return { success: false, message: 'User not authenticated' };
      }

      if (!activeWorkspace?.id) {
        toast.error('Espace de travail non trouvé');
        return { success: false, message: 'Workspace not found' };
      }

      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: user.id,
          workspaceId: activeWorkspace.id,
          title: '🔔 Test de notification',
          body: 'Si vous voyez ceci, les notifications push fonctionnent correctement !',
          tag: 'test-notification',
          url: '/settings'
        }
      });

      if (error) {
        console.error('Test notification error:', error);
        toast.error("Erreur lors de l'envoi de la notification test");
        return { success: false, message: error.message };
      }

      if (data?.sent > 0) {
        toast.success('Notification test envoyée !');
        return { success: true };
      }

      if (Array.isArray(data?.errors) && data.errors.length > 0) {
        toast.error(`Erreur push: ${data.errors[0]}`);
        return { success: false, message: data.errors[0] };
      }

      toast.warning('Aucun appareil enregistré pour recevoir les notifications');
      return { success: false, message: 'No subscriptions found' };
    } catch (error) {
      console.error('Test notification error:', error);
      toast.error("Erreur lors de l'envoi");
      return { success: false, message: String(error) };
    }
  }, [activeWorkspace?.id]);
  return {
    ...state,
    subscribe,
    unsubscribe,
    checkExistingSubscription,
    sendTestNotification
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
