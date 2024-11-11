export enum EMachineType {
  WASHER = "washer",
  DRYER = "dryer",
  IRON = "iron"
}

export type MachineType = {
  id: string,
  outlet_id: string,
  machine_id: string,
  name: string,
  ip: string,
  default_duration: number,
  type: string,
  is_deleted: boolean,
  created_at: string,
  updated_at: string,
  cycles: string,
  total_duration: string | null,
  outlet: {
    id: string,
    name: string,
    city: string,
  }

}