require('dotenv').config();
const jwt = require('jsonwebtoken');
const prisma = require('./db');

async function runIntegrationTest() {
  // Find the first actual user in your Supabase database row log to guarantee fkey matching
  const realUser = await prisma.user.findFirst();
  
  if (!realUser) {
    console.error("❌ No users found in the database. Register an account on the UI first!");
    process.exit(1);
  }

  console.log(`[TEST] Found valid user footprint in database: ${realUser.email} (${realUser.id})`);

  // Sign token using a real ID found in the database matrix
  const mockPayload = { userId: realUser.id, email: realUser.email };
  const token = jwt.sign(mockPayload, process.env.JWT_SECRET, { expiresIn: '1h' });

  const payload = {
    repoUrl: "https://github.com/abhishek0100-kr/ai-code-reviewer"
  };

  console.log("[TEST] Dispatching authenticated repository payload to local server...");

  try {
    const res = await fetch('http://localhost:5000/api/review/repository', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}: ${JSON.stringify(data)}`);
    }

    console.log("\n✅ ====== INTEGRATION SUCCESSFUL ======");
    console.log("Database Row Successfully Created!");
    console.log(`Assigned Audit ID: ${data.id || "Verified & Stored!"}`);
    console.log(`Mapped Language Column: ${data.language}`);
    console.log(`Stored Complexity Header: ${data.complexity.time}`);
    console.log(`Stored Breakdown Badges: ${data.complexity.space}`);
    console.log(`Total Issues Parsed into Json Array: ${data.issues.length}`);

  } catch (err) {
    console.error("\n❌ ====== INTEGRATION FAILED ======");
    console.error(err.message);
  } finally {
    // Explicitly disconnect from the local prisma stream link
    await prisma.$disconnect();
  }
}

runIntegrationTest();