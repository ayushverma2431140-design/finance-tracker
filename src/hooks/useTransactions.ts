import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";

export interface Transaction {
  id: string;
  userId: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  date: number;
  description: string;
  isRecurring: boolean;
  recurringFrequency?: string;
  createdAt: number;
}

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const results = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Transaction[];
        setTransactions(results);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "transactions");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  return { transactions, loading };
}
