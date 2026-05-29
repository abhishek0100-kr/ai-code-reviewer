const sampleCode = `
function handleData(users) {
  let adminFound = false;
  for (let i = 0; i < users.length; i++) {
    if (users[i].role == "admin") {
      adminFound = true;
      eval(users[i].action); // Dangerous line!
    }
  }
}
`;

fetch('http://localhost:5000/api/review', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: sampleCode })
})
.then(res => res.json())
.then(data => console.log("SUCCESS! AI Response Structure:\n", JSON.stringify(data, null, 2)))
.catch(err => console.error("Testing Failed:", err));