import CategoryPage from "@/components/Category/CategoryPage";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Cateogry",
  description: "category view",
};

const BasicChartPage: React.FC = () => {
  return (
    <DefaultLayout>
      <CategoryPage />
    </DefaultLayout>
  );
};

export default BasicChartPage;
