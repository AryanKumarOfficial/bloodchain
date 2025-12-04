'use client'

import { useSession } from 'next-auth/react'
import { StatsGrid } from './StatsGrid'
import { QuickActions } from './QuickActions'
import BloodMap from '@/components/maps/BloodMap'
import { useActiveRequests } from '@/hooks/useBloodRequests'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { Inbox, Activity } from 'lucide-react' // Added icons for better UI
import { Location } from '@/components/maps/BloodMap'

export default function DashboardPage() {
    const { data: session, status } = useSession()

    // 1. Fetch Stats
    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const res = await fetch('/api/dashboard/stats')
            if (!res.ok) return { data: { activeRequests: 0, matchedDonors: 0, completedDonations: 0, totalRewards: 0 } }
            return res.json()
        },
        enabled: status === 'authenticated'
    })

    // 2. Fetch Active Requests (for Map)
    const { data: activeRequestsData, isLoading: requestsLoading } = useActiveRequests()

    // 3. Handle Loading State (Session)
    if (status === 'loading') {
        return (
            <div className="p-4 sm:p-8 bg-gray-50/50 min-h-screen space-y-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    <Skeleton className="h-12 w-1/3" />
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
                    </div>
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                </div>
            </div>
        )
    }

    // 4. Handle Unauthenticated State
    if (!session) {
        // Middleware usually handles this, but as a fallback:
        return null
    }

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

    // Determine if there is data to show
    const hasMapData = mapLocations.length > 0
    const hasStats = stats.totalRewards > 0 || stats.completedDonations > 0 || stats.matchedDonors > 0

    return (
        <div className="p-4 sm:p-8 bg-gray-50/50 min-h-screen space-y-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                            {session.user.role === 'DONOR' ? 'Donor Dashboard' : 'Recipient Dashboard'}
                        </h1>
                        <p className="text-muted-foreground">
                            Welcome back, <span className="font-semibold text-foreground">{session.user.name}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        System Operational
                    </div>
                </div>

                {/* Stats Grid */}
                {statsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
                    </div>
                ) : (
                    <StatsGrid stats={stats} />
                )}

                {/* Main Content Area */}
                <div className="grid lg:grid-cols-3 gap-8">

                    {/* Left Column: Actions & Map */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Map Section */}
                        <div className="bg-white p-1 rounded-xl border shadow-sm overflow-hidden">
                            <div className="p-5 border-b flex justify-between items-center">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <Activity className="text-red-500" />
                                    Live Activity Map
                                </h2>
                                <span className="text-xs text-muted-foreground">{mapLocations.length} active requests</span>
                            </div>

                            {hasMapData ? (
                                <div className="p-1">
                                    <BloodMap locations={mapLocations} />
                                </div>
                            ) : (
                                <div className="h-[300px] flex flex-col items-center justify-center text-center p-8 bg-slate-50/50">
                                    <div className="bg-slate-100 p-4 rounded-full mb-4">
                                        <Inbox className="h-8 w-8 text-slate-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-900">No Active Requests Nearby</h3>
                                    <p className="text-sm text-slate-500 max-w-xs mt-1">
                                        There are currently no blood requests in your immediate area. You will be notified when someone needs help.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <QuickActions role={session.user.role} />
                    </div>

                    {/* Right Column: Notifications/Status */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl border shadow-sm h-fit">
                            <h2 className="text-lg font-semibold mb-4">System Status</h2>
                            <div className="space-y-4">
                                <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm flex items-center gap-2">
                                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
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