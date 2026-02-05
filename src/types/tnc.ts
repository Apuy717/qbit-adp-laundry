export type TermsAndConditions = {
    id: string;
    title: string;
    address: string;
    phone_number: string;
    icon: string;
    receipt_icon: string;
    created_at: string; // ISO date string
    updated_at: string; // ISO date string
    outlet: Outlet | null;
    tnc_creator: User | null;
    tnc_updater: User | null;
    terms_and_conditions_items: TermsAndConditionsItem[];
};

export type CreateUpdateTAndCItemDTO = {
    id?: string | null;
    terms_and_conditions_id?: string | null;
    label: string;
    text: string;
};

export type CreateUpdateTAndCDTO = {
    id?: string | null;
    outlet_id?: string | null;
    title: string;
    address?: string | null;
    phone_number?: string | null;
    icon?: string | null;
    receipt_icon?: string | null;
    items: CreateUpdateTAndCItemDTO[];
};

export type Outlet = {
    id: string;
    name: string;
};

export type User = {
    id: string;
    fullname: string;
    email: string;
    dial_code: string;
    phone_number: string;
};

export type TermsAndConditionsItem = {
    id: string;
    terms_and_conditions_id: string;
    label: string;
    text: string;
    created_at: string; // ISO date string
    updated_at: string; // ISO date string
};
