import {NextResponse} from "next/server"
import {getDashboardStats} from "@/lib/actions/dashboard.actions";

export async function GET() {
    try {

        const data = await getDashboardStats()

        console.log("data", data)
        return NextResponse.json({
            data
        })
    } catch (error) {
        console.error("[GET /api/dashboard/stats] ERROR:", error)

        // Safe fallback so your dashboard doesn’t crash
        return NextResponse.json(
            {
                data: {
                    activeRequests: 0,
                    matchedDonors: 0,
                    completedDonations: 0,
                    totalRewards: 0,
                },
            },
            {status: 500},
        )
    }
}
