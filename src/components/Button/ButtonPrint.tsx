'use client';

export default function PrintButton() {
  return (
    <button
      className={`font-semibold font-edium inline-flex w-full items-center justify-center rounded-md bg-black px-10 
      py-3 text-center text-white hover:bg-opacity-90 lg:px-8 xl:px-10`}
      onClick={() => {
        (window as any).print()
      }}
    >
      Print
    </button>
  );
}
