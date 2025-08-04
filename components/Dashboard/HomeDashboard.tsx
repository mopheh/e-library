import React, { useEffect, useState } from "react"
import { useAuth, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import Stats from "@/components/Dashboard/Stats"
import BookWrap from "@/components/Dashboard/BookWrap"
import AddedMaterials from "@/components/Dashboard/AddedMaterials"
import { useBooks, useMyBooks } from "@/hooks/useBooks"
import { useDepartmentId, useUserData } from "@/hooks/useUsers"

const HomeDashboard = () => {
  const { data: myData } = useUserData()
  const [department, setDepartment] = useState<string | undefined>()
  const [level, setLevel] = useState<string | undefined>()

  useEffect(() => {
    if (myData) {
      setLevel(myData.level)
      setDepartment(myData.departmentId)
    }
  }, [myData])

  const {
    data: books = { books: [], totalPages: 1 },
    isLoading: booksLoading,
    error: booksError,
  } = useBooks({ departmentId: department, level: level })

  const { user, isSignedIn, isLoaded } = useUser()
  const { signOut } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (user) {
      console.log(user)
    }
  }, [isSignedIn])

  return (
    <>
      <Stats />
      <BookWrap />
      <AddedMaterials books={books.books} loading={booksLoading} />
    </>
  )
}
export default HomeDashboard
