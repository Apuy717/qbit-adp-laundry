import ECommerce from "@/components/Dashboard/E-commerce";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "ADP | Depth Clean",
  description: "Qyubit admin panel laundry",
};

export default function Home() {
  return <ECommerce />
}
