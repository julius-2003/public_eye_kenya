import { createContext, useContext, useState, useRef } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const PaymentContext = createContext(null);

export const PaymentProvider = ({ children }) => {
  const [payment, setPayment] = useState(null);
  const [status, setStatus] = useState(null); // pending|success|failed
  const pollRef = useRef(null);

  const initiatePayment = async ({ phone, amount, method }) => {
    const { data } = await axios.post(`${API}/support/initiate`, { phone, amount, method });
    setPayment(data);
    setStatus('pending');
    // Poll every 3s for STK status
    if (method === 'stk') {
      pollRef.current = setInterval(async () => {
        const res = await axios.get(`${API}/support/status/${data.paymentId}`);
        if (res.data.status !== 'pending') {
          setStatus(res.data.status);
          clearInterval(pollRef.current);
        }
      }, 3000);
    }
    return data;
  };

  const clearPayment = () => {
    setPayment(null);
    setStatus(null);
    if (pollRef.current) clearInterval(pollRef.current);
  };

  return (
    <PaymentContext.Provider value={{ payment, status, initiatePayment, clearPayment }}>
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = () => useContext(PaymentContext);
