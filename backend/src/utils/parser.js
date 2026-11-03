export function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("JSON parse error:", text);
    return null;
  }
}