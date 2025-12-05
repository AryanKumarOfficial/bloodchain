'use client'

import {useState} from 'react'
import {Button} from '@/components/ui/button'
import {Card, CardHeader, CardTitle, CardContent} from '@/components/ui/card'
import {Loader2, ShieldAlert, RefreshCw, Activity} from 'lucide-react'
import {toast} from 'sonner'

export default function AdminDashboard() {
    const [loading, setLoading] = useState<string | null>(null)

    const triggerJob = async (jobName: string, endpoint: string) => {
        try {
            setLoading(jobName)
            // NOTE: In production, this secret should be protected or proxied.
            // For this implementation, we assume a public env var for the client demo.
            const secret = process.env.NEXT_PUBLIC_CRON_SECRET || ''

            const res = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${secret}`
                }
            })

            const data = await res.json()

            if (res.ok) {
                toast.success(`${jobName}: ${data.message}`)
            } else {
                toast.error(`Failed: ${data.error}`)
            }
        } catch (err) {
            toast.error('Network connection failed')
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="container mx-auto p-8 max-w-5xl">
            <h1 className="text-3xl font-bold mb-2">Admin System Controls</h1>
            <p className="text-muted-foreground mb-8">Manually trigger autonomous system agents and background jobs.</p>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Autonomous Matching Agent */}
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <RefreshCw className="text-blue-500 h-5 w-5"/> Matching Engine
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 mb-6">
                            Force run the AI matching algorithm to pair all open requests with eligible donors
                            immediately.
                        </p>
                        <Button
                            onClick={() => triggerJob('Matching Job', '/api/cron/autonomous-matching')}
                            disabled={!!loading}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                            {loading === 'Matching Job' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Run AI Matching
                        </Button>
                    </CardContent>
                </Card>

                {/* Fraud Detection Agent */}
                <Card className="border-l-4 border-l-red-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldAlert className="text-red-500 h-5 w-5"/> Security Scan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 mb-6">
                            Scan recent system activities for suspicious patterns, velocity anomalies, and device
                            fingerprinting.
                        </p>
                        <Button
                            onClick={() => triggerJob('Fraud Scan', '/api/cron/fraud-detection')}
                            disabled={!!loading}
                            variant="destructive"
                            className="w-full"
                        >
                            {loading === 'Fraud Scan' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Run Fraud Detection
                        </Button>
                    </CardContent>
                </Card>

                {/* Reputation Management */}
                <Card className="border-l-4 border-l-amber-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="text-amber-500 h-5 w-5"/> Reputation System
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 mb-6">
                            Apply decay algorithms to inactive users and normalize reputation scores across the
                            platform.
                        </p>
                        <Button
                            onClick={() => triggerJob('Reputation Decay', '/api/cron/reputation-decay')}
                            disabled={!!loading}
                            variant="outline"
                            className="w-full border-amber-200 text-amber-700 hover:bg-amber-50"
                        >
                            {loading === 'Reputation Decay' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Update Scores
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}