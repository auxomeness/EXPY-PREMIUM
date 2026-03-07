import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import type { UserData, Expense, Transaction } from "../App";
import { Calendar, Filter, Wallet, TrendingDown, PiggyBank, TrendingUp, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { formatCurrency } from "../utils/currency";

type ExpenseHistoryProps = {
  username: string;
};

const categoryColors: Record<string, string> = {
  leisure: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-800",
  bills: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800",
  transportation: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800",
  food: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800",
  other: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600",
};

const transactionTypeInfo = {
  expense: {
    label: "Expense",
    icon: TrendingDown,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800",
    sign: "-",
  },
  add_money: {
    label: "Add Money",
    icon: Wallet,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800",
    sign: "+",
  },
  add_savings: {
    label: "Add to Savings",
    icon: PiggyBank,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800",
    sign: "-",
  },
  withdraw_savings: {
    label: "Withdraw Savings",
    icon: TrendingUp,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-800",
    sign: "+",
  },
};

export function ExpenseHistory({ username }: ExpenseHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPeriod, setFilterPeriod] = useState<string>("all");
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  useEffect(() => {
    loadTransactions();
  }, [username]);

  const loadTransactions = () => {
    const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
    if (users[username]) {
      setTransactions(users[username].transactions || []);
      setCustomCategories(users[username].customCategories || []);
    }
  };

  const getDateFilteredTransactions = (transactions: Transaction[]) => {
    if (filterPeriod === "all") return transactions;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const transactionDay = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate());
      
      switch (filterPeriod) {
        case "today":
          return transactionDay.getTime() === today.getTime();
        
        case "week": {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return transactionDate >= weekAgo;
        }
        
        case "month": {
          return transactionDate.getMonth() === now.getMonth() && 
                 transactionDate.getFullYear() === now.getFullYear();
        }
        
        case "year": {
          return transactionDate.getFullYear() === now.getFullYear();
        }
        
        default:
          return true;
      }
    });
  };

  const dateFilteredTransactions = getDateFilteredTransactions(transactions);
  
  // Apply unified type/category filter
  const filteredTransactions = (() => {
    if (filterType === "all") return dateFilteredTransactions;
    
    // Check if it's a transaction type
    if (filterType === "add_money" || filterType === "add_savings" || filterType === "withdraw_savings") {
      return dateFilteredTransactions.filter(t => t.type === filterType);
    }
    
    // Check if it's "expense" (all expenses)
    if (filterType === "expense") {
      return dateFilteredTransactions.filter(t => t.type === "expense");
    }
    
    // Otherwise it's a category filter
    return dateFilteredTransactions.filter(t => 
      t.type === "expense" && t.category?.toLowerCase() === filterType.toLowerCase()
    );
  })();

  // Calculate net change (income - expenses)
  const totalIncome = filteredTransactions
    .filter(t => t.type === "add_money" || t.type === "withdraw_savings")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = filteredTransactions
    .filter(t => t.type === "expense" || t.type === "add_savings")
    .reduce((sum, t) => sum + t.amount, 0);

  const getCategoryColor = (category: string): string => {
    return categoryColors[category.toLowerCase()] || categoryColors.other;
  };

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2">
        <h1>Transaction History</h1>
        <p className="text-muted-foreground">Track all your transactions</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Income</p>
                <p className="text-xl text-green-600 dark:text-green-400">+{formatCurrency(totalIncome)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expenses</p>
                <p className="text-xl text-red-600 dark:text-red-400">-{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Transactions</SelectItem>
                    <SelectItem value="expense">All Expenses</SelectItem>
                    <SelectItem value="leisure">Leisure Expenses</SelectItem>
                    <SelectItem value="bills">Bills Expenses</SelectItem>
                    <SelectItem value="transportation">Transportation Expenses</SelectItem>
                    <SelectItem value="food">Food Expenses</SelectItem>
                    <SelectItem value="other">Other Expenses</SelectItem>
                    {customCategories.map(category => (
                      <SelectItem key={category} value={category}>{category} Expenses</SelectItem>
                    ))}
                    <SelectItem value="add_money">Add Money</SelectItem>
                    <SelectItem value="add_savings">Add to Savings</SelectItem>
                    <SelectItem value="withdraw_savings">Withdraw Savings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">No transactions found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredTransactions.map((transaction) => {
            const typeInfo = transactionTypeInfo[transaction.type];
            const Icon = typeInfo.icon;
            
            return (
              <Card key={transaction.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="mt-0.5">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={typeInfo.bgColor} variant="outline">
                            {typeInfo.label}
                          </Badge>
                          {transaction.type === "expense" && transaction.category && (
                            <Badge className={getCategoryColor(transaction.category)} variant="outline">
                              {transaction.category}
                            </Badge>
                          )}
                        </div>
                        {transaction.description && (
                          <p className="truncate mb-1">
                            {transaction.description}
                          </p>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(transaction.date).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{new Date(transaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg ${typeInfo.color}`}>
                        {typeInfo.sign}{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}