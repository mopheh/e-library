import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function OpportunityCardSkeleton() {
  return (
    <Card className="flex flex-col h-full border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <CardHeader className="pb-3 flex-grow">
        <div className="flex justify-between items-start mb-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="w-20 h-5 rounded-full" />
        </div>
        <Skeleton className="h-5 w-4/5 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="py-2 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </CardContent>
      <CardFooter className="pt-4 pb-5 border-t border-gray-100 dark:border-zinc-800 mt-auto">
        <Skeleton className="h-9 w-full rounded-xl" />
      </CardFooter>
    </Card>
  );
}
