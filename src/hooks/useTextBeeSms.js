import { useState, useCallback } from 'react';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_BASE_URL;
const API_KEY = process.env.REACT_APP_API_KEY;
const DEVICE_ID = process.env.REACT_APP_DEVICE_ID;

export function useTextBeeSms() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [verificationCode, setVerificationCode] = useState(null);

  const sendSms = useCallback(async (recipients, message) => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await axios.post(
        `${BASE_URL}/gateway/devices/${DEVICE_ID}/send-sms`,
        {
          recipients: Array.isArray(recipients) ? recipients : [recipients],
          message,
        },
        {
          headers: {
            'x-api-key': API_KEY,
          },
        }
      );

      setResponse(res.data.data);
      return res.data.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Erro ao enviar SMS via TextBee.';
      setError(errMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendVerificationCode = useCallback(async (recipient) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationCode(code);

    const message = `Seu código de verificação é ${code}. Ele expira em 5 minutos.`;

    const result = await sendSms(recipient, message);
    if (!result) return null;

    return code;
  }, [sendSms]);

  return {
    sendSms,
    sendVerificationCode,
    loading,
    response,
    error,
    verificationCode,
  };
}