import React, { useEffect, useState } from 'react';
import { borrowApi } from '../../api/borrowApi';
import { getErrorMessage } from '../../api/axios';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Badge from '../../components/common/Badge';

export default function BorrowingHistory() {
  const [transactions, setTransactions] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    borrowApi.getMyHistory()
      .then((res) => setTransactions(res.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <Alert message={error} />;
  if (!transactions) return <Spinner />;

  return (
    <div>
      <h1 className="page-title">Borrowing History</h1>
      <p className="page-subtitle">All your past and current borrow requests.</p>
      <div className="card">
        {transactions.length === 0 ? (
          <p className="empty-state">No borrowing history yet.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Title</th><th>Requested</th><th>Due Date</th><th>Returned</th><th>Status</th><th>Fine</th></tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>{t.bookTitle}</td>
                  <td>{new Date(t.requestDate).toLocaleDateString()}</td>
                  <td>{t.dueDate || '-'}</td>
                  <td>{t.returnDate ? new Date(t.returnDate).toLocaleDateString() : '-'}</td>
                  <td><Badge status={t.status} /></td>
                  <td>₹{t.fineAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
