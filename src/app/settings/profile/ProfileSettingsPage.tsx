'use client'

import {useForm} from 'react-hook-form'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Switch} from '@/components/ui/switch'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {useMutation} from '@tanstack/react-query'
import {Loader2} from 'lucide-react'
import type {Session} from 'next-auth'
import {useEffect} from 'react'
import {useRouter} from "next/navigation";

export default function ProfileSettingsPage({session}: { session: Session }) {
    const router = useRouter()

    const {register, handleSubmit, reset, formState: {isDirty, isSubmitting}} = useForm({
        defaultValues: {
            name: '',
            phone: '',
            city: '',
            isAvailable: true,
            bio: ''
        }
    })

    // Load session defaults AFTER hydration
    useEffect(() => {
        reset({
            name: session?.user?.name || '',
            phone: '',   // TODO: fetch from profile API if needed
            city: '',
            isAvailable: true,
            bio: ''
        })
    }, [session, reset])

    const updateProfile = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            })
            if (!res.ok) throw new Error('Failed to update')
            return res.json()
        },
        onSuccess: () => {
            alert('Profile updated successfully')
        }
    })

    const onSubmit = (data: any) => {
        updateProfile.mutate(data)
    }

    return (
        <div className="container mx-auto p-6 max-w-2xl">
            <h1 className="text-3xl font-bold mb-6">Settings</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Update your contact details and preferences.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">

                        {/* Name */}
                        <div className="grid gap-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" {...register('name')} />
                        </div>

                        {/* Phone + City */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input id="phone" type="tel" {...register('phone')} placeholder="+1234567890"/>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="city">City</Label>
                                <Input id="city" {...register('city')} placeholder="New York"/>
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="grid gap-2">
                            <Label htmlFor="bio">Medical Note / Bio</Label>
                            <Textarea id="bio" {...register('bio')}
                                      placeholder="Any relevant medical history or notes..."/>
                        </div>

                        {/* Donor Availability */}
                        {session.user.role === 'DONOR' && (
                            <div className="flex items-center justify-between rounded-lg border p-4 bg-slate-50">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Donor Availability</Label>
                                    <div className="text-sm text-muted-foreground">
                                        Turn off to stop receiving donation requests temporarily.
                                    </div>
                                </div>
                                <Switch {...register("isAvailable")} defaultChecked/>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" onClick={() => {
                        if (window.history.length > 1) {
                            router.back()
                        } else {
                            router.push('/dashboard')
                        }
                    }}
                            variant="ghost">Cancel</Button>
                    <Button type="submit" disabled={isSubmitting || !isDirty}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
    )
}
