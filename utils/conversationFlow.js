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
        question: `Welcome to Accounting Bot! 📊

What would you like to do?

1️⃣ Record Income
2️⃣ Record Expense
3️⃣ Record Invoice
4️⃣ View Summary
5️⃣ View Recent Transactions
6️⃣ Help

Reply with the number of your choice.`,
        validator: (input) => /^[1-6]$/.test(input.trim()),
        errorMessage: 'Please reply with a number from 1 to 6.',
        next: (input) => {
          const choice = input.trim();
          const flowMap = {
            '1': 'income',
            '2': 'expense',
            '3': 'invoice',
            '4': 'summary',
            '5': 'recent',
            '6': 'help'
          };
          return flowMap[choice];
        }
      }
    ]
  },

  // Income recording flow
  income: {
    steps: [
      {
        question: '💰 Record Income\n\nWhat is the amount? (e.g., 1500.00)',
        field: 'amount',
        validator: (input) => /^\d+(\.\d{1,2})?$/.test(input.trim()),
        errorMessage: 'Please enter a valid amount (e.g., 1500.00)'
      },
      {
        question: 'What is the source of this income? (e.g., Sales, Service, Investment)',
        field: 'category'
      },
      {
        question: 'Please provide a brief description:',
        field: 'description'
      },
      {
        question: 'Date of transaction? (YYYY-MM-DD or "today")',
        field: 'date',
        validator: (input) => {
          if (input.toLowerCase() === 'today') return true;
          return /^\d{4}-\d{2}-\d{2}$/.test(input.trim());
        },
        errorMessage: 'Please enter date as YYYY-MM-DD or "today"',
        processor: (input) => input.toLowerCase() === 'today' ? new Date().toISOString().split('T')[0] : input.trim()
      },
      {
        question: async (session) => {
          const data = {
            type: 'income',
            ...session.data
          };
          
          await dataStorage.saveTransaction(session.phoneNumber, data);
          
          return `✅ Income Recorded Successfully!

Amount: $${data.amount}
Category: ${data.category}
Description: ${data.description}
Date: ${data.date}

Reply "menu" to return to main menu or record another transaction.`;
        },
        isComplete: true
      }
    ]
  },

  // Expense recording flow
  expense: {
    steps: [
      {
        question: '💸 Record Expense\n\nWhat is the amount? (e.g., 250.50)',
        field: 'amount',
        validator: (input) => /^\d+(\.\d{1,2})?$/.test(input.trim()),
        errorMessage: 'Please enter a valid amount (e.g., 250.50)'
      },
      {
        question: 'What category is this expense? (e.g., Rent, Utilities, Supplies, Salary)',
        field: 'category'
      },
      {
        question: 'Please provide a brief description:',
        field: 'description'
      },
      {
        question: 'Date of transaction? (YYYY-MM-DD or "today")',
        field: 'date',
        validator: (input) => {
          if (input.toLowerCase() === 'today') return true;
          return /^\d{4}-\d{2}-\d{2}$/.test(input.trim());
        },
        errorMessage: 'Please enter date as YYYY-MM-DD or "today"',
        processor: (input) => input.toLowerCase() === 'today' ? new Date().toISOString().split('T')[0] : input.trim()
      },
      {
        question: async (session) => {
          const data = {
            type: 'expense',
            ...session.data
          };
          
          await dataStorage.saveTransaction(session.phoneNumber, data);
          
          return `✅ Expense Recorded Successfully!

Amount: $${data.amount}
Category: ${data.category}
Description: ${data.description}
Date: ${data.date}

Reply "menu" to return to main menu.`;
        },
        isComplete: true
      }
    ]
  },

  // Invoice recording flow
  invoice: {
    steps: [
      {
        question: '🧾 Record Invoice\n\nWhat is the invoice amount? (e.g., 3500.00)',
        field: 'amount',
        validator: (input) => /^\d+(\.\d{1,2})?$/.test(input.trim()),
        errorMessage: 'Please enter a valid amount (e.g., 3500.00)'
      },
      {
        question: 'Client/Customer name:',
        field: 'client'
      },
      {
        question: 'Invoice number:',
        field: 'invoiceNumber'
      },
      {
        question: 'Service/Product description:',
        field: 'description'
      },
      {
        question: 'Invoice date? (YYYY-MM-DD or "today")',
        field: 'date',
        validator: (input) => {
          if (input.toLowerCase() === 'today') return true;
          return /^\d{4}-\d{2}-\d{2}$/.test(input.trim());
        },
        errorMessage: 'Please enter date as YYYY-MM-DD or "today"',
        processor: (input) => input.toLowerCase() === 'today' ? new Date().toISOString().split('T')[0] : input.trim()
      },
      {
        question: 'Payment status? (paid/pending/overdue)',
        field: 'status',
        validator: (input) => /^(paid|pending|overdue)$/i.test(input.trim()),
        errorMessage: 'Please enter: paid, pending, or overdue',
        processor: (input) => input.trim().toLowerCase()
      },
      {
        question: async (session) => {
          const data = {
            type: 'invoice',
            category: 'Invoice',
            ...session.data
          };
          
          await dataStorage.saveTransaction(session.phoneNumber, data);
          
          return `✅ Invoice Recorded Successfully!

Invoice #: ${data.invoiceNumber}
Client: ${data.client}
Amount: $${data.amount}
Description: ${data.description}
Date: ${data.date}
Status: ${data.status}

Reply "menu" to return to main menu.`;
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
          const summary = await dataStorage.getSummary(session.phoneNumber);
          
          let message = `📊 Financial Summary\n\n`;
          message += `Total Income: $${summary.totalIncome.toFixed(2)}\n`;
          message += `Total Expenses: $${summary.totalExpense.toFixed(2)}\n`;
          message += `Net Profit: $${summary.netProfit.toFixed(2)}\n`;
          message += `Total Transactions: ${summary.count}\n\n`;
          
          if (Object.keys(summary.byCategory).length > 0) {
            message += `By Category:\n`;
            for (const [category, data] of Object.entries(summary.byCategory)) {
              message += `  • ${category}: $${data.total.toFixed(2)} (${data.count} transactions)\n`;
            }
          }
          
          message += `\nReply "menu" to return to main menu.`;
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
          const summary = await dataStorage.getSummary(session.phoneNumber);
          
          let message = `📝 Recent Transactions\n\n`;
          
          if (summary.recent.length === 0) {
            message += `No transactions recorded yet.\n`;
          } else {
            summary.recent.forEach((t, idx) => {
              message += `${idx + 1}. ${t.type.toUpperCase()} - $${t.amount}\n`;
              message += `   ${t.category} - ${t.description}\n`;
              message += `   Date: ${t.date}\n\n`;
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

This bot helps you capture accounting data for your business through simple Q&A.

Available Features:
• Record Income - Track money coming in
• Record Expense - Track money going out
• Record Invoice - Manage customer invoices
• View Summary - See financial overview
• Recent Transactions - View latest entries

Commands:
• "menu" - Return to main menu
• "cancel" - Cancel current operation
• "help" - Show this help

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
  if (input.toLowerCase() === 'menu' || input.toLowerCase() === 'start') {
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
