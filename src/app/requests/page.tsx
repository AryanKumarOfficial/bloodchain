'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { MapPin, Clock, Droplet, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function RequestsPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['active-requests'],
        queryFn: async () => {
            const res = await fetch('/api/requests/active')
            return res.json()
        }
    })

    const requests = data?.data?.requests || []

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Active Blood Requests</h1>
                    <p className="text-muted-foreground">Real-time needs from patients near you.</p>
                </div>
                <Button variant="default" className="bg-red-600 hover:bg-red-700">
                    Filter by Location
                </Button>
            </div>

            {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-[250px] rounded-xl" />
                    ))}
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {requests.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-muted-foreground bg-slate-50 rounded-xl border border-dashed">
                            <Droplet className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                            <p>No active requests found at the moment.</p>
                        </div>
                    ) : (
                        requests.map((req: any) => (
                            <Card key={req.id} className="hover:shadow-md transition-shadow border-l-4 border-l-red-500">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <Badge variant="outline" className="px-3 py-1 text-base font-bold border-red-200 text-red-700 bg-red-50">
                                            {req.bloodType.replace('_', ' ')}
                                        </Badge>
                                        <Badge variant={['CRITICAL', 'EMERGENCY'].includes(req.urgencyLevel) ? 'destructive' : 'secondary'}>
                                            {req.urgencyLevel}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm">
                                    <div className="flex items-center gap-2 text-slate-700">
                                        <Droplet className="h-4 w-4 text-red-500" />
                                        <span className="font-medium">{req.unitsNeeded} Units Required</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <MapPin className="h-4 w-4" />
                                        <span>
                                            {req.latitude ? `${req.latitude.toFixed(4)}, ${req.longitude.toFixed(4)}` : 'Location Hidden'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Clock className="h-4 w-4" />
                                        <span>Posted {formatDistanceToNow(new Date(req.createdAt))} ago</span>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full" variant="outline">
                                        View Details
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}