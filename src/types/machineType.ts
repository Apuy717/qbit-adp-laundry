export enum EMachineType {
  WASHER = "washer",
  DRYER = "dryer",
  IRON = "iron"
}

export type MachineType = {
  id: string;
  outlet_id: string;
  machine_id: string;
  name: string;
  ip: string;
  default_duration: number;
  type: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  cycles: string;
  relay_time_used: string | null;
  cyles_machine: string;
  runtime: string;
  api_key: string;

  outlet: {
    id: string;
    name: string;
    city: string;
  }

}