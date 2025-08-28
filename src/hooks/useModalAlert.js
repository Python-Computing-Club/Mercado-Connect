import { useState } from "react";

export default function useModalAlert() {
  const [modal, setModal] = useState({ open: false, title: "", message: "" });

  const showAlert = (title, message) => {
    setModal({ open: true, title, message });
  };

  const closeAlert = () => {
    setModal((prev) => ({ ...prev, open: false }));
  };

  return { modal, showAlert, closeAlert };
}