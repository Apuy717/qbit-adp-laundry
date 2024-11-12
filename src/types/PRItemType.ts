import { CategoryType } from "./category"
import { Outlet } from "./outlet"

export enum EStatusPRs {
  ACCEPTED = "accepted",
  REQUESTED = "requested",
  PLANNING = "planning",
  PENDING = "pending"
}

export type PRItemType = {
  id: string,
  outlet_id: string,
  name: string,
  slug: string | null,
  description: string | null,
  status: EStatusPRs,
  request_by: string | null,
  accept_by: string,
  category_id: string,
  is_deleted: boolean,
  created_at: string,
  updated_at: string,
  outlet: Outlet | null,
  category: CategoryType | null
}