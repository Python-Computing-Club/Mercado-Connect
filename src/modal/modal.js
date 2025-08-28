import React from "react";
import styles from "./modal.module.css";

export default function Modal({ title, message, onClose, onConfirm, confirmText, cancelText }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className={styles.buttons}>
          {onConfirm && (
            <>
              <button className={styles.cancelBtn} onClick={onClose}>
                {cancelText || "Cancelar"}
              </button>
              <button className={styles.confirmBtn} onClick={onConfirm}>
                {confirmText || "Confirmar"}
              </button>
            </>
          )}
          {!onConfirm && (
            <button className={styles.confirmBtn} onClick={onClose}>
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}