import { openDatabase, type SQLiteDatabase } from "react-native-quick-sqlite"
import type { IntakeRecord } from "../types"

class DatabaseService {
  private db: SQLiteDatabase

  constructor() {
    this.db = openDatabase({ name: "alfazaa.db" })
    this.initializeDatabase()
  }

  private initializeDatabase() {
    try {
      // Create intake_records table
      this.db.execute(`
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
        )
      `)

      console.log("Database initialized successfully")
    } catch (error) {
      console.error("Database initialization error:", error)
    }
  }

  async saveIntakeRecord(record: IntakeRecord): Promise<boolean> {
    try {
      const damageNotesJson = JSON.stringify(record.damageNotes)

      this.db.execute(
        `INSERT INTO intake_records (
          id, driver_name, driver_id, customer_name, customer_phone,
          vehicle_plate, vehicle_color, vehicle_type, damage_notes,
          general_comments, signature, created_at, synced
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.id,
          record.driverName,
          record.driverId,
          record.customerName,
          record.customerPhone,
          record.vehiclePlate,
          record.vehicleColor,
          record.vehicleType,
          damageNotesJson,
          record.generalComments,
          record.signature,
          record.createdAt,
          record.synced ? 1 : 0,
        ],
      )

      console.log("Intake record saved successfully")
      return true
    } catch (error) {
      console.error("Error saving intake record:", error)
      return false
    }
  }

  async updateIntakeRecord(record: IntakeRecord): Promise<boolean> {
    try {
      const damageNotesJson = JSON.stringify(record.damageNotes)

      this.db.execute(
        `UPDATE intake_records SET 
          driver_name = ?, driver_id = ?, customer_name = ?, customer_phone = ?,
          vehicle_plate = ?, vehicle_color = ?, vehicle_type = ?, damage_notes = ?,
          general_comments = ?, signature = ?, synced = ?
        WHERE id = ?`,
        [
          record.driverName,
          record.driverId,
          record.customerName,
          record.customerPhone,
          record.vehiclePlate,
          record.vehicleColor,
          record.vehicleType,
          damageNotesJson,
          record.generalComments,
          record.signature,
          record.synced ? 1 : 0,
          record.id,
        ],
      )

      console.log("Intake record updated successfully")
      return true
    } catch (error) {
      console.error("Error updating intake record:", error)
      return false
    }
  }

  async getAllIntakeRecords(): Promise<IntakeRecord[]> {
    try {
      const result = this.db.execute("SELECT * FROM intake_records ORDER BY created_at DESC")

      return result.rows._array.map((row: any) => ({
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
        synced: row.synced === 1,
      }))
    } catch (error) {
      console.error("Error fetching intake records:", error)
      return []
    }
  }

  async getUnsyncedRecords(): Promise<IntakeRecord[]> {
    try {
      const result = this.db.execute("SELECT * FROM intake_records WHERE synced = 0")

      return result.rows._array.map((row: any) => ({
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
        synced: false,
      }))
    } catch (error) {
      console.error("Error fetching unsynced records:", error)
      return []
    }
  }

  async deleteIntakeRecord(id: string): Promise<boolean> {
    try {
      this.db.execute("DELETE FROM intake_records WHERE id = ?", [id])
      console.log("Intake record deleted successfully")
      return true
    } catch (error) {
      console.error("Error deleting intake record:", error)
      return false
    }
  }
}

export default new DatabaseService()
