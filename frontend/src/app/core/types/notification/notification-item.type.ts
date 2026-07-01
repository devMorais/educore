// Interface de uma notificação
export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}
