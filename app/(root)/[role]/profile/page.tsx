// UniVault — Profile Editor Page with shadcn/ui components
// Save as `app/(dashboard)/profile/page.tsx`

"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useTheme } from "next-themes";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFaculties } from "@/hooks/useFaculties";
import { useDepartments } from "@/hooks/useDepartments";

const ProfileSchema = z.object({
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  faculty: z.string().optional(),
  department: z.string().optional(),
  year: z.string().optional(),
  matricNumber: z.string().optional(),
  dob: z.string().optional(),
  heightCm: z.string().optional(),
  weightKg: z.string().optional(),
  bio: z.string().max(500).optional(),
  preferences: z
    .object({
      allowEmail: z.boolean().optional(),
      allowSms: z.boolean().optional(),
    })
    .optional(),
  speech: z
    .object({
      enableSpeechToText: z.boolean().optional(),
      voice: z.string().optional(),
      speechRate: z.number().optional(),
      speechPitch: z.number().optional(),
    })
    .optional(),
});

type ProfileForm = z.infer<typeof ProfileSchema>;

function computeBMI(heightCm?: string, weightKg?: string) {
  const h = Number(heightCm);
  const w = Number(weightKg);
  if (!h || !w) return "—";
  const m = h / 100;
  const bmi = w / (m * m);
  return bmi.toFixed(1);
}

export default function ProfilePage() {
  const { theme, setTheme } = useTheme();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [gender, setGender] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const { data: faculties, isError, error } = useFaculties(1, 1000);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      faculty: "",
      department: "",
      year: "",
      matricNumber: "",
      dob: "",
      heightCm: "",
      weightKg: "",
      bio: "",
      preferences: { allowEmail: true, allowSms: false },
      speech: {
        enableSpeechToText: true,
        voice: "en-US-Wavenet-A",
        speechRate: 1.0,
        speechPitch: 1.0,
      },
    },
  });
  const selectedFaculty = watch("faculty");
  const { data: departments, isLoading: loadingDepartments } = useDepartments({
    facultyId: selectedFaculty,
  });
  const watchedHeight = watch("heightCm");
  const watchedWeight = watch("weightKg");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await axios.get("/api/profile");
        const data = res.data;
        console.log(data);
        for (const key of Object.keys(data)) {
          // @ts-ignore
          setValue(key, data[key]);
          setValue("faculty", data.faculty?.id ?? "");
          setValue("department", data.department?.id ?? "");
        }
        if (data.gender) setGender(data.gender)
        if (data.role) setRole(data.role)
        if (data.avatarUrl) setAvatarPreview(data.avatarUrl);
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [setValue]);

  async function onSubmit(values: ProfileForm) {
    try {
      setLoading(true);
      await axios.put("/api/profile", values);
      setSavedAt(new Date().toISOString());
    } catch (err) {
      console.error(err);
      alert("Failed to save profile");
    } finally {
      setLoading(false);
    }
  }

  function handleAvatarChange(file?: File) {
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
  }

  return (
    <div className="max-w-6xl mx-auto p-6 font-poppins">
      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-semibold mb-4"
      >
        Profile
      </motion.h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Left column */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-xl bg-muted overflow-hidden flex items-center justify-center">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground">No avatar</div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-normal">
                    {watch("firstName")} {watch("lastName")}
                  </div>
                  <div className="text-xs font-light text-muted-foreground">
                    {watch("email")}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Label className="cursor-pointer">
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleAvatarChange(e.target.files?.[0] ?? undefined)
                        }
                      />
                      <Button variant="outline" size="sm">
                        Upload
                      </Button>
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAvatarPreview(null)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>

              <hr className="my-4" />

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div>Last saved:</div>
                  <div className="text-muted-foreground text-xs">
                    {savedAt ? new Date(savedAt).toLocaleString() : "Never"}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>Gender:</div>
                  <div className="text-muted-foreground text-xs">
                    {gender}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>Role:</div>
                  <div className="text-muted-foreground text-xs">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span> {role}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Saving..." : "Save Profile"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.location.reload()}
                  >
                    Revert
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Settings</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 font-light">
              <Label className="flex items-center justify-between text-sm">
                Email notifications
                <Checkbox {...register("preferences.allowEmail")} />
              </Label>
              <Label className="flex items-center justify-between text-sm">
                SMS notifications
                <Checkbox {...register("preferences.allowSms")} />
              </Label>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 font-light">
              <RadioGroup
                value={theme}
                onValueChange={(value: any) => setTheme(value)}
              >
                <div className="flex items-center gap-3">
                  <Label htmlFor="light">Light</Label>
                  <RadioGroupItem value="light" id="light" />
                </div>
                <div className="flex items-center gap-3">
                  <Label htmlFor="dark">Dark</Label>
                  <RadioGroupItem value="dark" id="dark" />
                </div>
                <div className="flex items-center gap-3">
                  <Label htmlFor="system">System Default</Label>
                  <RadioGroupItem value="system" id="system" />
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Speech & Assist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm font-light">
              <div className="flex items-center justify-between">
                <span>Speech-to-text</span>
                <Checkbox {...register("speech.enableSpeechToText")} />
              </div>

              <Label className="text-xs">Voice</Label>
              <Select
                onValueChange={(val: any) => setValue("speech.voice", val)}
                defaultValue={watch("speech.voice")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-US-Wavenet-A">
                    en-US-Wavenet-A
                  </SelectItem>
                  <SelectItem value="en-UK-Wavenet-B">
                    en-UK-Wavenet-B
                  </SelectItem>
                  <SelectItem value="en-NG-Standard-1">
                    en-NG-Standard-1
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-3">
                <Label className="text-xs">Rate</Label>
                <Slider
                  defaultValue={[1]}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  onValueChange={(val) => setValue("speech.speechRate", val[0])}
                />
                <div className="text-xs w-10 text-right">
                  {watch("speech.speechRate")?.toFixed?.(1) ?? "1.0"}x
                </div>
              </div>

              <Button type="button" variant="outline" className="w-full mt-3">
                Play sample
              </Button>
            </CardContent>
          </Card>
        </motion.div>


        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="font-cairo">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
              <Input
                placeholder="First name"
                {...register("firstName")}
                className="font-light text-sm"
              />
              <Input
                placeholder="Last name"
                {...register("lastName")}
                className="font-light text-sm"
              />
              <Input
                className="md:col-span-2 font-light text-sm"
                placeholder="Email address"
                {...register("email")}
              />
              <Input
                placeholder="Phone"
                {...register("phone")}
                className="font-light text-sm"
              />
              <Textarea
                className="md:col-span-2 font-light text-sm"
                placeholder="Short bio"
                rows={3}
                {...register("bio")}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-cairo">Academic Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 font-light text-sm">
              <Select
                value={watch("faculty")}
                onValueChange={(val: any) => setValue("faculty", val)}
                defaultValue={watch("faculty")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Faculty" />
                </SelectTrigger>
                <SelectContent>
                  {faculties?.map((faculty: { id: any; name: any }) => (
                    <SelectItem key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                onValueChange={(val: any) => setValue("department", val)}
                value={watch("department")}
                disabled={!departments?.length}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments?.map((dept: { id: string; name: string }) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Year"
                {...register("year")}
                className="font-light text-sm"
              />
              <Input
                placeholder="Matriculation number"
                {...register("matricNumber")}
                className="md:col-span-2 font-light text-sm"
              />
              <Input
                type="date"
                placeholder="Date of birth"
                {...register("dob")}
                className="font-light text-sm"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-cairo">Body Data</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Height (cm)"
                {...register("heightCm")}
                className="font-light text-sm"
              />
              <Input
                placeholder="Weight (kg)"
                {...register("weightKg")}
                className="font-light text-sm"
              />
              <div className="p-3 rounded-lg border flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">
                    BMI (approx)
                  </div>
                  <div className="font-medium">
                    {computeBMI(watchedHeight, watchedWeight)}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Auto-calculated
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-cairo">
                Profile Search & Speech
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4 items-center">
              <div className="md:col-span-2">
                <Label className="text-sm">Quick profile search</Label>
                <div className="flex gap-2 mt-2 font-light text-sm">
                  <Input
                    placeholder="Search users, books, notes..."
                    className="font-light text-sm"
                  />
                  <Button variant="outline" className="font-light text-xs">
                    Search
                  </Button>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Searches are contextual to your faculty & department when
                  enabled.
                </div>
              </div>
              <div>
                <Label className="text-sm">Voice Command</Label>
                <div className="mt-2 flex gap-2 font-light text-xs">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={startVoice}
                    className="font-light text-xs"
                  >
                    Start
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={stopVoice}
                    className="font-light text-xs"
                  >
                    Stop
                  </Button>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Try: "Open my library" or "Show my reading stats"
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setValue("bio", "")}
            >
              Clear Bio
            </Button>
            <Button type="submit" size="sm">
              Save all
            </Button>
          </div>
        </motion.div>
      </form>
    </div>
  );
}
let recognition: any = null;
function startVoice() {
  if (typeof window === "undefined") return;
  // @ts-ignore
  const SpeechRecognition =
      //@ts-ignore
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition)
    return alert("Web Speech API not supported in this browser");
  recognition = new SpeechRecognition();
  recognition.lang = "en-NG";
  recognition.interimResults = true;
  recognition.onresult = (ev: any) => {
    const text = Array.from(ev.results)
      .map((r: any) => r[0].transcript)
      .join("");
    console.log("Voice captured:", text);
  };
  recognition.start();
}
function stopVoice() {
  if (!recognition) return;
  recognition.stop();
}
