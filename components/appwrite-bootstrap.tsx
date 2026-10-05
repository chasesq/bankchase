"use client"

import { useEffect } from "react"
import { pingAppwrite } from "@/lib/appwrite/client"

export function AppwriteBootstrap() {
  useEffect(() => {
    void pingAppwrite().catch((error) => {
      console.warn("[Appwrite] Connection check failed:", error)
    })
  }, [])

  return null
}
