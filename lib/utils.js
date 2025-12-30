import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export function formatDate(date) {
  if (!date) return '';
  
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

export function formatDateTime(date) {
  if (!date) return '';
  
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return '';
  }
}

export function generateCode(prefix, sequence) {
  const paddedSequence = String(sequence).padStart(6, '0');
  return `${prefix}${paddedSequence}`;
}

export async function generateProductCode() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PRD${timestamp}${random}`;
}

export async function generateCustomerCode() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `CUS${timestamp}${random}`;
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function calculateProfitMargin(sellingPrice, unitCost) {
  if (!sellingPrice || !unitCost || unitCost === 0) return 0;
  return ((sellingPrice - unitCost) / sellingPrice * 100).toFixed(2);
}

export function isStockCritical(currentStock, criticalLevel) {
  if (criticalLevel === null || criticalLevel === undefined) return false;
  return currentStock <= criticalLevel;
}

export function isBalanceAtRisk(currentBalance, riskLimit) {
  if (riskLimit === null || riskLimit === undefined) return false;
  return currentBalance >= riskLimit;
}

export function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'text-green-600 bg-green-50';
    case 'inactive':
      return 'text-gray-600 bg-gray-50';
    case 'pending':
      return 'text-yellow-600 bg-yellow-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export function truncate(str, length = 50) {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}