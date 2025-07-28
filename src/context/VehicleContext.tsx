"use client"

import type React from "react"
import { createContext, useContext, useReducer, type ReactNode } from "react"
import type { DamageNote } from "../types"

interface VehicleState {
  driverName: string
  driverId: string
  customerName: string
  customerPhone: string
  vehiclePlate: string
  vehicleColor: string
  vehicleType: string
  damageNotes: DamageNote[]
  selectedParts: string[]
}

type VehicleAction =
  | { type: "UPDATE_FIELD"; field: keyof VehicleState; value: any }
  | { type: "ADD_DAMAGE_NOTE"; note: DamageNote }
  | { type: "REMOVE_DAMAGE_NOTE"; index: number }
  | { type: "TOGGLE_PART"; part: string }
  | { type: "RESET_FORM" }

const initialState: VehicleState = {
  driverName: "",
  driverId: "",
  customerName: "",
  customerPhone: "",
  vehiclePlate: "",
  vehicleColor: "",
  vehicleType: "Sedan",
  damageNotes: [],
  selectedParts: [],
}

function vehicleReducer(state: VehicleState, action: VehicleAction): VehicleState {
  switch (action.type) {
    case "UPDATE_FIELD":
      return {
        ...state,
        [action.field]: action.value,
      }
    case "ADD_DAMAGE_NOTE":
      return {
        ...state,
        damageNotes: [...state.damageNotes, action.note],
      }
    case "REMOVE_DAMAGE_NOTE":
      return {
        ...state,
        damageNotes: state.damageNotes.filter((_, index) => index !== action.index),
      }
    case "TOGGLE_PART":
      const isSelected = state.selectedParts.includes(action.part)
      return {
        ...state,
        selectedParts: isSelected
          ? state.selectedParts.filter((part) => part !== action.part)
          : [...state.selectedParts, action.part],
      }
    case "RESET_FORM":
      return initialState
    default:
      return state
  }
}

interface VehicleContextType {
  state: VehicleState
  dispatch: React.Dispatch<VehicleAction>
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined)

export function VehicleProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(vehicleReducer, initialState)

  return <VehicleContext.Provider value={{ state, dispatch }}>{children}</VehicleContext.Provider>
}

export function useVehicle() {
  const context = useContext(VehicleContext)
  if (context === undefined) {
    throw new Error("useVehicle must be used within a VehicleProvider")
  }
  return context
}
