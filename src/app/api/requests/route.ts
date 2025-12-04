import {NextResponse} from "next/server"
import prisma from "@/lib/prisma"
import {getServerSession} from "next-auth"
import {authOptions} from "@/lib/auth"
import {requestSchema} from "@/schemas/requestSchema"
import {RequestStatus} from "@prisma/client"

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }

        const body = await req.json()
        const validated = requestSchema.parse(body)

        const newRequest = await prisma.bloodRequest.create({
            data: {
                recipientId: session.user.id,
                bloodType: validated.bloodType,
                rhFactor: validated.rhFactor,
                unitsNeeded: validated.units,
                urgencyLevel: validated.urgency,
                latitude: validated.latitude,
                longitude: validated.longitude,
                radius: validated.radius ?? 50,
                expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hrs expiry
                status: RequestStatus.OPEN,
            },
        })

        return NextResponse.json({data: newRequest})
    } catch (err) {
        console.error("POST /api/requests ERROR:", err)
        return NextResponse.json({error: "Failed to create request"}, {status: 500})
    }
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }

        const requests = await prisma.bloodRequest.findMany({
            where: {recipientId: session.user.id},
            include: {
                recipient: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                    }
                },
                RecipientProfile: true
            },
            orderBy: {createdAt: "desc"},
        })
        console.log(`request`, requests)
        return NextResponse.json({data: requests})
    } catch (err) {
        console.error("GET /api/requests ERROR:", err)
        return NextResponse.json({error: "Unable to fetch requests"}, {status: 500})
    }
}
