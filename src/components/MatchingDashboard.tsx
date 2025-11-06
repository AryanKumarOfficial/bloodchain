// app/components/MatchingDashboard.tsx

'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface Match {
    id: string
    score: number
    donorName: string
    distance: number
    reputation: number
}

export default function MatchingDashboard() {
    const { data: session } = useSession()
    const [matches, setMatches] = useState<Match[]>([])
    const [loading, setLoading] = useState(false)

    const triggerMatching = async () => {
        try {
            setLoading(true)

            const response = await fetch('/api/blood-requests/automated-matching', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId: 'request-id-here' }),
            })

            const data = await response.json()

            if (data.success) {
                setMatches(data.matches)
            }
        } catch (error) {
            console.error('Matching failed:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">🤖 AI Matching Engine</h2>

            <button
                onClick={triggerMatching}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition"
            >
                {loading ? 'Matching...' : 'Find Matches'}
            </button>

            <div className="mt-6 space-y-4">
                {matches.map((match) => (
                    <div
                        key={match.id}
                        className="border-l-4 border-red-600 pl-4 py-2 hover:bg-gray-50 transition"
                    >
                        <h3 className="font-bold">{match.donorName}</h3>
                        <p className="text-sm text-gray-600">
                            Match Score: {(match.score * 100).toFixed(0)}%
                        </p>
                        <p className="text-sm text-gray-600">Distance: {match.distance}km</p>
                        <p className="text-sm text-gray-600">
                            Reputation: {match.reputation}/100
                        </p>
                    </div>
                ))}
            </div>
        </div>
    )
}
