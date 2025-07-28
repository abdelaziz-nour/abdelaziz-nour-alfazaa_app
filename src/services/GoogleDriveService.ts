import { GoogleSignin } from "@react-native-google-signin/google-signin"
import RNFS from "react-native-fs"

interface GoogleDriveFile {
  id: string
  name: string
  mimeType: string
}

class GoogleDriveService {
  private accessToken: string | null = null
  private isInitialized = false

  async initialize(): Promise<boolean> {
    try {
      // Configure Google Sign In
      GoogleSignin.configure({
        scopes: ["https://www.googleapis.com/auth/drive.file"],
        webClientId: "901618687773-i2d660rlc6rjlojsb4kdumq426fuo1ah.apps.googleusercontent.com",
        offlineAccess: true,
      })

      // Check if user is already signed in
      const isSignedIn = await GoogleSignin.isSignedIn()

      if (!isSignedIn) {
        // Sign in silently or prompt user
        await GoogleSignin.signIn()
      }

      // Get access token
      const tokens = await GoogleSignin.getTokens()
      this.accessToken = tokens.accessToken
      this.isInitialized = true

      console.log("Google Drive service initialized successfully")
      return true
    } catch (error) {
      console.error("Google Drive initialization error:", error)
      this.isInitialized = false
      return false
    }
  }

  async createFolder(name: string, parentId?: string): Promise<string | null> {
    try {
      if (!this.accessToken) {
        throw new Error("Not authenticated")
      }

      const metadata = {
        name: name,
        mimeType: "application/vnd.google-apps.folder",
        parents: parentId ? [parentId] : undefined,
      }

      const response = await fetch("https://www.googleapis.com/drive/v3/files", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metadata),
      })

      if (!response.ok) {
        throw new Error(`Failed to create folder: ${response.statusText}`)
      }

      const result = await response.json()
      console.log(`Folder "${name}" created with ID: ${result.id}`)
      return result.id
    } catch (error) {
      console.error("Error creating folder:", error)
      return null
    }
  }

  async findFolder(name: string, parentId?: string): Promise<string | null> {
    try {
      if (!this.accessToken) {
        throw new Error("Not authenticated")
      }

      let query = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
      if (parentId) {
        query += ` and '${parentId}' in parents`
      }

      const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to search folder: ${response.statusText}`)
      }

      const result = await response.json()
      if (result.files && result.files.length > 0) {
        return result.files[0].id
      }

      return null
    } catch (error) {
      console.error("Error finding folder:", error)
      return null
    }
  }

  async findOrCreateFolder(name: string, parentId?: string): Promise<string | null> {
    try {
      // First try to find existing folder
      let folderId = await this.findFolder(name, parentId)

      // If not found, create it
      if (!folderId) {
        folderId = await this.createFolder(name, parentId)
      }

      return folderId
    } catch (error) {
      console.error("Error in findOrCreateFolder:", error)
      return null
    }
  }

  async uploadFile(filePath: string, fileName: string, parentId?: string): Promise<boolean> {
    try {
      if (!this.accessToken) {
        throw new Error("Not authenticated")
      }

      // Read file content
      const fileContent = await RNFS.readFile(filePath, "base64")

      // Create metadata
      const metadata = {
        name: fileName,
        parents: parentId ? [parentId] : undefined,
      }

      // Create multipart form data
      const boundary = "-------314159265358979323846"
      const delimiter = `\r\n--${boundary}\r\n`
      const close_delim = `\r\n--${boundary}--`

      const body =
        delimiter +
        "Content-Type: application/json\r\n\r\n" +
        JSON.stringify(metadata) +
        delimiter +
        "Content-Type: application/pdf\r\n" +
        "Content-Transfer-Encoding: base64\r\n\r\n" +
        fileContent +
        close_delim

      const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": `multipart/related; boundary="${boundary}"`,
        },
        body: body,
      })

      if (!response.ok) {
        throw new Error(`Failed to upload file: ${response.statusText}`)
      }

      const result = await response.json()
      console.log(`File "${fileName}" uploaded successfully with ID: ${result.id}`)
      return true
    } catch (error) {
      console.error("Error uploading file:", error)
      return false
    }
  }

  async createIntakeFolderStructure(): Promise<string | null> {
    try {
      const now = new Date()
      const year = now.getFullYear().toString()
      const month = (now.getMonth() + 1).toString().padStart(2, "0")
      const day = now.getDate().toString().padStart(2, "0")

      // Create/find intakes folder
      const intakesFolderId = await this.findOrCreateFolder("intakes")
      if (!intakesFolderId) {
        throw new Error("Failed to create intakes folder")
      }

      // Create/find year folder
      const yearFolderId = await this.findOrCreateFolder(year, intakesFolderId)
      if (!yearFolderId) {
        throw new Error("Failed to create year folder")
      }

      // Create/find month folder
      const monthFolderId = await this.findOrCreateFolder(month, yearFolderId)
      if (!monthFolderId) {
        throw new Error("Failed to create month folder")
      }

      // Create/find day folder
      const dayFolderId = await this.findOrCreateFolder(day, monthFolderId)
      if (!dayFolderId) {
        throw new Error("Failed to create day folder")
      }

      return dayFolderId
    } catch (error) {
      console.error("Error creating folder structure:", error)
      return null
    }
  }
}

export default new GoogleDriveService()
