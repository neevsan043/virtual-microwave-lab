const key = 'AIzaSyANhACUlXuJfgnlaBnp7SLkNUoWcN3ldlY';

async function list() {
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + key);
  const json = await res.json();
  if (json.models) {
     console.log(json.models.map((m: any) => m.name).join('\n'));
  } else {
     console.log(json);
  }
}
list();
