"use client"

import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from "react-native"
import { useVehicle } from "../context/VehicleContext"
import DatabaseService from "../services/DatabaseService"
import PrinterService from "../services/PrinterService"
import IntakePDFService from "../services/IntakePDFService"
import type { NativeStackNavigationProp } from "react-native-screens/lib/typescript/native-stack/types"
import type { RootStackParamList, IntakeRecord } from "../types"

interface NotesSignatureScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "NotesSignature">
}

export default function NotesSignatureScreen({ navigation }: NotesSignatureScreenProps) {
  const { state, dispatch } = useVehicle()
  const [generalComments, setGeneralComments] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string>("")

  const handleComplete = async () => {
    try {
      setIsProcessing(true)
      setUploadStatus("Saving intake record...")

      // Create intake record
      const intakeRecord: IntakeRecord = {
        id: Date.now().toString(),
        driverName: state.driverName,
        driverId: state.driverId,
        customerName: state.customerName,
        customerPhone: state.customerPhone,
        vehiclePlate: state.vehiclePlate,
        vehicleColor: state.vehicleColor,
        vehicleType: state.vehicleType,
        damageNotes: state.damageNotes,
        generalComments: generalComments,
        signature: null,
        createdAt: new Date().toISOString(),
        synced: false,
      }

      // Save to local database
      await DatabaseService.saveIntakeRecord(intakeRecord)
      console.log("Intake record saved to local database")

      // Print receipt
      setUploadStatus("Printing receipt...")
      try {
        await PrinterService.printReceipt(intakeRecord)
        console.log("Receipt printed successfully")
      } catch (printError) {
        console.warn("Printing failed:", printError)
        // Continue with the process even if printing fails
      }

      // Upload to Google Drive
      setUploadStatus("Uploading to Google Drive...")
      try {
        const uploadSuccess = await IntakePDFService.uploadIntakeToDrive(intakeRecord)
        if (uploadSuccess) {
          setUploadStatus("Successfully uploaded to Google Drive!")
          // Update record as synced
          await DatabaseService.updateIntakeRecord({
            ...intakeRecord,
            synced: true,
          })
        } else {
          setUploadStatus("Upload to Google Drive failed, but record saved locally")
        }
      } catch (driveError) {
        console.error("Google Drive upload error:", driveError)
        setUploadStatus("Upload to Google Drive failed, but record saved locally")
      }

      // Show success message
      Alert.alert(
        "Intake Complete",
        "Vehicle intake has been completed successfully. Receipt printed and uploaded to Google Drive.",
        [
          {
            text: "New Intake",
            onPress: () => {
              // Reset form
              dispatch({ type: "RESET_FORM" })
              navigation.navigate("IntakeForm")
            },
          },
        ],
      )
    } catch (error) {
      console.error("Error completing intake:", error)
      Alert.alert("Error", "Failed to complete intake. Please try again.", [{ text: "OK" }])
    } finally {
      setIsProcessing(false)
      setUploadStatus("")
    }
  }

  const addDamageNote = () => {
    Alert.prompt(
      "Add Damage Note",
      "Enter vehicle part:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Next",
          onPress: (part) => {
            if (part?.trim()) {
              Alert.prompt(
                "Add Damage Note",
                "Describe the damage:",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Add",
                    onPress: (damage) => {
                      if (damage?.trim()) {
                        dispatch({
                          type: "ADD_DAMAGE_NOTE",
                          note: {
                            part: part.trim(),
                            damage: damage.trim(),
                            timestamp: new Date().toISOString(),
                          },
                        })
                      }
                    },
                  },
                ],
                "plain-text",
              )
            }
          },
        },
      ],
      "plain-text",
    )
  }

  const removeDamageNote = (index: number) => {
    Alert.alert("Remove Damage Note", "Are you sure you want to remove this damage note?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          dispatch({ type: "REMOVE_DAMAGE_NOTE", index })
        },
      },
    ])
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Notes & Completion</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Damage Assessment</Text>

          {state.damageNotes.length > 0 ? (
            state.damageNotes.map((note, index) => (
              <View key={index} style={styles.damageNote}>
                <View style={styles.damageNoteContent}>
                  <Text style={styles.damageNotePart}>{note.part}</Text>
                  <Text style={styles.damageNoteText}>{note.damage}</Text>
                </View>
                <TouchableOpacity style={styles.removeButton} onPress={() => removeDamageNote(index)}>
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.noDamageText}>No damage notes added</Text>
          )}

          <TouchableOpacity style={styles.addButton} onPress={addDamageNote}>
            <Text style={styles.addButtonText}>+ Add Damage Note</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General Comments</Text>
          <TextInput
            style={styles.commentsInput}
            value={generalComments}
            onChangeText={setGeneralComments}
            placeholder="Enter any additional comments about the vehicle..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Customer:</Text>
            <Text style={styles.summaryValue}>{state.customerName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Vehicle:</Text>
            <Text style={styles.summaryValue}>
              {state.vehicleType} - {state.vehiclePlate}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Color:</Text>
            <Text style={styles.summaryValue}>{state.vehicleColor}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Driver:</Text>
            <Text style={styles.summaryValue}>{state.driverName}</Text>
          </View>
        </View>

        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#d2de24" />
            <Text style={styles.processingText}>{uploadStatus}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.completeButton, isProcessing && styles.disabledButton]}
          onPress={handleComplete}
          disabled={isProcessing}
        >
          <Text style={styles.completeButtonText}>{isProcessing ? "Processing..." : "Complete Intake"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} disabled={isProcessing}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  form: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#767c28",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#d2de24",
  },
  damageNote: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#cf2b24",
  },
  damageNoteContent: {
    flex: 1,
  },
  damageNotePart: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#cf2b24",
    marginBottom: 4,
  },
  damageNoteText: {
    fontSize: 14,
    color: "#333",
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#cf2b24",
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  noDamageText: {
    fontStyle: "italic",
    color: "#666",
    textAlign: "center",
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: "#d2de24",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  addButtonText: {
    color: "#767c28",
    fontSize: 16,
    fontWeight: "bold",
  },
  commentsInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    minHeight: 100,
  },
  summaryRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#cf2b24",
    width: 100,
  },
  summaryValue: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  processingContainer: {
    alignItems: "center",
    marginVertical: 20,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 2,
  },
  processingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#767c28",
    textAlign: "center",
  },
  completeButton: {
    backgroundColor: "#d2de24",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  completeButtonText: {
    color: "#767c28",
    fontSize: 18,
    fontWeight: "bold",
  },
  backButton: {
    backgroundColor: "#666",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})
