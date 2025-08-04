"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FiltersProps = {
  filters: {
    faculty: string;
    department: string;
    level: string;
  };
  setFilters: (filters: FiltersProps["filters"]) => void;
};

const departments = ["All", "Computer Engineering", "Electrical", "Mechanical"];
const faculties = ["All", "Engineering", "Science", "Arts"];
const levels = ["All", "100", "200", "300", "400", "500"];

// @ts-ignore
export const Filters = ({ filters, setFilters }: FiltersProps) => {
  const handleChange = (key: keyof typeof filters, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
      {/* Faculty Filter */}
      <Select
        value={filters.faculty}
        onValueChange={(value) => handleChange("faculty", value)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Filter by faculty" />
        </SelectTrigger>
        <SelectContent>
          {faculties.map((faculty) => (
            <SelectItem key={faculty} value={faculty}>
              {faculty}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Department Filter */}
      <Select
        value={filters.department}
        onValueChange={(value) => handleChange("department", value)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Filter by department" />
        </SelectTrigger>
        <SelectContent>
          {departments.map((dept) => (
            <SelectItem key={dept} value={dept}>
              {dept}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Level Filter */}
      <Select
        value={filters.level}
        onValueChange={(value) => handleChange("level", value)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Filter by level" />
        </SelectTrigger>
        <SelectContent>
          {levels.map((lvl) => (
            <SelectItem key={lvl} value={lvl}>
              {lvl}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
