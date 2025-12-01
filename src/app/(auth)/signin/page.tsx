'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button' // Assumes shadcn button
import { Input } from '@/components/ui/input'   // Assumes shadcn input
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { logToServer } from '@/lib/actions/log.action'
import { LogLevel } from '@/types/logger'

export default function SignInPage() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)

        try {
            const result = await signIn('credentials', {
                email: formData.get('email'),
                password: formData.get('password'),
                redirect: false,
            })

            if (result?.error) {
                // Add toast error here
                console.error(result.error)
            } else {
                await logToServer(LogLevel.INFO, 'User logged in successfully')
                router.push('/dashboard')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]"
        >
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
                <p className="text-sm text-muted-foreground">
                    Enter your credentials to access your account
                </p>
            </div>

            <div className="grid gap-6">
                <form onSubmit={onSubmit}>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                placeholder="name@example.com"
                                type="email"
                                autoCapitalize="none"
                                autoComplete="email"
                                autoCorrect="off"
                                disabled={loading}
                                className="bg-muted/50"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                disabled={loading}
                                className="bg-muted/50"
                            />
                        </div>
                        <Button disabled={loading} className="bg-red-600 hover:bg-red-700">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign In
                        </Button>
                    </div>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
                    </div>
                </div>

                <Button variant="outline" type="button" disabled={loading} onClick={() => signIn('google')}>
                    Google
                </Button>

                <p className="px-8 text-center text-sm text-muted-foreground">
                    <Link href="/signup" className="hover:text-brand underline underline-offset-4">
                        Don&apos;t have an account? Sign Up
                    </Link>
                </p>
            </div>
        </motion.div>
    )
}