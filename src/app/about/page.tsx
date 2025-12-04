import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function AboutPage() {
    return (
        <div className="container mx-auto px-6 py-20 max-w-4xl text-center space-y-8">
            <h1 className="text-4xl font-bold">About Bloodchain</h1>
            <p className="text-xl text-muted-foreground">
                Bloodchain is a decentralized, autonomous platform revolutionizing blood donation.
                By leveraging Blockchain for trust, AI for matching, and a community of Peer Verifiers,
                we ensure that every donation reaches those in need efficiently and transparently.
            </p>
            <div className="grid md:grid-cols-3 gap-8 text-left pt-10">
                <div className="p-6 border rounded-xl">
                    <h3 className="font-bold text-lg mb-2">Autonomous</h3>
                    <p className="text-sm text-muted-foreground">No central authority. Smart contracts and AI agents handle matching and verification automatically.</p>
                </div>
                <div className="p-6 border rounded-xl">
                    <h3 className="font-bold text-lg mb-2">Transparent</h3>
                    <p className="text-sm text-muted-foreground">Every donation lifecycle is recorded on the Polygon blockchain, creating an immutable history.</p>
                </div>
                <div className="p-6 border rounded-xl">
                    <h3 className="font-bold text-lg mb-2">Incentivized</h3>
                    <p className="text-sm text-muted-foreground">Donors earn tokens and soulbound NFTs, building a verifiable reputation on-chain.</p>
                </div>
            </div>
            <div className="pt-8">
                <Link href="/signup">
                    <Button size="lg" className="bg-red-600 hover:bg-red-700">Join the Network</Button>
                </Link>
            </div>
        </div>
    )
}