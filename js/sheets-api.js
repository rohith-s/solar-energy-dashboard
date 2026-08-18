export async function fetchSheetData(url) {
  const response = await fetch(url);
  return response.json();
}
