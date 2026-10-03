
// Authoritative Tasks Client Loader & Runtime Cache
(function() {
  window.TASK_CACHE = {};
  
  // Asynchronously loads tasks for any position with instantaneous caching
  window.loadAuthoritativeTasksForPositionAsync = async function(posId, roleLevel, deptName, teamName) {
    if (!posId && !roleLevel) return [];
    
    // Check in-memory cache
    if (posId && window.TASK_CACHE[posId]) {
      return window.TASK_CACHE[posId];
    }
    
    // Check window.AUTHORITATIVE_TASKS_BY_POSITION if already loaded
    if (window.AUTHORITATIVE_TASKS_BY_POSITION) {
      if (posId && window.AUTHORITATIVE_TASKS_BY_POSITION[posId]) {
        window.TASK_CACHE[posId] = window.AUTHORITATIVE_TASKS_BY_POSITION[posId].tasks;
        return window.TASK_CACHE[posId];
      }
      if (window.getAuthoritativeTasksForPosition) {
        var found = window.getAuthoritativeTasksForPosition(posId, roleLevel, deptName, teamName);
        if (found && found.length > 0) {
          if (posId) window.TASK_CACHE[posId] = found;
          return found;
        }
      }
    }
    
    // Fetch individual position file directly (2ms, ~35KB)
    if (posId) {
      try {
        var res = await fetch('/data/tasks/' + posId + '.json');
        if (res.ok) {
          var data = await res.json();
          if (data && data.tasks) {
            window.TASK_CACHE[posId] = data.tasks;
            return data.tasks;
          }
        }
      } catch (e) {
        // Fallback to API if static fetch fails
      }
      
      // Try Backend API
      try {
        var apiBase = (window.location.port === '3000') ? '' : 'http://localhost:5001';
        var apiRes = await fetch(apiBase + '/api/v1/org/positions/' + posId + '/tasks');
        if (apiRes.ok) {
          var apiData = await apiRes.json();
          if (apiData && apiData.tasks) {
            window.TASK_CACHE[posId] = apiData.tasks;
            return apiData.tasks;
          }
        }
      } catch (err) {
        console.warn('API fetch for tasks failed:', err);
      }
    }
    
    return [];
  };
})();
