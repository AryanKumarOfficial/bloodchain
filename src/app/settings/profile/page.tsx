// app/settings/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProfileSettingsPage from "./ProfileSettingsPage";

export default async function SettingsPage() {
    const session = await getServerSession(authOptions);

    // If no session → redirect to login
    if (!session) {
        redirect("/api/auth/signin?callbackUrl=/settings");
    }

    return <ProfileSettingsPage session={session} />;
}
