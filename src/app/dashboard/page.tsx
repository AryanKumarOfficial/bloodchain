'use client'

import { useSession } from 'next-auth/react'
import { StatsGrid } from './StatsGrid'
import { QuickActions } from './QuickActions'
import BloodMap from '@/components/maps/BloodMap'
import { useActiveRequests } from '@/hooks/useBloodRequests'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardPage() {
    const { data: session } = useSession()

    // Fetch stats using React Query instead of server actions directly in component
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const res = await fetch('/api/dashboard/stats')
            return res.json()
        }
    })

    const { data: activeRequests } = useActiveRequests()

    // Prepare map data
    const mapLocations = activeRequests?.data?.requests?.map((req: any) => ({
        lat: req.latitude || 0,
        lng: req.longitude || 0,
        title: `${req.unitsNeeded} units of ${req.bloodType}`,
        type: 'REQUEST'
    })) || []

    if (!session) return null
    const hasData = mapLocations.length > 0 || (stats?.data?.totalRewards > 0 || stats?.data?.completedDonations > 0);


    return (
        <div className="p-4 sm:p-8 bg-gray-50/50 min-h-screen space-y-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {session.user.role === 'DONOR' ? 'Donor Dashboard' : 'Recipient Dashboard'}
                        </h1>
                        <p className="text-muted-foreground">
                            Welcome back, {session.user.name}
                        </p>
                    </div>
                    {/* ... System Operational badge ... */}
                </div>

                {/* Stats Grid */}
                {statsLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
                    </div>
                ) : (
                    <StatsGrid stats={stats?.data || {}} />
                )}

                {/* EMPTY STATE HANDLING */}
                {!hasData && !statsLoading && session.user.role === 'DONOR' ? (
                    <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
                        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                            {/* You can use a lucide icon here like <Inbox /> */}
                            📭
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No Activity Yet</h3>
                        <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
                            There are currently no active blood requests in your area. You will be notified when someone needs help.
                        </p>
                        <div className="mt-6">
                            <QuickActions role={session.user.role} />
                        </div>
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Left Column: Actions & Map */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white p-6 rounded-xl border shadow-sm">
                                <h2 className="text-xl font-semibold mb-4">Live Activity Map</h2>
                                <BloodMap locations={mapLocations} />
                            </div>
                            <QuickActions role={session.user.role} />
                        </div>

                        {/* Right Column: Notifications */}
                        <div className="bg-white p-6 rounded-xl border shadow-sm h-fit">
                            <h2 className="text-xl font-semibold mb-4">Recent Notifications</h2>
                            <div className="space-y-4">
                                <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                    </span>
                                    System Online
                                </div>
                                <p className="text-sm text-gray-500 text-center py-4">
                                    No new alerts
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}