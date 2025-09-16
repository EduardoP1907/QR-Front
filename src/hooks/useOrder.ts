import { useState, useEffect } from 'react';
import { orderUtils } from '@/utils';
import type { OrderData } from '@/types';

export function useOrder() {
  const [pendingOrder, setPendingOrder] = useState<OrderData | null>(null);
  const [lastOrder, setLastOrder] = useState<OrderData | null>(null);

  useEffect(() => {
    setPendingOrder(orderUtils.getPendingOrder());
    setLastOrder(orderUtils.getLastOrder());
  }, []);

  const savePendingOrder = (orderData: OrderData) => {
    orderUtils.savePendingOrder(orderData);
    setPendingOrder(orderData);
  };

  const clearPendingOrder = () => {
    orderUtils.clearPendingOrder();
    setPendingOrder(null);
  };

  const saveLastOrder = (orderData: OrderData) => {
    orderUtils.saveLastOrder(orderData);
    setLastOrder(orderData);
  };

  const completePurchase = (orderData: OrderData) => {
    saveLastOrder(orderData);
    clearPendingOrder();
  };

  return {
    pendingOrder,
    lastOrder,
    savePendingOrder,
    clearPendingOrder,
    saveLastOrder,
    completePurchase,
  };
}