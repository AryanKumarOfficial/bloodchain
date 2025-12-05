'use client'

import {StatsGrid} from './StatsGrid'
import {QuickActions} from './QuickActions'
import BloodMap, {Location} from '@/components/maps/BloodMap'
import {useActiveRequests} from '@/hooks/useBloodRequests'
import {useQuery} from '@tanstack/react-query'
import {Skeleton} from '@/components/ui/skeleton'
import {Inbox, Activity} from 'lucide-react'
import {Session} from 'next-auth'
import {BroadcastButton} from '@/components/BroadcastButton' // Import the component
import {AlertTriangle} from 'lucide-react' // Optional icon
interface DashboardContentProps {
    session: Session
}

export function DashboardContent({session}: DashboardContentProps) {
    // 1. Fetch Stats
    // Note: enabled is true because we know session exists from the server check
    const {data: statsData, isLoading: statsLoading} = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const res = await fetch('/api/dashboard/stats')
            if (!res.ok) return {data: {activeRequests: 0, matchedDonors: 0, completedDonations: 0, totalRewards: 0}}
            return res.json()
        },
    })

    console.log(`statsData`, statsData)

    // 2. Fetch Active Requests
    const {data: activeRequestsData, isLoading: requestsLoading} = useActiveRequests()

    const stats = statsData?.data || {
        activeRequests: 0,
        matchedDonors: 0,
        completedDonations: 0,
        totalRewards: 0
    }

    // Prepare map data
    const requests = activeRequestsData?.data?.requests || []
    const mapLocations: Location[] = requests.map((req: any) => ({
        lat: req.latitude || 0,
        lng: req.longitude || 0,
        title: `${req.unitsNeeded} units of ${req.bloodType}`,
        type: 'REQUEST'
    }))

    const hasMapData = mapLocations.length > 0

    const { data: myRequestsData } = useQuery({
        queryKey: ['my-requests'],
        queryFn: async () => {
            const res = await fetch('/api/requests')
            return res.json()
        },
        enabled: session.user.role === 'RECIPIENT'
    })

    const myRequests = myRequestsData?.data || []

    return (
        <div className="p-4 sm:p-8 bg-gray-50/50 min-h-screen space-y-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                            {`${session.user.role} Dashboard`}
                        </h1>
                        <p className="text-muted-foreground">
                            Welcome back, <span className="font-semibold text-foreground">{session.user.name}</span>
                        </p>
                    </div>
                    <div
                        className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        <span className="relative flex h-2 w-2">
                            <span
                                className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        System Operational
                    </div>
                </div>

                {/* Stats Grid */}
                {statsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl"/>)}
                    </div>
                ) : (
                    <StatsGrid stats={stats}/>
                )}

                {session.user.role === 'RECIPIENT' && myRequests.length > 0 && (
                    <div className="bg-white p-6 rounded-xl border shadow-sm mb-8">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <AlertTriangle className="text-orange-500" />
                            My Active Requests
                        </h2>

                        <div className="space-y-4">
                            {myRequests.map((req: any) => (
                                <div key={req.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg bg-slate-50 gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-lg">{req.bloodType.replace('_', ' ')}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                req.urgencyLevel === 'EMERGENCY' ? 'bg-red-100 text-red-700' :
                                                    req.urgencyLevel === 'CRITICAL' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-blue-100 text-blue-700'
                                            }`}>
                                {req.urgencyLevel}
                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {req.unitsNeeded} Units • {new Date(req.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>

                                    {/* ONLY SHOW BROADCAST BUTTON FOR HIGH URGENCY REQUESTS */}
                                    {(req.urgencyLevel === 'EMERGENCY' || req.urgencyLevel === 'CRITICAL') && (
                                        <div className="w-full sm:w-auto">
                                            <BroadcastButton
                                                requestId={req.id}
                                                urgencyLevel={req.urgencyLevel}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="grid lg:grid-cols-3 gap-8">

                    {/* Left Column: Actions & Map */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Map Section */}
                        <div className="bg-white p-1 rounded-xl border shadow-sm overflow-hidden">
                            <div className="p-5 border-b flex justify-between items-center">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <Activity className="text-red-500"/>
                                    Live Activity Map
                                </h2>
                                <span
                                    className="text-xs text-muted-foreground">{mapLocations.length} active requests</span>
                            </div>

                            {hasMapData ? (
                                <div className="p-1">
                                    <BloodMap locations={mapLocations}/>
                                </div>
                            ) : (
                                <div
                                    className="h-[300px] flex flex-col items-center justify-center text-center p-8 bg-slate-50/50">
                                    <div className="bg-slate-100 p-4 rounded-full mb-4">
                                        <Inbox className="h-8 w-8 text-slate-400"/>
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-900">No Active Requests Nearby</h3>
                                    <p className="text-sm text-slate-500 max-w-xs mt-1">
                                        There are currently no blood requests in your immediate area. You will be
                                        notified when someone needs help.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <QuickActions role={session.user.role}/>
                    </div>

                    {/* Right Column: Notifications/Status */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl border shadow-sm h-fit">
                            <h2 className="text-lg font-semibold mb-4">System Status</h2>
                            <div className="space-y-4">
                                <div
                                    className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm flex items-center gap-2">
                                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"/>
                                    Socket Connection: Stable
                                </div>
                                <div className="p-3 bg-slate-50 text-slate-600 rounded-lg text-sm">
                                    <p className="font-medium">Identity Verification</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {session.user.verificationStatus === 'VERIFIED_BLOCKCHAIN'
                                            ? '✅ Verified on Blockchain'
                                            : '⚠️ Pending Verification'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}