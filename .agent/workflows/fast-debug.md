---
description: How to perform a rapid debug trace on the HOMEMADE Protein project.
---

1.  **Check Background Output**: Check the server logs for any crashes.
    // turbo
    `cat server/out.txt | tail -n 50`
2.  **Verify Ports**: Check if ports 5000 (Backend) or 3000 (Frontend) are blocked.
    // turbo
    `netstat -ano | findstr :5000; netstat -ano | findstr :3000`
3.  **Audit Data Integrity**: Check if the JSON database files are valid.
    // turbo
    `node -e "try { require('./server/data/menuItems.json'); console.log('✅ DB OK'); } catch(e) { console.error('❌ DB Error', e.message); }"`
4.  **Propose Fix**: Based on the results, provide a minimal fix and a restart command.
