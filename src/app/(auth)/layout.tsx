export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left: Decorative Side */}
            <div className="hidden lg:flex flex-col justify-between bg-zinc-900 p-10 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-red-600 opacity-20 bg-[url('/grid-pattern.svg')]"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 font-bold text-2xl">
                        🩸 BloodChain
                    </div>
                </div>
                <div className="relative z-10">
                    <blockquote className="space-y-2">
                        <p className="text-lg">
                            &#34;This platform saved my sister&#39;s life. The AI matching was instant, and the donor arrived within 20 minutes.&#34;
                        </p>
                        <footer className="text-sm text-zinc-400">Sofie Taylor, Recipient</footer>
                    </blockquote>
                </div>
            </div>

            {/* Right: Form Side */}
            <div className="flex items-center justify-center p-8 bg-background">
                {children}
            </div>
        </div>
    )
}