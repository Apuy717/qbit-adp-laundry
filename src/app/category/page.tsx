import CategoryPage from "@/components/Category/CategoryPage";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Cateogry",
  description: "category view",
};

const BasicChartPage: React.FC = () => {
  return (
    <>
      <CategoryPage />
    </>
  );
};

export default BasicChartPage;
