'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, AlertCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { userRegistrationSchema } from "@/lib/utils/validators"
import { UserRole } from '@prisma/client'

// 1. Extend the base schema for UI-specific validation (Confirm Password)
const signUpSchema = userRegistrationSchema.extend({
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isLoading },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
    defaultValues: {
      role: 'DONOR'
    }
  })

  const onSubmit = async (data: SignUpFormValues) => {
    try {
      setServerError(null)

      // 2. Destructure to remove confirmPassword before sending to API
      const { confirmPassword, ...registrationData } = data;

      // TODO: Replace with your actual Server Action or API call
      const response = await fetch("/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        cache: "no-store",
        body: JSON.stringify(registrationData)
      })

      const resolvedData = await response.json();
      if (!resolvedData.success) {
        alert(resolvedData.error);
        return;
      }

      alert("Account created successfully");
      // On success:
      router.push('/signin')

    } catch (error) {
      console.error(error);
      setServerError("Something went wrong. Please try again.");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]"
    >
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
        <p className="text-sm text-muted-foreground">Enter details to create your account</p>
      </div>

      <div className="grid gap-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4">

            {/* --- NAME FIELD --- */}
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                type="text"
                disabled={isLoading}
                className={errors.name ? "border-red-500 bg-muted/50" : "bg-muted/50"}
                {...register("name")}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* --- EMAIL FIELD --- */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="name@example.com"
                type="email"
                autoComplete="email"
                disabled={isLoading}
                className={errors.email ? "border-red-500 bg-muted/50" : "bg-muted/50"}
                {...register("email")}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            {/* --- PHONE FIELD --- */}
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+91 9876543210"
                type="tel"
                disabled={isLoading}
                className={errors.phone ? "border-red-500 bg-muted/50" : "bg-muted/50"}
                {...register("phone")}
              />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
            </div>

            {/* --- ROLE SELECTION --- */}
            <div className="grid gap-2">
              <Label htmlFor="role">I am a</Label>
              <select
                id="role"
                disabled={isLoading}
                className="flex h-9 w-full rounded-md border border-input bg-muted/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register("role")}
              >
                {/* Ensure these values match your Prisma UserRole Enum */}
                <option value={`${UserRole.DONOR}`}>{UserRole.DONOR}</option>
                <option value={`${UserRole.RECIPIENT}`}>{UserRole.RECIPIENT}</option>
              </select>
              {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
            </div>

            {/* --- PASSWORD FIELD --- */}
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                disabled={isLoading}
                className={errors.password ? "border-red-500 bg-muted/50" : "bg-muted/50"}
                {...register("password")}
              />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {/* --- CONFIRM PASSWORD FIELD --- */}
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                disabled={isLoading}
                className={errors.confirmPassword ? "border-red-500 bg-muted/50" : "bg-muted/50"}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
            </div>

            {/* --- SERVER ERROR DISPLAY --- */}
            {serverError && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                <p>{serverError}</p>
              </div>
            )}

            <Button disabled={isLoading} className="bg-red-600 hover:bg-red-700">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create account
            </Button>
          </div>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <Button variant="outline" type="button" disabled={isLoading} onClick={() => signIn('google')}>
          Google
        </Button>

        <p className="px-8 text-center text-sm text-muted-foreground">
          <Link href="/signin" className="hover:text-brand underline underline-offset-4">
            Already have an account? Sign In
          </Link>
        </p>
      </div>
    </motion.div>
  )
}