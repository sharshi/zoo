import { Component } from '../utils/types';

export interface FinancialComponent extends Component {
  type: 'financial';
  currentFunds: number;
  dailyIncome: number;
  dailyExpenses: number;
  ticketPrice: number;
  reputationScore: number; // 0-100
}

export function createFinancialComponent(
  startingFunds: number,
  ticketPrice: number
): FinancialComponent {
  return {
    type: 'financial',
    currentFunds: startingFunds,
    dailyIncome: 0,
    dailyExpenses: 0,
    ticketPrice,
    reputationScore: 50 // Start with neutral reputation
  };
}