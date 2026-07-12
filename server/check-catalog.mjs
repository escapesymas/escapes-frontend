const BIHR_USERNAME = process.env.BIHR_USERNAME || 'info@escapesymas.com';
const BIHR_MACKEY = process.env.BIHR_MACKEY || '';

async function getToken() {
  const formData = new URLSearchParams();
  formData.append('UserName', BIHR_USERNAME);
  formData.append('PassWord', BIHR_MACKEY);
  
  const response = await fetch('https://api.bihr.net/api/v2.1/Authentication/Token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString()
  });
  
  const data = await response.json();
  return data.access_token;
}

async function main() {
  const token = await getToken();
  
  // Try Extended catalog
  console.log('=== Requesting Extended catalog ===');
  const response = await fetch('https://api.bihr.net/api/v2.1/Catalog/ZIP/JSON/Extended/Full', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });
  
  console.log('Status:', response.status);
  const body = await response.text();
  console.log('Body:', body);
  
  // Try EssentialExtended
  console.log('\n=== Requesting EssentialExtended ===');
  const response2 = await fetch('https://api.bihr.net/api/v2.1/Catalog/EssentialExtended', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });
  
  console.log('Status:', response2.status);
  const body2 = await response2.text();
  console.log('Body:', body2.substring(0, 500));
}

main().catch(console.error);
