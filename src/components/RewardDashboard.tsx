'use client'

import {useEffect, useState} from 'react'

interface RewardInfo {
    pendingRewards: number
    nftBadges: string[]
    totalMinted: number
}

export default function RewardDashboard() {
    const [rewards, setRewards] = useState<RewardInfo | null>(null)
    const [loading, setLoading] = useState(true)
    const [claiming, setClaiming] = useState(false)

    useEffect(() => {
        fetchRewards()
    }, [])

    const fetchRewards = async () => {
        try {
            const response = await fetch('/api/rewards/claim')

            if (response.ok) {
                const data = await response.json()
                setRewards(data)
            } else {
                // Handle non-200 responses (e.g., 401 Unauthorized)
                console.error('Failed to fetch rewards:', await response.text())
                setRewards({pendingRewards: 0, nftBadges: [], totalMinted: 0})
            }
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
            } else {
                alert(data.error || 'Claim failed')
            }
        } catch (error) {
            console.error('Claim failed:', error)
        } finally {
            setClaiming(false)
        }
    }

    if (loading) {
        return <div className="p-6 text-center text-gray-500">Loading rewards...</div>
    }

    return (
        <div className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg shadow border border-yellow-200">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                🎁 My Rewards
            </h2>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <p className="text-gray-600 text-sm font-medium">Pending Tokens</p>
                    <p className="text-3xl font-bold text-red-600">
                        {rewards?.pendingRewards || 0}
                    </p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <p className="text-gray-600 text-sm font-medium">Total Earned</p>
                    <p className="text-3xl font-bold text-blue-600">
                        {rewards?.totalMinted || 0}
                    </p>
                </div>
            </div>

            {rewards && rewards.pendingRewards > 0 && (
                <button
                    onClick={claimRewards}
                    disabled={claiming}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition shadow-md"
                >
                    {claiming ? 'Processing...' : '💰 Claim Rewards'}
                </button>
            )}

            <div className="mt-6">
                <h3 className="font-bold mb-3 text-gray-800">My Badges</h3>
                <div className="flex flex-wrap gap-2">
                    {/* SAFE GUARD: Added optional chaining and fallback array */}
                    {(rewards?.nftBadges || []).length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No badges earned yet.</p>
                    ) : (
                        (rewards?.nftBadges || []).map((badge, index) => (
                            <span
                                key={index}
                                className="bg-purple-100 text-purple-800 border border-purple-200 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
                            >
                                🏅 {badge}
                            </span>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}