'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Droplet, Clock, MapPin, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export default function MatchingRequestsPage() {
    // Assuming a specific endpoint for donor matches exists in your API structure
    const { data, isLoading } = useQuery({
        queryKey: ['donor-matches'],
        queryFn: async () => {
            // This endpoint needs to be implemented or matched to existing one
            const res = await fetch('/api/blood-requests/automated-matching', {
                method: 'POST',
                body: JSON.stringify({ requestId: 'context-aware-id' }) // In real app, fetch based on user session
            })
            return res.json()
        }
    })

    // Mock data for UI demonstration if API is not fully wired
    const matches = data?.matches || [
        { id: '1', score: 0.98, urgency: 'CRITICAL', distance: 2.5, bloodType: 'O_POSITIVE' },
        { id: '2', score: 0.85, urgency: 'HIGH', distance: 5.1, bloodType: 'O_POSITIVE' },
    ]

    if (isLoading) return <div className="p-8"><Skeleton className="h-40 w-full" /></div>

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-bold">Suggested Matches</h1>
            <p className="text-muted-foreground">Based on your blood type, location, and reputation.</p>

            <div className="grid gap-4">
                {matches.map((match: any, idx: number) => (
                    <motion.div
                        key={match.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white p-6 rounded-xl shadow-sm border flex flex-col md:flex-row justify-between items-center gap-4 hover:border-red-200 transition-colors"
                    >
                        <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">
                                {match.bloodType?.replace('_', '') || 'O+'}
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-lg">Blood Request #{match.id}</h3>
                                    <Badge variant={match.urgency === 'CRITICAL' ? 'destructive' : 'secondary'}>
                                        {match.urgency}
                                    </Badge>
                                </div>
                                <div className="flex gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1"><MapPin size={14} /> {match.distance}km away</span>
                                    <span className="flex items-center gap-1"><Clock size={14} /> Expires in 2h</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <div className="text-right">
                                <span className="text-2xl font-bold text-green-600">{(match.score * 100).toFixed(0)}%</span>
                                <p className="text-xs text-muted-foreground">Match Score</p>
                            </div>
                            <Button className="bg-red-600 hover:bg-red-700">
                                Accept Request <Check className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}