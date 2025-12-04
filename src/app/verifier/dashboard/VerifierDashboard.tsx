'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle, XCircle, FileText, AlertTriangle, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import type { Session } from "next-auth"

export default function VerifierDashboard({ session }: { session: Session }) {
    const queryClient = useQueryClient()
    const [processingId, setProcessingId] = useState<string | null>(null)

    const { data, isLoading } = useQuery({
        queryKey: ['verifier-pending'],
        queryFn: async () => {
            const res = await fetch('/api/verifier/pending')
            if (!res.ok) throw new Error('Unauthorized')
            return res.json()
        },
        enabled: session?.user.role === 'VERIFIER'
    })

    const attestMutation = useMutation({
        mutationFn: async ({ id, approved }: { id: string, approved: boolean }) => {
            const res = await fetch(`/api/verifier/${id}/attest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    approved,
                    signature: 'mock-signature-for-now',
                    notes: approved ? 'Verified via documentation' : 'Insufficient proof'
                })
            })
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['verifier-pending'] })
            setProcessingId(null)
        }
    })

    const handleAttest = (id: string, approved: boolean) => {
        setProcessingId(id)
        attestMutation.mutate({ id, approved })
    }

    return (
        <div className="container mx-auto p-6 max-w-5xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Verification Console</h1>
                    <p className="text-muted-foreground">Review and attest pending donation claims.</p>
                </div>
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
                    <ShieldCheck className="w-4 h-4" />
                    Verified Status: Active
                </div>
            </div>

            {isLoading ? (
                <div className="grid gap-4">
                    {[1, 2].map(i => <Skeleton key={i} className="h-40 w-full" />)}
                </div>
            ) : (
                <div className="grid gap-6">
                    {data?.data?.length === 0 ? (
                        <Card className="bg-slate-50 border-dashed">
                            <CardContent className="p-12 text-center text-muted-foreground">
                                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                <p>No pending verifications. Good job!</p>
                            </CardContent>
                        </Card>
                    ) : (
                        data?.data?.map((verification: any) => (
                            <Card key={verification.id} className="border-l-4 border-l-blue-500">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">Request from {verification.request?.recipientId || 'Unknown Recipient'}</CardTitle>
                                            <CardDescription>Verification ID: {verification.id}</CardDescription>
                                        </div>
                                        <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-xs">Pending</span>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-slate-100 p-4 rounded-md mb-6 text-sm space-y-2">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-slate-500" />
                                            <span className="font-semibold">Proof Document:</span>
                                            <a href="#" className="text-blue-600 hover:underline">View Medical Report (IPFS)</a>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                                            <span className="font-semibold">Urgency Level:</span>
                                            <span>{verification.request?.urgencyLevel}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 justify-end">
                                        <Button
                                            variant="outline"
                                            className="border-red-200 hover:bg-red-50 text-red-600"
                                            onClick={() => handleAttest(verification.id, false)}
                                            disabled={processingId === verification.id}
                                        >
                                            <XCircle className="w-4 h-4 mr-2" /> Reject
                                        </Button>
                                        <Button
                                            className="bg-green-600 hover:bg-green-700"
                                            onClick={() => handleAttest(verification.id, true)}
                                            disabled={processingId === verification.id}
                                        >
                                            {processingId === verification.id ? 'Processing...' : (
                                                <>
                                                    <CheckCircle className="w-4 h-4 mr-2" /> Verify & Sign
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
