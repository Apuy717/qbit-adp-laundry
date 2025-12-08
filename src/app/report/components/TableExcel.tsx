import { forwardRef } from "react";

type MerchantDataType = {
  transaction: string;
  total: string;
  outlet: {
    id: number;
    name: string;
  }
}[];

type TablePrinterType = {
  merchantData: MerchantDataType;
};

export const TablePrinter = forwardRef<HTMLTableElement, TablePrinterType>((props, ref) => (
  <table ref={ref} className="hidden">
    <thead>
      <tr>
        <th>No</th>
        <th>Merchant</th>
        <th>Transaction</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      {props.merchantData &&
        props.merchantData.map((item, index) => (
          <tr key={index}>
            <td>{index + 1}</td>
            <td>{item.outlet.name}</td>
            <td>{item.transaction}</td>
            <td>{item.total}</td>
          </tr>
        ))}
    </tbody>
  </table>
));
TablePrinter.displayName = "TablePrinter";