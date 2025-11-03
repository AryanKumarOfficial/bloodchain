// app/page.tsx

'use client'

import {useSession} from 'next-auth/react'
import {useRouter} from 'next/navigation'
import Link from 'next/link'
import {JSX} from "react";

export default function HomePage(): JSX.Element {
    const {data: session, status} = useSession()
    const router = useRouter()

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
        )
    }

    if (session) {
        router.push('/dashboard')
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
            {/* Hero Section */}
            <section className="py-20 px-4 text-center">
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
                    Welcome to BloodChain
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                    Revolutionizing blood donation with AI-powered matching, blockchain verification,
                    and zero hospital dependency
                </p>

                <div className="flex gap-4 justify-center">
                    <Link
                        href="/signin"
                        className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition"
                    >
                        Sign In
                    </Link>
                    <Link
                        href="/signup"
                        className="border-2 border-red-600 text-red-600 hover:bg-red-50 px-8 py-3 rounded-lg font-semibold transition"
                    >
                        Sign Up
                    </Link>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4 bg-white">
                <h2 className="text-4xl font-bold text-center mb-12">Key Features</h2>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Feature 1 */}
                    <div className="p-6 border-2 border-red-200 rounded-lg hover:shadow-lg transition">
                        <div className="text-4xl mb-4">🤖</div>
                        <h3 className="text-2xl font-bold mb-2">AI Matching</h3>
                        <p className="text-gray-600">
                            Autonomous TensorFlow-powered matching algorithm that finds compatible donors
                            instantly
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="p-6 border-2 border-red-200 rounded-lg hover:shadow-lg transition">
                        <div className="text-4xl mb-4">⛓️</div>
                        <h3 className="text-2xl font-bold mb-2">Blockchain Verified</h3>
                        <p className="text-gray-600">
                            Multi-signature smart contracts ensure immutable, transparent, and trustless
                            verification
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="p-6 border-2 border-red-200 rounded-lg hover:shadow-lg transition">
                        <div className="text-4xl mb-4">👥</div>
                        <h3 className="text-2xl font-bold mb-2">P2P Network</h3>
                        <p className="text-gray-600">
                            Direct donor-to-recipient connections with community verification, no hospital
                            needed
                        </p>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 px-4">
                <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>

                <div className="max-w-4xl mx-auto">
                    {[
                        {num: 1, title: 'Register', desc: 'Create account as donor or recipient'},
                        {num: 2, title: 'Biometric Verify', desc: 'AI-powered facial recognition verification'},
                        {num: 3, title: 'AI Match', desc: 'Autonomous matching with qualified donors'},
                        {num: 4, title: 'Blockchain Confirm', desc: 'Multi-signature blockchain verification'},
                        {num: 5, title: 'Complete', desc: 'Receive blood with instant reward issuance'},
                    ].map((step) => (
                        <div key={step.num} className="flex items-center mb-8">
                            <div
                                className="bg-red-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg">
                                {step.num}
                            </div>
                            <div className="ml-4 flex-1">
                                <h3 className="text-xl font-bold">{step.title}</h3>
                                <p className="text-gray-600">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
