// app/(auth)/signin/page.tsx

'use client'

import {signIn, useSession} from 'next-auth/react'
import {FormEvent, JSX, useEffect, useState} from 'react'
import {useRouter} from 'next/navigation'
import Link from 'next/link'
import {LogLevel} from '@/types/logger'
import {logToServer} from '@/lib/actions/log.action'

export default function SignInPage(): JSX.Element {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()
    const {data: session, status} = useSession()

    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/dashboard')
        }
    })

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                await logToServer(LogLevel.WARN, 'Sign in failed', {email, error: result.error})
                setError(result.error || 'Sign in failed')
            } else {
                await logToServer(LogLevel.INFO, 'User signed in', {email})
                router.push('/dashboard')
            }
        } catch (err) {
            await logToServer(LogLevel.ERROR, 'Sign in error', {
                email,
                error: err instanceof Error ? err.message : `Failed to sign In`,
            })
            setError('An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignIn = async (): Promise<void> => {
        try {
            await signIn('google', {callbackUrl: '/dashboard'})
        } catch (error) {
            await logToServer(LogLevel.ERROR, 'Google sign in error', {error})
            setError('Google sign in failed')
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md">
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
                        Sign In to HemoBridge
                    </h1>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                                placeholder="user@example.com"
                                required
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-semibold text-gray-700 mb-2"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        <button
                            onClick={handleGoogleSignIn}
                            className="w-full mt-4 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-2 rounded-lg transition"
                        >
                            🔐 Sign in with Google
                        </button>
                    </div>

                    <p className="text-center text-gray-600 mt-6">
                        Don't have an account?{' '}
                        <Link href="/auth/signup" className="text-red-600 hover:underline font-semibold">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
