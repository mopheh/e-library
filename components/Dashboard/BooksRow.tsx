import React from "react"
import { DownloadIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { addRecentlyViewedBook } from "@/lib/utils"

// @ts-ignore
export const BooksRow = ({ book }) => {
  const router = useRouter()
  const downloadFile = async (url: string, filename: string) => {
    const response = await fetch(url)
    const blob = await response.blob()

    const blobUrl = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = blobUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(blobUrl) // cleanup
  }

  return (
    <tr className="font-poppins text-xs py-3 text-gray-800 font-normal border-b border-gray-200">
      <td
        className="px-6 py-4 cursor-pointer"
        onClick={() => {
          router.push(`/student/book/${book.id}`)
          addRecentlyViewedBook({ ...book, progress: 0 })
        }}
      >
        {book.title}
      </td>
      <td>{book.course}</td>
      <td>{book.type}</td>
      <td>
        {new Date(book.createdAt).toLocaleString("en-NG", {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </td>
      <td className="flex pt-2 gap-1.5">
        <div
          onClick={() => downloadFile(book.fileUrl, `${book.title}.pdf`)}
          className="p-2 cursor-pointer bg-neutral-700 text-white rounded"
        >
          <DownloadIcon className="h-4 w-4" />
        </div>
      </td>
    </tr>
  )
}
