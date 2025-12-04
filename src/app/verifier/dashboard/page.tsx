// app/verifier/page.tsx
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {redirect} from "next/navigation";
import VerifierDashboard from "./VerifierDashboard";

export default async function VerifierPage() {
    const session = await getServerSession(authOptions);

    // Not logged in → redirect to login
    if (!session) {
        redirect("/api/auth/signin?callbackUrl=/verifier");
    }

    // Logged in but not a verifier
    if (session.user.role !== "VERIFIER") {
        return (
            <div className="p-8 text-center text-red-500">
                Access Denied. Only authorized verifiers may view this dashboard.<br/>
            </div>
        );
    }

    return <VerifierDashboard session={session}/>;
}
