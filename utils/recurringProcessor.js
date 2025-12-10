import { DB, AUTH } from '../firebaseConfig';
import { collection, query, where, getDocs, runTransaction, doc, addDoc, serverTimestamp } from 'firebase/firestore';

const calculateNextExecutionDate = (currentDate, frequency) => {
    const date = new Date(currentDate);
    
    if (frequency === 'monthly') {
        date.setMonth(date.getMonth() + 1);
    } else if (frequency === 'weekly') {
        date.setDate(date.getDate() + 7);
    } else if (frequency === 'yearly') {
        date.setFullYear(date.getFullYear() + 1);
    }
    return date;
};

export const checkAndProcessRecurringTransactions = async () => {
    if (!AUTH.currentUser) return;

    try {
        const today = new Date();
        const userId = AUTH.currentUser.uid;
        
        const schedulesQ = query(
            collection(DB, "recurringSchedules"),
            where("userId", "==", userId),
            where("isActive", "==", true)
        );
        const schedulesSnapshot = await getDocs(schedulesQ);
        
        let processedCount = 0;

        for (const scheduleDoc of schedulesSnapshot.docs) {
            const schedule = scheduleDoc.data();
            const scheduleRef = scheduleDoc.ref;
            
            const nextExecutionDate = schedule.nextExecutionDate.toDate ? 
                schedule.nextExecutionDate.toDate() : 
                new Date(schedule.nextExecutionDate);

            if (nextExecutionDate <= today) {
                await runTransaction(DB, async (transaction) => {
                    const newTransaction = {
                        type: schedule.type,
                        amount: schedule.type === 'expense' ? -Math.abs(schedule.amount) : Math.abs(schedule.amount),
                        description: `(Тогтмол) ${schedule.description}`,
                        category: schedule.category,
                        userId: schedule.userId,
                        date: today.getTime(),
                        groupId: schedule.groupId || null,
                        recurrence: schedule.frequency,
                        createdAt: serverTimestamp(),
                    };
                    
                    const newTransRef = doc(collection(DB, "transactions"));
                    transaction.set(newTransRef, newTransaction);
                    
                    const nextDate = calculateNextExecutionDate(nextExecutionDate, schedule.frequency);
                    transaction.update(scheduleRef, {
                        nextExecutionDate: nextDate,
                        lastExecuted: today,
                    });

                    processedCount++;
                });
            }
        }
        
        if (processedCount > 0) {
            console.log(`Processed ${processedCount} recurring transactions`);
        }

    } catch (error) {
        console.error("Recurring Transaction Processing failed: ", error);
    }
};