'use client'

import { useEffect } from 'react'
import { signOut } from 'next-auth/react'

export default function SignOutPage() {
    useEffect(() => {
        signOut({ callbackUrl: '/' })
    }, [])

    return (
        <div className="h-screen flex items-center justify-center">
            <p className="text-muted-foreground">Signing out...</p>
        </div>
    )
}