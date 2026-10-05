import { Client } from "appwrite"

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "https://cloud.appwrite.io/v1"
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "6ac3f4ef00218fa22307"

export const appwriteClient = new Client().setEndpoint(endpoint).setProject(projectId)

export async function pingAppwrite() {
  return appwriteClient.ping()
}
