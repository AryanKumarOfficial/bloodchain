'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { Bell, Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function NotificationsPage() {
    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const res = await fetch('/api/notifications')
            return res.json()
        }
    })

    const markRead = useMutation({
        mutationFn: async (id: string) => {
            await fetch(`/api/notifications/${id}/read`, { method: 'PUT' })
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
    })

    const notifications = data?.data || []

    return (
        <div className="container mx-auto p-6 max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
                <Bell className="h-8 w-8 text-red-600" />
                <h1 className="text-2xl font-bold">Notifications</h1>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No notifications yet.
                        </div>
                    ) : (
                        notifications.map((notif: any) => (
                            <div
                                key={notif.id}
                                className={`p-4 rounded-lg border transition-all flex gap-4 ${
                                    notif.read ? 'bg-background opacity-60' : 'bg-white dark:bg-slate-900 border-l-4 border-l-red-500 shadow-sm'
                                }`}
                            >
                                <div className="flex-1">
                                    <h4 className={`text-sm font-semibold ${!notif.read && 'text-foreground'}`}>
                                        {notif.title}
                                    </h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {notif.message}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-2">
                                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                    </p>
                                </div>
                                {!notif.read && (
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => markRead.mutate(notif.id)}
                                        title="Mark as read"
                                    >
                                        <Check className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}