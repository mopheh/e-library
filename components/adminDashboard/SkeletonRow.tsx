// components/SkeletonRow.tsx
export const SkeletonRow = () => {
  return (
    <tr className="animate-pulse border-b border-zinc-200 dark:border-zinc-900">
      <td className="px-6 py-4">
        <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700 rounded" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-10 bg-zinc-200 dark:bg-zinc-700 rounded" />
      </td>
    </tr>
  );
};
