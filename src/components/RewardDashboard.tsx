// app/components/RewardDashboard.tsx

'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface RewardInfo {
    pendingRewards: number
    nftBadges: string[]
    totalMinted: number
}

export default function RewardDashboard() {
    const { data: session } = useSession()
    const [rewards, setRewards] = useState<RewardInfo | null>(null)
    const [loading, setLoading] = useState(true)
    const [claiming, setClaiming] = useState(false)

    useEffect(() => {
        fetchRewards()
    }, [])

    const fetchRewards = async () => {
        try {
            const response = await fetch('/api/rewards/claim')
            const data = await response.json()
            setRewards(data)
        } catch (error) {
            console.error('Failed to fetch rewards:', error)
        } finally {
            setLoading(false)
        }
    }

    const claimRewards = async () => {
        try {
            setClaiming(true)

            const response = await fetch('/api/rewards/claim', {
                method: 'POST',
            })

            const data = await response.json()

            if (data.success) {
                alert(`Claimed ${data.claimedAmount} tokens!`)
                fetchRewards()
            }
        } catch (error) {
            console.error('Claim failed:', error)
        } finally {
            setClaiming(false)
        }
    }

    if (loading) {
        return <div>Loading rewards...</div>
    }

    return (
        <div className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">🎁 My Rewards</h2>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg">
                    <p className="text-gray-600 text-sm">Pending Tokens</p>
                    <p className="text-3xl font-bold text-red-600">
                        {rewards?.pendingRewards || 0}
                    </p>
                </div>

                <div className="bg-white p-4 rounded-lg">
                    <p className="text-gray-600 text-sm">NFT Badges</p>
                    <p className="text-3xl font-bold text-blue-600">
                        {rewards?.totalMinted || 0}
                    </p>
                </div>
            </div>

            {rewards && rewards.pendingRewards > 0 && (
                <button
                    onClick={claimRewards}
                    disabled={claiming}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition"
                >
                    {claiming ? 'Claiming...' : '💰 Claim Rewards'}
                </button>
            )}

            <div className="mt-6">
                <h3 className="font-bold mb-2">NFT Badges:</h3>
                <div className="flex flex-wrap gap-2">
                    {rewards?.nftBadges.map((badge) => (
                        <span
                            key={badge}
                            className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
                        >
              🏅 {badge}
            </span>
                    ))}
                </div>
            </div>
        </div>
    )
}
