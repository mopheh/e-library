import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const HomeDashboardSkeleton = () => {
    return (
        <div className="flex-1 p-2 md:p-8 pt-6 space-y-8 premium-bg min-h-screen">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                    <Skeleton className="w-full h-[300px] rounded-[2rem]" />
                </div>
                <div className="lg:col-span-4 h-full">
                    <Skeleton className="w-full h-full rounded-[2rem]" />
                </div>
            </div>

            <Skeleton className="w-full h-24 rounded-[2rem]" />

            <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
                <div className="lg:col-span-4 space-y-8">
                    <Skeleton className="w-full h-[450px] rounded-[2rem]" />
                    <Skeleton className="w-full h-[300px] rounded-[2rem]" />
                </div>
                <div className="lg:col-span-3 space-y-8">
                    <div className="grid gap-8">
                        <Skeleton className="w-full h-[200px] rounded-[2rem]" />
                        <Skeleton className="w-full h-[200px] rounded-[2rem]" />
                    </div>
                    <Skeleton className="w-full h-64 rounded-[2rem]" />
                </div>
            </div>
        </div>
    );
};

export default HomeDashboardSkeleton;
