"use client";

import React, { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Faculty, Department } from "@/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFaculties } from "@/hooks/useFaculties";
import { useDepartments } from "@/hooks/useDepartments";
import { type Profile, type ProfileUpdate, ProfileSaveError, useUpdateProfile } from "@/hooks/useProfile";
import { card, SectionTitle } from "./ProfileOverview";

const LEVELS = ["100", "200", "300", "400", "500", "600"] as const;

// Mirrors the server rules in app/api/profile/route.ts so most mistakes are
// caught before a round trip; the server stays the source of truth.
const schema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(60),
  lastName: z.string().trim().min(1, "Last name is required").max(60),
  phoneNumber: z
    .string()
    .refine((v) => {
      const s = v.replace(/[\s()-]/g, "");
      return s === "" || /^(?:0[789]\d{9}|\+?\d{10,15})$/.test(s);
    }, "Enter a valid phone number, e.g. 0803 123 4567"),
  gender: z.enum(["MALE", "FEMALE"], { message: "Choose your gender" }),
  dateOfBirth: z.string(),
  address: z.string().trim().min(1, "Address is required").max(255),
  matricNo: z.string().trim().min(1, "Matric number is required").max(40),
  facultyId: z.string().min(1, "Choose your faculty"),
  departmentId: z.string().min(1, "Choose your department"),
  level: z.enum(LEVELS),
});

function toForm(p: Profile): ProfileUpdate {
  return {
    firstName: p.firstName,
    lastName: p.lastName,
    phoneNumber: p.personal.phoneNumber,
    gender: p.personal.gender,
    dateOfBirth: p.personal.dateOfBirth,
    address: p.personal.address,
    matricNo: p.academic.matricNo,
    facultyId: p.academic.facultyId,
    departmentId: p.academic.departmentId,
    level: p.academic.level,
  };
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        {label}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-rose-600 dark:text-rose-400" role="alert">{error}</p>
      ) : (
        hint && <p className="text-[11px] text-zinc-500">{hint}</p>
      )}
    </div>
  );
}

export default function ProfileForm({
  profile,
  focusField,
  onOpenAccount,
}: {
  profile: Profile;
  focusField?: keyof ProfileUpdate;
  onOpenAccount: () => void;
}) {
  const save = useUpdateProfile();
  const defaults = useMemo(() => toForm(profile), [profile]);
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    setFocus,
    formState: { errors, isDirty },
  } = useForm<ProfileUpdate>({ resolver: zodResolver(schema), defaultValues: defaults });

  useEffect(() => {
    if (focusField) setTimeout(() => setFocus(focusField), 50);
  }, [focusField, setFocus]);

  const facultyId = watch("facultyId");
  const departmentId = watch("departmentId");
  const { data: faculties } = useFaculties(1, 1000);
  const { data: departments, isLoading: deptLoading } = useDepartments({ facultyId });

  const movedDepartment = departmentId !== defaults.departmentId || facultyId !== defaults.facultyId;
  const today = new Date();
  const maxDob = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate()).toISOString().slice(0, 10);

  const onSubmit = (values: ProfileUpdate) =>
    save.mutate(values, {
      onSuccess: () => {
        toast.success("Your details are saved");
        reset(values);
      },
      onError: (err) => {
        if (err instanceof ProfileSaveError && err.field) {
          setError(err.field, { message: err.message }, { shouldFocus: true });
        } else {
          toast.error(err.message);
        }
      },
    });

  const inputCls = "h-11 rounded-xl";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <section className={cn(card, "p-5 sm:p-6")}>
        <SectionTitle>Personal</SectionTitle>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="First name" htmlFor="firstName" error={errors.firstName?.message}>
            <Input id="firstName" autoComplete="given-name" className={inputCls} {...register("firstName")} />
          </Field>
          <Field label="Last name" htmlFor="lastName" error={errors.lastName?.message}>
            <Input id="lastName" autoComplete="family-name" className={inputCls} {...register("lastName")} />
          </Field>

          <Field
            label="Email"
            htmlFor="email"
            className="sm:col-span-2"
            hint={
              <>
                Your sign-in email. Change it under{" "}
                <button type="button" onClick={onOpenAccount} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                  Account
                </button>
                .
              </>
            }
          >
            <div className="relative">
              <Input id="email" value={profile.email} readOnly disabled className={cn(inputCls, "pr-9")} />
              <Lock className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </Field>

          <Field label="Phone number" htmlFor="phoneNumber" error={errors.phoneNumber?.message} hint="Optional">
            <Input id="phoneNumber" type="tel" inputMode="tel" autoComplete="tel" placeholder="0803 123 4567" className={inputCls} {...register("phoneNumber")} />
          </Field>
          <Field label="Date of birth" htmlFor="dateOfBirth" error={errors.dateOfBirth?.message} hint="Optional">
            <Input id="dateOfBirth" type="date" max={maxDob} min="1930-01-01" autoComplete="bday" className={inputCls} {...register("dateOfBirth")} />
          </Field>

          <Field label="Gender" error={errors.gender?.message} className="sm:col-span-2">
            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <div role="radiogroup" aria-label="Gender" className="grid grid-cols-2 gap-2 max-w-xs">
                  {(["MALE", "FEMALE"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      role="radio"
                      aria-checked={field.value === g}
                      onClick={() => field.onChange(g)}
                      className={cn(
                        "h-11 rounded-xl border text-sm font-semibold transition-colors",
                        field.value === g
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950/50 dark:text-indigo-200"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800",
                      )}
                    >
                      {g === "MALE" ? "Male" : "Female"}
                    </button>
                  ))}
                </div>
              )}
            />
          </Field>

          <Field label="Address" htmlFor="address" error={errors.address?.message} className="sm:col-span-2">
            <Textarea id="address" rows={2} autoComplete="street-address" className="rounded-xl resize-none" {...register("address")} />
          </Field>
        </div>
      </section>

      <section className={cn(card, "p-5 sm:p-6")}>
        <SectionTitle>Academic</SectionTitle>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Matric number" htmlFor="matricNo" error={errors.matricNo?.message} className="sm:col-span-2">
            <Input id="matricNo" autoCapitalize="characters" className={cn(inputCls, "font-mono uppercase")} {...register("matricNo")} />
          </Field>

          <Field label="Faculty" error={errors.facultyId?.message}>
            <Select
              value={facultyId}
              onValueChange={(v) => {
                setValue("facultyId", v, { shouldDirty: true, shouldValidate: true });
                setValue("departmentId", "", { shouldDirty: true });
              }}
            >
              <SelectTrigger className={inputCls}>
                <SelectValue placeholder="Choose faculty" />
              </SelectTrigger>
              <SelectContent>
                {faculties?.map((f: Faculty) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Department" error={errors.departmentId?.message}>
            <Select
              value={departmentId || undefined}
              onValueChange={(v) => setValue("departmentId", v, { shouldDirty: true, shouldValidate: true })}
              disabled={!facultyId || deptLoading}
            >
              <SelectTrigger className={inputCls}>
                <SelectValue placeholder={deptLoading ? "Loading…" : "Choose department"} />
              </SelectTrigger>
              <SelectContent>
                {departments?.map((d: Department) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Level" error={errors.level?.message} className="sm:col-span-2">
            <Controller
              control={control}
              name="level"
              render={({ field }) => (
                <div role="radiogroup" aria-label="Level" className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {LEVELS.map((l) => (
                    <button
                      key={l}
                      type="button"
                      role="radio"
                      aria-checked={field.value === l}
                      onClick={() => field.onChange(l)}
                      className={cn(
                        "h-11 rounded-xl border text-sm font-semibold tabular-nums transition-colors",
                        field.value === l
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950/50 dark:text-indigo-200"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800",
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              )}
            />
          </Field>

          {movedDepartment && (
            <div className="sm:col-span-2 flex gap-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 p-4">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 dark:text-amber-200">
                Changing your department changes the courses, materials, CBTs and study plan you see. Only do this if
                you&apos;ve actually changed department.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Save bar: sticks to the bottom of the viewport (above the mobile nav) while there are changes */}
      {isDirty && (
        <div className="sticky bottom-[92px] sm:bottom-4 z-30">
          {/* mr leaves room for the floating chat button on phones */}
          <div className="mr-[76px] sm:mr-0 flex items-center gap-2 sm:gap-3 rounded-2xl bg-zinc-900 dark:bg-zinc-50 px-3 sm:px-4 py-3 shadow-2xl">
            <p className="flex-1 min-w-0 truncate text-xs sm:text-sm font-medium text-white dark:text-zinc-900">Unsaved changes</p>
            <button
              type="button"
              onClick={() => reset(defaults)}
              disabled={save.isPending}
              className="rounded-xl px-3 py-2 text-xs font-semibold text-zinc-300 dark:text-zinc-600 hover:text-white dark:hover:text-zinc-900"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={save.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-900 dark:text-white disabled:opacity-60"
            >
              {save.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {save.isPending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
