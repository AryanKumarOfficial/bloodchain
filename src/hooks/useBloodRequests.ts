import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'

export interface BloodRequestData {
    bloodType: string
    rhFactor: string
    units: number
    urgency: string
    latitude: number
    longitude: number
    radius: number
}

// Fetch active requests
export function useActiveRequests() {
    return useQuery({
        queryKey: ['active-requests'],
        queryFn: async () => {
            const res = await fetch('/api/blood-requests/active')
            if (!res.ok) throw new Error('Failed to fetch requests')
            return res.json()
        }
    })
}

// Create a new request
export function useCreateBloodRequest() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: BloodRequestData) => {
            const res = await fetch('/api/blood-requests/create', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data),
            })
            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.message || 'Failed to create request')
            }
            return res.json()
        },
        onSuccess: () => {
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({queryKey: ['active-requests']})
            queryClient.invalidateQueries({queryKey: ['dashboard-stats']})
        }
    })
}