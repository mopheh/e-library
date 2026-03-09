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
import { Loader2, ArrowRight, ArrowLeft, BookOpen } from "lucide-react";
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
      if (accountType === "STUDENT") {
        fieldsToValidate.push("level");
      }
    } else if (step === 3) {
      fieldsToValidate = ["tel", "gender", "address"];
    }

    const isValid = await trigger(fieldsToValidate);
    return isValid;
  };

  const handleNext = async () => {
    const isValid = await validateStep();
    if (isValid) setStep((s) => s + 1);
  };

  const handlePrev = () => {
    setStep((s) => Math.max(1, s - 1));
  };

  const onSubmit = async (data: OnboardingFormData) => {
    setIsSubmitting(true);
    try {
      const promise = createUser({
        //@ts-ignore
        clerkId: user?.id,
        email: user?.emailAddresses[0].emailAddress,
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
        error: "Failed to create profile. Please try again.",
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
        body: JSON.stringify({
          type: "ONBOARDING",
          meta: { action: "Onboarding Completed" },
        }),
      });

      router.push(`/${data.accountType.toLowerCase()}/dashboard`);
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-8 font-poppins h-full">
      <div className="bg-white dark:bg-zinc-900 shadow-2xl rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 relative overflow-hidden">
        
        {/* Progress Bar Header */}
        <div className="mb-8">
           <h1 className="text-2xl font-bold font-open-sans mb-2 tracking-tight">Setup Your Account</h1>
           <p className="text-zinc-500 text-sm mb-6">Let's get you ready to explore UniVault's academic ecosystem.</p>
           
           <div className="flex items-center gap-2 mb-2">
              {[1, 2, 3].map((i) => (
                 <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${step >= i ? "bg-blue-600" : "bg-zinc-100 dark:bg-zinc-800"}`} />
              ))}
           </div>
           <div className="flex justify-between text-xs font-semibold text-zinc-400 uppercase tracking-widest">
              <span className={step >= 1 ? "text-blue-600" : ""}>Role</span>
              <span className={step >= 2 ? "text-blue-600" : ""}>Academics</span>
              <span className={step >= 3 ? "text-blue-600" : ""}>Details</span>
           </div>
        </div>

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative min-h-[300px]">
            <AnimatePresence mode="wait">
              
              {/* --- STEP 1: ROLE & ID --- */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <FormField
                    control={control}
                    name="accountType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>I am a...</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                              <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="STUDENT">Current University Student</SelectItem>
                            <SelectItem value="ASPIRANT">Post-UTME / Aspirant</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="matric"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                           {accountType === "ASPIRANT" ? "JAMB Registration Number" : "Matriculation Number"}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={accountType === "ASPIRANT" ? "e.g. 20230010484GA" : "e.g. 19/52HL012"} 
                            className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}


              {/* --- STEP 2: ACADEMICS --- */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <FormField
                    control={control}
                    name="faculty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Faculty</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                              <SelectValue placeholder="Select Faculty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {faculties?.map((faculty) => (
                              <SelectItem key={faculty.id} value={faculty.id}>
                                {faculty.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedFaculty || loadingDepartments}>
                          <FormControl>
                            <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                              <SelectValue placeholder={
                                !selectedFaculty ? "Select a faculty first" :
                                loadingDepartments ? "Loading departments..." : "Select Department"
                              } />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments?.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {accountType === "ASPIRANT" && subjectCombination && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-2xl p-4"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                          Required Subject Combination
                        </h4>
                      </div>
                      <div className="space-y-3 text-sm">
                         <div>
                            <span className="font-medium text-blue-800 dark:text-blue-300">JAMB: </span>
                            <span className="text-blue-700/80 dark:text-blue-200/70">{subjectCombination.jamb.join(", ")}</span>
                         </div>
                         <div>
                            <span className="font-medium text-blue-800 dark:text-blue-300">Post-UTME: </span>
                            <span className="text-blue-700/80 dark:text-blue-200/70">{subjectCombination.postUtme.join(", ")}</span>
                         </div>
                         {subjectCombination.requirements && (
                           <div className="pt-2 mt-2 border-t border-blue-200/50 dark:border-blue-800/50">
                             <p className="text-blue-700/80 dark:text-blue-200/70 text-xs">{subjectCombination.requirements}</p>
                           </div>
                         )}
                      </div>
                    </motion.div>
                  )}

                  {accountType === "STUDENT" && (
                    <FormField
                      control={control}
                      name="level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                                <SelectValue placeholder="Select Academic Level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {["100", "200", "300", "400", "500", "600"].map((lvl) => (
                                <SelectItem key={lvl} value={lvl}>{lvl} Level</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </motion.div>
              )}


              {/* --- STEP 3: PERSONAL INFO --- */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 gap-4">
                     <FormField
                        control={control}
                        name="tel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input type="tel" placeholder="+234..." className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                                  <SelectValue placeholder="Gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="MALE">Male</SelectItem>
                                <SelectItem value="FEMALE">Female</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </div>

                  <FormField
                    control={control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Residential Address</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter your full address..." 
                            className="resize-none rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 p-4" 
                            rows={3} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}

            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-8 mt-auto">
               {step > 1 ? (
                 <Button 
                   type="button" 
                   variant="outline" 
                   onClick={handlePrev}
                   className="rounded-xl h-12 px-6 border-zinc-200 dark:border-zinc-800"
                   disabled={isSubmitting}
                 >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                 </Button>
               ) : (
                 <div /> // Empty div to keep 'Next' aligned to the right
               )}

               {step < 3 ? (
                 <Button 
                   type="button"
                   onClick={handleNext}
                   className="rounded-xl h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white"
                 >
                    Next <ArrowRight className="w-4 h-4 ml-2" />
                 </Button>
               ) : (
                 <Button 
                   type="submit"
                   disabled={isSubmitting}
                   className="rounded-xl h-12 px-8 bg-black dark:bg-white text-white dark:text-black font-semibold shadow-lg hover:scale-105 transition-transform"
                 >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Finalizing...</>
                    ) : (
                      "Complete Setup"
                    )}
                 </Button>
               )}
            </div>
            
          </form>
        </Form>
      </div>
    </div>
  );
};

export default Onboarding;
