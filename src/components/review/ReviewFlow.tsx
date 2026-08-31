"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Sparkles, UtensilsCrossed } from "lucide-react";
import { CafeHeader } from "@/components/layout/CafeHeader";
import { CafeShell } from "@/components/layout/CafeShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/review/StarRating";
import { ReviewCards, useCopiedFlag } from "@/components/review/ReviewCards";
import { OrderPicker } from "@/components/review/OrderPicker";
import { ServicePicker } from "@/components/review/ServicePicker";
import { RecommendPicker } from "@/components/review/RecommendPicker";
import { LanguagePicker } from "@/components/review/LanguagePicker";
import { type LanguageCode } from "@/lib/branding";
import { menuData, type Dish } from "@/data/menuData";
import {
  generateReviews,
  recordGoogleClick,
  recordQrScan,
  recordReviewAction,
  submitPrivateFeedback,
  submitRating,
} from "@/actions/review";
import type { ReviewSuggestion } from "@/types";

const feedbackFormSchema = z.object({
  message: z.string().trim().min(2, "Please share a little more").max(2000),
});

type Step = "rate" | "questions" | "reviews" | "feedback" | "thanks";

function getOrCreateSessionId() {
  const key = "adda-review-session";
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  sessionStorage.setItem(key, id);
  return id;
}

type ReviewFlowProps = {
  tableNumber?: number | null;
  dishes?: Dish[];
};

export function ReviewFlow({ tableNumber = null, dishes = menuData }: ReviewFlowProps) {
  const [sessionId, setSessionId] = useState("");
  const [step, setStep] = useState<Step>("rate");
  const [rating, setRating] = useState(0);
  const [orderedItems, setOrderedItems] = useState<string[]>([]);
  const [service, setService] = useState("");
  const [recommend, setRecommend] = useState("");
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [reviews, setReviews] = useState<ReviewSuggestion[]>([]);
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { message, setMessage } = useCopiedFlag();

  const menuHref = tableNumber ? `/menu?table=${tableNumber}` : "/menu";

  const feedbackForm = useForm<z.infer<typeof feedbackFormSchema>>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: { message: "" },
  });

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
    const scanKey = `adda-qr-${tableNumber ?? "lobby"}`;
    if (!sessionStorage.getItem(scanKey)) {
      sessionStorage.setItem(scanKey, "1");
      void recordQrScan(tableNumber);
    }
    const pending = localStorage.getItem("adda-pending-feedback");
    if (pending && navigator.onLine) {
      void submitPrivateFeedback(JSON.parse(pending)).then(() => {
        localStorage.removeItem("adda-pending-feedback");
      });
    }
  }, [tableNumber]);

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
  }

  async function handleRating(stars: number) {
    const id = sessionId || getOrCreateSessionId();
    if (!sessionId) setSessionId(id);
    setRating(stars);
    setError(null);
    if (stars >= 4) setStep("questions");
    else setStep("feedback");
    try {
      await submitRating({ sessionId: id, tableNumber, stars });
    } catch {
      // Analytics optional
    }
  }

  async function handleGenerate() {
    const id = sessionId || getOrCreateSessionId();
    setLoading(true);
    setError(null);
    const started = Date.now();
    const result = await generateReviews({
      sessionId: id,
      tableNumber,
      rating,
      orderedItems,
      service: service || undefined,
      recommend: recommend || undefined,
      language,
    });
    const wait = Math.max(0, 2200 - (Date.now() - started));
    await new Promise((resolve) => setTimeout(resolve, wait));
    setLoading(false);
    if (result.googleReviewUrl) setGoogleReviewUrl(result.googleReviewUrl);
    if (!result.ok) {
      setError(result.error);
      setStep("reviews");
      return;
    }
    setReviews(result.reviews);
    setStep("reviews");
  }

  async function handleSelect(index: number, text: string) {
    await copyText(text);
    const result = await recordReviewAction({
      sessionId,
      reviewIndex: index,
      reviewText: text,
      action: "use",
    });
    const url = result.googleReviewUrl || googleReviewUrl;
    setMessage("Review copied. Paste it into Google and edit if you like.");
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  async function onFeedback(values: z.infer<typeof feedbackFormSchema>) {
    setLoading(true);
    const payload = { sessionId, tableNumber, rating, message: values.message };
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      localStorage.setItem("adda-pending-feedback", JSON.stringify(payload));
      setLoading(false);
      setStep("thanks");
      return;
    }
    const result = await submitPrivateFeedback(payload);
    setLoading(false);
    if (result.googleReviewUrl) setGoogleReviewUrl(result.googleReviewUrl);
    setStep("thanks");
  }

  async function openGoogle() {
    const result = await recordGoogleClick(sessionId);
    const url = result.googleReviewUrl || googleReviewUrl;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <CafeShell>
      <CafeHeader href={tableNumber ? `/t/${tableNumber}` : "/review"} />
      <main className={`px-4 py-6 space-y-5 ${step === "questions" ? "pb-28" : "pb-16"}`}>
        {tableNumber ? (
          <p className="text-center text-xs font-medium text-gray-500">Table {tableNumber}</p>
        ) : null}

        <AnimatePresence mode="wait">
          {step === "rate" && (
            <motion.div key="rate" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="text-center space-y-5">
                <h1 className="text-3xl font-black text-gray-800 dark:text-white">How was your experience?</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">Tap a star. One thumb is enough.</p>
                <StarRating value={rating} onChange={handleRating} />
              </Card>
              <Link
                href={menuHref}
                className="mt-4 flex min-h-12 items-center justify-center gap-2 text-sm font-semibold text-red-700 dark:text-red-300"
              >
                <UtensilsCrossed className="h-4 w-4" />
                Back to menu
              </Link>
            </motion.div>
          )}

          {step === "questions" && (
            <motion.div key="questions" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-800 dark:text-white">Tell us a little more</h2>
                  <p className="text-sm text-gray-500 mt-1">Optional. Skip anything you like.</p>
                </div>
                <OrderPicker selected={orderedItems} onChange={setOrderedItems} dishes={dishes} />
                <ServicePicker value={service} onChange={setService} />
                <RecommendPicker value={recommend} onChange={setRecommend} />
                <LanguagePicker value={language} onChange={setLanguage} />
                {error ? <p className="text-sm text-red-600">{error}</p> : null}
              </Card>
            </motion.div>
          )}

          {step === "reviews" && (
            <motion.div key="reviews" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <h2 className="text-2xl font-black text-gray-800 dark:text-white">Pick a review</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Tap a card to copy it and open Google. Paste there, then edit if you want. We never submit it for you.
              </p>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <ReviewCards reviews={reviews} onSelect={handleSelect} copiedMessage={message} />
              {googleReviewUrl ? (
                <Button type="button" variant="outline" className="w-full min-h-12" onClick={openGoogle}>
                  Open Google Reviews
                </Button>
              ) : (
                <p className="text-xs text-gray-500">Add a Google Review URL in admin settings for one-tap open.</p>
              )}
            </motion.div>
          )}

          {step === "feedback" && (
            <motion.div key="feedback" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <form className="space-y-4" onSubmit={feedbackForm.handleSubmit(onFeedback)}>
                  <h2 className="text-2xl font-black text-gray-800 dark:text-white">What could we improve?</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">This stays private with the cafe.</p>
                  <Textarea placeholder="Your notes help us get better..." {...feedbackForm.register("message")} />
                  {feedbackForm.formState.errors.message ? (
                    <p className="text-sm text-red-600">{feedbackForm.formState.errors.message.message}</p>
                  ) : null}
                  <Button type="submit" size="lg" className="w-full min-h-14" disabled={loading}>
                    {loading ? "Sending..." : "Send private feedback"}
                  </Button>
                </form>
              </Card>
            </motion.div>
          )}

          {step === "thanks" && (
            <motion.div key="thanks" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <Card className="space-y-4 text-center">
                <h2 className="text-2xl font-black text-gray-800 dark:text-white">Thank you</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Your note went to the team. You can still leave a public Google review if you wish.
                </p>
                <Button type="button" variant="accent" className="w-full min-h-14" onClick={openGoogle}>
                  Leave a Google review
                </Button>
                <Link href={menuHref} className="block min-h-12 leading-[48px] text-sm font-semibold text-red-700">
                  Back to menu
                </Link>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {step === "questions" ? (
        <div className="fixed bottom-0 inset-x-0 z-50">
          <div className="max-w-md mx-auto px-4 pb-4">
            <Button type="button" size="lg" className="w-full min-h-14 text-base" disabled={loading} onClick={handleGenerate}>
              <Sparkles className="h-4 w-4" />
              Generate My Reviews
            </Button>
          </div>
        </div>
      ) : null}

      <AnimatePresence>
        {loading && step === "questions" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-white/90 dark:bg-zinc-950/90 backdrop-blur-sm flex items-center justify-center px-8"
          >
            <div className="text-center space-y-3">
              <motion.div
                className="mx-auto h-12 w-12 rounded-full border-4 border-red-200 border-t-red-600"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
              />
              <p className="text-lg font-black text-gray-800 dark:text-white">We&apos;re writing something amazing...</p>
              <p className="text-sm text-gray-500">This takes a couple of seconds.</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </CafeShell>
  );
}
