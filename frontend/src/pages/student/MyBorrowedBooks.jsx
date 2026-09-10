import React, { useEffect, useState } from 'react';
import { borrowApi } from '../../api/borrowApi';
import { getErrorMessage } from '../../api/axios';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Badge from '../../components/common/Badge';

export default function MyBorrowedBooks() {
  const [transactions, setTransactions] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    borrowApi.getMyCurrent()
      .then((res) => setTransactions(res.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <Alert message={error} />;
  if (!transactions) return <Spinner />;

  return (
    <div>
      <h1 className="page-title">My Borrowed Books</h1>
      <p className="page-subtitle">Books currently issued to you.</p>
      <div className="card">
        {transactions.length === 0 ? (
          <p className="empty-state">You have no borrowed books.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Title</th><th>Issue Date</th><th>Due Date</th><th>Status</th><th>Fine</th></tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>{t.bookTitle}</td>
                  <td>{t.issueDate ? new Date(t.issueDate).toLocaleDateString() : '-'}</td>
                  <td>{t.dueDate}</td>
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
