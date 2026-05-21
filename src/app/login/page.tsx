"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Loader2,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Atom,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  mobile: z
    .string()
    .regex(
      /^\+7 \d{3} \d{3} \d{2}-\d{2}$/,
      "Please enter a valid 10-digit mobile number",
    ),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." }),
});

function LoginForm() {
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const urlError = searchParams.get("error");

  React.useEffect(() => {
    if (urlError === "AccessDenied") {
      setError(
        "Access Denied: You do not have administrator or support privileges.",
      );
    }
  }, [urlError]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { mobile: "", password: "" },
  });

  const formatMobile = (value: string) => {
    if (!value || value === "+7" || value === "+7 " || value === "+") return "";
    let cleanValue = value.replace(/^\+7\s?/, "");
    let digits = cleanValue.replace(/\D/g, "");

    if (
      (value.startsWith("8") || value.startsWith("7")) &&
      digits.length === 11
    ) {
      digits = digits.substring(1);
    }
    digits = digits.substring(0, 10);
    if (digits.length === 0) return "";

    let formatted = "+7";
    if (digits.length > 0) formatted += " " + digits.substring(0, 3);
    if (digits.length > 3) formatted += " " + digits.substring(3, 6);
    if (digits.length > 6) formatted += " " + digits.substring(6, 8);
    if (digits.length > 8) formatted += "-" + digits.substring(8, 10);
    return formatted;
  };

  const handleMobileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (val: string) => void,
  ) => {
    onChange(formatMobile(e.target.value));
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    setIsLoading(true);

    const mobileNumber = values.mobile.replace(/\D/g, "").slice(-10);

    try {
      const res = await signIn("credentials", {
        mobile: mobileNumber,
        password: values.password,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        setError(
          res.error === "CredentialsSignin"
            ? "Invalid credentials."
            : res.error,
        );
        setIsLoading(false);
      } else {
        router.push(callbackUrl);
      }
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <>
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-6"
        >
          <Alert
            variant="destructive"
            className="border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="ml-2 font-semibold">Error</AlertTitle>
            <AlertDescription className="ml-2">{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="mobile"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Mobile Number
                </FormLabel>
                <FormControl>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Smartphone className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <Input
                      {...field}
                      placeholder="+7 (000) 000-00-00"
                      disabled={isLoading}
                      onChange={(e) => handleMobileChange(e, field.onChange)}
                      className="pl-10 h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                    {field.value.length === 15 &&
                      !form.formState.errors.mobile && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </div>
                      )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Password
                  </FormLabel>
                </div>
                <FormControl>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      disabled={isLoading}
                      {...field}
                      className="pl-10 pr-10 h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg transition-all duration-200"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </Form>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-400/20 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-[420px] px-4"
      >
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-8">
          <div className="flex flex-col items-center space-y-3 mb-8">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <Atom className="h-7 w-7 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Welcome back
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Sign in to access your dashboard
              </p>
            </div>
          </div>

          <React.Suspense
            fallback={
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" />
              </div>
            }
          >
            <LoginForm />
          </React.Suspense>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-900 px-2 text-slate-500">
                  Secure System
                </span>
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-slate-400">
              &copy; {new Date().getFullYear()} klinciti.ru. All rights
              reserved.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
