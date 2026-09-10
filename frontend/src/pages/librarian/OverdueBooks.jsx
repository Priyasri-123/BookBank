import React, { useEffect, useState } from 'react';
import { borrowApi } from '../../api/borrowApi';
import { getErrorMessage } from '../../api/axios';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Badge from '../../components/common/Badge';

export default function OverdueBooks() {
  const [transactions, setTransactions] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => {
    borrowApi.getOverdue()
      .then((res) => setTransactions(res.data))
      .catch((err) => setError(getErrorMessage(err)));
  };

  useEffect(load, []);

  const handleReturn = async (id) => {
    setError('');
    setSuccess('');
    try {
      await borrowApi.returnBook(id);
      setSuccess('Marked as returned.');
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (error && !transactions) return <Alert message={error} />;
  if (!transactions) return <Spinner />;

  return (
    <div>
      <h1 className="page-title">Overdue Books</h1>
      <p className="page-subtitle">Books past their due date and accruing fines.</p>

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      <div className="card">
        {transactions.length === 0 ? (
          <p className="empty-state">No overdue books right now. 🎉</p>
        ) : (
          <table>
            <thead><tr><th>Student</th><th>Book</th><th>Due Date</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>{t.userName}</td>
                  <td>{t.bookTitle}</td>
                  <td>{t.dueDate}</td>
                  <td><Badge status={t.status} /></td>
                  <td>
                    <button className="btn btn-accent btn-sm" onClick={() => handleReturn(t.id)}>Mark Returned</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
