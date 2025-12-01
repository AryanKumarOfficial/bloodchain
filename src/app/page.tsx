'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Heart, Shield, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
}

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background overflow-hidden">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-100 via-background to-background dark:from-red-950/30"></div>

                <div className="max-w-5xl mx-auto text-center space-y-8">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeIn}
                        transition={{ duration: 0.5 }}
                    >
            <span className="px-3 py-1 rounded-full bg-red-100 text-red-600 text-sm font-medium dark:bg-red-900/30 dark:text-red-400">
              v1.0 Public Beta Live 🚀
            </span>
                        <h1 className="mt-6 text-6xl md:text-7xl font-extrabold tracking-tight text-foreground">
                            Blood Donation, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">
                Decentralized.
              </span>
                        </h1>
                        <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
                            Connect directly with donors using AI matching and verify every drop on the blockchain.
                            Zero intermediaries. 100% Trust.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex gap-4 justify-center"
                    >
                        <Link href="/signin">
                            <Button size="lg" className="rounded-full px-8 text-lg bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20">
                                Start Saving Lives <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Link href="/about">
                            <Button size="lg" variant="outline" className="rounded-full px-8 text-lg">
                                How it Works
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 px-6 max-w-7xl mx-auto">
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        {
                            icon: <Zap className="h-8 w-8 text-yellow-500" />,
                            title: "AI Matching",
                            desc: "Our TensorFlow model predicts the best donor matches based on location, blood type, and reliability score."
                        },
                        {
                            icon: <Shield className="h-8 w-8 text-blue-500" />,
                            title: "Blockchain Verified",
                            desc: "Every donation is recorded as a smart contract transaction on Polygon, ensuring immutable history."
                        },
                        {
                            icon: <Heart className="h-8 w-8 text-red-500" />,
                            title: "Token Rewards",
                            desc: "Earn reputation tokens and soulbound NFTs for every verified donation. Build your legacy."
                        }
                    ].map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.2 }}
                            className="p-8 rounded-3xl border bg-card/50 backdrop-blur-sm hover:border-red-500/50 transition-colors"
                        >
                            <div className="mb-4 p-3 bg-background rounded-2xl w-fit border shadow-sm">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                            <p className="text-muted-foreground">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>
        </div>
    )
}