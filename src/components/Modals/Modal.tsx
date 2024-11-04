import React from "react";

interface ModalProps {
  isOpen: boolean;
  children: any;
}

const Modal: React.FC<ModalProps> = ({ isOpen, children }) => {
  const modalClass = isOpen ? "fixed inset-0 overflow-y-auto z-50" : "hidden";
  const modalContentClass = isOpen ? "flex items-center justify-center min-h-screen" : "hidden";

  return (
    <div className={modalClass}>
      <div className="fixed inset-0 transition-opacity" aria-hidden="true">
        <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
      </div>

      <div className={modalContentClass}>
        <div className="min-h-screen flex items-center justify-center z-50 fixed left-0 w-full">{children}</div>
      </div>
    </div>
  );
};

export default Modal;