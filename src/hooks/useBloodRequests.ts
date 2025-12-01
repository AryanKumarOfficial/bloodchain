import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

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

// Create new request
export function useCreateBloodRequest() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch('/api/blood-requests/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error('Failed to create request')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['active-requests'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
        }
    })
}