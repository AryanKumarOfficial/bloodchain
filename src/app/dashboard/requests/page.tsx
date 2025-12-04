"use client";

import React from "react";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";

const Page = () => {
    const { data: requestData, isLoading: requestLoading } = useQuery({
        queryKey: ["dashboard-requests"],
        queryFn: async () => {
            const res = await fetch("/api/requests");
            if (!res.ok) throw new Error(res.statusText);
            return res.json();
        },
    });

    if (requestLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen w-full px-2 py-1">
                <Spinner className="size-56" />
            </div>
        );
    }

    const requests = requestData?.data ?? [];

    return (
        <section className="container flex flex-col justify-center items-center py-10 w-full">
            <h1 className="text-4xl font-bold leading-tight mb-2">
                My Active Requests
            </h1>
            <Separator className="w-3/4 mb-8" />

            {requests.length === 0 ? (
                <p className="text-muted-foreground">You have no active requests.</p>
            ) : (
                requests.map((req: any) => (
                    <Card key={req.id} className="w-full max-w-3xl mb-6">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold flex justify-between">
                                <span>Request ID: {req.id}</span>
                                <span className="text-sm font-semibold px-3 py-1 rounded bg-red-100 text-red-600">
                  {req.status}
                </span>
                            </CardTitle>
                            <CardDescription>
                                Created: {new Date(req.createdAt).toLocaleString()} • Expires:{" "}
                                {new Date(req.expiresAt).toLocaleString()}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {/* Recipient Details */}
                            <div className="border p-4 rounded-md">
                                <h3 className="font-semibold text-lg mb-2">Recipient Details</h3>
                                <p><strong>Name:</strong> {req.recipient?.name}</p>
                                <p><strong>Email:</strong> {req.recipient?.email}</p>
                                <p><strong>Phone:</strong> {req.recipient?.phone}</p>
                            </div>

                            {/* Blood & Medical Info */}
                            <div className="border p-4 rounded-md">
                                <h3 className="font-semibold text-lg mb-2">Medical Info</h3>
                                <p><strong>Blood Group:</strong> {req.bloodType}</p>
                                <p><strong>Rh Factor:</strong> {req.rhFactor}</p>
                                <p><strong>Units Needed:</strong> {req.unitsNeeded}</p>
                                <p><strong>Urgency:</strong> {req.urgencyLevel}</p>
                            </div>

                            {/* Location */}
                            <div className="border p-4 rounded-md">
                                <h3 className="font-semibold text-lg mb-2">Location</h3>
                                <p><strong>Latitude:</strong> {req.latitude}</p>
                                <p><strong>Longitude:</strong> {req.longitude}</p>
                                <p><strong>Search Radius:</strong> {req.radius} km</p>
                            </div>

                            {/* Verification */}
                            <div className="border p-4 rounded-md">
                                <h3 className="font-semibold text-lg mb-2">Verification</h3>
                                <p><strong>Status:</strong> {req.verificationStatus}</p>
                                <p><strong>Required Verifications:</strong> {req.requiredVerifications}</p>
                                <p><strong>Verified by Peers:</strong> {req.verifiedByPeers?.length}</p>
                            </div>

                            {/* Blockchain Info */}
                            <div className="border p-4 rounded-md">
                                <h3 className="font-semibold text-lg mb-2">Blockchain</h3>
                                <p><strong>On-Chain:</strong> {req.isOnChain ? "Yes" : "No"}</p>
                                <p>
                                    <strong>Contract Address:</strong>{" "}
                                    {req.smartContractAddress ?? "N/A"}
                                </p>
                                <p>
                                    <strong>Transaction Hash:</strong>{" "}
                                    {req.transactionHash ?? "N/A"}
                                </p>
                            </div>
                        </CardContent>

                        <CardFooter>
                            <p className="text-sm text-muted-foreground">
                                Auto Matching: {req.autoMatchingEnabled ? "Enabled" : "Disabled"}
                            </p>
                        </CardFooter>
                    </Card>
                ))
            )}
        </section>
    );
};

export default Page;
