export enum EEmptyWash {
  PENDING = "pending",
  REJECTED = "rejected",
  APPROVED = "approved"
}

export type EmptyWashType = {
  id: string,
  review_status: EEmptyWash,
  duration: number | null,
  is_used: boolean,
  is_mqtt: boolean,
  created_at: string,
  updated_at: string,
  requested: {
    id: string,
    fullname: string,
    dial_code: string,
    phone_number: string
  } | null,
  approved: {
    id: string,
    fullname: string,
    dial_code: string,
    phone_number: string
  } | null,
  outlet: {
    id: string,
    name: string,
    city: string
  },
  machine: {
    id: string,
    machine_id: string,
    name: string,
    ip: string,
    type: string
  }
}