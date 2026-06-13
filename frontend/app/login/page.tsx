import { Suspense } from "react";
import type { Metadata } from "next";
import AuthScreen from "@/components/AuthScreen";

export const metadata: Metadata = {
  title: "Giriş — BrandOPS",
};

export default function LoginPage() {
  return (
    <Suspense>
      <AuthScreen />
    </Suspense>
  );
}
