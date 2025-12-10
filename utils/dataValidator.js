// Data validation utilities for transaction consistency

export const validateTransactionData = (transactionData) => {
    const requiredFields = ['userId', 'type', 'category', 'amount', 'date'];
    const validTypes = ['INCOME', 'EXPENSE', 'SAVING', 'TRANSFER'];
    
    // Check required fields
    for (const field of requiredFields) {
        if (!transactionData[field]) {
            throw new Error(`Missing required field: ${field}`);
        }
    }
    
    // Validate transaction type
    if (!validTypes.includes(transactionData.type)) {
        throw new Error(`Invalid transaction type: ${transactionData.type}`);
    }
    
    // Validate amount
    if (typeof transactionData.amount !== 'number' || transactionData.amount <= 0) {
        throw new Error('Amount must be a positive number');
    }
    
    // Validate userId format
    if (typeof transactionData.userId !== 'string' || transactionData.userId.length === 0) {
        throw new Error('Invalid userId format');
    }
    
    return true;
};

export const validateRecurringTransactionData = (recurringData) => {
    const requiredFields = ['userId', 'type', 'category', 'amount', 'frequency', 'nextProcessDate'];
    const validFrequencies = ['MONTHLY', 'WEEKLY', 'YEARLY'];
    
    // Check required fields
    for (const field of requiredFields) {
        if (!recurringData[field]) {
            throw new Error(`Missing required field: ${field}`);
        }
    }
    
    // Validate frequency
    if (!validFrequencies.includes(recurringData.frequency)) {
        throw new Error(`Invalid frequency: ${recurringData.frequency}`);
    }
    
    return validateTransactionData(recurringData);
};

export const sanitizeTransactionData = (data) => {
    return {
        userId: String(data.userId).trim(),
        type: String(data.type).toUpperCase(),
        category: String(data.category).trim(),
        amount: Number(data.amount),
        date: data.date,
        description: data.description ? String(data.description).trim() : '',
        groupId: data.groupId || null,
        walletId: data.walletId || null
    };
};