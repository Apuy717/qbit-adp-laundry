import { createContext, useState } from "react";

type ReportOutletLayoutType = {
    children: React.ReactNode;
}

type MerchantDataType = {
  transaction: string;
  total: string;
  outlet: {
    id: number;
    name: string;
  }
}

type MerchantDataContextType = {
  merchantData: MerchantDataType[];
  setMerchantData: React.Dispatch<React.SetStateAction<MerchantDataType[]>>;
};

 const MerchantDataContext = createContext<MerchantDataContextType>({
  merchantData: [],
  setMerchantData: () => {},
});

const ReportOutletLayout = (props: ReportOutletLayoutType) => {
    const [merchantData, setMerchantData] = useState<MerchantDataType[]>([]);

    return (
        <MerchantDataContext.Provider value={{merchantData, setMerchantData}}>
            {props.children}
        </MerchantDataContext.Provider>
    );
}

export {MerchantDataContext, ReportOutletLayout}
