// app/dashboard/page.tsx

'use client'

import {useSession} from 'next-auth/react'
import {JSX, useEffect, useState} from 'react'
import {logToServer} from "@/lib/actions/log.action";
import {LogLevel} from "@/types/logger";

interface DashboardStats {
    activeRequests: number
    matchedDonors: number
    completedDonations: number
    totalRewards: number
}

export default function DashboardPage(): JSX.Element {
    const {data: session, status} = useSession()
    const [stats, setStats] = useState<DashboardStats>({
        activeRequests: 0,
        matchedDonors: 0,
        completedDonations: 0,
        totalRewards: 0,
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async (): Promise<void> => {
        try {
            setLoading(true)

            // Fetch dashboard statistics
            const response = await fetch('/api/dashboard/stats')
            const data = await response.json()

            if (data.success) {
                setStats(data.data)
            }

            await logToServer(LogLevel.INFO, "Dashboard data fetched")
        } catch (error) {
            await logToServer(LogLevel.ERROR, "Failed to fetch dashboard data", {error})
        } finally {
            setLoading(false)
        }
    }

    if (status === 'loading' || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
        )
    }
    //
    // if (status === 'unauthenticated') {
    //     return (<>
    //         <div>Redirecting to sign in...</div>
    //         <p>
    //             {session?.user?.name}
    //         </p>
    //     </>)
    // }

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900">
                        Welcome, {session?.user?.name}! 👋
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Role: <span className="font-semibold">{session?.user?.role}</span>
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    {[
                        {label: 'Active Requests', value: stats.activeRequests, icon: '📋'},
                        {label: 'Matched Donors', value: stats.matchedDonors, icon: '💉'},
                        {label: 'Completed', value: stats.completedDonations, icon: '✅'},
                        {label: 'Rewards Earned', value: stats.totalRewards, icon: '🎁'},
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition"
                        >
                            <div className="text-4xl mb-2">{stat.icon}</div>
                            <p className="text-gray-600 text-sm">{stat.label}</p>
                            <p className="text-3xl font-bold text-red-600">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-2 gap-6">
                    {session?.user?.role === 'RECIPIENT' && (
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-2xl font-bold mb-4">📝 Create Request</h2>
                            <button
                                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition">
                                New Blood Request
                            </button>
                        </div>
                    )}

                    {session?.user?.role === 'DONOR' && (
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-2xl font-bold mb-4">🩸 Donate Blood</h2>
                            <button
                                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition">
                                View Matching Requests
                            </button>
                        </div>
                    )}

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold mb-4">⚙️ Settings</h2>
                        <button
                            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition">
                            Profile Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
