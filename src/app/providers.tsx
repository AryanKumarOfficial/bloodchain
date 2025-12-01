'use client'

import React, { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider, useSession } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { useAppStore } from '@/lib/store/useAppStore'

// Separate component to handle socket connection based on session
function SocketInitializer() {
    const { data: session } = useSession()
    const connectSocket = useAppStore((state) => state.connectSocket)

    useEffect(() => {
        if (session?.user) {
            // In a real app, you'd pass a real JWT token here
            connectSocket(session.user.id, "dummy-token")
        }
    }, [session, connectSocket])

    return null
}

export default function Providers({
                                      children,
                                      session
                                  }: {
    children: React.ReactNode
    session: any
}) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // 1 minute
            },
        },
    }))

    return (
        <SessionProvider session={session}>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                    <SocketInitializer />
                    {children}
                </ThemeProvider>
            </QueryClientProvider>
        </SessionProvider>
    )
}