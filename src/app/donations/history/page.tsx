'use client'

import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ExternalLink, CheckCircle2, Clock } from 'lucide-react'

export default function DonationHistoryPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['donation-history'],
        queryFn: async () => {
            const res = await fetch('/api/donations/history')
            return res.json()
        }
    })

    const donations = data?.data?.donations || []

    if (isLoading) return (
        <div className="container mx-auto p-6 space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
    )

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Donation History</h1>

            <div className="space-y-4">
                {donations.length === 0 ? (
                    <p className="text-muted-foreground">No donation history found.</p>
                ) : (
                    donations.map((donation: any) => (
                        <Card key={donation.id} className="hover:bg-accent/5 transition-colors">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-lg">
                                                {donation.bloodType} Donation
                                            </h3>
                                            <StatusBadge status={donation.status} />
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Units: {donation.unitsCollected} • {format(new Date(donation.createdAt), 'PPP')}
                                        </p>
                                        {donation.blockchainVerified && (
                                            <div className="flex items-center gap-1 text-xs text-green-600 mt-2 bg-green-50 w-fit px-2 py-1 rounded-full">
                                                <CheckCircle2 className="w-3 h-3" /> Blockchain Verified
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <div className="text-right">
                                            <span className="text-2xl font-bold text-green-600">+{donation.rewardTokensIssued}</span>
                                            <span className="text-xs text-muted-foreground ml-1">TOKENS</span>
                                        </div>

                                        {donation.transactionHash && (
                                            <a
                                                href={`https://mumbai.polygonscan.com/tx/${donation.transactionHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs flex items-center gap-1 text-blue-600 hover:underline"
                                            >
                                                View on Polygon <ExternalLink className="w-3 h-3" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        COMPLETED: "bg-green-100 text-green-800",
        PENDING: "bg-yellow-100 text-yellow-800",
        FAILED: "bg-red-100 text-red-800",
        IN_TRANSIT: "bg-blue-100 text-blue-800"
    }
    return (
        <Badge className={styles[status] || "bg-gray-100"}>
            {status}
        </Badge>
    )
}