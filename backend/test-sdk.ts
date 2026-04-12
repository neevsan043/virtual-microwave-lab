import { GoogleGenAI } from '@google/genai';

const keys = [
  'AIzaSyANhACUlXuJfgnlaBnp7SLkNUoWcN3ldlY',
  'AIzaSyAm_1RdGe34tXiSlsQWgsKKa_z3Tqh7joI',
  'AIzaSyCsZKvCT-2gYsaI3aNJuQf_KUOsdzQHEng',
  'AIzaSyChBw8L0U9-LGbmLQ9iBrlfVUVXYhNGw3o'
];

async function check() {
  const models = ['gemini-2.5-flash', 'gemini-flash-latest'];
  for (let m of models) {
    console.log('\n--- Testing Model', m);
    for (let i = 0; i < keys.length; i++) {
      try {
        const genAI = new GoogleGenAI({ apiKey: keys[i] });
        const res = await genAI.models.generateContent({
           model: m,
           contents: [{ role: 'user', parts: [{ text: 'what is 2+2?' }] }]
        });
        console.log('Key', i+1, 'SUCCESS', res.text);
      } catch (err: any) {
        console.log('Key', i+1, 'FAILED:', err.message.slice(0, 100));
      }
    }
  }
}
check();
