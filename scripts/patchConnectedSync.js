const fs = require('fs');
const path = require('path');

const files = [
  path.resolve(__dirname, '../client/index.html'),
  path.resolve(__dirname, '../index.html'),
  path.resolve(__dirname, '../client/public/index.html')
];

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  console.log(`Patching ${filePath}...`);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Update toggleManualTask to be unified and sync with statusStore and HR
  const oldToggleManualRegex = /function toggleManualTask\s*\(taskId\)\s*\{[\s\S]*?showNotification\(`\$\{task\.done\s*\?\s*'Completed:\s*'\s*:\s*'Reopened:\s*'\}[\s\S]*?;\s*\}/;
  const newToggleManual = `async function toggleManualTask(taskId) {
      const empId = currentAuthenticatedUser?.employeeId || currentLiveEmployeeId || 'E001';
      const statusStore = getTaskStatusStore();
      const currentStatus = statusStore[\`\${empId}_\${taskId}\`];
      let nextStatus = 'Completed';
      if (currentStatus) {
        nextStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
      } else {
        const dash = getSynthesizedDashboardForEmployee(empId);
        const tObj = dash?.tasks?.find(t => String(t.taskId) === String(taskId) || String(t.id) === String(taskId));
        nextStatus = (tObj && tObj.status === 'Completed') ? 'Pending' : 'Completed';
      }

      statusStore[\`\${empId}_\${taskId}\`] = nextStatus;
      saveTaskStatusStore(statusStore);

      const legacyTask = dailyTasksState.find(t => String(t.id) === String(taskId) || String(t.taskId) === String(taskId));
      if (legacyTask) {
        legacyTask.done = (nextStatus === 'Completed');
        saveTasksState();
      }

      await loadLiveEmployeeDashboard(empId);

      const hrPortal = document.getElementById('step-hr-portal');
      if (hrPortal && hrPortal.style.display !== 'none') {
        renderHRTaskInventory();
        renderHRRosterTable();
      }

      showNotification(\`✓ Task #\${taskId}: Marked as \${nextStatus}!\`);
    }`;

  if (oldToggleManualRegex.test(content)) {
    content = content.replace(oldToggleManualRegex, newToggleManual);
    console.log('  Patched toggleManualTask');
  }

  // 2. Update toggleLiveTask to refresh HR roster if HR is loaded
  const oldToggleLiveRegex = /async function toggleLiveTask\s*\(progressId,\s*currentStatus,\s*taskId\)\s*\{[\s\S]*?await loadLiveEmployeeDashboard\(currentLiveEmployeeId\);[\s\S]*?(?=\/\/ 3\. Sync to server)/;
  const newToggleLive = `async function toggleLiveTask(progressId, currentStatus, taskId) {
      const nextStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';

      // 1. Update localStorage status store immediately
      const statusStore = getTaskStatusStore();
      const key = \`\${currentLiveEmployeeId}_\${taskId}\`;
      statusStore[key] = nextStatus;
      saveTaskStatusStore(statusStore);

      showNotification(\`✓ \${taskId}: Marked as \${nextStatus}!\`);

      // 2. Reload employee dashboard
      await loadLiveEmployeeDashboard(currentLiveEmployeeId);

      // Refresh HR view and roster if visible
      const hrPortal = document.getElementById('step-hr-portal');
      if (hrPortal && hrPortal.style.display !== 'none') {
        renderHRTaskInventory();
        renderHRRosterTable();
      }

      `;

  if (oldToggleLiveRegex.test(content)) {
    content = content.replace(oldToggleLiveRegex, newToggleLive);
    console.log('  Patched toggleLiveTask');
  }

  // 3. In toggleTaskStatusFromHR, removeTaskByHR, and handleAddNewTaskByHR: ensure loadLiveEmployeeDashboard is called
  const oldHrToggleRegex = /showNotification\(`✓ Task #\$\{taskId\} updated to \$\{nextStatus\} for \$\{candidateData\.employee\.name\}!`\);\s*renderHRTaskInventory\(\);\s*renderHRRosterTable\(\);\s*\}/;
  const newHrToggle = `showNotification(\`✓ Task #\${taskId} updated to \${nextStatus} for \${candidateData.employee.name}!\`);
      renderHRTaskInventory();
      renderHRRosterTable();
      loadLiveEmployeeDashboard(currentLiveEmployeeId);
    }`;
  if (oldHrToggleRegex.test(content)) {
    content = content.replace(oldHrToggleRegex, newHrToggle);
    console.log('  Patched toggleTaskStatusFromHR');
  }

  const oldHrRemoveRegex = /showNotification\(`🗑️ Task #\$\{taskId\} removed from \$\{candidateData\.employee\.name\}'s checklist\.\`\);\s*renderHRTaskInventory\(\);\s*renderHRRosterTable\(\);\s*\}/;
  const newHrRemove = `showNotification(\`🗑️ Task #\${taskId} removed from \${candidateData.employee.name}'s checklist.\`);
      renderHRTaskInventory();
      renderHRRosterTable();
      loadLiveEmployeeDashboard(currentLiveEmployeeId);
    }`;
  if (oldHrRemoveRegex.test(content)) {
    content = content.replace(oldHrRemoveRegex, newHrRemove);
    console.log('  Patched removeTaskByHR');
  }

  const oldHrAddRegex = /titleInput\.value = '';\s*if \(descInput\) descInput\.value = '';\s*renderHRTaskInventory\(\);\s*renderHRRosterTable\(\);\s*\}/;
  const newHrAdd = `titleInput.value = '';
      if (descInput) descInput.value = '';
      renderHRTaskInventory();
      renderHRRosterTable();
      loadLiveEmployeeDashboard(currentLiveEmployeeId);
    }`;
  if (oldHrAddRegex.test(content)) {
    content = content.replace(oldHrAddRegex, newHrAdd);
    console.log('  Patched handleAddNewTaskByHR');
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Saved ${filePath}`);
});

console.log('All files patched successfully.');
