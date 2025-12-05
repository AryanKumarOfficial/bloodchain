import {CheckCircle, ClipboardList, Gift, Users,} from 'lucide-react'
import {DashboardStats} from '@/lib/types/dashboard'
import Link from "next/link";

interface StatsGridProps {
    stats: DashboardStats
}

// This is a Server Component by default (no 'use client')
// It just receives props and renders UI.
export function StatsGrid({stats}: StatsGridProps) {
    const statItems = [
        {
            label: 'Active Requests',
            value: stats.activeRequests,
            icon: ClipboardList,
            href: '/dashboard/requests',
        },
        {
            label: 'Matched Donors',
            value: stats.matchedDonors,
            icon: Users,
            href: '/dashboard',
        },
        {
            label: 'Completed', value: stats.completedDonations, icon: CheckCircle,
            href: '/dashboard',
        },
        {
            label: 'Rewards Earned', value: stats.totalRewards, icon: Gift,
            href: '/dashboard',
        },
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statItems.map((stat) => (
                <Link
                    href={stat.href}
                    key={stat.label}
                    className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100"
                >
                    <stat.icon className="h-8 w-8 text-red-600 mb-3" strokeWidth={1.5}/>
                    <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </Link>
            ))}
        </div>
    )
}