"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { createUser } from "@/actions/auth";
import { useFaculties } from "@/hooks/useFaculties";
import { toast } from "sonner";
import { useDepartments } from "@/hooks/useDepartments";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, ArrowLeft, BookOpen, CheckCircle2, GraduationCap, UserCircle2 } from "lucide-react";
import { getSubjectCombination } from "@/lib/subjectCombinations";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const onboardingSchema = z.object({
  accountType: z.enum(["STUDENT", "ASPIRANT"]),
  matric: z
    .string()
    .min(3, "ID must be at least 3 characters")
    .max(20, "ID too long"),
  faculty: z.string().min(1, "Faculty is required"),
  department: z.string().min(1, "Department is required"),
  level: z.enum(["100", "200", "300", "400", "500", "600"]).optional(),
  tel: z.string().regex(/^\+?\d{7,15}$/, "Enter a valid phone number"),
  gender: z.enum(["MALE", "FEMALE"]),
  address: z.string().min(5, "Address must be at least 5 characters"),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

const STEPS = [
  { id: 1, label: "Role & ID",    icon: UserCircle2 },
  { id: 2, label: "Academics",    icon: GraduationCap },
  { id: 3, label: "Personal",     icon: BookOpen },
];

const Onboarding = () => {
  const { data: faculties, isError, error } = useFaculties(1, 1000);
  const { userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      accountType: "STUDENT",
      matric: "",
      faculty: "",
      department: "",
      level: undefined,
      tel: "",
      gender: undefined,
      address: "",
    },
    mode: "onChange",
  });

  const { watch, trigger, handleSubmit, control } = form;
  const selectedFaculty = watch("faculty");
  const selectedDepartment = watch("department");
  const accountType = watch("accountType");

  const { data: departments, isLoading: loadingDepartments } = useDepartments({
    facultyId: selectedFaculty,
    limit: 1000,
  });

  const departmentName = departments?.find((d) => d.id === selectedDepartment)?.name;
  const subjectCombination = departmentName ? getSubjectCombination(departmentName) : null;

  useEffect(() => {
    if (userId) {
      fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "LOGIN",
          meta: { action: "User logged in" },
        }),
      });
    }
  }, [userId]);

  useEffect(() => {
    const checkExistingUser = async () => {
      if (!userId || !user) return;
      try {
        const res = await fetch(`/api/users?clerkId=${userId}`);
        const data = await res.json();
        if (data && data.length > 0) {
          const { syncUserMetadata } = await import("@/actions/sync");
          const result = await syncUserMetadata();
          if (result.success) {
            toast.success("Profile found! Syncing and redirecting...");
            window.location.href = "/dashboard";
          }
        }
      } catch (err) {
        console.error("Error checking existing user:", err);
      }
    };
    checkExistingUser();
  }, [userId, user, router]);

  useEffect(() => {
    if (isError) {
      toast.error("Something went wrong", {
        description: error?.message || "Unable to fetch faculties",
      });
    }
  }, [isError, error]);

  const validateStep = async () => {
    let fieldsToValidate: (keyof OnboardingFormData)[] = [];
    if (step === 1) {
      fieldsToValidate = ["accountType", "matric"];
    } else if (step === 2) {
      fieldsToValidate = ["faculty", "department"];
      if (accountType === "STUDENT") fieldsToValidate.push("level");
    } else if (step === 3) {
      fieldsToValidate = ["tel", "gender", "address"];
    }
    return await trigger(fieldsToValidate);
  };

  const handleNext = async () => {
    if (await validateStep()) setStep((s) => s + 1);
  };

  const handlePrev = () => setStep((s) => Math.max(1, s - 1));

  const onSubmit = async (data: OnboardingFormData) => {
    setIsSubmitting(true);
    try {
      const promise = createUser({
        clerkId: user?.id,
        email: user?.emailAddresses[0].emailAddress || "",
        fullName: `${user?.firstName} ${user?.lastName}`,
        facultyId: data.faculty,
        departmentId: data.department,
        year: data.accountType === "ASPIRANT" ? "100" : (data.level || "100"),
        role: data.accountType,
        phoneNumber: data.tel,
        matricNo: data.matric,
        gender: data.gender,
        address: data.address,
        onboarded: true,
      });

      toast.promise(promise, {
        loading: "Creating your profile...",
        success: "Profile created successfully!",
        error: (err: any) => err.message || "Failed to create profile. Please try again.",
      });

      await promise;
      await user?.update({
        unsafeMetadata: {
          ...data,
          role: data.accountType.toLowerCase(),
          onboarded: true,
        },
      });
      await fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "ONBOARDING", meta: { action: "Onboarding Completed" } }),
      });
      router.push("/dashboard");
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  const inputClass = "h-12 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-poppins text-sm focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all";
  const labelClass = "font-poppins text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5";

  return (
    <div className="w-full max-w-xl mx-auto font-poppins">
      {/* Card */}
      <div className="bg-white dark:bg-zinc-900 shadow-xl shadow-zinc-200/60 dark:shadow-black/30 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">

        {/* Progress header */}
        <div className="px-7 pt-7 pb-6 border-b border-zinc-100 dark:border-zinc-800">
          <h1 className="font-cabin text-xl font-black text-zinc-900 dark:text-white tracking-tight mb-0.5">
            Complete Your Profile
          </h1>
          <p className="font-poppins text-sm text-zinc-500 dark:text-zinc-400">
            Step {step} of 3 — {STEPS[step - 1].label}
          </p>

          {/* Step bar */}
          <div className="flex items-center gap-2 mt-4">
            {STEPS.map((s, i) => {
              const isCompleted = step > s.id;
              const isCurrent  = step === s.id;
              const Icon = s.icon;
              return (
                <React.Fragment key={s.id}>
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 text-xs font-bold
                        ${isCompleted ? "bg-blue-600 text-white" : isCurrent ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-600 text-blue-600 dark:text-blue-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600"}`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block transition-colors ${isCurrent ? "text-blue-600 dark:text-blue-400" : isCompleted ? "text-blue-500" : "text-zinc-400 dark:text-zinc-600"}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-px transition-all duration-500 ${step > s.id ? "bg-blue-500" : "bg-zinc-200 dark:bg-zinc-700"}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Form body */}
        <div className="px-7 py-6">
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 relative min-h-[280px]">
              <AnimatePresence mode="wait">

                {/* STEP 1 */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 24 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="space-y-5"
                  >
                    <FormField
                      control={control}
                      name="accountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelClass}>I am a...</FormLabel>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { value: "STUDENT", label: "University Student", desc: "Currently enrolled" },
                              { value: "ASPIRANT", label: "Post-UTME Aspirant", desc: "Seeking admission" },
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => field.onChange(opt.value)}
                                className={`relative text-left rounded-xl p-4 border-2 transition-all duration-200 ${
                                  field.value === opt.value
                                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10"
                                    : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30 hover:border-zinc-300 dark:hover:border-zinc-600"
                                }`}
                              >
                                {field.value === opt.value && (
                                  <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                  </div>
                                )}
                                <p className={`text-sm font-semibold ${field.value === opt.value ? "text-emerald-700 dark:text-emerald-400" : "text-zinc-800 dark:text-zinc-200"}`}>
                                  {opt.label}
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">{opt.desc}</p>
                              </button>
                            ))}
                          </div>
                          <FormMessage className="text-xs text-red-500 mt-1" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="matric"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelClass}>
                            {accountType === "ASPIRANT" ? "JAMB Registration Number" : "Matriculation Number"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={accountType === "ASPIRANT" ? "e.g. 20230010484GA" : "e.g. 19/52HL012"}
                              className={inputClass}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs text-red-500 mt-1" />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 24 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="space-y-5"
                  >
                    <FormField
                      control={control}
                      name="faculty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelClass}>Faculty</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className={inputClass}>
                                <SelectValue placeholder="Select your faculty" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="font-inter rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-xl">
                              {faculties?.map((f) => (
                                <SelectItem key={f.id} value={f.id} className="rounded-lg">{f.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs text-red-500 mt-1" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelClass}>Department</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedFaculty || loadingDepartments}>
                            <FormControl>
                              <SelectTrigger className={inputClass}>
                                <SelectValue placeholder={
                                  !selectedFaculty ? "Select a faculty first" :
                                  loadingDepartments ? "Loading departments..." : "Select your department"
                                } />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="font-inter rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-xl">
                              {departments?.map((d) => (
                                <SelectItem key={d.id} value={d.id} className="rounded-lg">{d.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs text-red-500 mt-1" />
                        </FormItem>
                      )}
                    />

                    {accountType === "ASPIRANT" && subjectCombination && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl p-4 bg-blue-50/60 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/40"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Required Subject Combination</p>
                        </div>
                        <p className="text-xs text-blue-700/80 dark:text-blue-300/70">
                          <span className="font-semibold">JAMB: </span>{subjectCombination.jamb.join(", ")}
                        </p>
                        <p className="text-xs text-blue-700/80 dark:text-blue-300/70 mt-1">
                          <span className="font-semibold">Post-UTME: </span>{subjectCombination.postUtme.join(", ")}
                        </p>
                        {subjectCombination.requirements && (
                          <p className="text-xs text-blue-700/60 dark:text-blue-300/50 mt-2 pt-2 border-t border-blue-200/40 dark:border-blue-800/30">
                            {subjectCombination.requirements}
                          </p>
                        )}
                      </motion.div>
                    )}

                    {accountType === "STUDENT" && (
                      <FormField
                        control={control}
                        name="level"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={labelClass}>Current Level</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className={inputClass}>
                                  <SelectValue placeholder="Select your academic level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="font-inter rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-xl">
                                {["100", "200", "300", "400", "500", "600"].map((lvl) => (
                                  <SelectItem key={lvl} value={lvl} className="rounded-lg">{lvl} Level</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs text-red-500 mt-1" />
                          </FormItem>
                        )}
                      />
                    )}
                  </motion.div>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 24 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="space-y-5"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={control}
                        name="tel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={labelClass}>Phone Number</FormLabel>
                            <FormControl>
                              <Input type="tel" placeholder="+234..." className={inputClass} {...field} />
                            </FormControl>
                            <FormMessage className="text-xs text-red-500 mt-1" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={labelClass}>Gender</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className={inputClass}>
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="font-inter rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-xl">
                                <SelectItem value="MALE" className="rounded-lg">Male</SelectItem>
                                <SelectItem value="FEMALE" className="rounded-lg">Female</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs text-red-500 mt-1" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelClass}>Residential Address</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter your full residential address..."
                              className="resize-none rounded-xl bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-inter text-sm focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 transition-all p-3"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs text-red-500 mt-1" />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrev}
                    disabled={isSubmitting}
                    className="rounded-xl h-12 px-5 rounded-xl border-zinc-200 dark:border-zinc-700 font-poppins font-medium text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
                  </Button>
                ) : <div />}

                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-poppins font-semibold text-sm shadow-sm hover:shadow-md transition-all"
                  >
                    Continue <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-poppins font-semibold text-sm shadow-sm hover:shadow-md transition-all disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Setting up...</>
                    ) : (
                      <>Complete Setup <CheckCircle2 className="w-4 h-4 ml-1.5" /></>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
