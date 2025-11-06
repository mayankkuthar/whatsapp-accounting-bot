/**
 * Data Storage - In-memory storage for serverless environment
 * For production, replace with a database (MongoDB, PostgreSQL, etc.)
 */
class DataStorage {
  constructor() {
    // Use in-memory storage for serverless compatibility
    this.storage = new Map();
  }

  async saveTransaction(phoneNumber, transaction) {
    try {
      const key = phoneNumber.replace(/[^a-zA-Z0-9]/g, '_');
      
      // Get existing records or create new array
      let records = this.storage.get(key) || [];

      const record = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...transaction
      };

      records.push(record);
      this.storage.set(key, records);
      
      console.log(`Saved transaction for ${key}:`, record);
      return record;
    } catch (error) {
      console.error('Error saving transaction:', error);
      throw error;
    }
  }

  async getTransactions(phoneNumber) {
    try {
      const key = phoneNumber.replace(/[^a-zA-Z0-9]/g, '_');
      const records = this.storage.get(key) || [];
      console.log(`Retrieved ${records.length} transactions for ${key}`);
      return records;
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
