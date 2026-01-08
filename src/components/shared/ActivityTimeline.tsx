import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Plus,
  Edit,
  ArrowRight,
  Link2,
  Unlink,
  Rocket,
  Send,
  FileCheck,
  Receipt,
  CreditCard,
  MessageSquare,
  UserPlus,
  CheckCircle,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useEntityActivities, ActivityType } from '@/hooks/useEntityActivities';
import { cn } from '@/lib/utils';

interface ActivityTimelineProps {
  entityType?: string;
  entityId?: string;
  workspaceId: string | undefined;
  className?: string;
  maxItems?: number;
  showHeader?: boolean;
}

const activityConfig: Record<ActivityType, { icon: React.ElementType; color: string; bgColor: string }> = {
  created: { icon: Plus, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  updated: { icon: Edit, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  status_changed: { icon: ArrowRight, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  linked: { icon: Link2, color: 'text-indigo-600', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' },
  unlinked: { icon: Unlink, color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-900/30' },
  converted: { icon: Rocket, color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  document_sent: { icon: Send, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  document_signed: { icon: FileCheck, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  invoice_sent: { icon: Receipt, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  invoice_paid: { icon: CreditCard, color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' },
  comment_added: { icon: MessageSquare, color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-900/30' },
  assigned: { icon: UserPlus, color: 'text-violet-600', bgColor: 'bg-violet-100 dark:bg-violet-900/30' },
  completed: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  email_sent: { icon: Send, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  email_received: { icon: MessageSquare, color: 'text-indigo-600', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' },
  action_created: { icon: Plus, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  action_completed: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  stage_changed: { icon: ArrowRight, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
};

function ActivityItem({ 
  activity 
}: { 
  activity: {
    id: string;
    activity_type: ActivityType;
    title: string;
    description?: string;
    created_at: string;
    entity_type: string;
    related_entity_type?: string;
  };
}) {
  const config = activityConfig[activity.activity_type] || { 
    icon: Activity, 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-100' 
  };
  const Icon = config.icon;

  const timeAgo = formatDistanceToNow(new Date(activity.created_at), { 
    addSuffix: true, 
    locale: fr 
  });

  return (
    <div className="flex gap-3 group">
      {/* Timeline dot and line */}
      <div className="flex flex-col items-center">
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
          config.bgColor
        )}>
          <Icon className={cn("h-4 w-4", config.color)} />
        </div>
        <div className="w-px h-full bg-border group-last:hidden" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <p className="text-sm font-medium">{activity.title}</p>
        {activity.description && (
          <p className="text-sm text-muted-foreground mt-0.5">{activity.description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1" title={format(new Date(activity.created_at), 'PPPp', { locale: fr })}>
          {timeAgo}
        </p>
      </div>
    </div>
  );
}

export function ActivityTimeline({ 
  entityType, 
  entityId, 
  workspaceId, 
  className,
  maxItems = 20,
  showHeader = true,
}: ActivityTimelineProps) {
  const { activities, isLoading } = useEntityActivities(entityType, entityId, workspaceId);

  const displayedActivities = activities.slice(0, maxItems);

  if (isLoading) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activité récente
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (displayedActivities.length === 0) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activité récente
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            Aucune activité pour le moment
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activité récente
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-0 pr-4">
            {displayedActivities.map((activity) => (
              <ActivityItem 
                key={activity.id} 
                activity={activity as { id: string; activity_type: ActivityType; title: string; description?: string; created_at: string; entity_type: string; related_entity_type?: string }}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
