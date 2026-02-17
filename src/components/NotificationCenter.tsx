import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, Circle, CheckCheck } from "lucide-react";
import { Notification, subscribeNotifications, markAsRead } from "@/lib/notifications";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export function NotificationCenter() {
  const { address } = useAccount();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!address) return;

    // Subscribe to notifications
    const unsubscribe = subscribeNotifications(address.toLowerCase(), (data) => {
      setNotifications(data);
    });

    return () => unsubscribe();
  }, [address]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
      setIsOpen(false);
    }
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "staking_reward": return <Circle className="w-2 h-2 fill-green-500 text-green-500" />;
      case "ticket_reply": return <Circle className="w-2 h-2 fill-blue-500 text-blue-500" />;
      case "referral_joined": return <Circle className="w-2 h-2 fill-purple-500 text-purple-500" />;
      default: return <Circle className="w-2 h-2 fill-gray-500 text-gray-500" />;
    }
  };

  if (!address) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-background" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} New
            </Badge>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer flex gap-3 ${
                    !notification.isRead ? "bg-muted/20" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="mt-1 flex-shrink-0">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className={`text-sm ${!notification.isRead ? "font-medium" : "text-muted-foreground"}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground pt-1">
                      {format(notification.createdAt, "MMM d, p")}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="self-center">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {notifications.length > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs h-8 text-muted-foreground"
              onClick={() => {
                notifications.forEach((n) => !n.isRead && markAsRead(n.id));
              }}
            >
              <CheckCheck className="w-3 h-3 mr-2" />
              Mark all as read
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
