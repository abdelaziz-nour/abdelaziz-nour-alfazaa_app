import { useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Alert } from "react-native"
import { Picker } from "@react-native-picker/picker"
import { useVehicle } from "../context/VehicleContext"
import VehicleDiagram from "../components/VehicleDiagram"
import { RootStackParamList } from "../types"
import { NativeStackNavigationProp } from "react-native-screens/lib/typescript/native-stack/types"

interface VehicleBodyScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "VehicleBody">;
}

export default function VehicleBodyScreen({ navigation }: VehicleBodyScreenProps) {
  const { state, dispatch } = useVehicle()
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedPart, setSelectedPart] = useState<string | null>(null)
  const [selectedDamage, setSelectedDamage] = useState("Scratch")

  const damageTypes = ["Scratch", "Dent", "Broken", "Missing", "Cracked", "Damaged Paint"]

  const handlePartPress = (partName: string) => {
    setSelectedPart(partName)
    setModalVisible(true)
  }

  const addDamageNote = () => {
    if (selectedPart && selectedDamage) {
      const note = {
        part: selectedPart,
        damage: selectedDamage,
        timestamp: new Date().toISOString(),
      }

      dispatch({ type: "ADD_DAMAGE_NOTE", note })
      setModalVisible(false)
      setSelectedPart(null)
      setSelectedDamage("Scratch")
    }
  }

  const removeDamageNote = (index: number) => {
    Alert.alert("Remove Damage Note", "Are you sure you want to remove this damage note?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", onPress: () => dispatch({ type: "REMOVE_DAMAGE_NOTE", index }) },
    ])
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Vehicle Inspection</Text>
        <Text style={styles.subtitle}>Tap on vehicle parts to add damage notes</Text>

        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleText}>
            {state.vehicleType} - {state.vehiclePlate} ({state.vehicleColor})
          </Text>
        </View>

        <VehicleDiagram vehicleType={state.vehicleType} onPartPress={handlePartPress} damageNotes={state.damageNotes} />

        {state.damageNotes.length > 0 && (
          <View style={styles.damageList}>
            <Text style={styles.damageListTitle}>Recorded Damage:</Text>
            {state.damageNotes.map((note, index) => (
              <View key={index} style={styles.damageItem}>
                <View style={styles.damageInfo}>
                  <Text style={styles.damagePart}>{note.part}</Text>
                  <Text style={styles.damageType}>{note.damage}</Text>
                </View>
                <TouchableOpacity onPress={() => removeDamageNote(index)} style={styles.removeButton}>
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.nextButton} onPress={() => navigation.navigate("NotesSignature")}>
            <Text style={styles.nextButtonText}>Next →</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Damage Note</Text>
            <Text style={styles.modalSubtitle}>Part: {selectedPart}</Text>

            <Text style={styles.modalLabel}>Damage Type:</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={selectedDamage} onValueChange={setSelectedDamage} style={styles.picker}>
                {damageTypes.map((type) => (
                  <Picker.Item key={type} label={type} value={type} />
                ))}
              </Picker>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalSaveButton} onPress={addDamageNote}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
  },
  vehicleInfo: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
  },
  vehicleText: {
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
    color: "#cf2b24",
  },
  damageList: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
    elevation: 2,
  },
  damageListTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  damageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  damageInfo: {
    flex: 1,
  },
  damagePart: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  damageType: {
    fontSize: 14,
    color: "#f44336",
  },
  removeButton: {
    backgroundColor: "#f44336",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
  },
  backButton: {
    backgroundColor: "#757575",
    borderRadius: 10,
    padding: 15,
    flex: 0.45,
    alignItems: "center",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  nextButton: {
    backgroundColor: "#d2de24",
    borderRadius: 10,
    padding: 15,
    flex: 0.45,
    alignItems: "center",
  },
  nextButtonText: {
    color: "#767c28",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    width: "80%",
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#333",
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#2196F3",
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
    color: "#333",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 20,
  },
  picker: {
    height: 50,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalCancelButton: {
    backgroundColor: "#757575",
    borderRadius: 8,
    padding: 12,
    flex: 0.45,
    alignItems: "center",
  },
  modalCancelText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalSaveButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    padding: 12,
    flex: 0.45,
    alignItems: "center",
  },
  modalSaveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})
