'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Megaphone, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface BroadcastButtonProps {
    requestId: string
    urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EMERGENCY'
}

export function BroadcastButton({
                                    requestId,
                                    urgencyLevel,
                                }: BroadcastButtonProps) {
    const [loading, setLoading] = useState(false)

    const handleBroadcast = async () => {
        if (
            !confirm(
                `Are you sure? This will send ${urgencyLevel} alerts to all nearby donors.`,
            )
        )
            return

        setLoading(true)
        try {
            const res = await fetch('/api/requests/broadcast-urgent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, urgencyLevel }), // ✅ include it if backend needs it
            })

            if (!res.ok) throw new Error('Failed to broadcast')
            toast.success('Emergency alert sent to nearby donors!')
        } catch (error) {
            toast.error('Failed to send alert')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            onClick={handleBroadcast}
            disabled={loading}
            variant="destructive"
            className="w-full gap-2 cursor-pointer"
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Megaphone className="h-4 w-4" />
            )}
            Broadcast Emergency Alert
        </Button>
    )
}
