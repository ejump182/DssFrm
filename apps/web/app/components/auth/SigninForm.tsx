"use client";

import { GoogleButton } from "@/app/components/auth/GoogleButton";
import { PasswordInput } from "@formbricks/ui/PasswordInput";
import { Button } from "@formbricks/ui/Button";
import { XCircleIcon } from "@heroicons/react/24/solid";
import { signIn } from "next-auth/react";
import Link from "next/dist/client/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { GithubButton } from "./GithubButton";
import { Controller, SubmitHandler, useForm, FormProvider } from "react-hook-form";
import TwoFactor from "@/app/components/auth/TwoFactor";
import { cn } from "@formbricks/lib/cn";
import TwoFactorBackup from "@/app/components/auth/TwoFactorBackup";

type TSigninFormState = {
  email: string;
  password: string;
  totpCode: string;
  backupCode: string;
};

export const SigninForm = ({
  publicSignUpEnabled,
  passwordResetEnabled,
  googleOAuthEnabled,
  githubOAuthEnabled,
}: {
  publicSignUpEnabled: boolean;
  passwordResetEnabled: boolean;
  googleOAuthEnabled: boolean;
  githubOAuthEnabled: boolean;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailRef = useRef<HTMLInputElement>(null);

  const formMethods = useForm<TSigninFormState>();

  const onSubmit: SubmitHandler<TSigninFormState> = async (data) => {
    setLoggingIn(true);

    try{
      const signInResponse = await signIn("credentials", {
        callbackUrl: searchParams?.get("callbackUrl") || "/",
        email: data.email,
        password: data.password,
        ...(totpLogin && { totpCode: data.totpCode }),
        ...(totpBackup && { backupCode: data.backupCode }),
        redirect: false,
      });
  
      if (signInResponse?.error === "second factor required") {
        setTotpLogin(true);
        setLoggingIn(false);
        return;
      }
  
      if (signInResponse?.error) {
        setLoggingIn(false);
        setSignInError(signInResponse.error);
        return;
      }
  
      if (!signInResponse?.error) {
        router.push(searchParams?.get("callbackUrl") || "/");
      }      
  
    } catch(error){
      const errorMessage = error.toString();
      const errorFeedback = errorMessage.includes("Invalid URL")
          ? "Too many requests, please try again after some time!"
          : error.message;
      setSignInError(errorFeedback);
    } finally{
      setLoggingIn(false);
    }

  };

  const [loggingIn, setLoggingIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [totpLogin, setTotpLogin] = useState(false);
  const [totpBackup, setTotpBackup] = useState(false);
  const [signInError, setSignInError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const callbackUrl = searchParams?.get("callbackUrl");
  const inviteToken = callbackUrl ? new URL(callbackUrl).searchParams.get("token") : null;

  const formLabel = useMemo(() => {
    if (totpBackup) {
      return "Enter your backup code";
    }

    if (totpLogin) {
      return "Enter your two-factor authentication code";
    }

    return "Login to your account";
  }, [totpBackup, totpLogin]);

  const TwoFactorComponent = useMemo(() => {
    if (totpBackup) {
      return <TwoFactorBackup />;
    }

    if (totpLogin) {
      return <TwoFactor />;
    }

    return null;
  }, [totpBackup, totpLogin]);

  return (
    <FormProvider {...formMethods}>
      <div className="text-center">
        <h1 className="mb-4 text-slate-700">{formLabel}</h1>
        <div className="space-y-2">
          <form onSubmit={formMethods.handleSubmit(onSubmit)} className="space-y-2">
            {TwoFactorComponent}

            {showLogin && (
              <div className={cn(totpLogin && "hidden")}>
                <div className="mb-2 transition-all duration-500 ease-in-out">
                  <label htmlFor="email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="work@email.com"
                    defaultValue={searchParams?.get("email") || ""}
                    className="focus:border-brand focus:ring-brand block w-full rounded-md border-slate-300 shadow-sm sm:text-sm"
                    {...formMethods.register("email", {
                      required: true,
                      pattern: /\S+@\S+\.\S+/,
                    })}
                  />
                </div>
                <div className="transition-all duration-500 ease-in-out">
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <Controller
                    name="password"
                    control={formMethods.control}
                    render={({ field }) => (
                      <PasswordInput
                        id="password"
                        autoComplete="current-password"
                        placeholder="*******"
                        aria-placeholder="password"
                        onFocus={() => setIsPasswordFocused(true)}
                        required
                        className="focus:border-brand focus:ring-brand block w-full rounded-md border-slate-300 shadow-sm sm:text-sm"
                        {...field}
                      />
                    )}
                    rules={{
                      required: true,
                    }}
                  />
                </div>
                {passwordResetEnabled && isPasswordFocused && (
                  <div className="ml-1 text-right transition-all duration-500 ease-in-out">
                    <Link
                      href="/auth/forgot-password"
                      className="hover:text-brand-dark text-xs text-slate-500">
                      Forgot your password?
                    </Link>
                  </div>
                )}
              </div>
            )}
            <Button
              onClick={() => {
                if (!showLogin) {
                  setShowLogin(true);
                  // Add a slight delay before focusing the input field to ensure it's visible
                  setTimeout(() => emailRef.current?.focus(), 100);
                } else if (formRef.current) {
                  formRef.current.requestSubmit();
                }
              }}
              variant="darkCTA"
              className="w-full justify-center"
              loading={loggingIn}>
              {totpLogin ? "Submit" : "Login with Email"}
            </Button>
          </form>

          {googleOAuthEnabled && !totpLogin && (
            <>
              <GoogleButton inviteUrl={callbackUrl} />
            </>
          )}

          {githubOAuthEnabled && !totpLogin && (
            <>
              <GithubButton inviteUrl={callbackUrl} />
            </>
          )}
        </div>

        {publicSignUpEnabled && !totpLogin && (
          <div className="mt-9 text-center text-xs ">
            <span className="leading-5 text-slate-500">New to Formbricks?</span>
            <br />
            <Link
              href={callbackUrl ? `/auth/signup?inviteToken=${inviteToken}` : "/auth/signup"}
              className="font-semibold text-slate-600 underline hover:text-slate-700">
              Create an account
            </Link>
          </div>
        )}
      </div>

      {totpLogin && !totpBackup && (
        <div className="mt-9 text-center text-xs">
          <span className="leading-5 text-slate-500">Lost Access?</span>
          <br />
          <div className="flex flex-col">
            <button
              className="font-semibold text-slate-600 underline hover:text-slate-700"
              onClick={() => {
                setTotpBackup(true);
              }}>
              Use a backup code
            </button>

            <button
              className="mt-4 font-semibold text-slate-600 underline hover:text-slate-700"
              onClick={() => {
                setTotpLogin(false);
              }}>
              Go Back
            </button>
          </div>
        </div>
      )}

      {totpBackup && (
        <div className="mt-9 text-center text-xs">
          <button
            className="font-semibold text-slate-600 underline hover:text-slate-700"
            onClick={() => {
              setTotpBackup(false);
            }}>
            Go Back
          </button>
        </div>
      )}

      {signInError && (
        <div className="absolute top-10 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">An error occurred when logging you in</h3>
              <div className="mt-2 text-sm text-red-700">
                <p className="space-y-1 whitespace-pre-wrap">{signInError}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </FormProvider>
  );
};
