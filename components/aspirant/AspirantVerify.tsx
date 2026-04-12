"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UploadCloud, CheckCircle, AlertTriangle, Building, FileText, BadgeCheck, Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { submitVerification, getVerificationStatus } from "@/actions/aspirant";
import { getFaculties, getDepartmentsByFaculty } from "@/actions/academic";
import { LEVEL_ENUM } from "@/database/schema";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileUploadDropzone } from "@/components/shared/FileUploadDropzone";
import { useUserData } from "@/hooks/useUsers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const verifySchema = z.object({
  jambNo: z.string().min(5, "JAMB number required"),
  approvedFacultyId: z.string().min(1, "Faculty is required"),
  approvedDepartmentId: z.string().min(1, "Department is required"),
  admissionYear: z.string().min(4, "Year is required"),
  level: z.enum(["100", "200", "300", "400", "500", "600"]),
});

type VerifyFormValues = z.infer<typeof verifySchema>;

export default function AspirantVerify() {
  const { user } = useUser();
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  
  const [faculties, setFaculties] = useState<{ id: string; name: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(false);
  const { data: dbUser } = useUserData();
  
  const [status, setStatus] = useState<"idle" | "success" | "pending" | "loading_status">("loading_status");

  const form = useForm<VerifyFormValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      jambNo: "",
      approvedFacultyId: "",
      approvedDepartmentId: "",
      admissionYear: new Date().getFullYear().toString(),
      level: "100",
    },
  });

  const selectedFacultyId = form.watch("approvedFacultyId");

  useEffect(() => {
    // Check if user already submitted
    getVerificationStatus().then((req) => {
      if (req && req.id) {
        console.log("Submitedd!!!!!", req)
        setStatus("pending"); // either pending or approved handled elsewhere
      } else {
        setStatus("idle");
      }
    });

    // Load faculties
    getFaculties().then(setFaculties);
  }, []);

  useEffect(() => {
    if (dbUser?.matricNo) {
      form.setValue("jambNo", dbUser.matricNo);
    }
  }, [dbUser, form]);

  useEffect(() => {
    if (selectedFacultyId) {
      setIsDepartmentsLoading(true);
      getDepartmentsByFaculty(selectedFacultyId)
        .then(setDepartments)
        .finally(() => setIsDepartmentsLoading(false));
      form.setValue("approvedDepartmentId", ""); // reset department when faculty changes
    } else {
      setDepartments([]);
    }
  }, [selectedFacultyId, form]);


  const onSubmit = async (data: VerifyFormValues) => {
    if (!uploadedUrl) {
      toast.error("Please upload your admission document first");
      return;
    }

    const result = await submitVerification({
      ...data,
      proofUrl: uploadedUrl,
      subjectCombinations: [],
    });

    if (result.success) {
      toast.success("Verification request submitted!");
      setStatus("success");
    } else {
      toast.error(result.error);
    }
  };

  if (status === "loading_status") {
    return <div className="flex-1 p-8 flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (status === "success" || status === "pending") {
    return (
       <div className="flex-1 p-4 md:p-8 pt-12 min-h-screen bg-zinc-50 dark:bg-zinc-950 font-poppins flex flex-col items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-md w-full shadow-xl border border-zinc-200 dark:border-zinc-800 text-center"
          >
             <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10" />
             </div>
             <h2 className="text-2xl font-semibold font-cabin mb-2">Request Submitted</h2>
             <p className="text-zinc-600 dark:text-zinc-400 mb-8">
               Your admission verification request is currently pending. Please allow 24-48 hours for our team to review your documents and grant you Student access.
             </p>
             <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl text-left border border-zinc-100 dark:border-zinc-700">
               <div className="text-xs text-zinc-500 mb-1">Status</div>
               <div className="font-semibold text-blue-600 flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                 In Review
               </div>
             </div>
          </motion.div>
       </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 min-h-screen bg-zinc-50 dark:bg-zinc-950 font-poppins">
      
      <div className="max-w-3xl mx-auto">
        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <BadgeCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold font-open-sans mb-2">Verify Your Admission</h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-xs font-poppins max-w-lg mx-auto">
            Upgrade your account to a Verified Student to unlock premium department resources, internal past questions, and full lecture notes.
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-10 shadow-lg border border-zinc-200 dark:border-zinc-800">
           
           <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-2xl flex gap-4 mb-8">
              <AlertTriangle className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-800 dark:text-blue-300 font-poppins font-light">
                 Please ensure that your JAMB admission letter or university clearance form clearly shows your full name, department, and institution. Ensure you select the correct department you were admitted into (which may differ from what you applied for).
              </div>
           </div>

           <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-xs font-normal mb-2">Full Name</label>
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 cursor-not-allowed">
                       {user?.firstName} {user?.lastName}
                    </div>
                 </div>
                 
                 <div>
                    <label className="block text-xs font-normal font-poppins mb-2">JAMB Registration No.</label>
                    <input 
                      {...form.register("jambNo")}
                      readOnly
                      placeholder="e.g. 20230010484GA"
                      className="w-full bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 cursor-not-allowed focus:outline-none"
                    />
                    {form.formState.errors.jambNo && <p className="text-red-500 text-xs mt-1">{form.formState.errors.jambNo.message}</p>}
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-xs font-normal font-poppins mb-2">Admitted Faculty</label>
                    <Controller
                      control={form.control}
                      name="approvedFacultyId"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value} disabled={faculties.length === 0}>
                          <SelectTrigger className="w-full bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 h-[50px]">
                            <SelectValue placeholder="Select Faculty..." />
                          </SelectTrigger>
                          <SelectContent>
                            {faculties.map((f) => (
                              <SelectItem key={f.id} value={f.id}>
                                {f.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {form.formState.errors.approvedFacultyId && <p className="text-red-500 text-xs mt-1">{form.formState.errors.approvedFacultyId.message}</p>}
                 </div>

                 <div>
                    <label className="block text-xs font-normal font-poppins mb-2">Admitted Department</label>
                    <div className="relative">
                       <Building className="absolute left-3 top-3.5 w-5 h-5 text-zinc-400 z-10" />
                       {isDepartmentsLoading && (
                         <div className="absolute right-8 top-3.5 z-10">
                           <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                         </div>
                       )}
                       <Controller
                         control={form.control}
                         name="approvedDepartmentId"
                         render={({ field }) => (
                           <Select onValueChange={field.onChange} value={field.value} disabled={!selectedFacultyId || departments.length === 0 || isDepartmentsLoading}>
                             <SelectTrigger className="w-full bg-white dark:bg-zinc-900 px-3 py-3 pl-10 rounded-xl border border-zinc-300 dark:border-zinc-700 h-[50px] disabled:opacity-50 relative">
                               <SelectValue placeholder={isDepartmentsLoading ? "Loading departments..." : "Select Department..."} />
                             </SelectTrigger>
                             <SelectContent>
                               {departments.map((d) => (
                                 <SelectItem key={d.id} value={d.id}>
                                   {d.name}
                                 </SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                         )}
                       />
                    </div>
                    {form.formState.errors.approvedDepartmentId && <p className="text-red-500 text-xs mt-1">{form.formState.errors.approvedDepartmentId.message}</p>}
                 </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-normal font-poppins mb-2">Admission Year</label>
                    <input 
                      {...form.register("admissionYear")}
                      type="text"
                      placeholder="e.g. 2024"
                      className="w-full bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-normal font-poppins mb-2">Starting Level</label>
                    <Controller
                      control={form.control}
                      name="level"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="w-full bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 h-[50px]">
                            <SelectValue placeholder="Select Level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="100">100 Level</SelectItem>
                            <SelectItem value="200">200 Level (Direct Entry)</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
              </div>


              <div>
                 <label className="block text-xs font-normal font-poppins mb-2">Upload Admission Document</label>
                 <FileUploadDropzone 
                    onUploadSuccess={(url) => setUploadedUrl(url)}
                    accept="application/pdf,image/png,image/jpeg,image/webp,.pdf,.jpg,.jpeg,.png"
                    maxSizeMB={5}
                    label="Click or drag admission document to upload"
                 />
              </div>

              <div className="pt-4">
                 <button 
                   type="submit" 
                   disabled={form.formState.isSubmitting || !uploadedUrl}
                   className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                 >
                    {form.formState.isSubmitting ? (
                      <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Submitting...</>
                    ) : (
                      "Submit Verification Request"
                    )}
                 </button>
              </div>
           </form>
        </div>
      </div>
    </div>
  );
}
