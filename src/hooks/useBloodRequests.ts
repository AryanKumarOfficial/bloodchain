"use client"

import {useQuery, useMutation} from "@tanstack/react-query"

interface ActiveRequest {
    id: string
    latitude: number | null
    longitude: number | null
    unitsNeeded: number
    bloodType: string
    urgencyLevel: string
    createdAt: string
}

// ---- ACTIVE REQUESTS (for dashboard map) ----
export function useActiveRequests() {
    return useQuery({
        queryKey: ["active-requests"],
        queryFn: async () => {
            const res = await fetch("/api/requests/active")
            if (!res.ok) {
                throw new Error("Failed to fetch active requests")
            }
            // shape: { data: { requests: ActiveRequest[] } }
            return res.json() as Promise<{ data: { requests: ActiveRequest[] } }>
        },
    })
}

// ---- EXAMPLE: create blood request hook (if you don’t already have it) ----
import type {z} from "zod"
import {requestSchema} from "@/schemas/requestSchema" // or where you keep it

type CreateRequestInput = z.infer<typeof requestSchema>

export function useCreateBloodRequest() {
    return useMutation({
        mutationFn: async (payload: CreateRequestInput) => {
            const res = await fetch("/api/blood-requests/create", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    ...payload,
                    unitsNeeded: payload.units
                }),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Failed to create request")
            }
            return res.json()
        },
    })
}
