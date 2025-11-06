// app/components/BiometricVerification.tsx

'use client'

import { useRef, useState } from 'react'
import { useSession } from 'next-auth/react'

export default function BiometricVerification() {
    const { data: session } = useSession()
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [verified, setVerified] = useState(false)
    const [loading, setLoading] = useState(false)

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
            })

            if (videoRef.current) {
                videoRef.current.srcObject = stream
            }
        } catch (error) {
            console.error('Camera access denied:', error)
        }
    }

    const captureAndVerify = async () => {
        try {
            setLoading(true)

            if (!canvasRef.current || !videoRef.current) return

            const context = canvasRef.current.getContext('2d')
            if (!context) return

            context.drawImage(
                videoRef.current,
                0,
                0,
                canvasRef.current.width,
                canvasRef.current.height
            )

            canvasRef.current.toBlob(async (blob) => {
                if (!blob) return

                const formData = new FormData()
                formData.append('image', blob, 'face.jpg')

                const response = await fetch('/api/verify/biometric', {
                    method: 'POST',
                    body: formData,
                })

                const data = await response.json()

                if (data.verified) {
                    setVerified(true)
                } else {
                    alert(`Verification failed: ${data.spoofRisk}`)
                }
            })
        } catch (error) {
            console.error('Verification error:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow max-w-md">
            <h2 className="text-2xl font-bold mb-4">🔐 Face Verification</h2>

            {!verified ? (
                <>
                    <video
                        ref={videoRef}
                        autoPlay
                        className="w-full rounded-lg mb-4"
                        onLoadedMetadata={startCamera}
                    />

                    <canvas
                        ref={canvasRef}
                        width={320}
                        height={240}
                        className="hidden"
                    />

                    <button
                        onClick={captureAndVerify}
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-lg transition"
                    >
                        {loading ? 'Verifying...' : 'Verify Face'}
                    </button>
                </>
            ) : (
                <div className="text-center">
                    <div className="text-4xl mb-2">✅</div>
                    <p className="text-green-600 font-bold">Verified successfully!</p>
                </div>
            )}
        </div>
    )
}
