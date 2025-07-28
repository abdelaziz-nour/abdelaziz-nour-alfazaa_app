import RNHTMLtoPDF from "react-native-html-to-pdf"
import RNFS from "react-native-fs"
import type { IntakeRecord } from "../types"
import GoogleDriveService from "./GoogleDriveService"

class IntakePDFService {
  async generateIntakePDF(intakeData: IntakeRecord): Promise<string | null> {
    try {
      // Generate HTML content with the same theme as PrinterService
      const htmlContent = this.generateHTMLContent(intakeData)

      // Generate PDF
      const options = {
        html: htmlContent,
        fileName: `intake_${intakeData.vehiclePlate}_${Date.now()}`,
        directory: "Documents",
        width: 612,
        height: 792,
        padding: 24,
      }

      const pdf = await RNHTMLtoPDF.convert(options)

      if (pdf.filePath) {
        console.log("PDF generated successfully:", pdf.filePath)
        return pdf.filePath
      }

      return null
    } catch (error) {
      console.error("Error generating PDF:", error)
      return null
    }
  }

  private generateHTMLContent(intakeData: IntakeRecord): string {
    const currentDate = new Date().toLocaleString()

    return `
      <html>
        <head>
          <style>
            body { 
              font-family: 'Arial', sans-serif; 
              margin: 0; 
              padding: 20px; 
              background-color: #fff;
              color: #333;
            }
            .header { 
              font-size: 24px; 
              font-weight: bold; 
              text-align: center; 
              margin-bottom: 10px;
              color: #767c28;
              border-bottom: 3px solid #d2de24;
              padding-bottom: 10px;
            }
            .title { 
              font-size: 18px; 
              text-align: center; 
              margin-bottom: 20px;
              color: #cf2b24;
              font-weight: bold;
            }
            .section { 
              margin-bottom: 20px; 
              border: 1px solid #ddd;
              border-radius: 8px;
              padding: 15px;
              background-color: #f9f9f9;
            }
            .section-title { 
              font-weight: bold; 
              margin-bottom: 10px;
              color: #d2de24;
              font-size: 16px;
              border-bottom: 1px solid #d2de24;
              padding-bottom: 5px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              padding: 5px 0;
            }
            .info-label {
              font-weight: bold;
              color: #cf2b24;
              width: 40%;
            }
            .info-value {
              color: #333;
              width: 55%;
            }
            .divider { 
              border-top: 2px solid #d2de24; 
              margin: 20px 0; 
            }
            .damage-item {
              background-color: #fff;
              border: 1px solid #ddd;
              border-radius: 4px;
              padding: 10px;
              margin-bottom: 8px;
            }
            .signature-section {
              margin-top: 30px;
              border: 2px solid #767c28;
              border-radius: 8px;
              padding: 20px;
            }
            .signature-line {
              border-bottom: 1px solid #333;
              height: 40px;
              margin: 10px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #767c28;
              font-weight: bold;
              border-top: 2px solid #d2de24;
              padding-top: 15px;
            }
            .date-time {
              text-align: right;
              font-size: 12px;
              color: #666;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">ALFAZAA COMPANY</div>
          <div class="title">Vehicle Intake Report</div>
          <div class="date-time">Generated: ${currentDate}</div>
          
          <div class="section">
            <div class="section-title">DRIVER INFORMATION</div>
            <div class="info-row">
              <div class="info-label">Driver Name:</div>
              <div class="info-value">${intakeData.driverName}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Driver ID:</div>
              <div class="info-value">${intakeData.driverId}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">CUSTOMER INFORMATION</div>
            <div class="info-row">
              <div class="info-label">Customer Name:</div>
              <div class="info-value">${intakeData.customerName}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Phone Number:</div>
              <div class="info-value">${intakeData.customerPhone}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">VEHICLE INFORMATION</div>
            <div class="info-row">
              <div class="info-label">Plate Number:</div>
              <div class="info-value">${intakeData.vehiclePlate}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Vehicle Type:</div>
              <div class="info-value">${intakeData.vehicleType}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Color:</div>
              <div class="info-value">${intakeData.vehicleColor}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Intake Date:</div>
              <div class="info-value">${new Date(intakeData.createdAt).toLocaleString()}</div>
            </div>
          </div>

          ${
            intakeData.damageNotes?.length
              ? `
            <div class="section">
              <div class="section-title">DAMAGE ASSESSMENT</div>
              ${intakeData.damageNotes
                .map(
                  (note) => `
                <div class="damage-item">
                  <div class="info-row">
                    <div class="info-label">Part:</div>
                    <div class="info-value">${note.part}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Damage:</div>
                    <div class="info-value">${note.damage}</div>
                  </div>
                </div>
              `,
                )
                .join("")}
            </div>
          `
              : ""
          }

          ${
            intakeData.generalComments
              ? `
            <div class="section">
              <div class="section-title">GENERAL COMMENTS</div>
              <div style="padding: 10px; background-color: #fff; border-radius: 4px;">
                ${intakeData.generalComments}
              </div>
            </div>
          `
              : ""
          }

          <div class="signature-section">
            <div class="section-title">CUSTOMER ACKNOWLEDGMENT</div>
            <p>I acknowledge that the above information accurately represents the condition of my vehicle at the time of intake.</p>
            <div style="margin-top: 20px;">
              <div class="info-label">Customer Signature:</div>
              <div class="signature-line"></div>
            </div>
            <div style="margin-top: 15px;">
              <div class="info-row">
                <div class="info-label">Date:</div>
                <div class="info-value">_________________</div>
              </div>
            </div>
          </div>

          <div class="footer">
            <div>Thank you for choosing Alfazaa Company</div>
            <div style="font-size: 12px; margin-top: 5px;">Professional Vehicle Services</div>
          </div>
        </body>
      </html>
    `
  }

  async uploadIntakeToDrive(intakeData: IntakeRecord): Promise<boolean> {
    try {
      console.log("Starting Google Drive upload process...")

      // Initialize Google Drive service
      const initialized = await GoogleDriveService.initialize()
      if (!initialized) {
        throw new Error("Failed to initialize Google Drive service")
      }

      // Generate PDF
      const pdfPath = await this.generateIntakePDF(intakeData)
      if (!pdfPath) {
        throw new Error("Failed to generate PDF")
      }

      // Create folder structure
      const dayFolderId = await GoogleDriveService.createIntakeFolderStructure()
      if (!dayFolderId) {
        throw new Error("Failed to create folder structure")
      }

      // Generate meaningful filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
      const fileName = `Intake_${intakeData.customerName.replace(/\s+/g, "_")}_${intakeData.vehiclePlate}_${timestamp}.pdf`

      // Upload to Google Drive
      const uploaded = await GoogleDriveService.uploadFile(pdfPath, fileName, dayFolderId)

      // Clean up local file
      try {
        await RNFS.unlink(pdfPath)
        console.log("Local PDF file cleaned up")
      } catch (cleanupError) {
        console.warn("Failed to clean up local PDF file:", cleanupError)
      }

      if (uploaded) {
        console.log("Intake successfully uploaded to Google Drive")
        return true
      } else {
        throw new Error("Failed to upload to Google Drive")
      }
    } catch (error) {
      console.error("Error uploading intake to Drive:", error)
      return false
    }
  }
}

export default new IntakePDFService()
