import * as RNFS from 'react-native-fs';
import * as RNHTMLtoPDF from 'react-native-html-to-pdf';
import { IntakeRecord } from '../types';

class GoogleDriveService {
  async initialize(): Promise<void> {
    try {
      console.log('Google Drive service initialized (simplified mode)');
    } catch (error) {
      console.error('Failed to initialize Google Drive service:', error);
      throw error;
    }
  }

  private generateHTML(intakeData: IntakeRecord): string {
    return `
      <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              line-height: 1.6; 
              color: #333;
            }
            .header { 
              text-align: center; 
              border-bottom: 3px solid #d2de24; 
              padding-bottom: 15px; 
              margin-bottom: 25px; 
            }
            .header h1 {
              color: #cf2b24;
              margin: 0;
              font-size: 28px;
            }
            .header h2 {
              color: #333;
              margin: 5px 0;
              font-size: 20px;
            }
            .section { 
              margin-bottom: 20px; 
              padding: 15px; 
              border: 1px solid #ddd; 
              border-radius: 8px; 
              background-color: #f9f9f9;
            }
            .section-title { 
              font-weight: bold; 
              color: #cf2b24; 
              margin-bottom: 10px; 
              font-size: 16px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            .info-row {
              display: flex;
              margin: 5px 0;
            }
            .label {
              font-weight: bold;
              min-width: 120px;
            }
            .value {
              flex: 1;
            }
            .damage-item { 
              margin: 8px 0; 
              padding: 8px; 
              background-color: #fff; 
              border-left: 3px solid #f44336;
              border-radius: 4px;
            }
            .footer { 
              margin-top: 30px; 
              text-align: center; 
              color: #666; 
              font-size: 12px; 
              border-top: 1px solid #ddd;
              padding-top: 15px;
            }
            .report-id {
              background-color: #d2de24;
              color: #333;
              padding: 5px 10px;
              border-radius: 4px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ALFAZAA COMPANY</h1>
            <h2>Vehicle Intake Report</h2>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>

          <div class="section">
            <div class="section-title">DRIVER INFORMATION</div>
            <div class="info-row">
              <span class="label">Name:</span>
              <span class="value">${intakeData.driverName}</span>
            </div>
            <div class="info-row">
              <span class="label">ID:</span>
              <span class="value">${intakeData.driverId}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">CUSTOMER INFORMATION</div>
            <div class="info-row">
              <span class="label">Name:</span>
              <span class="value">${intakeData.customerName}</span>
            </div>
            <div class="info-row">
              <span class="label">Phone:</span>
              <span class="value">${intakeData.customerPhone}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">VEHICLE INFORMATION</div>
            <div class="info-row">
              <span class="label">Plate Number:</span>
              <span class="value">${intakeData.vehiclePlate}</span>
            </div>
            <div class="info-row">
              <span class="label">Type:</span>
              <span class="value">${intakeData.vehicleType}</span>
            </div>
            <div class="info-row">
              <span class="label">Color:</span>
              <span class="value">${intakeData.vehicleColor}</span>
            </div>
          </div>

          ${intakeData.damageNotes.length > 0 ? `
            <div class="section">
              <div class="section-title">DAMAGE NOTES</div>
              ${intakeData.damageNotes.map(note => 
                `<div class="damage-item"><strong>${note.part}:</strong> ${note.damage}</div>`
              ).join('')}
            </div>
          ` : ''}

          ${intakeData.generalComments ? `
            <div class="section">
              <div class="section-title">GENERAL COMMENTS</div>
              <p>${intakeData.generalComments}</p>
            </div>
          ` : ''}

          <div class="footer">
            <div class="report-id">Report ID: ${intakeData.id}</div>
            <p>Thank you for choosing Alfazaa Company</p>
            <p>This report was automatically generated by the Alfazaa Mobile App</p>
          </div>
        </body>
      </html>
    `;
  }

  async uploadIntakeReport(intakeData: IntakeRecord): Promise<string> {
    try {
      // 1. Generate PDF
      console.log('Generating PDF...');
      const htmlContent = this.generateHTML(intakeData);
      const pdfResult = await RNHTMLtoPDF.convert({
        html: htmlContent,
        fileName: `Intake_${intakeData.vehiclePlate}_${Date.now()}`,
        directory: 'Documents',
      });

      if (!pdfResult.filePath) {
        throw new Error('Failed to generate PDF');
      }

      console.log('PDF generated successfully at:', pdfResult.filePath);

      // 2. Save to documents folder for now
      const fileName = `Intake_${intakeData.vehiclePlate}_${new Date().toISOString().split('T')[0]}.pdf`;
      const documentsPath = RNFS.DocumentDirectoryPath;
      const finalPath = `${documentsPath}/${fileName}`;
      
      await RNFS.copyFile(pdfResult.filePath, finalPath);
      await RNFS.unlink(pdfResult.filePath); // Clean up temp file
      
      console.log('PDF saved to:', finalPath);
      console.log('Google Drive upload will be implemented later');
      
      return 'local-file-id';
    } catch (error) {
      console.error('Error in PDF generation:', error);
      throw error;
    }
  }

  async createFolderIfNotExists(folderName: string): Promise<string> {
    try {
      console.log('Creating folder (placeholder):', folderName);
      return 'placeholder-folder-id';
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }
}

export default new GoogleDriveService(); 