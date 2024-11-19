import DefaultLayout from "@/components/Layouts/DefaultLayout";

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  return (
    <DefaultLayout>
      {children}
    </DefaultLayout>
  )
}