import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import { useUser } from "@clerk/nextjs";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useFaculties } from "@/hooks/useFaculties";
import { useDepartments } from "@/hooks/useDepartments";

const ProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  faculty: z.string().optional(),
  department: z.string().optional(),
  year: z.string().optional(),
  matricNumber: z.string().optional(),
  dob: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof ProfileSchema>;

interface ProfileFormProps {
  profile: any;
  onSaved: () => void;
}

export default function ProfileForm({ profile, onSaved }: ProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const { data: faculties } = useFaculties(1, 1000);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      firstName: profile?.firstName || "",
      lastName: profile?.lastName || "",
      phone: profile?.phoneNumber || "",
      faculty: profile?.faculty?.id || "",
      department: profile?.department?.id || "",
      year: profile?.year || "",
      matricNumber: profile?.matricNumber || "",
      dob: profile?.dateOfBirth || "",
      gender: profile?.gender || "",
      address: profile?.address || "",
    },
  });

  const selectedFaculty = watch("faculty");
  const { data: departments } = useDepartments({
    facultyId: selectedFaculty,
  });

  async function onSubmit(values: ProfileFormValues) {
    try {
      setLoading(true);
      await axios.put("/api/profile", values);
      toast.success("Profile updated successfully!");
      onSaved();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details here.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" placeholder="First name" {...register("firstName")} />
            {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" placeholder="Last name" {...register("lastName")} />
            {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" placeholder="Phone" {...register("phone")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input id="dob" type="date" placeholder="Date of birth" {...register("dob")} />
          </div>

          <div className="space-y-2">
             <Label htmlFor="gender">Gender</Label>
             <Select
                value={watch("gender")}
                onValueChange={(val: any) => setValue("gender", val, { shouldDirty: true, shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                   <SelectItem value="MALE">Male</SelectItem>
                   <SelectItem value="FEMALE">Female</SelectItem>
                </SelectContent>
              </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" placeholder="Address" {...register("address")} rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Academic Details</CardTitle>
          <CardDescription>Update your university academic records.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Faculty</Label>
            <Select
              value={watch("faculty")}
              onValueChange={(val: any) => {
                  setValue("faculty", val, { shouldDirty: true, shouldValidate: true });
                  setValue("department", "", { shouldDirty: true, shouldValidate: true }); // reset department when faculty changes
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Faculty" />
              </SelectTrigger>
              <SelectContent>
                {faculties?.map((faculty: any) => (
                  <SelectItem key={faculty.id} value={faculty.id}>
                    {faculty.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Department</Label>
            <Select
              value={watch("department")}
              onValueChange={(val: any) => setValue("department", val, { shouldDirty: true, shouldValidate: true })}
              disabled={!departments?.length}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                {departments?.map((dept: any) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Level / Year</Label>
            <Select
                value={watch("year")}
                onValueChange={(val: any) => setValue("year", val, { shouldDirty: true, shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Level" />
                </SelectTrigger>
                <SelectContent>
                   {["100", "200", "300", "400", "500", "600"].map((level) => (
                       <SelectItem key={level} value={level}>{level} Level</SelectItem>
                   ))}
                </SelectContent>
              </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="matricNumber">Matriculation Number</Label>
            <Input id="matricNumber" placeholder="Matriculation number" {...register("matricNumber")} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={loading || !isDirty} className="w-full md:w-auto">
          {loading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? "Saving changes..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
