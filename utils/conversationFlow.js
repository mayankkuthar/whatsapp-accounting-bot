const sessionManager = require('./sessionManager');
const dataStorage = require('./dataStorage');

/**
 * Conversation Flows - Defines Q&A flows for data capture
 */
const flows = {
  // Language selection - First screen
  languageSelection: {
    steps: [
      {
        question: `Hello 👋! Welcome to A Kira Shop Daily Tracker 📊

Please select your language:
ଆପଣଙ୍କର ଭାଷା ବାଛନ୍ତୁ:

1️⃣ English
2️⃣ Odia (ଓଡ଼ିଆ)

Reply with the number of your choice.`,
        validator: (input) => /^[1-2]$/.test(input.trim()),
        errorMessage: 'Please reply 1 for English or 2 for Odia.\nEnglish କିମ୍ବା Odia ପାଇଁ 1 କିମ୍ବା 2 ଉତ୍ତର ଦିଅନ୍ତୁ।',
        next: (input) => {
          const choice = input.trim();
          // Store language preference in session
          return choice === '1' ? 'main_en' : 'main_od';
        }
      }
    ]
  },

  // Main menu - English
  main_en: {
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
            '1': 'dailySales_en',
            '2': 'summary_en',
            '3': 'recent_en',
            '4': 'help_en'
          };
          return flowMap[choice];
        }
      }
    ]
  },

  // Main menu - Odia
  main_od: {
    steps: [
      {
        question: `ନମସ୍କାର 👋!
ଏ କିରା ଦୁକାନ ଦୈନିକ ଟ୍ର୍ୟାକର୍‌କୁ ସ୍ୱାଗତ 📊

ଆପଣ କଣ କରିବାକୁ ଚାହୁଁଛନ୍ତି?

1️⃣ ଆଜିର ବିକ୍ରୀ ରେକର୍ଡ କରନ୍ତୁ
2️⃣ ସାରାଂଶ ଦେଖନ୍ତୁ
3️⃣ ସାମ୍ପ୍ରତିକ ରେକର୍ଡ ଦେଖନ୍ତୁ
4️⃣ ସହାୟତା

ସଂଖ୍ୟା ଉତ୍ତର ଦିଅନ୍ତୁ।`,
        validator: (input) => /^[1-4]$/.test(input.trim()),
        errorMessage: '1 ରୁ 4 ମଧ୍ୟରେ ଏକ ସଂଖ୍ୟା ଉତ୍ତର ଦିଅନ୍ତୁ।',
        next: (input) => {
          const choice = input.trim();
          const flowMap = {
            '1': 'dailySales_od',
            '2': 'summary_od',
            '3': 'recent_od',
            '4': 'help_od'
          };
          return flowMap[choice];
        }
      }
    ]
  },

  // Daily Sales recording flow - English
  dailySales_en: {
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
            amount: sales, // Add amount field for compatibility
            description: `Daily shop record for ${date}`
          };
          
          await dataStorage.saveTransaction(session.phoneNumber, data);
          
          console.log('Data saved:', data); // Debug log
          
          return `Here's your summary for ${date} 🧾\n\nTotal Sales: ₹${sales.toFixed(2)}\nInventory Cost: ₹${inventoryCost.toFixed(2)}\nOther Expenses: ₹${expenses.toFixed(2)}\n\n📊 Profit / Loss Calculation:\nProfit = Sales - (Inventory Cost + Expenses)\n\n➡️ Net Profit: ₹${profit.toFixed(2)}\n💹 Profit Margin: ${margin.toFixed(2)}%\n\n💡 Here's what your numbers mean today 👇\n${insight}\n\n✅ Your daily record has been saved.\n\nReply "menu" to return to main menu.`;
        },
        isComplete: true
      }
    ]
  },

  // Daily Sales recording flow - Odia
  dailySales_od: {
    steps: [
      {
        question: "ଆସନ୍ତୁ ଆଜିର ଦୁକାନ ସାରାଂଶ ରେକର୍ଡ କରିବା।\n\nଆଜିର ମୁଟ ବିକ୍ରୀ (₹) ଲିଖନ୍ତୁ:",
        field: 'sales',
        validator: (input) => /^\d+(\.\d{1,2})?$/.test(input.trim()),
        errorMessage: 'ଦୟାକରି ଏକ ବୈଧ ରାଶି ଲିଖନ୍ତୁ (ଉଦା: 5000 କିମ୍ବା 5000.50)'
      },
      {
        question: "ଧନ୍ୟବାଦ! ଏବେ ଆଜିର ମୁଟ ଇନ୍ଭେଣ୍ଟରୀ ଖରଚ (₹) ଲିଖନ୍ତୁ —\n(ଅର୍ଥାତ୍ ଆଜି ବିକ୍ରି ହୋଇଥିବା ଉତ୍ପାଦର ମୁଟ ଖରଚ):",
        field: 'inventoryCost',
        validator: (input) => /^\d+(\.\d{1,2})?$/.test(input.trim()),
        errorMessage: 'ଦୟାକରି ଏକ ବୈଧ ରାଶି ଲିଖନ୍ତୁ (ଉଦା: 3000)'
      },
      {
        question: 'ଠିକ ଅଛି ✅\nଏବେ ଆଜିର ଅନ୍ୟ ଖରଚ (₹) ଲିଖନ୍ତୁ (ଯଥା ଭାଡ଼ା, କର୍ମଚାରୀ, ବିଦ୍ୟୁତ୍)\nଯଦି ନାହିଁ, 0 ଲିଖନ୍ତୁ:',
        field: 'expenses',
        validator: (input) => /^\d+(\.\d{1,2})?$/.test(input.trim()),
        errorMessage: 'ଦୟାକରି ଏକ ବୈଧ ରାଶି କିମ୍ବା 0 ଲିଖନ୍ତୁ'
      },
      {
        question: async (session) => {
          const sales = parseFloat(session.data.sales);
          const inventoryCost = parseFloat(session.data.inventoryCost);
          const expenses = parseFloat(session.data.expenses);
          const profit = sales - (inventoryCost + expenses);
          const margin = sales > 0 ? (profit / sales * 100) : 0;
          const date = new Date().toISOString().split('T')[0];

          // Generate insights in Odia
          let insight = '';
          if (profit > 0) {
            if (margin > 30) {
              insight = '🟢 ବହୁତ ଭଲ! ଏହିପରି ଚାଲୁ ରଖନ୍ତୁ 👍';
            } else if (margin >= 10) {
              insight = '🟡 ଭଲ କାମ, କିନ୍ତୁ ଖରଚ ସମୀକ୍ଷା କରନ୍ତୁ।';
            } else {
              insight = '🔻 ଅଧିକ ଖରଚ ପାଇଲା। ଉତ୍ପାଦ ମୂଲ୍ୟ ଯାଞ୍ଚ କରନ୍ତୁ।';
            }
          } else {
            insight = "🔴 ଆଜି ଆପଣ ଠିକ୍ରେ ଅଛନ୍ତି। ଦୟାକରି ଆପଣଙ୍କ ମୂଲ୍ୟ ଓ ଖରଚ ପୁଣି ପରୀକ୍ଷା କରନ୍ତୁ।";
          }

          const data = {
            type: 'dailySales',
            category: 'Shop Daily Record',
            date: date,
            sales: sales,
            inventoryCost: inventoryCost,
            expenses: expenses,
            profit: profit,
            margin: margin.toFixed(2),
            amount: sales,
            description: `Daily shop record for ${date}`
          };
          
          await dataStorage.saveTransaction(session.phoneNumber, data);
          
          return `${date} ତାରିଖ ପାଇଁ ଆପଣଙ୍କ ସାରାଂଶ 🧾

ମୁଟ ବିକ୍ରୀ: ₹${sales.toFixed(2)}
ଇନ୍ଭେଣ୍ଟରୀ ଖରଚ: ₹${inventoryCost.toFixed(2)}
ଅନ୍ୟ ଖରଚ: ₹${expenses.toFixed(2)}

📊 ଲାଭ/ଠିକ୍ ଗଣନା:
ଲାଭ = ବିକ୍ରୀ - (ଇନ୍ଭେଣ୍ଟରୀ + ଖରଚ)

➡️ ନେଟ ଲାଭ: ₹${profit.toFixed(2)}
💹 ଲାଭ ମାର୍ଜିନ: ${margin.toFixed(2)}%

💡 ଆଜିର ଅର୍ଥ 👇
${insight}

✅ ଆପଣଙ୍କ ଦୈନିକ ରେକର୍ଡ ସେଭ ହୋଇଗଲା।

ମୁଖ୍ୟ ମେନୁକୁ ଫିରିବା ପାଇଁ "menu" ଉତ୍ତର ଦିଅନ୍ତୁ।`;
        },
        isComplete: true
      }
    ]
  },

  // Summary view - English
  summary_en: {
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

  // Summary view - Odia
  summary_od: {
    steps: [
      {
        question: async (session) => {
          const transactions = await dataStorage.getTransactions(session.phoneNumber);
          const dailyRecords = transactions.filter(t => t.type === 'dailySales');
          
          if (dailyRecords.length === 0) {
            return '📊 ଏ କିରା ଦୁକାନ ସାରାଂଶ\n\nଏବେ ଯାଏଁ କୌଣସି ଦୈନିକ ରେକର୍ଡ ପାଇଲା ନାହିଁ।\n\nମୁଖ୍ୟ ମେନୁକୁ ଫିରିବା ପାଇଁ "menu" ଉତ୍ତର ଦିଅନ୍ତୁ।';
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

          let message = `📊 ଏ କିରା ଦୁକାନ ସାରାଂଶ\n\n`;
          message += `ମୁଟ ରେକର୍ଡ: ${dailyRecords.length} ଦିନ\n\n`;
          message += `ମୁଟ ବିକ୍ରୀ: ₹${totalSales.toFixed(2)}\n`;
          message += `ମୁଟ ଇନ୍ଭେଣ୍ଟରୀ ଖରଚ: ₹${totalInventoryCost.toFixed(2)}\n`;
          message += `ମୁଟ ଅନ୍ୟ ଖରଚ: ₹${totalExpenses.toFixed(2)}\n\n`;
          message += `➡️ ନେଟ ଲାଭ: ₹${totalProfit.toFixed(2)}\n`;
          message += `💹 ଗଡ଼ ମାର୍ଜିନ: ${avgMargin.toFixed(2)}%\n\n`;
          
          if (totalProfit > 0) {
            message += '🟢 ସମଗ୍ର: ଲାଭଜନକ';
          } else {
            message += '🔴 ସମଗ୍ର: ଠିକ୍‌ରେ';
          }
          
          message += '\n\nମୁଖ୍ୟ ମେନୁକୁ ଫିରିବା ପାଇଁ "menu" ଉତ୍ତର ଦିଅନ୍ତୁ।';
          return message;
        },
        isComplete: true
      }
    ]
  },

  // Recent transactions - English
  recent_en: {
    steps: [
      {
        question: async (session) => {
          const transactions = await dataStorage.getTransactions(session.phoneNumber);
          console.log('All transactions:', transactions); // Debug log
          const dailyRecords = transactions.filter(t => t.type === 'dailySales');
          console.log('Daily records:', dailyRecords); // Debug log
          
          let message = `📝 Recent Daily Records\n\n`;
          
          if (dailyRecords.length === 0) {
            message += `No records found yet.\n`;
          } else {
            dailyRecords.slice(-5).reverse().forEach((r, idx) => {
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

  // Recent transactions - Odia
  recent_od: {
    steps: [
      {
        question: async (session) => {
          const transactions = await dataStorage.getTransactions(session.phoneNumber);
          console.log('All transactions:', transactions);
          const dailyRecords = transactions.filter(t => t.type === 'dailySales');
          console.log('Daily records:', dailyRecords);
          
          let message = `📝 ସାମ୍ପ୍ରତିକ ଦୈନିକ ରେକର୍ଡ\n\n`;
          
          if (dailyRecords.length === 0) {
            message += `ଏବେ ଯାଏଁ ରେକର୍ଡ ପାଇଲା ନାହିଁ।\n`;
          } else {
            dailyRecords.slice(-5).reverse().forEach((r, idx) => {
              message += `${idx + 1}. ${r.date}\n`;
              message += `   ବିକ୍ରୀ: ₹${r.sales} | ଲାଭ: ₹${r.profit}\n`;
              message += `   ମାର୍ଜିନ: ${r.margin}%\n\n`;
            });
          }
          
          message += `ମୁଖ୍ୟ ମେନୁକୁ ଫିରିବା ପାଇଁ "menu" ଉତ୍ତର ଦିଅନ୍ତୁ।`;
          return message;
        },
        isComplete: true
      }
    ]
  },

  // Help - English
  help_en: {
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
  },

  // Help - Odia
  help_od: {
    steps: [
      {
        question: `📖 ସହାୟତା ଓ ସୂଚନା

ଏହି ବଟ ଆପଣଙ୍କୁ ଏ କିରା ଦୁକାନ ପାଇଁ ଦୈନିକ ବିକ୍ରୀ ଟ୍ର୍ୟାକ କରିବାରେ ସାହାଯ୍ୟ କରେ।

ଉପଲବ୍ଧ ବୈଶିଷ୍ଟ୍ୟ:
• ଆଜିର ବିକ୍ରୀ ରେକର୍ଡ କରନ୍ତୁ - ଦୈନିକ ବିକ୍ରୀ, ଖରଚ ଓ ଲାଭ ଲିପିବଦ୍ଧ କରନ୍ତୁ
• ସାରାଂଶ ଦେଖନ୍ତୁ - ଦୁକାନର ସମଗ୍ର କାର୍ଯ୍ୟ ଦେଖନ୍ତୁ
• ସାମ୍ପ୍ରତିକ ରେକର୍ଡ - ସର୍ବଶେଷ ନିବେଶ ଦେଖନ୍ତୁ

ଆଦେଶ:
• "menu" - ମୁଖ୍ୟ ମେନୁକୁ ଫିରନ୍ତୁ
• "cancel" - ବର୍ତ୍ତମାନ କାର୍ଯ୍ୟ ବାତିଲ କରନ୍ତୁ

ପ୍ରତିଟି ନିବେଶ ପରେ ସ୍ୱୟଂଚାଳିତ ଭାବରେ ସେଭ ହୁଏ।

ମୁଖ୍ୟ ମେନୁକୁ ଫିରିବା ପାଇଁ "menu" ଉତ୍ତର ଦିଅନ୍ତୁ।`,
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
    // Start with language selection
    session.currentFlow = 'languageSelection';
    session.currentStep = 0;
    sessionManager.updateSession(phoneNumber, session);
    return await getNextQuestion(session);
  }
  
  if (input.toLowerCase() === 'cancel') {
    sessionManager.resetSession(phoneNumber);
    return 'Operation cancelled. Reply "menu" to start over.';
  }

  const session = sessionManager.getSession(phoneNumber);
  const flow = flows[session.currentFlow];
  
  console.log(`Processing: input="${input}", flow="${session.currentFlow}", step=${session.currentStep}`);
  
  if (!flow) {
    sessionManager.resetSession(phoneNumber);
    return await getNextQuestion(sessionManager.getSession(phoneNumber));
  }

  const currentStep = flow.steps[session.currentStep];
  console.log(`Current step has: field="${currentStep.field}", hasNext=${!!currentStep.next}, hasValidator=${!!currentStep.validator}`);

  // Handle flow navigation (e.g., main menu selection)
  if (currentStep && currentStep.next) {
    console.log('Handling flow navigation');
    // Validate input if validator exists
    if (currentStep.validator && !currentStep.validator(input)) {
      console.log('Validation failed for flow navigation');
      return currentStep.errorMessage || 'Invalid input. Please try again.';
    }
    
    const nextFlow = currentStep.next(input);
    console.log(`Navigating to flow: ${nextFlow}`);
    sessionManager.updateSession(phoneNumber, {
      currentFlow: nextFlow,
      currentStep: 0,
      data: {}
    });
    return await getNextQuestion(sessionManager.getSession(phoneNumber));
  }

  // Validate and save the current step's input
  if (currentStep) {
    // Validate input if validator exists
    if (currentStep.validator && !currentStep.validator(input)) {
      console.log(`Validation failed: ${input}`);
      return currentStep.errorMessage || 'Invalid input. Please try again.';
    }

    // Process and save input
    if (currentStep.field) {
      const value = currentStep.processor ? currentStep.processor(input) : input.trim();
      session.data[currentStep.field] = value;
      console.log(`Saved: ${currentStep.field} = ${value}`);
    }
  }

  // Move to next step
  session.currentStep++;
  sessionManager.updateSession(phoneNumber, session);
  console.log(`Moving to step ${session.currentStep}`);

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
