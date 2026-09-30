const fs = require('fs');

const css = `
/* Day Filter Pills & Badges */
.day-filter-bar {
  display: inline-flex;
  gap: 4px;
  background: #f1f5f9;
  padding: 4px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-slate-200);
}
.btn-day-pill {
  padding: 5px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  font-weight: 700;
  border: 1px solid transparent;
  background: transparent;
  color: var(--color-slate-600);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.btn-day-pill:hover {
  color: var(--color-slate-900);
  background: rgba(255, 255, 255, 0.6);
}
.btn-day-pill.active {
  background: #ffffff;
  color: #2563eb;
  border-color: rgba(37, 99, 235, 0.25);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.manual-task-day-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  background: #eff6ff;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}
.btn-sm-action {
  padding: 5px 12px;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 6px;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.btn-sm-toggle {
  padding: 4px 10px;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 6px;
  cursor: pointer;
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
  transition: all var(--transition-fast);
}
.btn-sm-toggle:hover {
  background: #dbeafe;
}
`;

['styles.css', 'client/styles.css', 'client/public/styles.css'].forEach(f => {
  if (fs.existsSync(f)) {
    fs.appendFileSync(f, '\n' + css, 'utf8');
    console.log('Appended styles to ' + f);
  }
});
