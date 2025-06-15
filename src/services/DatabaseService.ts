import { open } from 'react-native-quick-sqlite';

interface DamageNote {
  part: string;
  damage: string;
  timestamp?: string;
}

interface IntakeRecord {
  id: string;
  driverName: string;
  driverId: string;
  customerName: string;
  customerPhone: string;
  vehiclePlate: string;
  vehicleColor: string;
  vehicleType: string;
  damageNotes: DamageNote[];
  generalComments: string;
  signature: string | null;
  createdAt: string;
  synced?: boolean;
}

class DatabaseService {
  private db: any = null;  // Changed from database to db

  async initDatabase(): Promise<void> {
    try {
      this.db = open({
        name: 'VehicleIntake.db',
        location: 'default',
      });
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  async createTables(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS intake_records (
        id TEXT PRIMARY KEY,
        driver_name TEXT NOT NULL,
        driver_id TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        vehicle_plate TEXT NOT NULL,
        vehicle_color TEXT NOT NULL,
        vehicle_type TEXT NOT NULL,
        damage_notes TEXT,
        general_comments TEXT,
        signature TEXT,
        created_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      );
    `);
  }

  async saveIntakeRecord(record: IntakeRecord): Promise<boolean> {
    if (!this.db) throw new Error("Database not initialized");  // Changed to this.db

    try {
      const insertQuery = `
        INSERT INTO intake_records (
          id, driver_name, driver_id, customer_name, customer_phone,
          vehicle_plate, vehicle_color, vehicle_type, damage_notes,
          general_comments, signature, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `;

      const values = [
        record.id,
        record.driverName,
        record.driverId,
        record.customerName,
        record.customerPhone,
        record.vehiclePlate,
        record.vehicleColor,
        record.vehicleType,
        JSON.stringify(record.damageNotes),
        record.generalComments,
        record.signature,
        record.createdAt,
      ];

      await this.db.execute(insertQuery, values);  // Changed from executeSql to execute
      console.log("Intake record saved successfully");
      return true;
    } catch (error) {
      console.error("Error saving intake record:", error);
      throw error;
    }
  }

  async getAllRecords(): Promise<IntakeRecord[]> {
    if (!this.db) throw new Error("Database not initialized");  // Changed to this.db

    try {
      const selectQuery = "SELECT * FROM intake_records ORDER BY created_at DESC;";
      const { rows } = await this.db.execute(selectQuery);  // Changed from executeSql to execute
      
      const records: IntakeRecord[] = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows.item(i);
        records.push({
          id: row.id,
          driverName: row.driver_name,
          driverId: row.driver_id,
          customerName: row.customer_name,
          customerPhone: row.customer_phone,
          vehiclePlate: row.vehicle_plate,
          vehicleColor: row.vehicle_color,
          vehicleType: row.vehicle_type,
          damageNotes: JSON.parse(row.damage_notes || "[]"),
          generalComments: row.general_comments,
          signature: row.signature,
          createdAt: row.created_at,
          synced: Boolean(row.synced),
        });
      }

      return records;
    } catch (error) {
      console.error("Error fetching records:", error);
      throw error;
    }
  }

  async closeDatabase(): Promise<void> {
    if (this.db) {  // Changed to this.db
      await this.db.close();
      this.db = null;
      console.log("Database closed");
    }
  }
}

export default new DatabaseService();