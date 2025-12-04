import RewardDashboard from '@/components/RewardDashboard'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function RewardsPage() {
    const session = await getServerSession(authOptions)
    if (!session) redirect('/signin')

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Rewards & Recognition</h1>
            <p className="text-muted-foreground mb-8">
                Earn tokens for verified donations and collect soulbound NFT badges for your milestones.
            </p>
            <RewardDashboard />
        </div>
    )
}