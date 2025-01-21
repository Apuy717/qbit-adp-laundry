import { Outlet } from "./outlet"

export enum EDepartmentEmployee {
  HQ = "head quarter",
  AUDITOR = "auditor",
  FINANCE = "finance",
  AM = "area manager",
  SPV = "supervisor",
  HO = "head office",
  IS = "iron staff",
  SV = "server",

}

export type EmployeeOutlet = {
  id: string
  user_id: string
  outlet_id: string
  created_at: string
  updated_at: string
  outlet: Outlet
}

export type Employee = {
  id: string
  roles_id: string
  role: {
    id: string
    name: string
    slug: string | null
  },
  fullname: string
  country: string
  province: string
  city: string
  district: string
  postal_code: string
  address: string
  dial_code: string
  phone_number: string
  email: string
  is_deleted: boolean
  department: EDepartmentEmployee
  created_at: string
  updated_at: string
  employee_outlets: EmployeeOutlet[]
}