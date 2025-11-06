const fs = require('fs');
const path = require('path');

/**
 * Data Storage - Simple JSON file-based storage
 * For production, replace with a database
 */
class DataStorage {
  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    this.ensureDataDir();
  }

  ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  async saveTransaction(phoneNumber, transaction) {
    try {
      const fileName = `${phoneNumber.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
      const filePath = path.join(this.dataDir, fileName);
      
      let records = [];
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        records = JSON.parse(content);
      }

      const record = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...transaction
      };

      records.push(record);
      fs.writeFileSync(filePath, JSON.stringify(records, null, 2));
      
      return record;
    } catch (error) {
      console.error('Error saving transaction:', error);
      throw error;
    }
  }

  async getTransactions(phoneNumber) {
    try {
      const fileName = `${phoneNumber.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
      const filePath = path.join(this.dataDir, fileName);
      
      if (!fs.existsSync(filePath)) {
        return [];
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Error reading transactions:', error);
      return [];
    }
  }

  async getSummary(phoneNumber) {
    const transactions = await this.getTransactions(phoneNumber);
    
    const summary = {
      totalIncome: 0,
      totalExpense: 0,
      count: transactions.length,
      byCategory: {},
      recent: transactions.slice(-5).reverse()
    };

    transactions.forEach(t => {
      if (t.type === 'income') {
        summary.totalIncome += parseFloat(t.amount || 0);
      } else if (t.type === 'expense') {
        summary.totalExpense += parseFloat(t.amount || 0);
      }

      const category = t.category || 'uncategorized';
      if (!summary.byCategory[category]) {
        summary.byCategory[category] = { count: 0, total: 0 };
      }
      summary.byCategory[category].count++;
      summary.byCategory[category].total += parseFloat(t.amount || 0);
    });

    summary.netProfit = summary.totalIncome - summary.totalExpense;

    return summary;
  }
}

module.exports = new DataStorage();
