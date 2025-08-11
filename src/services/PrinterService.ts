import {Printer} from 'react-native-esc-pos-printer';
import Print from 'react-native-print';
import {IntakeRecord} from '../types';

class PrinterService {
  private printer: Printer | null = null;
  private isConnected: boolean = false;
  
  // Google Apps Script endpoint URL
  private readonly GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyYp9s8filgDVOOkHIZ2ehcxa-KO4XpEl6uV2zo04FMVH0m-3VfdYxljvXlccAsYQcleg/exec';

  async initializePrinter(): Promise<boolean> {
    try {
      // Create a new printer instance
      this.printer = new Printer({
        target: 'bluetooth', // or 'network' depending on your printer type
        deviceName: 'printer-device',
      });

      await this.printer.connect();
      this.isConnected = true;
      console.log('Printer connected successfully');
      return true;
    } catch (error) {
      console.error('Printer initialization error:', error);
      this.isConnected = false;
      this.printer = null;
      return false;
    }
  }

  async printReceipt(intakeData: IntakeRecord): Promise<boolean> {
    try {
      // Build HTML content for the receipt (same as before)
      let htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: monospace; width: 80mm; margin: 0; padding: 0; }
              .header { font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 10px; }
              .title { font-size: 16px; text-align: center; margin-bottom: 10px; }
              .section { margin-bottom: 10px; }
              .section-title { font-weight: bold; margin-bottom: 5px; }
              .divider { border-top: 1px dashed #000; margin: 10px 0; }
            </style>
          </head>
          <body>
            <div class="header">ALFAZAA COMPANY</div>
            <div class="title">Vehicle Intake Receipt</div>
            <div class="divider"></div>
            <div>Date/Time: ${new Date().toLocaleString()}</div>
            <div class="divider"></div>
            <div class="section">
              <div class="section-title">DRIVER INFO:</div>
              <div>Driver Name: ${intakeData.driverName}</div>
              <div>Driver ID: ${intakeData.driverId}</div>
            </div>
            <div class="section">
              <div class="section-title">CUSTOMER INFO:</div>
              <div>Customer Name: ${intakeData.customerName}</div>
              <div>Phone Number: ${intakeData.customerPhone}</div>
            </div>
            <div class="section">
              <div class="section-title">VEHICLE INFO:</div>
              <div>Plate Number: ${intakeData.vehiclePlate}</div>
              <div>Vehicle Type: ${intakeData.vehicleType}</div>
              <div>Color: ${intakeData.vehicleColor}</div>
            </div>
            ${
              intakeData.damageNotes?.length
                ? `<div class="section"><div class="section-title">DAMAGE NOTES:</div>${intakeData.damageNotes
                    .map(note => `<div>${note.part}: ${note.damage}</div>`)
                    .join('')}</div>`
                : ''
            }
            ${
              intakeData.generalComments
                ? `<div class="section"><div class="section-title">GENERAL COMMENTS:</div><div>${intakeData.generalComments}</div></div>`
                : ''
            }
            <div class="section">
              <div class="section-title">CUSTOMER SIGNATURE:</div>
              <div>__________________________</div>
              <div>__________________________</div>
              <div>Date: ___________</div>
            </div>
            <div class="divider"></div>
            <div style="text-align: center;">Thank you for choosing</div>
            <div style="text-align: center;">Alfazaa Company</div>
          </body>
        </html>
      `;
      await Print.print({html: htmlContent}); // Only pass html
      console.log('Receipt printed successfully');
      return true;
    } catch (error) {
      console.error('Printing error:', error);
      throw error;
    }
  }

  async disconnectPrinter(): Promise<void> {
    try {
      if (this.printer && this.isConnected) {
        await this.printer.disconnect();
        this.isConnected = false;
        this.printer = null;
        console.log('Printer disconnected');
      }
    } catch (error) {
      console.error('Printer disconnect error:', error);
    }
  }

  /**
   * Converts HTML to PDF and saves to Google Drive using the Google Apps Script endpoint
   * @param intakeData - The intake record data
   * @returns Promise<{success: boolean, fileUrl?: string, error?: string}>
   */
  async convertHtmlToPdfAndSave(intakeData: IntakeRecord): Promise<{success: boolean, fileUrl?: string, error?: string}> {
    try {
      // Generate HTML content for PDF
      const htmlContent = this.generateHTMLContent(intakeData);
      
      // Create filename with timestamp and vehicle plate - use .pdf extension
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      const fileName = `intake_${intakeData.vehiclePlate}_${timestamp}.pdf`;
      
      console.log('Converting HTML to PDF and saving to Google Drive:', { 
        fileName, 
        contentLength: htmlContent.length,
        vehiclePlate: intakeData.vehiclePlate 
      });
      
      // Send HTML content with convertToPdf flag for backend conversion
      const response = await fetch(this.GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `fileName=${encodeURIComponent(fileName)}&rawHtml=${encodeURIComponent(htmlContent)}&convertToPdf=true&mimeType=application/pdf`
      });
      
      return await this.handleGoogleDriveResponse(response);
      
    } catch (error) {
      console.error('Error converting HTML to PDF and saving:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Legacy method - kept for backward compatibility
   * @deprecated Use convertHtmlToPdfAndSave instead
   */
  async saveToGoogleDrive(intakeData: IntakeRecord): Promise<boolean> {
    const result = await this.convertHtmlToPdfAndSave(intakeData);
    return result.success;
  }

  private convertToBase64(str: string): string {
    // Simple base64 encoding for React Native
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';
    
    // Convert string to bytes
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i);
    }
    
    let byteNum;
    let chunk;
    
    for (let i = 0; i < bytes.length; i += 3) {
      byteNum = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
      chunk = [
        chars[(byteNum >> 18) & 0x3F],
        chars[(byteNum >> 12) & 0x3F],
        chars[(byteNum >> 6) & 0x3F],
        chars[byteNum & 0x3F]
      ];
      output += chunk.join('');
    }
    
    return output;
  }

  private async handleGoogleDriveResponse(response: any): Promise<{success: boolean, fileUrl?: string, error?: string}> {
    try {
      console.log('Google Drive response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP error:', response.status, response.statusText, errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      let result: any;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        return {
          success: false,
          error: 'Invalid response format from server'
        };
      }
      
      if (result.success) {
        console.log('Successfully saved to Google Drive:', result);
        return {
          success: true,
          fileUrl: result.fileUrl
        };
      } else {
        console.error('Failed to save to Google Drive:', result.error || result.message);
        return {
          success: false,
          error: result.error || result.message || 'Unknown error from server'
        };
      }
    } catch (error) {
      console.error('Error handling Google Drive response:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private generateHTMLContent(intakeData: IntakeRecord): string {
    return `
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Vehicle Intake Report - ${intakeData.vehiclePlate}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              width: 100%; 
              margin: 0; 
              padding: 20px; 
              background-color: #f5f5f5;
              color: #333;
            }
            .container { 
              max-width: 800px; 
              margin: 0 auto; 
              background-color: white; 
              padding: 30px; 
              border-radius: 10px; 
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header { 
              font-size: 24px; 
              font-weight: bold; 
              text-align: center; 
              margin-bottom: 20px; 
              color: #cf2b24;
              border-bottom: 3px solid #cf2b24;
              padding-bottom: 10px;
            }
            .title { 
              font-size: 20px; 
              text-align: center; 
              margin-bottom: 20px; 
              color: #333;
            }
            .section { 
              margin-bottom: 20px; 
              padding: 15px;
              border: 1px solid #eee;
              border-radius: 5px;
            }
            .section-title { 
              font-weight: bold; 
              margin-bottom: 10px; 
              color: #cf2b24;
              font-size: 18px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              padding: 5px 0;
            }
            .label {
              font-weight: 500;
              color: #555;
              min-width: 120px;
            }
            .value {
              color: #333;
              text-align: right;
            }
            .damage-item {
              background-color: #fff3cd;
              padding: 8px;
              margin: 5px 0;
              border-radius: 4px;
              border-left: 4px solid #ffc107;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              color: #666;
            }
            .timestamp {
              font-size: 12px;
              color: #999;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">ALFAZAA COMPANY</div>
            <div class="title">Vehicle Intake Report</div>
            
            <div class="section">
              <div class="section-title">📋 INTAKE INFORMATION</div>
              <div class="info-row">
                <span class="label">Date & Time:</span>
                <span class="value">${new Date().toLocaleString()}</span>
              </div>
              <div class="info-row">
                <span class="label">Intake ID:</span>
                <span class="value">${intakeData.id}</span>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">👤 DRIVER INFORMATION</div>
              <div class="info-row">
                <span class="label">Driver Name:</span>
                <span class="value">${intakeData.driverName}</span>
              </div>
              <div class="info-row">
                <span class="label">Driver ID:</span>
                <span class="value">${intakeData.driverId}</span>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">👥 CUSTOMER INFORMATION</div>
              <div class="info-row">
                <span class="label">Customer Name:</span>
                <span class="value">${intakeData.customerName}</span>
              </div>
              <div class="info-row">
                <span class="label">Phone Number:</span>
                <span class="value">${intakeData.customerPhone}</span>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">🚗 VEHICLE INFORMATION</div>
              <div class="info-row">
                <span class="label">License Plate:</span>
                <span class="value">${intakeData.vehiclePlate}</span>
              </div>
              <div class="info-row">
                <span class="label">Vehicle Type:</span>
                <span class="value">${intakeData.vehicleType}</span>
              </div>
              <div class="info-row">
                <span class="label">Color:</span>
                <span class="value">${intakeData.vehicleColor}</span>
              </div>
            </div>
            
            ${
              intakeData.damageNotes?.length > 0
                ? `<div class="section">
                    <div class="section-title">⚠️ DAMAGE DOCUMENTATION</div>
                    ${intakeData.damageNotes
                      .map(note => `
                        <div class="damage-item">
                          <strong>${note.part}:</strong> ${note.damage}
                          ${note.timestamp ? `<div class="timestamp">Recorded: ${new Date(note.timestamp).toLocaleString()}</div>` : ''}
                        </div>
                      `)
                      .join('')}
                   </div>`
                : '<div class="section"><div class="section-title">✅ NO DAMAGE NOTED</div></div>'
            }
            
            ${
              intakeData.generalComments
                ? `<div class="section">
                    <div class="section-title">📝 GENERAL COMMENTS</div>
                    <div style="padding: 10px; background-color: #f8f9fa; border-radius: 4px;">
                      ${intakeData.generalComments}
                    </div>
                   </div>`
                : ''
            }
            
            <div class="footer">
              <p>This report was automatically generated by Alfazaa Mobile App</p>
              <p>Generated on: ${new Date().toLocaleString()}</p>
              <p>Thank you for choosing Alfazaa Company</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

export default new PrinterService();
