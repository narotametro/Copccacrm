/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Exchange rate to USD
}

export const currencies: Currency[] = [
  // Major Currencies
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79 },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  
  // African Currencies
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', rate: 1450 },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', rate: 18.5 },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', rate: 160 },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi', rate: 12 },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', rate: 30.9 },
  { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling', rate: 2500 },
  { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling', rate: 3700 },
  { code: 'MAD', symbol: 'DH', name: 'Moroccan Dirham', rate: 10 },
  { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr', rate: 56 },
  { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', rate: 605 },
  { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc', rate: 605 },
  { code: 'RWF', symbol: 'FRw', name: 'Rwandan Franc', rate: 1250 },
];

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (amount: number) => string;
  convertAmount: (amount: number, fromCode?: string) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const [currency, setCurrencyState] = useState<Currency>(currencies[0]); // USD default

  // Load saved currency preference on mount and when user changes
  useEffect(() => {
    const loadSavedCurrency = () => {
      try {
        if (typeof window !== 'undefined' && window.localStorage && user?.id) {
          const savedCurrencyCode = localStorage.getItem(`currency_${user.id}`);
          if (savedCurrencyCode) {
            const savedCurrency = currencies.find(c => c.code === savedCurrencyCode);
            if (savedCurrency) {
              console.log('Loading saved currency preference:', savedCurrency.code);
              setCurrencyState(savedCurrency);
              return;
            }
          }
        }
        // Fallback to USD if no saved preference or user not logged in
        console.log('Using default currency: USD');
        setCurrencyState(currencies[0]);
      } catch (error) {
        console.warn('Failed to load saved currency preference:', error);
        setCurrencyState(currencies[0]);
      }
    };

    loadSavedCurrency();
  }, [user?.id]);

  // Wrapper to save currency preference when changed
  const setCurrency = (newCurrency: Currency) => {
    console.log('Setting currency to:', newCurrency.code);
    setCurrencyState(newCurrency);
    try {
      if (typeof window !== 'undefined' && window.localStorage && user?.id) {
        localStorage.setItem(`currency_${user.id}`, newCurrency.code);
        console.log('Saved currency preference to localStorage:', newCurrency.code);
      } else {
        console.warn('Cannot save currency preference: localStorage not available or user not logged in');
      }
    } catch (error) {
      console.warn('Failed to save currency preference:', error);
    }
  };

  const formatCurrency = useCallback((amount: number): string => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return `${currency.symbol}0`;
    }
    return `${currency.symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }, [currency.symbol]);

  const convertAmount = useCallback((amount: number, fromCode: string = 'USD'): number => {
    const fromCurrency = currencies.find(c => c.code === fromCode) || currencies[0];
    // Convert to USD first, then to target currency
    const amountInUSD = amount / fromCurrency.rate;
    return amountInUSD * currency.rate;
  }, [currency.rate]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency, convertAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};
