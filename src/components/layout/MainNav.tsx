'use client'

import React from "react";
import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {cn} from '@/lib/utils'
import { useSession } from 'next-auth/react'

export function MainNav({
                            className,
                            onClick,
                            ...props
                        }: React.HTMLAttributes<HTMLElement> & { onClick?: () => void }) {
    const pathname = usePathname()
    const { data: session } = useSession()

    const routes = [
        {href: '/dashboard', label: 'Dashboard'},
        {href: '/requests/new', label: 'Request Blood'},
        {href: '/donations/history', label: 'History'},
        {href: '/rewards', label: 'Rewards'},
    ]

    // Add Verifier route conditionally
    if (session?.user?.role === 'VERIFIER') {
        routes.push({ href: '/verifier/dashboard', label: 'Verifier Console' })
    }

    return (
        <nav
            className={cn('flex items-center space-x-4 lg:space-x-6', className)}
            {...props}
        >
            {routes.map((route) => (
                <Link
                    key={route.href}
                    href={route.href}
                    className={cn(
                        'text-sm font-medium transition-colors hover:text-primary',
                        pathname === route.href
                            ? 'text-black dark:text-white font-bold'
                            : 'text-muted-foreground'
                    )}
                    onClick={onClick}
                >
                    {route.label}
                </Link>
            ))}
        </nav>
    )
}