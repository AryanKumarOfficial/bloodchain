import {NextResponse} from "next/server"
import prisma from "@/lib/prisma"
import {getServerSession} from "next-auth"
import {authOptions} from "@/lib/auth"
import {requestSchema} from "@/schemas/requestSchema"

export async function GET(req: Request, {params}: { params: Promise<{ id: string }> }) {
    try {
        const {id} = await params

        const request = await prisma.bloodRequest.findUnique({
            where: {id},
        })

        if (!request) return NextResponse.json({error: "Not found"}, {status: 404})

        return NextResponse.json({data: request})
    } catch (err) {
        console.error("GET /api/requests/[id] ERROR:", err)
        return NextResponse.json({error: "Error fetching request"}, {status: 500})
    }
}

export async function PATCH(req: Request, {params}: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return NextResponse.json({error: "Unauthorized"}, {status: 401})

        const {id} = await params

        const existing = await prisma.bloodRequest.findUnique({where: {id}})
        if (!existing) return NextResponse.json({error: "Not found"}, {status: 404})

        if (existing.recipientId !== session.user.id)
            return NextResponse.json({error: "Forbidden"}, {status: 403})

        const body = await req.json()
        const validated = requestSchema.partial().parse(body)

        const updated = await prisma.bloodRequest.update({
            where: {id},
            data: validated,
        })

        return NextResponse.json({data: updated})
    } catch (err) {
        console.error("PATCH /api/requests/[id] ERROR:", err)
        return NextResponse.json({error: "Error updating request"}, {status: 500})
    }
}

export async function DELETE(req: Request, {params}: { params:Promise<{id:string}> }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return NextResponse.json({error: "Unauthorized"}, {status: 401})

        const {id} =await params

        const existing = await prisma.bloodRequest.findUnique({where: {id}})
        if (!existing) return NextResponse.json({error: "Not found"}, {status: 404})

        if (existing.recipientId !== session.user.id)
            return NextResponse.json({error: "Forbidden"}, {status: 403})

        await prisma.bloodRequest.delete({where: {id}})

        return NextResponse.json({message: "Deleted"})
    } catch (err) {
        console.error("DELETE /api/requests/[id] ERROR:", err)
        return NextResponse.json({error: "Error deleting request"}, {status: 500})
    }
}
