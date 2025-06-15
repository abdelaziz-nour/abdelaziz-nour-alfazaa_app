import {Printer} from 'react-native-esc-pos-printer';
import Print from 'react-native-print';
import {IntakeRecord} from '../types';

class PrinterService {
  private printer: Printer | null = null;
  private isConnected: boolean = false;

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
}

export default new PrinterService();
