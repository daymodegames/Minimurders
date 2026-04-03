export default async function handler(req, res) {
  const SHEET_ID = '1FLms3sb48UeBe0kLKvgUHoqJAmdE0cx33QMPWmLMwRA';
  const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
  const SHEET_NAME = 'Sheet1';

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`

  const response = await fetch(url)
  const data = await response.json()

  const rows = data.values
  const headers = rows[0]
  const raw = rows.slice(1).map(row => {
    const m = {}
    headers.forEach((h, i) => m[h] = row[i] || '')
    return m
  })

  const mysteries = raw.map(m => {
    // Build suspects array
    const suspects = []
    for (let i = 1; i <= 4; i++) {
      if (!m[`suspect${i}_id`]) continue
      suspects.push({
        id: m[`suspect${i}_id`],
        name: m[`suspect${i}_name`],
        color: m[`suspect${i}_color`],
        role: m[`suspect${i}_role`],
        topics: [1, 2, 3].map(t => ({
          id: `topic${t}`,
          label: m[`suspect${i}_topic${t}_label`],
          response: m[`suspect${i}_topic${t}_response`]
        })).filter(t => t.label)
      })
    }

    // Build clues array
    const clues = []
    for (let i = 1; i <= 4; i++) {
      if (!m[`clue${i}_label`]) continue
      clues.push({
        id: `clue${i}`,
        label: m[`clue${i}_label`],
        response: m[`clue${i}_response`]
      })
    }

    // Build accusations array
    const accusations = []
    for (let i = 1; i <= 4; i++) {
      if (!m[`accusation${i}_id`]) continue
      accusations.push({
        id: m[`accusation${i}_id`],
        label: m[`accusation${i}_label`]
      })
    }

    return {
      id: m.id,
      title: m.title,
      tag: m.tag,
      intro: m.intro,
      flavor: m.flavor,
      victim: m.victim,
      actions: parseInt(m.actions),
      solution: m.solution,
      spoiler: m.spoiler,
      suspects,
      clues,
      accusations
    }
  })

  res.status(200).json({ mysteries })
}