# Alfazaa Mobile - Vehicle Intake Management System

A comprehensive React Native mobile application for vehicle intake management with automated PDF generation and Google Drive integration.

## 🚀 Overview

The Alfazaa Mobile app streamlines the vehicle intake process by allowing users to:
- Capture detailed vehicle information
- Document damage with notes and timestamps
- Generate professional PDF reports
- Automatically upload reports to Google Drive
- Print local receipts
- Store data locally with SQLite

## 📱 App Architecture

### **Technology Stack**
- **Frontend**: React Native 0.79.2
- **Database**: SQLite (react-native-quick-sqlite)
- **PDF Generation**: Google Apps Script + HTML-to-PDF conversion
- **Cloud Storage**: Google Drive API
- **Printing**: react-native-print + react-native-esc-pos-printer
- **State Management**: React Context API

### **Project Structure**
```
src/
├── components/
│   └── VehicleDiagram.tsx          # Vehicle body diagram component
├── context/
│   └── VehicleContext.tsx          # Global state management
├── screens/
│   ├── IntakeFormScreen.tsx        # Driver & customer info
│   ├── VehicleBodyScreen.tsx       # Damage documentation
│   └── NotesSignatureScreen.tsx    # Review & finalize
├── services/
│   ├── DatabaseService.ts          # SQLite operations
│   └── PrinterService.ts           # PDF generation & Google Drive
└── types/
    ├── react-native-print.d.ts     # Type definitions
    └── types.ts                    # App data models
```

## 🔄 Complete Workflow

### **1. User Journey**
```
Intake Form → Vehicle Body → Notes & Review → PDF Generation → Google Drive
     ↓              ↓              ↓              ↓              ↓
Driver Info    Damage Notes   Comments      HTML→PDF      Upload to Drive
Customer Info   Timestamps    Review        Conversion    Organized Storage
Vehicle Info    Visual Docs   Finalize      Professional  Year/Month Folders
```

### **2. Data Flow**
```
User Input → Context State → Local Database → HTML Generation → Google Apps Script → Google Drive
     ↓              ↓              ↓              ↓              ↓              ↓
Form Fields    Global State    SQLite Store    Professional    PDF Conversion    Organized Files
Damage Notes   Real-time      Persistent      HTML Content    Server-side       Year/Month Structure
Comments       Updates        Storage         Styling         Processing        File URLs
```

## 📊 Data Models

### **IntakeRecord Interface**
```typescript
interface IntakeRecord {
  id: string;                    // Unique identifier
  driverName: string;            // Driver's full name
  driverId: string;              // Driver ID number
  customerName: string;          // Customer's full name
  customerPhone: string;         // Customer contact
  vehiclePlate: string;          // License plate number
  vehicleColor: string;          // Vehicle color
  vehicleType: string;           // Car, truck, etc.
  damageNotes: DamageNote[];     // Array of damage documentation
  generalComments: string;       // Additional notes
  signature: string | null;      // Digital signature (future)
  createdAt: string;             // ISO timestamp
  synced?: boolean;              // Sync status
}
```

### **DamageNote Interface**
```typescript
interface DamageNote {
  part: string;                  // Vehicle part name
  damage: string;                // Damage description
  timestamp?: string;            // When damage was recorded
}
```

## 🛠️ Core Services

### **DatabaseService**
- **Purpose**: Local SQLite database operations
- **Functions**:
  - `saveIntakeRecord()` - Store intake data locally
  - `getIntakeRecords()` - Retrieve stored records
  - `updateIntakeRecord()` - Modify existing records
  - `deleteIntakeRecord()` - Remove records

### **PrinterService**
- **Purpose**: PDF generation, printing, and Google Drive integration
- **Key Functions**:
  - `printReceipt()` - Print local receipt
  - `convertHtmlToPdfAndSave()` - Generate PDF and upload to Drive
  - `generateHTMLContent()` - Create professional HTML report
  - `handleGoogleDriveResponse()` - Process upload responses

## 🌐 Google Drive Integration

### **Google Apps Script Endpoint**
- **URL**: `https://script.google.com/macros/s/AKfycbyX9VwDsNB8VfOC0mPoE4xURdbIC5BqR9fN4-o_OzoEWHsZXbskbRJxZzDpxbzN83nviw/exec`
- **Method**: POST
- **Content-Type**: `application/x-www-form-urlencoded`

### **Request Format**
```
fileName=intake_ABC123_2025-01-11T10-30-00.pdf
rawHtml=<!DOCTYPE html>...professional HTML content...
convertToPdf=true
mimeType=application/pdf
rootFolderId=1Lf83Zb6QFMvtkOa5s3iR4-cyR9RcT6UM
```

### **Response Format**
```json
{
  "success": true,
  "fileId": "1ABC123...",
  "fileUrl": "https://drive.google.com/file/d/1ABC123.../view",
  "folderPath": "2025/01",
  "name": "intake_ABC123_2025-01-11T10-30-00.pdf",
  "mimeType": "application/pdf"
}
```

### **File Organization**
```
Google Drive/
└── Your Specific Folder (1Lf83Zb6QFMvtkOa5s3iR4-cyR9RcT6UM)/
    ├── 2025/
    │   └── 01/
    │       ├── intake_ABC123_2025-01-11T10-30-00.pdf
    │       ├── intake_XYZ789_2025-01-11T11-45-00.pdf
    │       └── ...
    └── 2024/
        └── 12/
            └── ...
```

## 📄 PDF Generation Process

### **1. HTML Content Generation**
The app generates professional HTML content with:
- **Company branding** (ALFAZAA COMPANY)
- **Structured sections** with icons and styling
- **Responsive design** optimized for PDF conversion
- **Professional formatting** with colors and typography

### **2. PDF Conversion**
- **Server-side conversion** using Google Apps Script
- **HTML to PDF** using `blob.getAs('application/pdf')`
- **Professional formatting** preserved
- **Optimized for printing** and digital viewing

## 🖨️ Printing System

### **Local Receipt Printing**
- **react-native-print** for system printing
- **Receipt-optimized HTML** with monospace font
- **80mm width** for thermal printers
- **Professional receipt format**

## 🔧 Configuration

### **Google Apps Script Setup**
1. **Create new Google Apps Script project**
2. **Copy code from `GOOGLE_APPS_SCRIPT.js`**
3. **Deploy as Web App**:
   - Execute as: "Me"
   - Who has access: "Anyone"
4. **Copy the deployment URL**
5. **Update `PrinterService.ts` with new URL**

### **Folder Configuration**
- **Default**: Uploads to Google Drive root
- **Custom Folder**: Set `rootFolderId` in request
- **Organization**: Automatic year/month subfolders

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+
- React Native CLI
- Android Studio (for Android)
- Xcode (for iOS)
- Google account for Drive integration

### **Installation**
```bash
# Clone repository
git clone <repository-url>
cd alfazaa_mobile_new

# Install dependencies
npm install --legacy-peer-deps

# iOS setup
cd ios && pod install && cd ..

# Run on Android
npx react-native run-android

# Run on iOS
npx react-native run-ios
```

### **Google Drive Setup**
1. **Create Google Apps Script project**
2. **Deploy as Web App**
3. **Update URL in `PrinterService.ts`**
4. **Test with sample data**

## 🔍 Error Handling

### **Network Errors**
- **Connection timeouts** handled gracefully
- **Retry mechanisms** for failed uploads
- **User feedback** with clear error messages

### **Google Drive Errors**
- **Permission issues** detected and reported
- **File size limits** handled
- **Folder access** validated

### **Local Errors**
- **Database failures** with fallback options
- **Printing errors** with alternative methods
- **Form validation** with user guidance

## 📈 Future Enhancements

### **Planned Features**
- **Image capture** for damage documentation
- **Digital signatures** for customer approval
- **Offline sync** when connection restored
- **Multi-language support**
- **Advanced reporting** and analytics

### **Technical Improvements**
- **Image compression** and optimization
- **Batch upload** capabilities
- **Real-time sync** status
- **Enhanced error recovery**

## 🛡️ Security & Privacy

### **Data Protection**
- **Local SQLite** encryption
- **Secure API** communication
- **No sensitive data** in logs
- **User consent** for data collection

### **Google Drive Security**
- **OAuth 2.0** authentication
- **Scoped permissions** (read/write only)
- **Secure file storage**
- **Access logging** and monitoring

---

**Built with ❤️ for efficient vehicle intake management**