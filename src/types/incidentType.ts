export enum ETypeIncident {
  SINGLE = "single",
  MULTIPLE = "multiple"
}

export type IncidentType = {
  id: string,
  note: string | null,
  token: string,
  approved: boolean,
  is_used: boolean,
  type: ETypeIncident,
  created_at: string,
  updated_at: string,
  incident_type: {
    id: string,
    name: string,
  },
  outlet: {
    id: string,
    name: string,
    city: string,
  },
  accepted_by: AcceptedByType | null,
  reported_by: ReportedByType | null,
  incident_reports: IncidentReport[]
}

type AcceptedByType = {
  id: string,
  fullname: string,
  dial_code: string,
  phone_number: string,
  department: string,
}

type ReportedByType = {
  id: string,
  fullname: string,
  dial_code: string,
  phone_number: string,
  department: string,
}

type IncidentReport = {
  id: string,
  change_machine: boolean,
  order_item_stage: {
    id: string,
    log_machine_id: string,
    order_item_id: string,
    name: string,
    status: string,
    machine_id: string,
    created_at: string,
    updated_at: string,
    machine: {
      id: string,
      name: string,
      type: string,
    } | null,
    order_item: {
      product_name: string,
      product_sku_name: string,
      washer_duration: number,
      dryer_duration: number,
      price: string,
      order: {
        id: string,
        invoice_id: string,
      }
    }
  }
}