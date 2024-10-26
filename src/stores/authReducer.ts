import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export enum ERoles {
  SUPER_ADMIN = "super admin",
  FINANCE = "finance",
  OUTLET_ADMIN = "outlet admin",
  EMPLOYEE = "employee",
  TECHNICIAN = "technician",
  PROVIDER = "provider"
}

export interface iAuthRedux {
  id: string | null,
  outlet_id: string | null,
  fullname: string | null,
  dial_code: string | null,
  phone_number: string | null,
  email: string | null,
  role: {
    id: string | null,
    name: ERoles,
    slug: null
  },
  auth: {
    access_token: string | null,
    expires: string | null
  }
}

const defaultState: iAuthRedux = {
  id: null,
  outlet_id: null,
  fullname: null,
  dial_code: null,
  phone_number: null,
  email: null,
  role: {
    id: null,
    name: ERoles.EMPLOYEE,
    slug: null
  },
  auth: {
    access_token: null,
    expires: null
  }
};

export const slice = createSlice({
  name: "auth",
  initialState: defaultState,
  reducers: {
    setLogin: (state: iAuthRedux, action: PayloadAction<iAuthRedux>) => {
      return Object.assign(state, action.payload);
    },

    setLogout: (state: iAuthRedux) => {
      return Object.assign(state, defaultState);
    },
  },
});

export const { setLogin, setLogout } = slice.actions;
export default slice.reducer;