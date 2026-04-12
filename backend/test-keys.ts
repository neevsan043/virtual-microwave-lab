const keys = [
  'AIzaSyANhACUlXuJfgnlaBnp7SLkNUoWcN3ldlY',
  'AIzaSyAm_1RdGe34tXiSlsQWgsKKa_z3Tqh7joI',
  'AIzaSyCsZKvCT-2gYsaI3aNJuQf_KUOsdzQHEng',
  'AIzaSyChBw8L0U9-LGbmLQ9iBrlfVUVXYhNGw3o'
];

async function check() {
  for (let i = 0; i < keys.length; i++) {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + keys[i], {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ contents: [{ parts: [{text: 'hello'}]}] })
    });
    const json = await res.json();
    console.log('Key', i+1, 'Status:', res.status, 'Message:', json.error?.message || 'Success');
  }
}
check();
