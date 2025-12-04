'use client'

import BiometricVerification from '@/components/BiometricVerification'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldCheck, AlertTriangle } from 'lucide-react'

export default function VerifyAccountPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-xl shadow-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                        <ShieldCheck className="h-8 w-8 text-amber-600" />
                    </div>
                    <CardTitle className="text-2xl">Identity Verification Required</CardTitle>
                    <CardDescription>
                        To ensure the safety and trust of the Bloodchain network, all donors must complete biometric verification.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg flex gap-3 text-sm text-blue-800 border border-blue-200">
                        <AlertTriangle className="h-5 w-5 shrink-0" />
                        <p>
                            We use AI to verify your identity securely. Your biometric data is hashed and never stored in its raw form.
                        </p>
                    </div>

                    {/* Biometric Component */}
                    <div className="border rounded-xl p-4 bg-white">
                        <BiometricVerification />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}