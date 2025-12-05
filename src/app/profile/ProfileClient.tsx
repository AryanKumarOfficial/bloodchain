// app/profile/ProfileClient.tsx
'use client'

import React from 'react'
import type {Session} from 'next-auth'
import {useMutation, useQuery} from '@tanstack/react-query'
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar'
import {Badge} from '@/components/ui/badge'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Skeleton} from '@/components/ui/skeleton'
import {Trophy, Droplet, Activity, ShieldCheck} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {toast} from "sonner";

export default function ProfileClient({session}: { session: Session | null }) {

    const {data: reputationData, isLoading} = useQuery({
        queryKey: ['reputation', session?.user?.email],
        queryFn: async () => {
            const res = await fetch('/api/profile/reputation')
            if (!res.ok) throw new Error('Failed to load')
            return res.json()
        },
        enabled: !!session
    })

    const registerVerifier = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/verifier/register', {method: 'POST'})
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            return data
        },
        onSuccess: () => {
            toast.success(`🎉 You are now a Verifier!`)
            window.location.reload()
        },
        onError: (err: any) => {
            toast.error(`Registration failed: ${err.message}`)
        }
    })

    if (!session) return <div className="p-8">Please log in.</div>

    const stats = reputationData?.data || {}
    const isEligible =stats.totalScore >= 500
    const isVerifier = (session.user as any)?.role === 'VERIFIER'

    return (
        <div className="container mx-auto p-6 space-y-8 max-w-5xl">

            {/* Header */}
            <div
                className="flex flex-col md:flex-row gap-6 items-center md:items-start bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={session.user?.image || ''}/>
                    <AvatarFallback className="text-2xl bg-red-100 text-red-600">
                        {session.user?.name?.[0] ?? 'U'}
                    </AvatarFallback>
                </Avatar>

                <div className="space-y-2 text-center md:text-left flex-1">
                    <h1 className="text-3xl font-bold">{session.user?.name}</h1>
                    <p className="text-muted-foreground">{session.user?.email}</p>

                    <div className="flex gap-2 justify-center md:justify-start">
                        <Badge variant="outline" className="border-blue-500 text-blue-500">
                            {(session.user as any)?.role ?? 'User'}
                        </Badge>

                        {(session.user as any)?.verificationStatus === 'VERIFIED_BLOCKCHAIN' && (
                            <Badge className="bg-green-500 hover:bg-green-600">
                                <ShieldCheck className="w-3 h-3 mr-1"/> Verified
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Reputation */}
                <div
                    className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-900/10 p-6 rounded-xl border border-amber-200 dark:border-amber-800 w-full md:w-auto min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                        <Trophy className="text-amber-600 h-5 w-5"/>
                        <span className="font-semibold text-amber-800 dark:text-amber-400">Reputation</span>
                    </div>

                    {isLoading ? (
                        <Skeleton className="h-8 w-20"/>
                    ) : (
                        <>
                            <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                                {stats.totalScore || 0}
                            </div>
                            <div className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                                Level: {stats.level || 'Bronze'} {stats.badge}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Donations</CardTitle>
                        <Droplet className="h-4 w-4 text-red-500"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalDonations || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Units collected</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
                        <Activity className="h-4 w-4 text-green-500"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {((stats.successRate ?? 0) * 100).toFixed(0)}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Completion rate</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Trust Score</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-blue-500"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(stats.trustScore ?? 0).toFixed(0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Community trust</p>
                    </CardContent>
                </Card>

            </div>

            {/* Verifier CTA */}
            {isEligible && !isVerifier && (
                <Card className="mt-8 border-blue-200 bg-blue-50">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-blue-900">Become a Community Verifier</h3>
                            <p className="text-blue-700">
                                You are eligible to join the verification network and earn extra tokens.
                            </p>
                        </div>

                        <Button
                            onClick={() => registerVerifier.mutate()}
                            disabled={registerVerifier.isPending}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {registerVerifier.isPending ? 'Registering...' : 'Apply Now'}
                        </Button>
                    </CardContent>
                </Card>
            )}

        </div>
    )
}
