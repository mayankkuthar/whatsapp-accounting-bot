const sessionManager = require('./sessionManager');
const dataStorage = require('./dataStorage');

/**
 * Conversation Flows - Defines Q&A flows for data capture
 */
const flows = {
  // Main menu
  main: {
    steps: [
      {
        question: `Hello 👋!
Welcome to A Kira Shop Daily Tracker 📊

What would you like to do?

1️⃣ Record Today's Sales
2️⃣ View Summary
3️⃣ View Recent Records
4️⃣ Help

Reply with the number of your choice.`,
        validator: (input) => /^[1-4]$/.test(input.trim()),
        errorMessage: 'Please reply with a number from 1 to 4.',
        next: (input) => {
          const choice = input.trim();
          const flowMap = {
            '1': 'dailySales',
            '2': 'summary',
            '3': 'recent',
            '4': 'help'
          };
          return flowMap[choice];
        }
      }
    ]
  },

  // Daily Sales recording flow
  dailySales: {
    steps: [
      {
        question: "Let's record your shop summary for today.\n\nPlease enter today's total sales (₹):",
        field: 'sales',
        validator: (input) => /^\d+(\.\d{1,2})?$/.test(input.trim()),
        errorMessage: 'Please enter a valid amount (e.g., 5000 or 5000.50)'
      },
      {
        question: "Thanks! Now enter today's total inventory cost (₹) —\n(that's the total cost of items sold today):",
        field: 'inventoryCost',
        validator: (input) => /^\d+(\.\d{1,2})?$/.test(input.trim()),
        errorMessage: 'Please enter a valid amount (e.g., 3000)'
      },
      {
        question: 'Got it ✅\nNow enter your other expenses (₹) for today (like rent, staff, electricity).\nIf none, type 0:',
        field: 'expenses',
        validator: (input) => /^\d+(\.\d{1,2})?$/.test(input.trim()),
        errorMessage: 'Please enter a valid amount or 0'
      },
      {
        question: async (session) => {
          const sales = parseFloat(session.data.sales);
          const inventoryCost = parseFloat(session.data.inventoryCost);
          const expenses = parseFloat(session.data.expenses);
          const profit = sales - (inventoryCost + expenses);
          const margin = sales > 0 ? (profit / sales * 100) : 0;
          const date = new Date().toISOString().split('T')[0];

          // Generate insights
          let insight = '';
          if (profit > 0) {
            if (margin > 30) {
              insight = '🟢 Great day! Keep it up 👍';
            } else if (margin >= 10) {
              insight = '🟡 Good work, but review costs.';
            } else {
              insight = '🔻 High costs detected. Try checking product pricing.';
            }
          } else {
            insight = "🔴 You're in loss today. Review your pricing and costs.";
          }

          // Save data
          const data = {
            type: 'dailySales',
            category: 'Shop Daily Record',
            date: date,
            sales: sales,
            inventoryCost: inventoryCost,
            expenses: expenses,
            profit: profit,
            margin: margin.toFixed(2),
            description: `Daily shop record for ${date}`
          };
          
          await dataStorage.saveTransaction(session.phoneNumber, data);
          
          return `Here's your summary for ${date} 🧾\n\nTotal Sales: ₹${sales.toFixed(2)}\nInventory Cost: ₹${inventoryCost.toFixed(2)}\nOther Expenses: ₹${expenses.toFixed(2)}\n\n📊 Profit / Loss Calculation:\nProfit = Sales - (Inventory Cost + Expenses)\n\n➡️ Net Profit: ₹${profit.toFixed(2)}\n💹 Profit Margin: ${margin.toFixed(2)}%\n\n💡 Here's what your numbers mean today 👇\n${insight}\n\n✅ Your daily record has been saved.\n\nReply "menu" to return to main menu.`;
        },
        isComplete: true
      }
    ]
  },

  // Summary view
  summary: {
    steps: [
      {
        question: async (session) => {
          const transactions = await dataStorage.getTransactions(session.phoneNumber);
          const dailyRecords = transactions.filter(t => t.type === 'dailySales');
          
          if (dailyRecords.length === 0) {
            return '📊 A Kira Shop Summary\n\nNo daily records found yet.\n\nReply "menu" to return to main menu.';
          }

          let totalSales = 0;
          let totalInventoryCost = 0;
          let totalExpenses = 0;
          
          dailyRecords.forEach(r => {
            totalSales += parseFloat(r.sales || 0);
            totalInventoryCost += parseFloat(r.inventoryCost || 0);
            totalExpenses += parseFloat(r.expenses || 0);
          });

          const totalProfit = totalSales - (totalInventoryCost + totalExpenses);
          const avgMargin = totalSales > 0 ? (totalProfit / totalSales * 100) : 0;

          let message = `📊 A Kira Shop Summary\n\n`;
          message += `Total Records: ${dailyRecords.length} days\n\n`;
          message += `Total Sales: ₹${totalSales.toFixed(2)}\n`;
          message += `Total Inventory Cost: ₹${totalInventoryCost.toFixed(2)}\n`;
          message += `Total Other Expenses: ₹${totalExpenses.toFixed(2)}\n\n`;
          message += `➡️ Net Profit: ₹${totalProfit.toFixed(2)}\n`;
          message += `💹 Average Margin: ${avgMargin.toFixed(2)}%\n\n`;
          
          if (totalProfit > 0) {
            message += '🟢 Overall: Profitable';
          } else {
            message += '🔴 Overall: In Loss';
          }
          
          message += '\n\nReply "menu" to return to main menu.';
          return message;
        },
        isComplete: true
      }
    ]
  },

  // Recent transactions
  recent: {
    steps: [
      {
        question: async (session) => {
          const transactions = await dataStorage.getTransactions(session.phoneNumber);
          const dailyRecords = transactions.filter(t => t.type === 'dailySales').slice(-5).reverse();
          
          let message = `📝 Recent Daily Records\n\n`;
          
          if (dailyRecords.length === 0) {
            message += `No records found yet.\n`;
          } else {
            dailyRecords.forEach((r, idx) => {
              message += `${idx + 1}. ${r.date}\n`;
              message += `   Sales: ₹${r.sales} | Profit: ₹${r.profit}\n`;
              message += `   Margin: ${r.margin}%\n\n`;
            });
          }
          
          message += `Reply "menu" to return to main menu.`;
          return message;
        },
        isComplete: true
      }
    ]
  },

  // Help
  help: {
    steps: [
      {
        question: `📖 Help & Information

This bot helps you track daily sales for A Kira Shop.

Available Features:
• Record Today's Sales - Capture daily sales, costs, and expenses
• View Summary - See overall shop performance
• Recent Records - View latest daily entries

Commands:
• "menu" - Return to main menu
• "cancel" - Cancel current operation

Data is saved automatically after each entry.

Reply "menu" to return to main menu.`,
        isComplete: true
      }
    ]
  }
};

/**
 * Process user message based on current session state
 */
async function processMessage(phoneNumber, message) {
  const input = message.trim();
  
  // Handle global commands
  if (input.toLowerCase() === 'menu' || input.toLowerCase() === 'start' || input.toLowerCase() === 'hi' || input.toLowerCase() === 'hello') {
    sessionManager.resetSession(phoneNumber);
    const session = sessionManager.getSession(phoneNumber);
    return await getNextQuestion(session);
  }
  
  if (input.toLowerCase() === 'cancel') {
    sessionManager.resetSession(phoneNumber);
    return 'Operation cancelled. Reply "menu" to start over.';
  }

  const session = sessionManager.getSession(phoneNumber);
  const flow = flows[session.currentFlow];
  
  if (!flow) {
    sessionManager.resetSession(phoneNumber);
    return await getNextQuestion(sessionManager.getSession(phoneNumber));
  }

  const currentStepData = flow.steps[session.currentStep];

  // If this is not the first step, validate and save input
  if (session.currentStep > 0 || session.currentFlow !== 'main') {
    const previousStep = flow.steps[session.currentStep - 1] || flow.steps[session.currentStep];
    
    // Validate input if validator exists
    if (previousStep.validator && !previousStep.validator(input)) {
      return previousStep.errorMessage || 'Invalid input. Please try again.';
    }

    // Process and save input
    if (previousStep.field) {
      const value = previousStep.processor ? previousStep.processor(input) : input.trim();
      session.data[previousStep.field] = value;
    }

    // Handle flow navigation
    if (previousStep.next) {
      const nextFlow = previousStep.next(input);
      sessionManager.updateSession(phoneNumber, {
        currentFlow: nextFlow,
        currentStep: 0,
        data: {}
      });
      return await getNextQuestion(sessionManager.getSession(phoneNumber));
    }
  }

  // Move to next step
  session.currentStep++;
  sessionManager.updateSession(phoneNumber, session);

  return await getNextQuestion(session);
}

/**
 * Get the next question for the user
 */
async function getNextQuestion(session) {
  const flow = flows[session.currentFlow];
  
  if (!flow || session.currentStep >= flow.steps.length) {
    sessionManager.resetSession(session.phoneNumber);
    return await getNextQuestion(sessionManager.getSession(session.phoneNumber));
  }

  const step = flow.steps[session.currentStep];
  
  // Handle dynamic questions (functions)
  if (typeof step.question === 'function') {
    const response = await step.question(session);
    
    // If this step is complete, reset to main menu
    if (step.isComplete) {
      sessionManager.resetSession(session.phoneNumber);
    }
    
    return response;
  }

  return step.question;
}

module.exports = {
  processMessage,
  flows
};
